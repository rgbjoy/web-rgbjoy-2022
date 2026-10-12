"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import GUI from "lil-gui"
import { memo, useCallback, useEffect, useMemo, useRef, type FC } from "react"
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  GLSL3,
  HalfFloatType,
  Matrix3,
  Matrix4,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three"
import { Accumulator, cameraMoved, type FrameMode } from "./accumulation"
import { Bloom, BLOOM_LEVELS } from "./bloom"
import { Controls, type EditMode } from "./Controls"
import { BLUE_NOISE_SIZE, blueNoiseRGBA } from "./blueNoise"
import displayShader from "./display.frag"
import probeShader from "./probe.frag"
import {
  PROBE_ATLAS_HEIGHT,
  PROBE_ATLAS_WIDTH,
  probeDefines,
  ProbeSchedule,
  randomRotation,
} from "./probes"
import { blockInverse, OBJECTS, resetObjects, sceneDefines, type SceneObject } from "./room"
import sceneShader from "./scene.glsl"
import traceShader from "./trace.frag"

import styles from "./GlobalIllumination.module.css"

/** Frames averaged at rest before the image counts as settled and tracing stops. */
const SAMPLE_LIMIT = 512
/** The probe volume's image has no noise to average away, only edges to antialias. */
const PROBE_SAMPLE_LIMIT = 96

/** Probe updates after a change before the volume counts as settled and stops. */
const PROBE_LIMIT = 120

/** Emissive intensity is in the panel's units; this brings it to scene radiance. */
const EMISSIVE_SCALE = 0.1

const METHODS = { "Path traced": 0, "Probe volume": 1 } as const
const SAMPLING = { "White noise": 0, "Blue noise": 1 } as const
const MARCH_STEPS = [4, 8, 16, 32, 64]
const VOLUME_STEPS = [8, 16, 32, 64]
const MODES: Record<FrameMode, number> = { fresh: 0, rest: 1, moving: 2 }

const SETTINGS = {
  emissiveColor: "#f2701f",
  emissiveIntensity: 7,
  lightX: 14,
  lightY: 5.2,
  lightZ: 1.7,
  shadowSoftness: 0.1,
  ambient: 0.02,
  accumulate: true,
  method: "Path traced" as keyof typeof METHODS,
  probeRays: 64,
  sampling: "Blue noise" as keyof typeof SAMPLING,
  bounces: 2,
  marchSteps: 32,
  marchJitter: true,
  volumetrics: true,
  volumeSteps: 32,
  volumeDensity: 0.014,
  exposure: 0.9,
  bloom: 1.2,
  bloomThreshold: 0.9,
  bloomRadius: 1.2,
}

/** Where the orbit starts: inside, looking across the room at the window wall. */
const CAMERA = {
  position: new Vector3(-2.2, 2.7, 5.2),
  target: new Vector3(0.4, 1.3, -1.6),
  /** Vertical field of view on a landscape screen. */
  fov: 52,
  /** Narrow screens widen the view until at least this much fits across. */
  minHorizontalFov: 58,
}

const emissive = new Color()

/** How many frames the current method needs averaged at rest. */
const sampleLimit = () => (SETTINGS.method === "Probe volume" ? PROBE_SAMPLE_LIMIT : SAMPLE_LIMIT)

/** Copies where the objects are onto the passes (whose scene uniforms are shared). */
function applyObjects(trace: ShaderMaterial) {
  const u = trace.uniforms
  u.uGlowCenter.value.copy(OBJECTS.glow.position)
  u.uPebbleCenter.value.copy(OBJECTS.pebble.position)
  u.uBlockCenter.value.copy(OBJECTS.block.position)
  blockInverse(u.uBlockInverse.value)
}

/** Copies the panel's settings onto the passes. The scene's uniforms are shared, so this reaches both. */
function applySettings(trace: ShaderMaterial, probe: ShaderMaterial) {
  const u = trace.uniforms
  u.uMethod.value = METHODS[SETTINGS.method]
  probe.uniforms.uProbeRays.value = SETTINGS.probeRays
  emissive.set(SETTINGS.emissiveColor)
  u.uEmissive.value
    .set(emissive.r, emissive.g, emissive.b)
    .multiplyScalar(SETTINGS.emissiveIntensity * EMISSIVE_SCALE)
  u.uBounces.value = SETTINGS.bounces
  u.uLightPosition.value.set(SETTINGS.lightX, SETTINGS.lightY, SETTINGS.lightZ)
  u.uShadowSoftness.value = SETTINGS.shadowSoftness
  u.uAmbient.value = SETTINGS.ambient
  u.uSampling.value = SAMPLING[SETTINGS.sampling]
  u.uMarchSteps.value = SETTINGS.marchSteps
  u.uMarchJitter.value = SETTINGS.marchJitter ? 1 : 0
  u.uVolumeSteps.value = SETTINGS.volumeSteps
  u.uVolumeDensity.value = SETTINGS.volumetrics ? SETTINGS.volumeDensity : 0
}

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position, 1.0); }
`

// The surface's own light plus what it bounces back, seen through the air,
// plus the light the air adds on the way.
const compositeShader = /* glsl */ `
  uniform sampler2D uBounce;
  uniform sampler2D uDirect;
  uniform sampler2D uAlbedo;
  uniform sampler2D uAir;
  void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec3 surface = texelFetch(uDirect, pixel, 0).rgb
      + texelFetch(uAlbedo, pixel, 0).rgb * texelFetch(uBounce, pixel, 0).rgb;
    vec4 air = texelFetch(uAir, pixel, 0);
    gl_FragColor = vec4(surface * air.a + air.rgb, 1.0);
  }
`

/** One triangle that covers the screen, drawn by itself in its own scene. */
function fullscreenPass(material: ShaderMaterial) {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
  )
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  const scene = new Scene()
  scene.add(mesh)
  return { scene, geometry }
}

type Passes = {
  /** Ping-pong history: bounce light and sample count, direct light and depth, surface colour, air. */
  history: [WebGLRenderTarget, WebGLRenderTarget]
  /** Ping-pong probe atlas: red, green and blue harmonics, and whether each probe is usable. */
  probes: [WebGLRenderTarget, WebGLRenderTarget]
  /** The surface and the air combined, ready to bloom and grade. */
  image: WebGLRenderTarget
  trace: ShaderMaterial
  probe: ShaderMaterial
  probeScene: Scene
  composite: ShaderMaterial
  bloom: Bloom
  display: ShaderMaterial
  traceScene: Scene
  compositeScene: Scene
  displayScene: Scene
  camera: OrthographicCamera
  dispose: () => void
}

type SceneProps = {
  onReady: () => void
  selected: SceneObject | null
  mode: EditMode
  onSelect: (name: SceneObject | null) => void
}

const GlobalIlluminationScene: FC<SceneProps> = memo(({ onReady, selected, mode, onSelect }) => {
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const passes = useRef<Passes | null>(null)
  const accumulator = useRef(new Accumulator(sampleLimit()))
  const probeSchedule = useRef(new ProbeSchedule(PROBE_LIMIT))
  /** The camera the history was traced from. */
  const tracedView = useRef(new Matrix4())
  const drawingSize = useRef(new Vector2())
  const readyRef = useRef(false)
  /** Mirrors the sample and probe counts for the panel's readout. */
  const progress = useRef({ samples: "0", probes: "–" })
  /** The transform gizmo, drawn over the finished picture. */
  const gizmo = useMemo(() => new Scene(), [])

  // A moved object changes all the light: start every mean over.
  const objectsMoved = useCallback(() => {
    if (passes.current) applyObjects(passes.current.trace)
    accumulator.current.reset()
    probeSchedule.current.reset()
    invalidate()
  }, [invalidate])

  useEffect(() => {
    // Float keeps a long running mean exact; half float is the fallback.
    const type = gl.extensions.has("EXT_color_buffer_float") ? FloatType : HalfFloatType
    const makeHistory = () => {
      const target = new WebGLRenderTarget(1, 1, {
        count: 4,
        type,
        format: RGBAFormat,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
      })
      target.textures.forEach((texture, i) => {
        texture.name = `Global Illumination ${["bounce", "direct", "albedo", "air"][i]}`
      })
      return target
    }
    const history: [WebGLRenderTarget, WebGLRenderTarget] = [makeHistory(), makeHistory()]
    const makeProbes = () => {
      const target = new WebGLRenderTarget(PROBE_ATLAS_WIDTH, PROBE_ATLAS_HEIGHT, {
        count: 4,
        type,
        format: RGBAFormat,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
      })
      target.textures.forEach((texture, i) => {
        texture.name = `Global Illumination probes ${["red", "green", "blue", "meta"][i]}`
      })
      return target
    }
    const probes: [WebGLRenderTarget, WebGLRenderTarget] = [makeProbes(), makeProbes()]
    const image = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    })
    image.texture.name = "Global Illumination image"

    const blueNoise = new DataTexture(
      blueNoiseRGBA(BLUE_NOISE_SIZE),
      BLUE_NOISE_SIZE,
      BLUE_NOISE_SIZE,
      RGBAFormat,
      UnsignedByteType,
    )
    blueNoise.minFilter = NearestFilter
    blueNoise.magFilter = NearestFilter
    blueNoise.needsUpdate = true

    // The scene's own uniforms, shared by reference between the trace and
    // the probe pass: set once, seen by both.
    const sceneUniforms = {
      uLightPosition: { value: new Vector3() },
      uShadowSoftness: { value: 0 },
      uAmbient: { value: 0 },
      uEmissive: { value: new Vector3() },
      uGlowCenter: { value: new Vector3() },
      uPebbleCenter: { value: new Vector3() },
      uBlockCenter: { value: new Vector3() },
      uBlockInverse: { value: new Matrix3() },
      uProbeRed: { value: probes[0].textures[0] },
      uProbeGreen: { value: probes[0].textures[1] },
      uProbeBlue: { value: probes[0].textures[2] },
      uProbeMeta: { value: probes[0].textures[3] },
    }
    const defines = { ...sceneDefines(), ...probeDefines() }

    const trace = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: `${sceneShader}\n${traceShader}`,
      defines,
      uniforms: {
        ...sceneUniforms,
        uBounceHistory: { value: null },
        uDirectHistory: { value: null },
        uAlbedoHistory: { value: null },
        uAirHistory: { value: null },
        uBlueNoise: { value: blueNoise },
        uResolution: { value: new Vector2(1, 1) },
        uMode: { value: 0 },
        uWeight: { value: 1 },
        uNoiseIndex: { value: 0 },
        uJitter: { value: new Vector2(0.5, 0.5) },
        uSampling: { value: 0 },
        uMarchSteps: { value: 1 },
        uMarchJitter: { value: 0 },
        uCameraPosition: { value: new Vector3() },
        uCameraRight: { value: new Vector3() },
        uCameraUp: { value: new Vector3() },
        uCameraForward: { value: new Vector3() },
        uTanHalfFov: { value: 1 },
        uPreviousPosition: { value: new Vector3() },
        uPreviousRight: { value: new Vector3() },
        uPreviousUp: { value: new Vector3() },
        uPreviousForward: { value: new Vector3() },
        uMethod: { value: 0 },
        uProbeSettling: { value: 0 },
        uBounces: { value: 1 },
        uVolumeSteps: { value: 1 },
        uVolumeDensity: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    })

    const probe = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader,
      fragmentShader: `${sceneShader}\n${probeShader}`,
      defines,
      uniforms: {
        ...sceneUniforms,
        uRayRotation: { value: new Matrix3() },
        uProbeRays: { value: 1 },
        uProbeWeight: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    })
    applySettings(trace, probe)
    applyObjects(trace)

    const composite = new ShaderMaterial({
      vertexShader,
      fragmentShader: compositeShader,
      uniforms: {
        uBounce: { value: null },
        uDirect: { value: null },
        uAlbedo: { value: null },
        uAir: { value: null },
      },
      depthTest: false,
      depthWrite: false,
    })

    const bloom = new Bloom()
    const display = new ShaderMaterial({
      vertexShader,
      fragmentShader: displayShader,
      uniforms: {
        uImage: { value: image.texture },
        uBloom: { value: bloom.texture },
        uResolution: { value: new Vector2(1, 1) },
        uBloomStrength: { value: 0 },
        uExposure: { value: 1 },
      },
      defines: { BLOOM_LEVELS },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })

    const traceQuad = fullscreenPass(trace)
    const probeQuad = fullscreenPass(probe)
    const compositeQuad = fullscreenPass(composite)
    const displayQuad = fullscreenPass(display)

    passes.current = {
      history,
      probes,
      image,
      trace,
      probe,
      probeScene: probeQuad.scene,
      composite,
      bloom,
      display,
      traceScene: traceQuad.scene,
      compositeScene: compositeQuad.scene,
      displayScene: displayQuad.scene,
      camera: new OrthographicCamera(),
      dispose: () => {
        history.forEach((target) => target.dispose())
        probes.forEach((target) => target.dispose())
        image.dispose()
        bloom.dispose()
        blueNoise.dispose()
        trace.dispose()
        probe.dispose()
        composite.dispose()
        display.dispose()
        traceQuad.geometry.dispose()
        probeQuad.geometry.dispose()
        compositeQuad.geometry.dispose()
        displayQuad.geometry.dispose()
      },
    }
    accumulator.current.reset()
    probeSchedule.current.reset()
    invalidate()

    return () => {
      passes.current?.dispose()
      passes.current = null
    }
  }, [gl, invalidate])

  useEffect(() => {
    const gui = new GUI({ title: "Global Illumination" })

    // Anything that changes the light throws every running mean away.
    const sync = () => {
      if (passes.current) applySettings(passes.current.trace, passes.current.probe)
      accumulator.current.limit = sampleLimit()
      accumulator.current.reset()
      probeSchedule.current.reset()
      invalidate()
    }
    // Grading happens after the mean, so it only needs a redraw.
    const redraw = () => invalidate()

    const scene = gui.addFolder("Scene")
    scene.addColor(SETTINGS, "emissiveColor").name("Emissive color").onChange(sync)
    scene.add(SETTINGS, "emissiveIntensity", 0, 60, 0.5).name("Emissive intensity").onChange(sync)
    scene.add(SETTINGS, "exposure", 0.1, 2, 0.01).name("Exposure").onChange(redraw)
    scene
      .add(
        {
          resetObjects: () => {
            resetObjects()
            objectsMoved()
          },
        },
        "resetObjects",
      )
      .name("Reset objects")

    const light = gui.addFolder("Light")
    light.add(SETTINGS, "lightX", -4.5, 24, 0.1).name("Position x").onChange(sync)
    light.add(SETTINGS, "lightY", 0.2, 14, 0.1).name("Position y").onChange(sync)
    light.add(SETTINGS, "lightZ", -12, 12, 0.1).name("Position z").onChange(sync)
    light.add(SETTINGS, "shadowSoftness", 0.1, 10, 0.1).name("Shadow softness").onChange(sync)
    light.add(SETTINGS, "ambient", 0, 1, 0.01).name("Ambient fill").onChange(sync)

    const sampling = gui.addFolder("GI Sampling")
    const method = sampling.add(SETTINGS, "method", Object.keys(METHODS)).name("Method")
    sampling.add(SETTINGS, "accumulate").name("Accumulate").onChange(sync)
    // These only steer the path tracer's bounce rays.
    const traced = [
      sampling.add(SETTINGS, "bounces", [1, 2]).name("Bounces").onChange(sync),
      sampling.add(SETTINGS, "sampling", Object.keys(SAMPLING)).name("Sampling").onChange(sync),
      sampling.add(SETTINGS, "marchSteps", MARCH_STEPS).name("March steps").onChange(sync),
      sampling.add(SETTINGS, "marchJitter").name("March jitter").onChange(sync),
    ]
    sampling.add(progress.current, "samples").name("Samples").disable().listen()

    const probeFolder = gui.addFolder("Probe Volume")
    const probeRays = probeFolder
      .add(SETTINGS, "probeRays", [16, 32, 64, 128])
      .name("Rays per probe")
      .onChange(sync)
    probeFolder.add(progress.current, "probes").name("Updates").disable().listen()

    // Grey out whatever the chosen method ignores.
    const showMethod = () => {
      const probing = SETTINGS.method === "Probe volume"
      traced.forEach((controller) => controller.enable(!probing))
      probeRays.enable(probing)
    }
    method.onChange(() => {
      showMethod()
      sync()
    })
    showMethod()

    const volume = gui.addFolder("Volumetrics")
    volume.add(SETTINGS, "volumetrics").name("Enabled").onChange(sync)
    volume.add(SETTINGS, "volumeSteps", VOLUME_STEPS).name("March steps").onChange(sync)
    volume.add(SETTINGS, "volumeDensity", 0, 0.2, 0.001).name("Density").onChange(sync)

    const bloom = gui.addFolder("Bloom")
    bloom.add(SETTINGS, "bloom", 0, 4, 0.05).name("Strength").onChange(redraw)
    bloom.add(SETTINGS, "bloomThreshold", 0, 3, 0.05).name("Threshold").onChange(redraw)
    bloom.add(SETTINGS, "bloomRadius", 0.5, 2, 0.05).name("Radius").onChange(redraw)

    let hidden = true
    const setHidden = (value: boolean) => {
      hidden = value
      gui.domElement.style.display = value ? "none" : ""
    }
    setHidden(true)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.key.toLowerCase() !== "h") return

      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return

      setHidden(!hidden)
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      gui.destroy()
    }
  }, [invalidate, objectsMoved])

  useFrame(
    ({ gl: renderer, camera }) => {
      const pass = passes.current
      if (!pass) return

      const u = pass.trace.uniforms
      renderer.getDrawingBufferSize(drawingSize.current)
      const { x: width, y: height } = drawingSize.current
      if (pass.image.width !== width || pass.image.height !== height) {
        pass.history.forEach((target) => target.setSize(width, height))
        pass.image.setSize(width, height)
        pass.bloom.setSize(width, height)
        u.uResolution.value.set(width, height)
        pass.display.uniforms.uResolution.value.set(width, height)
        const tanHalfFov = Math.max(
          Math.tan((CAMERA.fov * Math.PI) / 360),
          Math.tan((CAMERA.minHorizontalFov * Math.PI) / 360) / (width / height),
        )
        u.uTanHalfFov.value = tanHalfFov
        // The shader casts its own rays; the camera is matched to them so the
        // gizmo draws, and clicks pick, exactly where the picture says.
        if ("fov" in camera) {
          camera.fov = (Math.atan(tanHalfFov) * 360) / Math.PI
          camera.updateProjectionMatrix()
        }
        accumulator.current.reset()
      }

      camera.updateMatrixWorld()
      const view = camera.matrixWorld
      const moving = cameraMoved(view.elements, tracedView.current.elements)
      const accumulate = SETTINGS.accumulate

      // The probe volume settles on its own clock, whatever the camera does.
      const probing = SETTINGS.method === "Probe volume" && probeSchedule.current.pending()
      const shared = u
      if (probing) {
        const [before, after] = pass.probes
        shared.uProbeRed.value = before.textures[0]
        shared.uProbeGreen.value = before.textures[1]
        shared.uProbeBlue.value = before.textures[2]
        shared.uProbeMeta.value = before.textures[3]
        const p = pass.probe.uniforms
        p.uProbeWeight.value = probeSchedule.current.next()
        p.uRayRotation.value.fromArray(randomRotation())
        renderer.setRenderTarget(after)
        renderer.render(pass.probeScene, pass.camera)
        pass.probes = [after, before]
      }
      const [probesNow] = pass.probes
      shared.uProbeRed.value = probesNow.textures[0]
      shared.uProbeGreen.value = probesNow.textures[1]
      shared.uProbeBlue.value = probesNow.textures[2]
      shared.uProbeMeta.value = probesNow.textures[3]
      u.uProbeSettling.value = probing ? 0.1 : 0

      if (moving || probing || accumulator.current.pending(accumulate)) {
        const sample = accumulator.current.next(accumulate, moving)
        const [previous, next] = pass.history

        // The shader rebuilds each camera ray from the camera's own axes, and
        // finds last frame's surfaces through the camera that traced them.
        const last = tracedView.current
        u.uPreviousPosition.value.setFromMatrixPosition(last)
        u.uPreviousRight.value.setFromMatrixColumn(last, 0)
        u.uPreviousUp.value.setFromMatrixColumn(last, 1)
        u.uPreviousForward.value.setFromMatrixColumn(last, 2).negate()
        u.uCameraPosition.value.setFromMatrixPosition(view)
        u.uCameraRight.value.setFromMatrixColumn(view, 0)
        u.uCameraUp.value.setFromMatrixColumn(view, 1)
        u.uCameraForward.value.setFromMatrixColumn(view, 2).negate()
        // Measured frame to frame, so the last creep of a damped orbit never
        // adds up to a move and restarts a run already under way.
        last.copy(view)

        u.uBounceHistory.value = previous.textures[0]
        u.uDirectHistory.value = previous.textures[1]
        u.uAlbedoHistory.value = previous.textures[2]
        u.uAirHistory.value = previous.textures[3]
        u.uMode.value = MODES[sample.mode]
        u.uWeight.value = sample.weight
        u.uNoiseIndex.value = sample.index
        u.uJitter.value.set(sample.jitterX, sample.jitterY)
        renderer.setRenderTarget(next)
        renderer.render(pass.traceScene, pass.camera)
        pass.history = [next, previous]
        invalidate()
      }
      progress.current.probes =
        SETTINGS.method === "Probe volume" ? `${probeSchedule.current.frames} / ${PROBE_LIMIT}` : "–"
      progress.current.samples = !accumulate
        ? "1 (no accumulation)"
        : moving
          ? "moving"
          : `${Math.min(accumulator.current.samples, accumulator.current.limit)} / ${accumulator.current.limit}`

      const [latest] = pass.history
      const composite = pass.composite.uniforms
      composite.uBounce.value = latest.textures[0]
      composite.uDirect.value = latest.textures[1]
      composite.uAlbedo.value = latest.textures[2]
      composite.uAir.value = latest.textures[3]
      renderer.setRenderTarget(pass.image)
      renderer.render(pass.compositeScene, pass.camera)

      const display = pass.display.uniforms
      display.uExposure.value = SETTINGS.exposure
      display.uBloomStrength.value = SETTINGS.bloom
      if (SETTINGS.bloom > 0) {
        pass.bloom.radius = SETTINGS.bloomRadius
        // The same scale the tone map applies, so the threshold is judged on screen brightness.
        pass.bloom.exposure = SETTINGS.exposure / 0.6
        pass.bloom.threshold = SETTINGS.bloomThreshold
        pass.bloom.render(renderer, pass.image.texture)
      }
      renderer.setRenderTarget(null)
      renderer.render(pass.displayScene, pass.camera)
      if (selected) {
        const autoClear = renderer.autoClear
        renderer.autoClear = false
        renderer.render(gizmo, camera)
        renderer.autoClear = autoClear
      }

      if (!readyRef.current) {
        readyRef.current = true
        onReady()
      }
    },
    // The render phase runs after every update; a job here replaces R3F's default render.
    { phase: "render" },
  )

  return (
    <Controls
      gizmo={gizmo}
      selected={selected}
      mode={mode}
      onSelect={onSelect}
      onMove={objectsMoved}
      home={CAMERA}
    />
  )
})

GlobalIlluminationScene.displayName = "GlobalIlluminationScene"

export const GlobalIlluminationCanvas: FC<SceneProps> = (props) => (
  <Canvas
    className={styles.canvas}
    frameloop="demand"
    // Every pixel is traced, and on a 120 Hz screen a frame has 8 ms. The
    // accumulated jitter antialiases what the lower ceiling gives up.
    dpr={[1, 1.25]}
    gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
  >
    <GlobalIlluminationScene {...props} />
  </Canvas>
)
