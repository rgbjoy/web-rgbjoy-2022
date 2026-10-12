// The scene both passes share: a concrete box in the sky with one window,
// two spheres and a block, as a signed distance field with exact shortcuts
// for the room's inside; the sun and its shadows; and the probe volume that
// stores the light bouncing around the room. Joined ahead of trace.frag and
// probe.frag (WebGL has no #include).

uniform vec3 uLightPosition;
uniform float uShadowSoftness;
uniform float uAmbient;
uniform vec3 uEmissive;
// Where the movable objects are: two sphere centres, and the block's centre
// and world-to-local rotation.
uniform vec3 uGlowCenter;
uniform vec3 uPebbleCenter;
uniform vec3 uBlockCenter;
uniform mat3 uBlockInverse;
// The probe volume's spherical-harmonic light, one atlas texel per probe:
// red, green and blue coefficients, then whether the probe can be used.
uniform sampler2D uProbeRed;
uniform sampler2D uProbeGreen;
uniform sampler2D uProbeBlue;
uniform sampler2D uProbeMeta;

#define MAT_WALL 0
#define MAT_FLOOR 1
#define MAT_GLOW 2
#define MAT_PEBBLE 3
#define MAT_BLOCK 4

// A closed concrete box floating in the sky, lit only through one square
// window in its +x wall.
// ROOM_CENTER, ROOM_HALF, WALL, WINDOW and the objects' sizes come in as
// defines from room.ts, which picks objects against the same shapes.
const vec3 SHELL_HALF = ROOM_HALF + WALL;
const float INNER_X = ROOM_HALF.x;
const float OUTER_X = ROOM_HALF.x + WALL;


const vec3 SUN = vec3(1.0, 0.9, 0.78) * 3.4;
const vec3 SKY_ZENITH = vec3(0.05, 0.19, 0.62);
const vec3 SKY_HORIZON = vec3(0.24, 0.45, 0.92);
// Flat fill for the bounces past the first; kept low so the traced bounce leads.
const vec3 AMBIENT_TINT = vec3(0.86, 0.9, 1.0) * 0.35;

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/** Where a ray enters and leaves an axis-aligned box; empty when x > y. */
vec2 boxSpan(vec3 ro, vec3 rd, vec3 centre, vec3 halfSize) {
  vec3 inv = 1.0 / rd;
  vec3 a = (centre - halfSize - ro) * inv;
  vec3 b = (centre + halfSize - ro) * inv;
  vec3 near = min(a, b);
  vec3 far = max(a, b);
  return vec2(max(max(near.x, near.y), near.z), min(min(far.x, far.y), far.z));
}

vec2 shellSpan(vec3 ro, vec3 rd) {
  return boxSpan(ro, rd, ROOM_CENTER, SHELL_HALF);
}

vec3 sky(vec3 rd) {
  return mix(SKY_HORIZON, SKY_ZENITH, smoothstep(-0.1, 0.9, rd.y));
}

vec3 toBlock(vec3 p) {
  return uBlockInverse * (p - uBlockCenter);
}

float buildingDistance(vec3 p) {
  vec3 q = p - ROOM_CENTER;
  float shell = max(sdBox(q, SHELL_HALF), -sdBox(q, ROOM_HALF));
  float window = sdBox(p - vec3(INNER_X + WALL * 0.5, WINDOW.xy), vec3(WALL, WINDOW.zw));
  return max(shell, -window);
}

float sceneDistance(vec3 p) {
  float d = buildingDistance(p);
  d = min(d, length(p - uGlowCenter) - GLOW_RADIUS);
  d = min(d, length(p - uPebbleCenter) - PEBBLE_RADIUS);
  d = min(d, sdBox(toBlock(p), BLOCK_HALF) - BLOCK_ROUNDING);
  return d;
}

int materialAt(vec3 p) {
  float best = buildingDistance(p);
  int id = abs(p.y) < 0.02 ? MAT_FLOOR : MAT_WALL;
  float glow = length(p - uGlowCenter) - GLOW_RADIUS;
  if (glow < best) { best = glow; id = MAT_GLOW; }
  float pebble = length(p - uPebbleCenter) - PEBBLE_RADIUS;
  if (pebble < best) { best = pebble; id = MAT_PEBBLE; }
  float block = sdBox(toBlock(p), BLOCK_HALF) - BLOCK_ROUNDING;
  if (block < best) { id = MAT_BLOCK; }
  return id;
}

void surface(int id, out vec3 albedo, out vec3 emission) {
  emission = vec3(0.0);
  if (id == MAT_FLOOR) albedo = vec3(0.36, 0.35, 0.34);
  else if (id == MAT_GLOW) { albedo = vec3(0.85, 0.72, 0.62); emission = uEmissive; }
  // Saturated enough that their colour carries into the light they bounce.
  else if (id == MAT_PEBBLE) albedo = vec3(0.3, 0.8, 0.22);
  else if (id == MAT_BLOCK) albedo = vec3(0.08, 0.3, 0.9);
  // Mid-grey walls: pale ones would bounce so much neutral light around
  // that every colour washed out in it.
  else albedo = vec3(0.42, 0.4, 0.38);
}

vec3 normalAt(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.0015;
  return normalize(
    k.xyy * sceneDistance(p + k.xyy * h) +
    k.yyx * sceneDistance(p + k.yyx * h) +
    k.yxy * sceneDistance(p + k.yxy * h) +
    k.xxx * sceneDistance(p + k.xxx * h)
  );
}

/** How far a point on the window wall's plane is from the opening; ≤ 0 inside it. */
float windowMiss(vec2 yz) {
  vec2 q = abs(yz - WINDOW.xy) - WINDOW.zw;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

// Soft occlusion by a sphere along a ray, from how widely the ray clears it
// relative to the distance — the analytic twin of the marched penumbra.
float sphereShadow(vec3 p, vec3 rd, vec3 centre, float radius, float k) {
  vec3 toCentre = centre - p;
  float along = dot(toCentre, rd);
  if (along <= 0.0) return 1.0;
  float clearance = length(toCentre - rd * along) - radius;
  return smoothstep(-1.0, 1.0, k * clearance / along);
}

float blockShadow(vec3 p, vec3 rd) {
  vec2 span = boxSpan(toBlock(p), uBlockInverse * rd, vec3(0.0), BLOCK_HALF);
  return span.x <= span.y && span.y > 0.0 ? 0.0 : 1.0;
}

// Sunlight reaching a point inside the room. All of it analytic — the
// window's aperture, the spheres, the block — so the air march can ask it
// dozens of times a pixel, and the surfaces never need a shadow ray marched.
float airVisibility(vec3 p) {
  vec3 rd = normalize(uLightPosition - p);
  float k = 1.0 / max(uShadowSoftness * 0.005, 0.0005);
  float lit = 1.0;
  if (sdBox(uLightPosition - ROOM_CENTER, SHELL_HALF) > 0.0) {
    if (rd.x <= 0.0) return 0.0;
    float inner = (INNER_X - p.x) / rd.x;
    float outer = (OUTER_X - p.x) / rd.x;
    float miss = max(windowMiss((p + rd * inner).yz) / inner, windowMiss((p + rd * outer).yz) / outer);
    lit = smoothstep(1.0, -1.0, k * miss);
    if (lit <= 0.0) return 0.0;
  }
  lit *= sphereShadow(p, rd, uGlowCenter, GLOW_RADIUS, k);
  lit *= sphereShadow(p, rd, uPebbleCenter, PEBBLE_RADIUS, k);
  return lit * blockShadow(p, rd);
}

// Penumbrae from how closely the shadow ray grazes everything on its way out
// (Quilez's improved soft shadow). Softness widens the light's apparent size.
float sunShadow(vec3 p, vec3 n) {
  vec3 toLight = uLightPosition - p;
  float far = length(toLight);
  vec3 rd = toLight / far;
  vec3 ro = p + n * 0.01;
  // The penumbra is k⁻¹ wide per unit of distance.
  float k = 1.0 / max(uShadowSoftness * 0.005, 0.0005);

  if (sdBox(uLightPosition - ROOM_CENTER, SHELL_HALF) > 0.0) {
    // Inside the room, an outdoor sun only gets in through the window, past
    // the spheres and the block — all of which have exact answers, so
    // there's nothing to march.
    if (sdBox(ro - ROOM_CENTER, ROOM_HALF) < 0.0) return airVisibility(ro);

    // Past the building there is nothing left to hit.
    vec2 span = shellSpan(ro, rd);
    if (span.y < 0.05 || span.x > span.y) return 1.0;
    far = min(far, span.y + 0.3);
  }

  float lit = 1.0;
  float t = 0.02;
  for (int i = 0; i < 64; i++) {
    float h = sceneDistance(ro + rd * t);
    lit = min(lit, k * h / t);
    t += clamp(h, 0.015, 1.0);
    if (lit < -1.0 || t > far) break;
  }
  // A ray that crawled along a surface and never got out is taken as blocked.
  if (t < far) return 0.0;
  lit = max(lit, -1.0);
  return 0.25 * (1.0 + lit) * (1.0 + lit) * (2.0 - lit);
}

vec3 sunlight(vec3 p, vec3 n) {
  float facing = dot(n, normalize(uLightPosition - p));
  if (facing <= 0.0) return vec3(0.0);
  return SUN * facing * sunShadow(p, n);
}

/** Light leaving a surface point toward whatever is looking at it, given what else arrives there. */
vec3 radianceAt(vec3 p, vec3 n, vec3 arriving) {
  vec3 albedo, emission;
  surface(materialAt(p), albedo, emission);
  return emission + albedo * (sunlight(p, n) + AMBIENT_TINT * uAmbient + arriving);
}

/** Nearest hit of a ray on a sphere from outside it; -1 for a miss. */
float sphereHit(vec3 ro, vec3 rd, vec3 centre, float radius) {
  vec3 oc = ro - centre;
  float b = dot(oc, rd);
  float h = b * b - dot(oc, oc) + radius * radius;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

/** Nearest hit on the block from outside it (its rounding ignored); -1 for a miss. */
float blockHit(vec3 ro, vec3 rd) {
  vec2 span = boxSpan(toBlock(ro), uBlockInverse * rd, vec3(0.0), BLOCK_HALF + BLOCK_ROUNDING);
  return span.x <= span.y && span.x > 0.0 ? span.x : -1.0;
}

// From inside the room the scene is simple enough to hit exactly: the room's
// walls, two spheres and a block. Only a ray that leaves through the window
// needs marching, from the opening on.
float castFromRoom(vec3 ro, vec3 rd, out bool throughWindow) {
  float t = boxSpan(ro, rd, ROOM_CENTER, ROOM_HALF).y;
  vec3 exit = ro + rd * t;
  throughWindow = exit.x > INNER_X - 0.001 && windowMiss(exit.yz) < 0.0;
  float nearest = t;
  float glow = sphereHit(ro, rd, uGlowCenter, GLOW_RADIUS);
  if (glow > 0.0) nearest = min(nearest, glow);
  float pebble = sphereHit(ro, rd, uPebbleCenter, PEBBLE_RADIUS);
  if (pebble > 0.0) nearest = min(nearest, pebble);
  float block = blockHit(ro, rd);
  if (block > 0.0) nearest = min(nearest, block);
  if (nearest < t) throughWindow = false;
  return nearest;
}

float castCamera(vec3 ro, vec3 rd) {
  float start = 0.0;
  if (sdBox(ro - ROOM_CENTER, ROOM_HALF) < 0.0) {
    bool throughWindow;
    float t = castFromRoom(ro, rd, throughWindow);
    if (!throughWindow) return t;
    start = t;
  }

  vec2 span = shellSpan(ro, rd);
  if (span.y < 0.0 || span.x > span.y) return -1.0;

  float t = max(span.x - 0.01, start);
  if (sceneDistance(ro) < 0.0) {
    // Orbiting through a wall: see straight through it, like a near clip.
    // Walk out of the solid and on until clear of its far face; stopping
    // right on that face would let the march below "hit" the face it just
    // left, in thin contour lines wherever the last step happened to land.
    for (int i = 0; i < 64; i++) {
      float d = sceneDistance(ro + rd * t);
      if (d > 0.01) break;
      t += max(abs(d), 0.05);
    }
  }
  for (int i = 0; i < 100; i++) {
    float d = sceneDistance(ro + rd * t);
    if (d < max(0.0004 * t, 0.0002)) return t;
    t += d;
    if (t > span.y) break;
  }
  return -1.0;
}


// ---- The probe volume -----------------------------------------------------
// A grid of probes through the room's air (PROBE_GRID, PROBE_ORIGIN and
// PROBE_SPACING come in as defines from probes.ts), each holding the light
// arriving from every direction as linear spherical harmonics: a constant
// and a gradient per colour channel. That's coarse, but light that has
// bounced off matte walls is coarse too.

ivec2 probeTexel(ivec3 cell) {
  int index = cell.x + PROBE_GRID.x * (cell.y + PROBE_GRID.y * cell.z);
  return ivec2(index % PROBE_ATLAS_WIDTH, index / PROBE_ATLAS_WIDTH);
}

vec3 probeCellPosition(ivec3 cell) {
  return PROBE_ORIGIN + vec3(cell) * PROBE_SPACING;
}

/** Light a surface facing n gets from one probe's harmonics, as irradiance / π. */
float shIrradiance(vec4 sh, vec3 n) {
  // Y00 and Y1 (0.282095, 0.488603) convolved with the cosine lobe (π, 2π/3), over π.
  return 0.282095 * sh.x + 0.325735 * dot(sh.yzw, n);
}

// Light arriving at a surface by bouncing, read from the eight probes around
// it: trilinear weights, with probes buried in objects left out and probes
// behind the surface faded (they see the other side of it). Looked up a
// little off the surface so a wall doesn't lean on probes inside itself.
// Where most of the eight are buried — right under a sphere — the light
// fades out with them rather than leaning on whichever one is left, which
// would switch on and off in hard-edged patches.
vec3 probeLight(vec3 p, vec3 n) {
  // No probes outside the room; the open sky stands in.
  if (sdBox(p - ROOM_CENTER, ROOM_HALF) > 0.02) return sky(normalize(n + vec3(0.0, 0.6, 0.0)));

  vec3 g = (p + n * 0.2 - PROBE_ORIGIN) / PROBE_SPACING;
  ivec3 base = clamp(ivec3(floor(g)), ivec3(0), PROBE_GRID - 2);
  vec3 f = clamp(g - vec3(base), 0.0, 1.0);
  vec3 light = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 8; i++) {
    ivec3 offset = ivec3(i & 1, (i >> 1) & 1, i >> 2);
    ivec3 cell = base + offset;
    ivec2 texel = probeTexel(cell);
    vec4 meta = texelFetch(uProbeMeta, texel, 0);
    if (meta.x < 0.5) continue;
    vec3 tri = mix(1.0 - f, f, vec3(offset));
    // Facing judged from where the probe actually sits, after relocation.
    float facing = (dot(normalize(probeCellPosition(cell) + meta.yzw - p), n) + 1.0) * 0.5;
    float w = tri.x * tri.y * tri.z * (facing * facing + 0.2);
    light += w * vec3(
      shIrradiance(texelFetch(uProbeRed, texel, 0), n),
      shIrradiance(texelFetch(uProbeGreen, texel, 0), n),
      shIrradiance(texelFetch(uProbeBlue, texel, 0), n)
    );
    total += w;
  }
  return max(light / max(total, 0.15), vec3(0.0));
}

// Probes half a metre apart can't see a sphere's contact shadow, so the
// distance field fills it in (Quilez's five-tap ambient occlusion): step out
// along the normal and see how much nearer than that the nearest surface is.
// Kept short and gentle — reaching further would darken every corner, and
// under the glowing sphere it would darken the very light the sphere gives.
float occlusion(vec3 p, vec3 n) {
  float occluded = 0.0;
  float scale = 1.0;
  for (int i = 1; i <= 5; i++) {
    float h = 0.05 * float(i);
    occluded += (h - sceneDistance(p + n * h)) * scale;
    scale *= 0.7;
  }
  return clamp(1.0 - occluded, 0.0, 1.0);
}
