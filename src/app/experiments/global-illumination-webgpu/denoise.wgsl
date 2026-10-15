// Smooths the path tracer's bounce light where it hasn't had the samples to
// smooth itself — newly uncovered as the camera swings, freshly restarted,
// or kept short while the plus turns — in the way of SVGF (Schied et al.
// 2017), without its temporal half, which the trace already does.
//
// The bounce is light arriving at a surface, before its colour multiplies in,
// so blurring it leaves every edge of colour, every stripe on the plus,
// exactly as sharp as it was. What must not blur is one surface into another:
// each neighbour counts only if it faces the same way, lies in the same
// plane, and isn't brighter or darker than the noise there can explain.
//
// First a variance pass, which also works out each pixel's position and
// normal once for all the rounds to share, then up to five rounds of an à-trous ("with holes")
// filter, a 3×3 tent whose taps spread 1, 2, 4, 8 and 16 pixels apart, so
// a pixel's reach doubles each round at the same cost. How many rounds a
// pixel takes follows how many samples it holds: one sample takes all five,
// and each fourfold more sample takes one round fewer — the noise halves, so
// the reach can too — until a settled pixel passes straight through as the
// exact mean it is. Only the picture is filtered; the history stays raw.
//
// Joined after frame.wgsl.

struct Iteration {
  /** Which round this is; its taps sit 2^index pixels apart. */
  index: u32,
}

// The variance pass's bindings.
@group(0) @binding(0) var<uniform> frame: Frame;
/** The trace's bounce light (rgb) and how many samples it holds (a). */
@group(0) @binding(1) var bounce: texture_2d<f32>;
/** The distance to each pixel's surface (a; -1 for sky). */
@group(0) @binding(2) var direct: texture_2d<f32>;
/** Each pixel's surface normal, packed (a). */
@group(0) @binding(3) var albedo: texture_2d<f32>;
@group(0) @binding(4) var spreadOut: texture_storage_2d<rgba16float, write>;
/** Where each pixel's surface is (xyz) and its normal, packed (w; -1 for sky). */
@group(0) @binding(5) var geometryOut: texture_storage_2d<rgba32float, write>;

// A round's bindings.
@group(0) @binding(10) var<uniform> iteration: Iteration;
@group(0) @binding(11) var samples: texture_2d<f32>;
/** The last round's bounce light (rgb) and its variance (a). */
@group(0) @binding(12) var source: texture_2d<f32>;
@group(0) @binding(13) var geometry: texture_2d<f32>;
@group(0) @binding(14) var filtered: texture_storage_2d<rgba16float, write>;

/** How far a neighbour's luminance may stray, in standard deviations of the noise, before it stops counting. */
const LUMINANCE_SIGMA = 4.0;

fn luminance(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

/** How many rounds a pixel holding this many samples takes; 512 or more takes none. A half-resolution
 *  sample is shared by four pixels, so it counts as a quarter of one. */
fn rounds(count: f32) -> u32 {
  let samples = select(count, count * 0.25, frame.halfBounce == 1u);
  let halvings = floor(log2(max(samples, 1.0)) * 0.5 + 0.5);
  return u32(clamp(5.0 - halvings, 0.0, 5.0));
}

struct Geometry {
  position: vec3f,
  normal: vec3f,
  sky: bool,
}

fn traced(pixel: vec2i) -> Geometry {
  let depth = textureLoad(direct, pixel, 0).a;
  let normal = unpackNormal(textureLoad(albedo, pixel, 0).a);
  let position = frame.cameraPosition + cameraRay(vec2f(pixel) + 0.5) * depth;
  return Geometry(position, normal, depth < 0.0);
}

fn stored(pixel: vec2i) -> Geometry {
  let g = textureLoad(geometry, pixel, 0);
  return Geometry(g.xyz, unpackNormal(max(g.w, 0.0)), g.w < 0.0);
}

// How much neighbour q's light can stand in for pixel p's, by geometry
// alone: none for the sky, and falling away fast as q turns from p's facing
// or stands off p's plane. A floor pixel's neighbour up the wall fails both.
fn sameSurface(p: Geometry, q: Geometry, reach: f32) -> f32 {
  if (q.sky) { return 0.0; }
  let facing = pow(max(dot(p.normal, q.normal), 0.0), 32.0);
  let offPlane = abs(dot(p.normal, q.position - p.position));
  return facing * exp(-offPlane / reach);
}

/** How far off its plane a neighbour may stand: further for surfaces further away, whose pixels cover more. */
fn planeReach(p: Geometry) -> f32 {
  return 0.02 + 0.002 * length(p.position - frame.cameraPosition);
}

// The luminance variance across each pixel's own surface nearby, which
// tells the rounds how much of what they see is noise; and each pixel's
// position and normal, for the rounds to read instead of working out again.
@compute @workgroup_size(8, 8)
fn variance(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2i(textureDimensions(bounce));
  let pixel = vec2i(id.xy);
  if (any(pixel >= size)) { return; }
  let centre = textureLoad(bounce, pixel, 0);
  let p = traced(pixel);
  textureStore(geometryOut, pixel, vec4f(p.position, select(textureLoad(albedo, pixel, 0).a, -1.0, p.sky)));
  if (p.sky || rounds(centre.a) == 0u) {
    textureStore(spreadOut, pixel, vec4f(centre.rgb, 0.0));
    return;
  }

  let reach = planeReach(p);
  var sum = 0.0;
  var sumSquares = 0.0;
  var total = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let q = clamp(pixel + vec2i(x, y), vec2i(0), size - 1);
      let w = sameSurface(p, traced(q), reach);
      let l = luminance(textureLoad(bounce, q, 0).rgb);
      sum += w * l;
      sumSquares += w * l * l;
      total += w;
    }
  }
  let mean = sum / total;
  textureStore(spreadOut, pixel, vec4f(centre.rgb, max(sumSquares / total - mean * mean, 0.0)));
}

@compute @workgroup_size(8, 8)
fn atrous(@builtin(global_invocation_id) id: vec3u) {
  let size = vec2i(textureDimensions(samples));
  let pixel = vec2i(id.xy);
  if (any(pixel >= size)) { return; }
  let centre = textureLoad(source, pixel, 0);
  // Settled pixels, and the sky, pass straight through before anything else is read.
  if (iteration.index >= rounds(textureLoad(samples, pixel, 0).a)) {
    textureStore(filtered, pixel, centre);
    return;
  }
  let p = stored(pixel);
  if (p.sky) {
    textureStore(filtered, pixel, centre);
    return;
  }

  let spacing = 1 << iteration.index;
  let reach = planeReach(p);
  let lp = luminance(centre.rgb);
  let sigma = LUMINANCE_SIGMA * sqrt(centre.a) + 1e-4;
  var light = vec3f(0.0);
  var spread = 0.0;
  var total = 0.0;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let q = pixel + vec2i(x, y) * spacing;
      if (any(q < vec2i(0)) || any(q >= size)) { continue; }
      let neighbour = textureLoad(source, q, 0);
      // The tent: ½ in the middle, ¼ either side, along each axis.
      let tent = select(0.25, 0.5, x == 0) * select(0.25, 0.5, y == 0);
      let w = tent * sameSurface(p, stored(q), reach) * exp(-abs(luminance(neighbour.rgb) - lp) / sigma);
      light += w * neighbour.rgb;
      spread += w * w * neighbour.a;
      total += w;
    }
  }
  textureStore(filtered, pixel, vec4f(light / total, spread / (total * total)));
}
