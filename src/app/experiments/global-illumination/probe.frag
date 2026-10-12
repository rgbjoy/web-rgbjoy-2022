// One frame of the probe volume. Each fragment is one probe: it sends rays
// evenly over the sphere, lights whatever they land on — with last frame's
// probes standing in for the light that reaches there by bouncing, so every
// frame adds a bounce — and folds the result into its running estimate.
// A fragment shader doing a compute shader's job, at a few thousand probes
// rather than a few million pixels.

layout(location = 0) out vec4 outRed;
layout(location = 1) out vec4 outGreen;
layout(location = 2) out vec4 outBlue;
/** Whether the probe can be used (x), and how far it was moved to clear a surface (yzw). */
layout(location = 3) out vec4 outMeta;

/** A fresh random turn each frame, so the rays sweep new directions. */
uniform mat3 uRayRotation;
uniform int uProbeRays;
/** How much of this frame goes into each probe's running estimate. */
uniform float uProbeWeight;

#define MAX_PROBE_RAYS 128
/** How far a probe keeps from the nearest surface. */
#define PROBE_CLEARANCE 0.12
#define PI 3.14159265359

/** The i-th of n points spread evenly over the sphere (spherical Fibonacci). */
vec3 fibonacciSphere(int i, int n) {
  float k = float(i) + 0.5;
  float phi = 2.39996322973 * k;
  float cosTheta = 1.0 - 2.0 * k / float(n);
  float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));
  return vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
}

/** Light coming back along a probe's ray. */
vec3 probeRay(vec3 origin, vec3 rd) {
  float t = castCamera(origin, rd);
  if (t < 0.0) return sky(rd);
  vec3 p = origin + rd * t;
  vec3 n = normalAt(p);
  return radianceAt(p, n, probeLight(p, n));
}

void main() {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  int index = texel.x + texel.y * PROBE_ATLAS_WIDTH;
  ivec3 cell = ivec3(index % PROBE_GRID.x, (index / PROBE_GRID.x) % PROBE_GRID.y, index / (PROBE_GRID.x * PROBE_GRID.y));
  vec3 probe = probeCellPosition(cell);
  // A probe just under a surface, or too close to one to see past it, is
  // nudged out along the field's gradient (DDGI's probe relocation). One
  // buried deeper than that would have to move into the next cell: it's
  // left out, along with any past the last probe.
  vec3 offset = vec3(0.0);
  float d = sceneDistance(probe);
  if (d < PROBE_CLEARANCE) offset = normalAt(probe) * (PROBE_CLEARANCE - d);
  bool usable = index < PROBE_COUNT
    && length(offset) < 0.45 * PROBE_SPACING
    && sceneDistance(probe + offset) > 0.5 * PROBE_CLEARANCE;
  probe += offset;

  vec4 red = vec4(0.0);
  vec4 green = vec4(0.0);
  vec4 blue = vec4(0.0);
  if (usable) {
    for (int i = 0; i < MAX_PROBE_RAYS; i++) {
      if (i >= uProbeRays) break;
      vec3 rd = uRayRotation * fibonacciSphere(i, uProbeRays);
      vec3 light = probeRay(probe, rd);
      // Projected onto Y00 and Y1, in the same x, y, z order shIrradiance reads.
      vec4 basis = vec4(0.282095, 0.488603 * rd);
      red += light.r * basis;
      green += light.g * basis;
      blue += light.b * basis;
    }
    float solidAngle = 4.0 * PI / float(uProbeRays);
    red *= solidAngle;
    green *= solidAngle;
    blue *= solidAngle;
  }

  outRed = mix(texelFetch(uProbeRed, texel, 0), red, uProbeWeight);
  outGreen = mix(texelFetch(uProbeGreen, texel, 0), green, uProbeWeight);
  outBlue = mix(texelFetch(uProbeBlue, texel, 0), blue, uProbeWeight);
  outMeta = vec4(usable ? 1.0 : 0.0, offset);
}
