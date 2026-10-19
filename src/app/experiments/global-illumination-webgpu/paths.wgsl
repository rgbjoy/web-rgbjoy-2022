// The path tracer's own toolkit: the noise, the bounce rays and their
// marches, where a surface was last frame, and how long a surface's bounce
// light may be remembered while the plus turns. Joined after scene.wgsl and
// frame.wgsl, ahead of trace.wgsl, which declares the `frame` and
// `blueNoise` bindings it uses.

const SAMPLING_BLUE = 1u;
const METHOD_PROBES = 1u;
const MODE_FRESH = 0u;
const MODE_REST = 1u;
const MODE_MOVING = 2u;
/** Samples after which a surface's bounce light is carried across camera
 *  moves as it is, without tracing it again; resting builds it up the rest
 *  of the way. */
const SETTLED = 64.0;
/** While the plus turns, the bounce's running mean near it holds at most this
 *  many samples, so it forgets the plus's moving shadow within a few frames. */
const ANIMATED_SAMPLES = 16.0;
/** How far past the plus's reach its turning still moves the bounce light
 *  enough to keep the memory short: fully within the first, not at all past
 *  the second. Its sunlit shadow lands further off, but sunlight is traced
 *  fresh every frame anyway. */
const REFRESH_NEAR = 1.0;
const REFRESH_FAR = 2.5;
/** The plus fits in a sphere this big. */
const PLUS_REACH = length(vec3f(PLUS_ARM, PLUS_BAR, PLUS_BAR));
const MAX_MARCH_STEPS = 64u;
/** How far a bounce ray is meant to reach; the march steps are spread over it.
 *  At 16 steps a stride is exactly one wall thick, so walls hold; fewer steps
 *  and the strides start skipping clean through them. */
const BOUNCE_REACH = 9.6;
const TAU = 6.28318530718;

fn pcg4d(seed: vec4u) -> vec4u {
  var v = seed * 1664525u + 1013904223u;
  v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
  v ^= v >> vec4u(16u);
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
fn sampleNoise(pixel: vec2i, layer: i32) -> vec4f {
  if (frame.sampling == SAMPLING_BLUE) {
    let texel = (pixel + layer * vec2i(23, 41)) & vec2i(63);
    let blue = textureLoad(blueNoise, texel, 0) + 0.5 / 256.0;
    return fract(blue + frame.noiseIndex * vec4f(0.7548776662, 0.5698402910, 0.6180339887, 0.4142135624));
  }
  let hash = pcg4d(vec4u(vec2u(pixel), u32(frame.noiseIndex), u32(layer)));
  return vec4f(hash) * (1.0 / 4294967296.0);
}

// Cosine-weighted, so the plain average of the bounce samples is already the
// diffuse light: no pdf to divide out. Basis from Duff et al. 2017.
fn cosineDirection(n: vec3f, u: vec2f) -> vec3f {
  let s = select(-1.0, 1.0, n.z >= 0.0);
  let a = -1.0 / (s + n.z);
  let b = n.x * n.y * a;
  let tangent = vec3f(1.0 + s * n.x * n.x * a, s * b, -s * n.x);
  let bitangent = vec3f(b, s + n.y * n.y * a, -n.y);
  let r = sqrt(u.y);
  let phi = TAU * u.x;
  return r * cos(phi) * tangent + r * sin(phi) * bitangent + sqrt(max(0.0, 1.0 - u.y)) * n;
}

/** Where a bounce ray landed (q, with normal n), or if it didn't, what it found instead. */
struct Landing {
  hit: bool,
  q: vec3f,
  n: vec3f,
  missed: vec3f,
}

// The bounce ray strides out in at least BOUNCE_REACH / steps at a time,
// leaping further where the field says the way is clear. Few steps means long
// strides that skip past thin things and land well inside whatever they hit;
// jitter slides every stride by a random fraction, so those misses turn from
// bands into noise that accumulation averages away.
fn march(p: vec3f, n: vec3f, noise: vec3f) -> Landing {
  let rd = cosineDirection(n, noise.xy);
  let ro = p + n * 0.02;
  let span = shellSpan(ro, rd);
  if (span.y < 0.0 || span.x > span.y) { return Landing(false, ro, n, sky(rd)); }

  let steps = min(frame.marchSteps, MAX_MARCH_STEPS);
  let stride = BOUNCE_REACH / f32(steps);
  var t = max(span.x, 0.0) + stride * mix(0.5, noise.z, frame.marchJitter);
  var q = ro;
  var d = 1.0;
  for (var i = 0u; i < steps; i++) {
    if (t > span.y) { break; }
    q = ro + rd * t;
    d = sceneDistance(q);
    if (d < 0.0) { break; }
    t += max(d, stride);
  }
  if (d < 0.0) {
    // Inside something: settle back onto its surface.
    let nq = normalAt(q);
    return Landing(true, q - nq * d, nq, vec3f(0.0));
  }
  // Out of the building, or out of steps with the fill light standing in.
  return Landing(false, q, n, select(sky(rd), AMBIENT_TINT * scene.ambient, t <= span.y));
}

// Light arriving at a surface by bouncing off whatever a cosine-weighted ray
// from it lands on. With two bounces, that surface is lit the same way in
// turn — which is what lets a side the sun never touches catch the sunlit
// floor and pass its colour on to the walls. Shaded after both marches,
// never inside them: neighbouring pixels land on different steps, and a GPU
// would run the shading once for every step any of them hit on.
fn bounce(p: vec3f, n: vec3f, first: vec3f, second: vec3f) -> vec3f {
  let one = march(p, n, first);
  if (!one.hit) { return one.missed; }
  var further = vec3f(0.0);
  if (frame.bounces > 1u) {
    // An if, not select(): select would shade the miss too.
    let two = march(one.q, one.n, second);
    if (two.hit) { further = radianceAt(two.q, two.n, vec3f(0.0)); } else { further = two.missed; }
  }
  return radianceAt(one.q, one.n, further);
}

/** Where a surface point was when the history was traced: on the plus, where it was before the plus turned; anywhere else, right where it is. */
fn wasAt(p: vec3f) -> vec3f {
  let q = toPlus(p);
  // Its hits ignore the rounding, so they can sit a hair off the rounded surface.
  if (plusDistance(q) > 0.02) { return p; }
  return frame.plusPreviousTurn * q + frame.plusPreviousCenter;
}

/** Where a world point fell in the previous frame's picture, in pixels (xy), and how far it was from that camera (z). */
fn previousPixel(p: vec3f) -> vec3f {
  let v = p - frame.previousPosition;
  let range = length(v);
  let z = dot(v, frame.previousForward);
  if (z <= 0.0) { return vec3f(-1.0, -1.0, range); }
  var ndc = vec2f(dot(v, frame.previousRight), dot(v, frame.previousUp)) / (z * frame.tanHalfFov);
  ndc.x *= frame.resolution.y / frame.resolution.x;
  return vec3f((ndc * 0.5 + 0.5) * frame.resolution, range);
}


/** How many samples a surface's bounce mean may hold, and whether, once settled, it may coast on them untraced while the camera moves. */
struct Memory {
  samples: f32,
  coast: bool,
}

// Still, every surface remembers everything, and a settled one coasts. While
// the plus turns, it's the light near the plus that moves: there the memory is
// short and every frame traces. With the local refresh, everywhere well clear
// of it keeps the memory it would have still — it settles, then coasts — and
// between the two the memory lengthens with distance, so there's no seam.
// Without it, everywhere is treated as near.
fn memory(p: vec3f) -> Memory {
  if (frame.animating == 0u) { return Memory(1e9, true); }
  if (frame.localRefresh == 0u) { return Memory(ANIMATED_SAMPLES, false); }
  let clear = length(p - scene.plusCenter) - PLUS_REACH;
  let near = 1.0 - smoothstep(REFRESH_NEAR, REFRESH_FAR, clear);
  return Memory(mix(SETTLED, ANIMATED_SAMPLES, near), near <= 0.0);
}
