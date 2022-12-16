import { useState, useRef, useEffect } from 'react';

import * as THREE from "three";
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as random from "maath/random";

import gsap from "gsap"

import style from "./Background.module.scss"

let animatingOut = false
let clickable = false

const getRandomPick = (items: Array<number>): number => {
  return items[Math.floor(Math.random() * items.length)];
}

const animateOut = (meshes) => {
  for (var m of meshes) {
    gsap.to(m.rotation, { overwrite: true, duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeIn" });
    gsap.to(m.position, { overwrite: true, duration: 2, x: getRandomPick([-5, 5]), y: getRandomPick([-5, 5]), z: getRandomPick([-5, 5]), ease: "Power2.easeIn" });
    gsap.to(m.material, { overwrite: true, duration: 2, opacity: 0, ease: "Power2.easeIn", onComplete: () => animatingOut = false });
  }
}

const animateIn = (meshes) => {
  for (var m of meshes) {

    if (!animatingOut) {
      m.position.set(getRandomPick([-5, 5]), getRandomPick([-5, 5]), getRandomPick([-5, 5]))
    }

    if (m.name == "red") {
      gsap.to(m.position, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: THREE.MathUtils.degToRad(90), y: 0, z: 0, ease: "Power2.easeOut" });
    } else if (m.name == "green") {
      gsap.to(m.position, { duration: 2, x: 0, y: -0.5, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
    } else if (m.name == "blue") {
      gsap.to(m.position, { duration: 2, x: 0.5, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: THREE.MathUtils.degToRad(90), z: 0, ease: "Power2.easeOut" });
    }

    gsap.to(m.material, { duration: 2, opacity: 1, ease: "Power2.easeOut", onComplete: () => { clickable = true } });
  }
}

const handleClick = (e, isHome) => {
  if (!clickable && isHome) {
    return
  }

  clickable = false

  const meshes = e.eventObject.children
  for (var m of meshes) {
    gsap.to(m.rotation, { yoyo: true, repeat: 1, duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeInOut" });
    gsap.to(m.position, { yoyo: true, repeat: 1, duration: 2, x: getRandomPick([-5, 5]), y: getRandomPick([-5, 5]), z: getRandomPick([-5, 5]), ease: "Power2.easeInOut" });
    gsap.to(m.material, { yoyo: true, repeat: 1, duration: 2, opacity: 0, ease: "Power2.easeInOut", onComplete: () => { clickable = true } });
  }
}

const Plane = (props: any) => {
  return (
    <mesh {...props} >
      <planeGeometry />
      <meshBasicMaterial side={THREE.DoubleSide} blending={THREE.AdditiveBlending} opacity={0} depthTest={false} transparent={true} color={props.color} />
    </mesh>
  )
}

const Rig = ({ children, page }) => {
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)
  const isHome = page == "/" ? true : false

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])

  useEffect(() => {
    const meshes = ref.current && ref.current.children
    if (!meshes) {
      return
    }
    isHome ? animateIn(meshes) : animateOut(meshes)
  }, [isHome])

  useFrame((state, delta) => {
    let WIDTH = state.viewport.width * state.viewport.factor;
    ref.current.position.y = WIDTH < 768 ? -0.5 : 0;
    ref.current.rotation.y += delta / 50;
  })

  return (
    <group
      onClick={e => handleClick(e, isHome)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      ref={ref}>
      {children}
    </group>
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
      <Stars />
      <Float>
        <Rig page={page}>
          <Plane color="#FF0000" name="red" />
          <Plane color="#00FF00" name="green" />
          <Plane color="#0000FF" name="blue" />
        </Rig>
      </Float>
    </Canvas>
  )
}

export default Background