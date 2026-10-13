// One frame of the building: a camera ray, the sun, a bounce path of one or
// two hops per pixel and a march through the sunlit air, each blended into
// the running mean of every frame before it.
//
// The bounce is kept apart from the rest. It is the noisy, costly part, and
// it is smooth: when the camera moves it is carried over from last frame and
// only traced where something new comes into view. Everything sharp — the
// sun, its shadows, the surfaces' colours — is cheap, so it is simply traced
// again, and stays crisp however far the camera swings.
//
// With the probe volume, the bounce isn't traced per pixel at all: it's read
// from the probes around each surface, which probe.frag keeps up to date.
//
// The chrome torus bounces nothing matte; it mirrors. What it shows depends on
// where it's seen from, so it all goes with the sharp, cheap part — traced
// fresh each frame — and none of it with the bounce carried across moves.

/** Light arriving by bouncing off other surfaces (rgb), and how many samples that mean holds (a). */
layout(location = 0) out vec4 outBounce;
/** Light leaving the surface by every other way (rgb), and the distance to it (a; -1 for sky). */
layout(location = 1) out vec4 outDirect;
/** The surface's colour, averaged over the pixel. */
layout(location = 2) out vec4 outAlbedo;
/** Sunlight the air scatters toward the camera (rgb), and how much of the surface gets through (a). */
layout(location = 3) out vec4 outAir;

uniform sampler2D uBounceHistory;
uniform sampler2D uDirectHistory;
uniform sampler2D uAlbedoHistory;
uniform sampler2D uAirHistory;
uniform sampler2D uBlueNoise;
uniform vec2 uResolution;
uniform int uMode;
/** How much of this frame goes into the running means of everything traced fresh. */
uniform float uWeight;
uniform float uNoiseIndex;
uniform vec2 uJitter;
uniform int uSampling;
uniform int uMarchSteps;
uniform float uMarchJitter;

uniform vec3 uCameraPosition;
uniform vec3 uCameraRight;
uniform vec3 uCameraUp;
uniform vec3 uCameraForward;
uniform float uTanHalfFov;
// The camera of the frame the history was traced from.
uniform vec3 uPreviousPosition;
uniform vec3 uPreviousRight;
uniform vec3 uPreviousUp;
uniform vec3 uPreviousForward;

uniform int uMethod;
/** While the probes are still settling, the floor on how fast pixels follow them. */
uniform float uProbeSettling;
uniform int uBounces;
uniform int uVolumeSteps;
uniform float uVolumeDensity;

#define SAMPLING_BLUE 1
#define METHOD_PROBES 1
#define MODE_FRESH 0
#define MODE_REST 1
#define MODE_MOVING 2
/** Samples after which a surface's bounce light is carried across camera
 *  moves as it is, without tracing it again; resting builds it up the rest
 *  of the way. */
#define SETTLED 64.0
#define MAX_MARCH_STEPS 64
/** How far a bounce ray is meant to reach; the march steps are spread over it.
 *  At 16 steps a stride is exactly one wall thick, so walls hold; fewer steps
 *  and the strides start skipping clean through them. */
#define BOUNCE_REACH 9.6
#define MAX_VOLUME_STEPS 64
/** Henyey–Greenstein asymmetry: the air scatters a little forward, so the
 *  shafts brighten as you look toward the window. */
#define FORWARD_SCATTER 0.35
/** How tight the sun's glint on the chrome is (a Phong exponent). A true
 *  mirror would show the sun as a speck smaller than a pixel; a little
 *  polish spreads it wide enough to catch. */
#define GLINT 900.0

uvec4 pcg4d(uvec4 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  v ^= v >> 16u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  return v;
}

// Four uniform numbers for this pixel and frame: a bounce direction, then
// where the bounce and the air march each start. Blue noise walks each texel
// along its own low-discrepancy sequence (R2 for the direction, golden ratio
// and √2 for the two offsets), so every frame is blue and the frames together
// cover the range evenly; white noise is just a hash.
// The second bounce reads the same texture from a far-off texel, which in
// blue noise is as good as a fresh layer.
vec4 sampleNoise(int layer) {
  if (uSampling == SAMPLING_BLUE) {
    ivec2 texel = (ivec2(gl_FragCoord.xy) + layer * ivec2(23, 41)) & 63;
    vec4 blue = texelFetch(uBlueNoise, texel, 0) + 0.5 / 256.0;
    return fract(blue + uNoiseIndex * vec4(0.7548776662, 0.5698402910, 0.6180339887, 0.4142135624));
  }
  uvec4 hash = pcg4d(uvec4(uvec2(gl_FragCoord.xy), uint(uNoiseIndex), uint(layer)));
  return vec4(hash) * (1.0 / 4294967296.0);
}

// Cosine-weighted, so the plain average of the bounce samples is already the
// diffuse light: no pdf to divide out. Basis from Duff et al. 2017.
vec3 cosineDirection(vec3 n, vec2 u) {
  float s = n.z >= 0.0 ? 1.0 : -1.0;
  float a = -1.0 / (s + n.z);
  float b = n.x * n.y * a;
  vec3 tangent = vec3(1.0 + s * n.x * n.x * a, s * b, -s * n.x);
  vec3 bitangent = vec3(b, s + n.y * n.y * a, -n.y);
  float r = sqrt(u.y);
  float phi = 6.28318530718 * u.x;
  return r * cos(phi) * tangent + r * sin(phi) * bitangent + sqrt(max(0.0, 1.0 - u.y)) * n;
}

// The bounce ray strides out in at least BOUNCE_REACH / steps at a time,
// leaping further where the field says the way is clear. Few steps means long
// strides that skip past thin things and land well inside whatever they hit;
// jitter slides every stride by a random fraction, so those misses turn from
// bands into noise that accumulation averages away.
//
// Returns whether it landed on a surface (q, with normal nq); if not, what it
// found instead in `missed`.
bool march(vec3 p, vec3 n, vec3 noise, out vec3 q, out vec3 nq, out vec3 missed) {
  vec3 rd = cosineDirection(n, noise.xy);
  vec3 ro = p + n * 0.02;
  vec2 span = shellSpan(ro, rd);
  q = ro;
  nq = n;
  missed = sky(rd);
  if (span.y < 0.0 || span.x > span.y) return false;

  float stride = BOUNCE_REACH / float(uMarchSteps);
  float t = max(span.x, 0.0) + stride * mix(0.5, noise.z, uMarchJitter);
  float d = 1.0;
  for (int i = 0; i < MAX_MARCH_STEPS; i++) {
    if (i >= uMarchSteps || t > span.y) break;
    q = ro + rd * t;
    d = sceneDistance(q);
    if (d < 0.0) break;
    t += max(d, stride);
  }
  if (d < 0.0) {
    // Inside something: settle back onto its surface.
    nq = normalAt(q);
    q -= nq * d;
    return true;
  }
  // Out of the building, or out of steps with the fill light standing in.
  if (t <= span.y) missed = AMBIENT_TINT * uAmbient;
  return false;
}

// Light arriving at a surface by bouncing off whatever a cosine-weighted ray
// from it lands on. With two bounces, that surface is lit the same way in
// turn — which is what lets a side the sun never touches catch the sunlit
// floor and pass its colour on to the walls. Shaded after both marches,
// never inside them: neighbouring pixels
// land on different steps, and a GPU would run the shading once for every
// step any of them hit on.
vec3 bounce(vec3 p, vec3 n, vec3 first, vec3 second) {
  vec3 q, nq, missed;
  if (!march(p, n, first, q, nq, missed)) return missed;
  vec3 further = vec3(0.0);
  if (uBounces > 1) {
    vec3 q2, nq2, missed2;
    further = march(q, nq, second, q2, nq2, missed2) ? radianceAt(q2, nq2, vec3(0.0)) : missed2;
  }
  return radianceAt(q, nq, further);
}

/** Henyey–Greenstein, scaled so that scattering evenly in all directions is 1. */
float phase(float cosTheta) {
  const float g = FORWARD_SCATTER;
  float d = 1.0 + g * g - 2.0 * g * cosTheta;
  return (1.0 - g * g) / (d * sqrt(d));
}

// Sunlight scattered toward the camera by the room's air, sampled in even
// slices between the camera (or the wall it looks in through) and whatever
// the camera ray hit. Unjittered, every pixel samples the same slices and the
// shafts come out layered; jitter slides the slices per pixel and per frame,
// and accumulation blends the layers smooth.
vec3 airLight(vec3 ro, vec3 rd, float hit, float jitter, out float transmittance) {
  transmittance = 1.0;
  if (uVolumeDensity <= 0.0) return vec3(0.0);
  vec2 span = boxSpan(ro, rd, ROOM_CENTER, ROOM_HALF);
  float start = max(span.x, 0.0);
  float end = min(span.y, hit);
  if (end <= start) return vec3(0.0);

  float slice = (end - start) / float(uVolumeSteps);
  float t = start + slice * mix(0.5, jitter, uMarchJitter);
  float scattered = 0.0;
  for (int i = 0; i < MAX_VOLUME_STEPS; i++) {
    if (i >= uVolumeSteps) break;
    vec3 p = ro + rd * t;
    scattered += airVisibility(p) * phase(dot(rd, normalize(uLightPosition - p)));
    t += slice;
  }
  transmittance = exp(-uVolumeDensity * (end - start));
  return SUN * uVolumeDensity * scattered * slice;
}

/** Where a world point fell in the previous frame's picture, in pixels, and how far it was from that camera. */
vec2 previousPixel(vec3 p, out float range) {
  vec3 v = p - uPreviousPosition;
  range = length(v);
  float z = dot(v, uPreviousForward);
  if (z <= 0.0) return vec2(-1.0);
  vec2 ndc = vec2(dot(v, uPreviousRight), dot(v, uPreviousUp)) / (z * uTanHalfFov);
  ndc.x *= uResolution.y / uResolution.x;
  return (ndc * 0.5 + 0.5) * uResolution;
}

// The bounce light last frame gathered for a surface point, wherever on
// screen it was. The light reaching a point doesn't depend on where it's seen
// from, so it still holds: find where the point was, check that pixel saw
// this same surface and not something in front of it, and carry it over.
// Nothing (a = 0) if last frame didn't see it.
vec4 carriedBounce(vec3 p) {
  // Bilinear between the four nearest texels, each kept only if it saw this
  // same surface. Nearest-texel would snap a little every frame, and edges
  // carried across many frames would come out in stair steps.
  float range;
  vec2 previous = previousPixel(p, range) - 0.5;
  ivec2 base = ivec2(floor(previous));
  vec2 f = previous - vec2(base);
  vec3 light = vec3(0.0);
  float total = 0.0;
  float count = SETTLED;
  for (int i = 0; i < 4; i++) {
    ivec2 offset = ivec2(i & 1, i >> 1);
    ivec2 texel = base + offset;
    if (any(lessThan(texel, ivec2(0))) || any(greaterThanEqual(texel, ivec2(uResolution)))) continue;
    float seen = texelFetch(uDirectHistory, texel, 0).a;
    if (abs(seen - range) > 0.02 * range + 0.01) continue;
    vec2 w2 = mix(1.0 - f, f, vec2(offset));
    float w = w2.x * w2.y;
    vec4 history = texelFetch(uBounceHistory, texel, 0);
    light += history.rgb * w;
    total += w;
    count = min(count, history.a);
  }
  if (total < 0.01) return vec4(0.0);
  return vec4(light / total, count);
}

// What this pixel already knows about the bounce light reaching its surface.
// At rest that's simply its own history. On the move it's carried over from
// wherever last frame saw the surface; where nothing did, it's newly
// uncovered and starts again.
vec4 bounceHistory(vec3 ro, vec3 rd, float t) {
  if (uMode == MODE_REST) return texelFetch(uBounceHistory, ivec2(gl_FragCoord.xy), 0);
  if (uMode != MODE_MOVING || t < 0.0) return vec4(0.0);
  return carriedBounce(ro + rd * t);
}

// The bounce light reaching a surface seen in the chrome. The probes have it
// for anywhere. The path tracer only has it for what's on screen — so most
// of what the torus mirrors costs nothing, already averaged; the rest (behind
// the camera, or hidden from it) gets one fresh noisy bounce, which settles
// as the frames average.
vec3 mirroredBounce(vec3 q, vec3 nq) {
  if (uMethod == METHOD_PROBES) return probeLight(q, nq) * occlusion(q, nq);
  if (uMode != MODE_FRESH) {
    vec4 carried = carriedBounce(q);
    if (carried.a > 0.0) return carried.rgb;
  }
  vec3 light = bounce(q, nq, sampleNoise(2).xyz, sampleNoise(3).xyz);
  return any(isnan(light)) || any(isinf(light)) ? vec3(0.0) : light;
}

/** The sun's glint: a tight lobe around the mirror direction, shadowed like any sunlight. */
vec3 glint(vec3 p, vec3 n, vec3 r) {
  vec3 l = normalize(uLightPosition - p);
  float lobe = (GLINT + 2.0) / 6.28318530718 * pow(max(dot(r, l), 0.0), GLINT);
  float facing = dot(n, l);
  if (lobe < 1e-3 || facing <= 0.0) return vec3(0.0);
  return SUN * lobe * facing * sunShadow(p, n);
}

// Chrome: the room in mirror image, through a Fresnel term that turns
// everything to a full mirror at a glancing angle, and through the same sunlit
// air the camera looks through — without it, a mirror hung in the shaft
// shows a room clearer than the one around it. One reflection deep: where
// the torus mirrors itself, its matte stand-in shows instead.
vec3 chrome(vec3 p, vec3 n, vec3 rd, float jitter) {
  vec3 r = reflect(rd, n);
  vec3 fresnel = CHROME + (1.0 - CHROME) * pow(1.0 - max(dot(n, r), 0.0), 5.0);
  vec3 ro = p + n * 0.02;
  float t = castCamera(ro, r);
  vec3 seen = sky(r);
  if (t >= 0.0) {
    vec3 q = ro + r * t;
    vec3 nq = normalAt(q);
    seen = radianceAt(q, nq, mirroredBounce(q, nq));
  }
  float transmittance;
  vec3 air = airLight(ro, r, t >= 0.0 ? t : 1e4, jitter, transmittance);
  return fresnel * (seen * transmittance + air + glint(p, n, r));
}

void main() {
  vec2 ndc = (gl_FragCoord.xy - 0.5 + uJitter) / uResolution * 2.0 - 1.0;
  ndc.x *= uResolution.x / uResolution.y;
  vec3 rd = normalize(uCameraForward + (ndc.x * uCameraRight + ndc.y * uCameraUp) * uTanHalfFov);
  ivec2 pixel = ivec2(gl_FragCoord.xy);

  vec4 noise = sampleNoise(0);
  float t = castCamera(uCameraPosition, rd);
  vec3 direct = sky(rd);
  vec3 albedo = vec3(0.0);
  // The sky has no surface for anything to bounce onto.
  vec4 bounced = vec4(0.0, 0.0, 0.0, 1.0);

  if (t >= 0.0) {
    vec3 p = uCameraPosition + rd * t;
    vec3 n = normalAt(p);
    int id = materialAt(p);
    vec3 emission;
    surface(id, albedo, emission);
    direct = emission + albedo * (sunlight(p, n) + AMBIENT_TINT * uAmbient);

    if (id == MAT_CHROME) {
      // All mirror and no matte: nothing for the bounce light to land on.
      // The pixel's bounce mean is left as it was, so where the torus's edge
      // shares a pixel with the wall behind, the wall's mean keeps building.
      direct = chrome(p, n, rd, noise.w);
      albedo = vec3(0.0);
      bounced = uMethod == METHOD_PROBES
        ? vec4(texelFetch(uBounceHistory, pixel, 0).rgb, 1.0)
        : bounceHistory(uCameraPosition, rd, t);
    } else if (uMethod == METHOD_PROBES) {
      // Noiseless, and the same from any viewpoint: nothing to carry over,
      // only the antialiasing to average while the camera rests. A pixel
      // still follows the probes quickly while they settle.
      vec3 light = probeLight(p, n) * occlusion(p, n);
      float weight = uMode == MODE_REST ? max(uWeight, uProbeSettling) : 1.0;
      bounced = vec4(mix(texelFetch(uBounceHistory, pixel, 0).rgb, light, weight), 1.0);
    } else {
      vec4 history = bounceHistory(uCameraPosition, rd, t);
      if (uMode == MODE_MOVING && history.a >= SETTLED) {
        // Settled already: carried over as it is, and costs nothing to trace.
        bounced = history;
      } else {
        vec3 light = bounce(p, n, noise.xyz, sampleNoise(1).xyz);
        // One bad sample would sit in the mean for good.
        if (any(isnan(light)) || any(isinf(light))) light = vec3(0.0);
        float count = history.a + 1.0;
        bounced = vec4(mix(history.rgb, light, 1.0 / count), count);
      }
    }
  }
  if (any(isnan(direct)) || any(isinf(direct))) direct = vec3(0.0);

  float transmittance;
  vec3 air = airLight(uCameraPosition, rd, t >= 0.0 ? t : 1e4, noise.w, transmittance);

  outBounce = bounced;
  outDirect = vec4(mix(texelFetch(uDirectHistory, pixel, 0).rgb, direct, uWeight), t >= 0.0 ? t : -1.0);
  outAlbedo = mix(texelFetch(uAlbedoHistory, pixel, 0), vec4(albedo, 1.0), uWeight);
  outAir = mix(texelFetch(uAirHistory, pixel, 0), vec4(air, transmittance), uWeight);
}
