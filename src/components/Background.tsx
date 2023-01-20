import { useState, useRef, useEffect } from 'react';

import * as THREE from "three";
import { ResizeObserver } from "@juggle/resize-observer"
import { Group } from 'three';
import { Canvas, useFrame } from '@react-three/fiber'
import {  Float } from '@react-three/drei'

import gsap from "gsap"

import style from "./Background.module.scss"

let clickable:boolean = false
let firstLoad:boolean = true
let currentPage:string = ""

const colors = {
  "/": {
    "red": {r:1, g:0, b:0},
    "green": {r:0, g:1, b:0},
    "blue": {r:0, g:0, b:1},
  },
  "/info": {
    r:1, g:0, b:0
  },
  "/dev": {
    r:0, g:1, b:0
  },
  "/art": {
    r:0, g:0, b:1
  }
};

const getRandomPick = (items: Array<number>): number => {
  return items[Math.floor(Math.random() * items.length)];
}

const getRandomRange = (min:number, max:number): number => {
  return Math.random() * (max - min) + min;
}

const animateIn = (meshes) => {
  for (var m of meshes) {

    if (firstLoad) {
      m.position.set(getRandomPick([-5, 5]), getRandomPick([-5, 5]), getRandomPick([-5, 5]))
    }

    if (m.name == "red") {
      gsap.to(m.position, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: THREE.MathUtils.degToRad(90), y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.material.color, { duration: 2, r:colors[currentPage][m.name].r, g:colors[currentPage][m.name].g, b:colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    } else if (m.name == "green") {
      gsap.to(m.position, { duration: 2, x: 0, y: -0.5, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.material.color, { duration: 2, r:colors[currentPage][m.name].r, g:colors[currentPage][m.name].g, b:colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    } else if (m.name == "blue") {
      gsap.to(m.position, { duration: 2, x: 0.5, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: THREE.MathUtils.degToRad(90), z: 0, ease: "Power2.easeOut" });
      gsap.to(m.material.color, { duration: 2, r:colors[currentPage][m.name].r, g:colors[currentPage][m.name].g, b:colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    }

    gsap.to(m.material, { duration: 2, opacity: 1, ease: "Power2.easeOut", onComplete: () => { clickable = true } });
  }
  firstLoad = false
}

const animateOut = (meshes, explode:boolean = false) => {
  let maxDegree = 45
  let maxDistance = explode ? 2 : 1
  for (var m of meshes) {
    gsap.to(m.rotation, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, x: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), y: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), z: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), ease: explode ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.position, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, x: getRandomRange(-maxDistance, maxDistance), y: getRandomRange(-maxDistance, maxDistance), z: getRandomRange(-maxDistance, maxDistance), ease: explode ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.material, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, opacity: explode ? 1 : 0.15, ease: explode ? "Sine.easInOut" : "Power2.easInOut", onComplete: () => clickable = true});
    if (!explode) {
      gsap.to(m.material.color, { overwrite: true, duration: 1.5, r:colors[currentPage].r, g:colors[currentPage].g, b:colors[currentPage].b, ease: "Power2.easInOut"});
    }
  }
  firstLoad = false
}

const handleClick = (e) => {
  if (!clickable || currentPage !== "/") {
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
  const ref = useRef<Group>(null!)
  currentPage = page

  useEffect(() => {
    if (currentPage === "/") {
      document.body.style.cursor = hovered ? 'pointer' : 'auto'
    }
  }, [hovered])

  useEffect(() => {
    const meshes = ref.current && ref.current.children
    if (currentPage === "/") {
      animateIn(meshes)
    } else {
      animateOut(meshes)
    }
  }, [page])

  useFrame((state, delta) => {
    let WIDTH = state.viewport.width * state.viewport.factor;
    ref.current.position.y = WIDTH < 768 ? -0.5 : 0;
    ref.current.rotation.y += delta / 50;
  })

  return (
    <group
      onClick={e => handleClick(e)}
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