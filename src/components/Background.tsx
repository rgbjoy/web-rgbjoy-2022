import { useState, useRef, useEffect } from 'react';

import * as THREE from "three";
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { EffectComposer, Noise } from "@react-three/postprocessing";
import * as random from "maath/random";

import gsap from "gsap"

import style from "./Background.module.scss"

function getRandomInt(min:any, max:any): number {
  return Math.random() * (max - min) + min;
}

const Plane = (props: any) => {
  const plane = useRef(null)

  useEffect(() => {
    gsap.from(plane.current.rotation, { duration: 3, delay: getRandomInt(0, 1), x: 0, y: 0, z: 0, ease: "power2.inOut" });
    gsap.from(plane.current.position, { duration: 3, delay: getRandomInt(0, 1), x: getRandomInt(-5, 5), y: getRandomInt(-5, 5), z: getRandomInt(-5, 5), ease: "power2.inOut" });
    gsap.from(plane.current.material, { duration: 3, opacity: 0, ease: "power2.in" });
  }, []);

  return (
    <mesh {...props} ref={plane} >
      <planeGeometry />
      <meshBasicMaterial side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthTest={false} transparent={true} color={props.color} />
    </mesh>
  )
}

const Rotate = ({children}) => {
  const ref = useRef(null)
  useFrame((state, delta) => {
    ref.current.rotation.y += delta / 50;
  })
  return <group ref={ref} {...children.props}></group>
}

const Stars = (props: any) => {
  const ref = useRef(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 10 }))
  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 50
    ref.current.rotation.y -= delta / 50
  })
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#565656" size={0.03} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  )
}

const Background = ({ page }) => {
  return (
    <Canvas className={style.background} dpr={[1.5, 2]} camera={{ fov: 25, position: [5, 5, 5] }}
      gl={{
        powerPreference: "high-performance",
        alpha: false,
        antialias: false,
        depth: false,
        toneMapping: THREE.NoToneMapping,
      }}>
      <color attach="background" args={["#121212"]} />
      <Stars />
      <Rotate>
        <group visible={page !== "/" ? false : true}>
          <Plane color="#FF0000" position={[-0.5, 0, 0]} rotation={[THREE.MathUtils.degToRad(90), 0, 0]} />
          <Plane color="#0000FF" position={[0, 0, 0]} rotation={[0, THREE.MathUtils.degToRad(90), 0]} />
          <Plane color="#00FF00" position={[-0.5, -0.5, 0]} rotation={[0, 0, 0]} />
        </group>
      </Rotate>
      <EffectComposer multisampling={0} disableNormalPass={true}>
        <Noise opacity={0.05} />
      </EffectComposer>
      {/* <CameraShake yawFrequency={0.02} pitchFrequency={0.02} rollFrequency={0.02} /> */}
    </Canvas>
  )
}

export default Background