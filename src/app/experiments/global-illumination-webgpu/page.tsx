"use client"

import dynamic from "next/dynamic"

// WebGPU and three.js's renderers only exist in the browser.
const Scene = dynamic(() => import("./Scene"), { ssr: false })
export default function Page() { return <Scene /> }
