// TypeScript's DOM library types WebGPU's interfaces but not its flag
// namespaces, nor the canvas's "webgpu" context. Just those, until the
// project takes on @webgpu/types.

declare const GPUBufferUsage: {
  readonly MAP_READ: GPUFlagsConstant
  readonly MAP_WRITE: GPUFlagsConstant
  readonly COPY_SRC: GPUFlagsConstant
  readonly COPY_DST: GPUFlagsConstant
  readonly INDEX: GPUFlagsConstant
  readonly VERTEX: GPUFlagsConstant
  readonly UNIFORM: GPUFlagsConstant
  readonly STORAGE: GPUFlagsConstant
  readonly INDIRECT: GPUFlagsConstant
  readonly QUERY_RESOLVE: GPUFlagsConstant
}

declare const GPUTextureUsage: {
  readonly COPY_SRC: GPUFlagsConstant
  readonly COPY_DST: GPUFlagsConstant
  readonly TEXTURE_BINDING: GPUFlagsConstant
  readonly STORAGE_BINDING: GPUFlagsConstant
  readonly RENDER_ATTACHMENT: GPUFlagsConstant
}

declare const GPUShaderStage: {
  readonly VERTEX: GPUFlagsConstant
  readonly FRAGMENT: GPUFlagsConstant
  readonly COMPUTE: GPUFlagsConstant
}

declare const GPUMapMode: {
  readonly READ: GPUFlagsConstant
  readonly WRITE: GPUFlagsConstant
}

type GPUFlagsConstant = number

interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): GPUCanvasContext | null
}
