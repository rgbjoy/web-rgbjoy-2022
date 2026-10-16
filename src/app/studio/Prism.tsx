"use client"

import { useEffect, useRef } from "react"

import fragmentShader from "./prism.frag"

/** One triangle that covers the whole canvas; the fragment shader does the rest. */
const VERTEX_SHADER = "attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }"

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

/** Returns a draw function for the given time, or null when WebGL isn't available. */
function setup(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.useProgram(program)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const resolution = gl.getUniformLocation(program, "uResolution")
  const time = gl.getUniformLocation(program, "uTime")
  return (seconds: number) => {
    // Soft light needs no extra pixels, so it renders at CSS size even on dense screens.
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
    gl.uniform2f(resolution, width, height)
    gl.uniform1f(time, seconds)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
}

/** Light split by a prism, falling in from the top right corner. Still under reduced motion. */
export function Prism({ className, still }: { className?: string; still: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const draw = canvas && setup(canvas)
    if (!canvas || !draw) return

    // A fixed moment that looks good, for reduced motion.
    if (still) {
      draw(3)
      return
    }

    // Pinned to the window, so it's always in view; the browser pauses frames in a background tab.
    let frame = 0
    const tick = (now: number) => {
      draw(now / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [still])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
