"use client"

import { GlobalIlluminationViewer } from "../global-illumination/Viewer"
import { GlobalIlluminationWebGPUCanvas } from "./GlobalIlluminationWebGPU"

export default function Page() {
  return <GlobalIlluminationViewer Canvas={GlobalIlluminationWebGPUCanvas} />
}
