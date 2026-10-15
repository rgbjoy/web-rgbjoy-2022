"use client"

import { GlobalIlluminationCanvas } from "./GlobalIllumination"
import { GlobalIlluminationViewer } from "./Viewer"

export default function Page() {
  return <GlobalIlluminationViewer Canvas={GlobalIlluminationCanvas} />
}
