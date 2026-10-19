// One frame of the camera and the path tracer's settings, shared by the
// trace and the denoiser, with the surface the trace leaves behind for the
// denoiser to tell surfaces apart by. Each module that joins this declares its own `frame` binding.

struct Frame {
  cameraPosition: vec3f,
  tanHalfFov: f32,
  cameraRight: vec3f,
  /** How much of this frame goes into the running means of everything traced fresh. */
  weight: f32,
  cameraUp: vec3f,
  noiseIndex: f32,
  cameraForward: vec3f,
  marchJitter: f32,
  // The camera of the frame the history was traced from.
  previousPosition: vec3f,
  /** While the probes are still settling, the floor on how fast pixels follow them. */
  probeSettling: f32,
  previousRight: vec3f,
  volumeDensity: f32,
  previousUp: vec3f,
  /** The same as weight, for the air alone: it keeps a short memory while the plus turns. */
  airWeight: f32,
  previousForward: vec3f,
  /** 1 while the plus turns, so no light stays put for long. */
  animating: u32,
  resolution: vec2f,
  jitter: vec2f,
  mode: u32,
  sampling: u32,
  marchSteps: u32,
  method: u32,
  bounces: u32,
  volumeSteps: u32,
  // The plus's turn (local to world) and centre when the history was traced.
  plusPreviousTurn: mat3x3f,
  plusPreviousCenter: vec3f,
  /** 1 when the denoised bounce is of the very history this frame reads. */
  smoothHistory: u32,
  /** 1 once the probe volume holds any light, for reflections to fall back on. */
  probesReady: u32,
  /** 1 when, while the plus turns, only surfaces near it keep a short memory. */
  localRefresh: u32,
}

/** The camera ray through a point on the picture, in pixels from its bottom-left corner. */
fn cameraRay(position: vec2f) -> vec3f {
  var ndc = position / frame.resolution * 2.0 - 1.0;
  ndc.x *= frame.resolution.x / frame.resolution.y;
  return normalize(frame.cameraForward + (ndc.x * frame.cameraRight + ndc.y * frame.cameraUp) * frame.tanHalfFov);
}

/** The camera ray, from the frame the history was traced from, through a point on its picture. */
fn previousRay(position: vec2f) -> vec3f {
  var ndc = position / frame.resolution * 2.0 - 1.0;
  ndc.x *= frame.resolution.x / frame.resolution.y;
  return normalize(frame.previousForward + (ndc.x * frame.previousRight + ndc.y * frame.previousUp) * frame.tanHalfFov);
}

// A surface's normal folded onto an octahedron, 11 bits a side, and one more
// bit for whether it's the mirror: packed into one whole number below 2²³ —
// which a float holds exactly, so it fits in the one spare channel the trace
// has.
fn packSurface(n: vec3f, mirror: bool) -> f32 {
  var p = n.xy / (abs(n.x) + abs(n.y) + abs(n.z));
  if (n.z < 0.0) {
    p = (1.0 - abs(p.yx)) * select(vec2f(-1.0), vec2f(1.0), p >= vec2f(0.0));
  }
  let e = vec2u(round((p * 0.5 + 0.5) * 2047.0));
  return f32((select(0u, 1u, mirror) << 22u) | (e.x << 11u) | e.y);
}

fn isMirror(packed: f32) -> bool {
  return (u32(packed) >> 22u) == 1u;
}

fn unpackNormal(packed: f32) -> vec3f {
  let bits = u32(packed);
  let p = vec2f(f32((bits >> 11u) & 2047u), f32(bits & 2047u)) / 2047.0 * 2.0 - 1.0;
  var n = vec3f(p, 1.0 - abs(p.x) - abs(p.y));
  let fold = max(-n.z, 0.0);
  n.x += select(fold, -fold, n.x >= 0.0);
  n.y += select(fold, -fold, n.y >= 0.0);
  return normalize(n);
}
