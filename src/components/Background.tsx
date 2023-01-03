import { useState, useRef, useEffect } from 'react';

import * as THREE from "three";
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame } from '@react-three/fiber'
import {  Float } from '@react-three/drei'

import gsap from "gsap"

import style from "./Background.module.scss"

let clickable = false
let firstLoad = true

const getRandomPick = (items: Array<number>): number => {
  return items[Math.floor(Math.random() * items.length)];
}

const animateOut = (meshes, isYoyo = false) => {
  for (var m of meshes) {
    gsap.to(m.rotation, { yoyo: isYoyo ? true : false, repeat: isYoyo ? 1 : 0, overwrite: true, duration: 2, x: THREE.MathUtils.degToRad(getRandomPick([-45, 45])), y: THREE.MathUtils.degToRad(getRandomPick([-45, 45])), z: THREE.MathUtils.degToRad(getRandomPick([-45, 45])), ease: isYoyo ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.position, { yoyo: isYoyo ? true : false, repeat: isYoyo ? 1 : 0, overwrite: true, duration: 2, x: getRandomPick([-1, 1]), y: getRandomPick([-1, 1]), z: getRandomPick([-1, 1]), ease: isYoyo ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.material, { yoyo: isYoyo ? true : false, repeat: isYoyo ? 1 : 0, overwrite: true, duration: 2, opacity: isYoyo ? 1 : 0.15, ease: isYoyo ? "Sine.easInOut" : "Power2.easInOut", onComplete: () => clickable = true });
  }
}

const animateIn = (meshes) => {
  for (var m of meshes) {

    if (firstLoad) {
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
  firstLoad = false
}

const handleClick = (e, isHome) => {
  if (!clickable || !isHome) {
    return
  }

  clickable = false

  const meshes = e.eventObject.children
  animateOut(meshes, true)
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
    if (isHome) {
      document.body.style.cursor = hovered ? 'pointer' : 'auto'
    }
  }, [hovered])

  useEffect(() => {
    const meshes = ref.current && ref.current.children
    if (!meshes) {
      return
    }
    if (isHome) {
      animateIn(meshes)
    } else {
      animateOut(meshes)
    }
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