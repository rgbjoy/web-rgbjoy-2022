// Spreads the half-resolution bounce back over every pixel, edge by edge (a
// joint bilateral upsample): each pixel blends the four blocks around it, but
// only those whose traced surface lies in its own plane and faces its way, so
// the floor's light never seeps up the wall or onto a sphere in front.
// Where no block shares its surface — a sliver too thin for any block to have
// traced from — the probe volume stands in, which the path tracer keeps up to
// date for the chrome anyway.
//
// What it writes takes the place of the bounce the trace would have written
// per pixel, so the denoiser, the composite and next frame's reflections read
// it exactly as they would that.
//
// Joined after scene.wgsl and frame.wgsl.

@group(1) @binding(0) var<uniform> frame: Frame;
/** This frame's half-resolution means (rgb) and sample counts (a). */
@group(1) @binding(1) var bounceHalf: texture_2d<f32>;
/** This frame's blocks: distance to the surface traced from (x), its packed normal (y), which pixel (z). */
@group(1) @binding(2) var surfaceHalf: texture_2d<f32>;
@group(1) @binding(3) var directNow: texture_2d<f32>;
@group(1) @binding(4) var albedoNow: texture_2d<f32>;
@group(1) @binding(5) var bounceOut: texture_storage_2d<rgba32float, write>;

/** What a pixel with no surface of its own to light reports: nothing, and settled, so the denoiser leaves it be. */
const NOTHING = vec4f(0.0, 0.0, 0.0, 1e4);

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let pixel = vec2i(id.xy);
  if (any(pixel >= vec2i(frame.resolution))) { return; }
  let depth = textureLoad(directNow, pixel, 0).a;
  let packed = textureLoad(albedoNow, pixel, 0).a;
  if (depth < 0.0 || isMirror(packed)) {
    textureStore(bounceOut, pixel, NOTHING);
    return;
  }
  let p = frame.cameraPosition + cameraRay(vec2f(pixel) + frame.jitter) * depth;
  let n = unpackNormal(packed);
  let reach = 0.02 + 0.002 * depth;

  // The blocks around the pixel, each weighted by how far the pixel it
  // traced from lies from this one — a tent two pixels wide, since a block's
  // sample sits at that pixel, not at the block's middle.
  let centre = vec2f(pixel) + 0.5;
  let home = vec2i(floor(vec2f(pixel) * 0.5));
  let size = vec2i(textureDimensions(bounceHalf));
  var light = vec3f(0.0);
  var total = 0.0;
  var count = 1e9;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let block = home + vec2i(x, y);
      if (any(block < vec2i(0)) || any(block >= size)) { continue; }
      let s = textureLoad(surfaceHalf, block, 0);
      if (s.x < 0.0) { continue; }
      let corner = i32(s.z);
      let traced = block * 2 + vec2i(corner & 1, corner >> 1u);
      // A floor on the tent, so a block one pixel too far still counts for a
      // little when it's the only one on this surface.
      let tent = max(vec2f(0.0), 1.0 - abs(centre - (vec2f(traced) + 0.5)) * 0.5) + 0.02;
      let q = frame.cameraPosition + cameraRay(vec2f(traced) + frame.jitter) * s.x;
      let facing = pow(max(dot(n, unpackNormal(s.y)), 0.0), 16.0);
      let w = tent.x * tent.y * facing * exp(-abs(dot(n, q - p)) / reach);
      if (w < 1e-5) { continue; }
      let blockLight = textureLoad(bounceHalf, block, 0);
      light += blockLight.rgb * w;
      total += w;
      count = min(count, blockLight.a);
    }
  }

  if (total < 1e-5) {
    // Noise-free, so it reports as settled: there's nothing for the denoiser to smooth.
    textureStore(bounceOut, pixel, vec4f(probeLight(p, n) * occlusion(p, n), SETTLED_PROBES));
    return;
  }
  textureStore(bounceOut, pixel, vec4f(light / total, count));
}

/** The sample count a probe-lit pixel reports. */
const SETTLED_PROBES = 512.0;
