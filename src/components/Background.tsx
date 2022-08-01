import { useState, useRef } from 'react';

import * as THREE from "three";
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import * as random from "maath/random";

import style from "./Background.module.scss"


const Stars = (props: any) => {
  const ref = useRef<THREE.Points>(null!);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }))
  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 50
    ref.current.rotation.y -= delta / 50
  })
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#565656" size={0.003} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  )
}

const Background = () => {
  return (
    <Canvas className={style.background} camera={{ position: [0, 0, 1] }}
      gl={{
        powerPreference: "high-performance",
        alpha: false,
        antialias: false,
        stencil: false,
        depth: false
      }}>
      <color attach="background" args={["#121212"]} />
      <EffectComposer multisampling={0} disableNormalPass={true}>
        <Noise opacity={0.05} />
        <Stars />
      </EffectComposer>
    </Canvas>
  )
}

export default Background