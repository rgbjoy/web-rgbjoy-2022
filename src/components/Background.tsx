import { useState, useRef, useEffect, Suspense, Children } from 'react';

import * as THREE from "three";
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as random from "maath/random";

import gsap from "gsap"

import style from "./Background.module.scss"
import { MeshStandardMaterial } from 'three';

const getRandomInt = (min: any, max: any):number => {
  return Math.random() * (max - min) + min;
}

const getRandomPick = (items:Array<number>):number => {
  return items[Math.floor(Math.random()*items.length)];
}

let clickable = true
const handleClick = (e) => {

  if (!clickable) {
    return
  }

  clickable = false

  const meshes = e.eventObject.children
  for(var m of meshes) {
    gsap.to(m.rotation, { yoyo: true, repeat: 1, duration: 2, x: 0, y:0, z:0, ease: "power2.inOut" });
    gsap.to(m.position, { yoyo: true, repeat: 1, duration: 2, x: getRandomPick([-5, 5]), y: getRandomPick([-5, 5]), z: getRandomPick([-5, 5]), ease: "power2.inOut" });
    gsap.to(m.material, { yoyo: true, repeat: 1, duration: 2, opacity: 0, ease: "power2.in", onComplete:() => {clickable = true} });
  }
}

const Plane = (props: any) => {
  const plane = useRef(null)

  useEffect(() => {
    gsap.from(plane.current.rotation, { duration: 3, delay: getRandomInt(0, 1), x: 0, y: 0, z: 0, ease: "power2.inOut" });
    gsap.from(plane.current.position, { duration: 3, delay: getRandomInt(0, 1), x: getRandomPick([-5, 5]), y: getRandomPick([-5, 5]), z: getRandomPick([-5, 5]), ease: "power2.inOut" });
    gsap.to(plane.current.material, { duration: 3, opacity: 1, ease: "power2.in" });
  }, []);

  return (
    <mesh {...props} ref={plane} >
      <planeGeometry />
      <meshBasicMaterial side={THREE.DoubleSide} blending={THREE.AdditiveBlending} opacity={0} depthTest={false} transparent={true} color={props.color} />
    </mesh>
  )
}

const Rig = ({ children, page }) => {
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  useFrame((state, delta) => {
    let WIDTH = state.viewport.width * state.viewport.factor;
    ref.current.position.y = WIDTH < 768 ? -0.5 : 0;
    ref.current.rotation.y += delta / 50;
  })
  return (
    <group onClick={handleClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} ref={ref} visible={page !== "/" ? false : true}>{children}</group>
  )
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
        <PointMaterial transparent color="#888888" size={0.03} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  )
}

const Background = ({ page }) => {
  return (
    <Canvas className={style.background} camera={{ fov: 25, position: [5, 5, 5] }} resize={{ polyfill: ResizeObserver }}
      gl={{
        powerPreference: "high-performance",
        alpha: true,
        antialias: false,
        depth: false,
        toneMapping: THREE.NoToneMapping,
      }}>
        <Suspense fallback={null}>
          <Stars />
          <Float>
            <Rig page={page}>
              <Plane color="#FF0000" position={[0, 0, 0]} rotation={[THREE.MathUtils.degToRad(90), 0, 0]} />
              <Plane color="#0000FF" position={[0.5, 0, 0]} rotation={[0, THREE.MathUtils.degToRad(90), 0]} />
              <Plane color="#00FF00" position={[0, -0.5, 0]} />
            </Rig>
          </Float>
        </Suspense>
    </Canvas>
  )
}

export default Background