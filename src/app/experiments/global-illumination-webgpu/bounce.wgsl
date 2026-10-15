// The path tracer's bounce at half resolution: one bounce path for every 2×2
// block of pixels, a quarter of the rays, each blended into a running mean
// of its own. The bounce is the costly part of a frame and the smoothest —
// light that's bounced off matte walls changes slowly across a surface — so
// it gives up least by being traced sparsely. upsample.wgsl spreads it back
// over every pixel without letting it cross from one surface to another.
//
// Each block traces from its first pixel that's on a matte surface — not
// the sky, not the mirror — so a block straddling an edge still has a
// surface to work from; which pixel that was is kept with the result, for
// the upsampling and for next frame to find it again.
//
// Joined after scene.wgsl, frame.wgsl and paths.wgsl.

@group(1) @binding(0) var<uniform> frame: Frame;
@group(1) @binding(1) var blueNoise: texture_2d<f32>;
/** This frame's distance to each pixel's surface (a; -1 for sky), from the trace. */
@group(1) @binding(2) var directNow: texture_2d<f32>;
/** This frame's normal and mirror flag at each pixel, packed (a), from the trace. */
@group(1) @binding(3) var albedoNow: texture_2d<f32>;
/** Last frame's half-resolution means (rgb) and their sample counts (a). */
@group(1) @binding(4) var bouncePrevious: texture_2d<f32>;
/** Last frame's blocks: the distance to the surface traced from (x; -1 for none), its packed normal (y), and which of the block's pixels it was (z). */
@group(1) @binding(5) var surfacePrevious: texture_2d<f32>;
@group(1) @binding(6) var bounceNext: texture_storage_2d<rgba32float, write>;
@group(1) @binding(7) var surfaceNext: texture_storage_2d<rgba32float, write>;

/** The full-resolution pixel a block traced from, given which of its four it was. */
fn blockPixel(block: vec2i, corner: f32) -> vec2i {
  let i = i32(corner);
  return block * 2 + vec2i(i & 1, i >> 1u);
}

// Last frame's mean for a surface point, from wherever it fell in last
// frame's half-resolution picture. Each block's sample sits at the pixel it
// traced from, not at the block's middle, so the blocks around that point
// are weighted by how far their own traced pixel lies from it — a tent two
// pixels wide — rather than by a regular bilinear grid: with the camera
// still, every block lands exactly on itself, and nothing smears from one
// frame to the next. Each is kept only if its pixel lay on this same surface
// — in its plane, and facing its way. Nothing (a = 0) if none did.
fn carriedHalf(p: vec3f, n: vec3f) -> vec4f {
  let was = wasAt(p);
  // A point on the plus faced elsewhere before it turned.
  let wasFacing = select(n, frame.plusPreviousTurn * (scene.plusInverse * n), any(was != p));
  let found = previousPixel(was);
  if (found.x < 0.0) { return vec4f(0.0); }
  let home = vec2i(floor(found.xy * 0.5));
  let size = vec2i(textureDimensions(bouncePrevious));
  let reach = 0.02 + 0.002 * found.z;
  var light = vec3f(0.0);
  var total = 0.0;
  var count = 1e9;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let texel = home + vec2i(x, y);
      if (any(texel < vec2i(0)) || any(texel >= size)) { continue; }
      let s = textureLoad(surfacePrevious, texel, 0);
      if (s.x < 0.0) { continue; }
      let traced = vec2f(blockPixel(texel, s.z)) + 0.5;
      let tent = max(vec2f(0.0), 1.0 - abs(found.xy - traced) * 0.5);
      let w = tent.x * tent.y;
      if (w <= 0.0) { continue; }
      let q = frame.previousPosition + previousRay(traced) * s.x;
      if (dot(unpackNormal(s.y), wasFacing) < 0.9 || abs(dot(wasFacing, q - was)) > reach) { continue; }
      let history = textureLoad(bouncePrevious, texel, 0);
      light += history.rgb * w;
      total += w;
      count = min(count, history.a);
    }
  }
  if (total < 0.01) { return vec4f(0.0); }
  return vec4f(light / total, count);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let block = vec2i(id.xy);
  if (any(block >= vec2i(textureDimensions(bounceNext)))) { return; }
  let size = vec2i(frame.resolution);

  // The block's first matte pixel, in reading order.
  var corner = -1;
  var depth = -1.0;
  var packed = 0.0;
  for (var i = 0; i < 4; i++) {
    let pixel = block * 2 + vec2i(i & 1, i >> 1u);
    if (any(pixel >= size)) { continue; }
    let d = textureLoad(directNow, pixel, 0).a;
    let s = textureLoad(albedoNow, pixel, 0).a;
    if (d >= 0.0 && !isMirror(s)) {
      corner = i;
      depth = d;
      packed = s;
      break;
    }
  }
  if (corner < 0) {
    textureStore(bounceNext, block, vec4f(0.0));
    textureStore(surfaceNext, block, vec4f(-1.0, 0.0, 0.0, 0.0));
    return;
  }

  let pixel = blockPixel(block, f32(corner));
  let p = frame.cameraPosition + cameraRay(vec2f(pixel) + frame.jitter) * depth;
  let n = unpackNormal(packed);

  var history = vec4f(0.0);
  if (frame.mode == MODE_REST) {
    // Still: its own mean, if it traced from the same pixel last frame.
    let s = textureLoad(surfacePrevious, block, 0);
    if (s.z == f32(corner) && abs(s.x - depth) < 0.02 + 0.002 * depth) {
      history = textureLoad(bouncePrevious, block, 0);
    }
  } else if (frame.mode == MODE_MOVING) {
    history = carriedHalf(p, n);
  }

  let remembered = memory(p);
  var bounced: vec4f;
  if (frame.mode == MODE_MOVING && history.a >= settledAt() && remembered.coast) {
    // Settled already: carried over as it is, and costs nothing to trace.
    bounced = history;
  } else {
    // Blue noise read at the block's own coordinates, so the half-resolution
    // picture is blue, not a quarter-sampled blue one.
    var light = bounce(p, n, sampleNoise(block, 0).xyz, sampleNoise(block, 1).xyz);
    // One bad sample would sit in the mean for good.
    if (!finite(light)) { light = vec3f(0.0); }
    let count = min(history.a + 1.0, remembered.samples);
    bounced = vec4f(mix(history.rgb, light, 1.0 / count), count);
  }
  textureStore(bounceNext, block, bounced);
  textureStore(surfaceNext, block, vec4f(depth, packed, f32(corner), 0.0));
}
