import { useState, useRef, useEffect, useMemo } from 'react';

import * as THREE from 'three';
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, useCursor, RoundedBox } from '@react-three/drei'
import { interactionGroups, Physics, InstancedRigidBodies, RapierRigidBody, InstancedRigidBodyProps } from "@react-three/rapier";
import { Attractor } from "@react-three/rapier-addons";

import gsap from "gsap"

import style from "./background.module.scss"

let clickable: boolean = false
let firstLoad: boolean = true
let currentPage: string = ""

const colors = {
  "home": {
    "red": { r: 1, g: 0, b: 0 },
    "green": { r: 0, g: 1, b: 0 },
    "blue": { r: 0, g: 0, b: 1 },
  },
  "info": {
    r: 1, g: 0, b: 0
  },
  "dev": {
    r: 0, g: 1, b: 0
  },
  "art": {
    r: 0, g: 0, b: 1
  },
  "posts": {
    r: 1, g: 1, b: 0
  },
};

const getRandomPick = (items: Array<number>): number => {
  return items[Math.floor(Math.random() * items.length)];
}

const getRandomRange = (min: number, max: number): number => {
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
      gsap.to(m.children[0].material.color, { duration: 2, r: colors[currentPage][m.name].r, g: colors[currentPage][m.name].g, b: colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    } else if (m.name == "green") {
      gsap.to(m.position, { duration: 2, x: 0, y: -0.5, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.children[0].material.color, { duration: 2, r: colors[currentPage][m.name].r, g: colors[currentPage][m.name].g, b: colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    } else if (m.name == "blue") {
      gsap.to(m.position, { duration: 2, x: 0.5, y: 0, z: 0, ease: "Power2.easeOut" });
      gsap.to(m.rotation, { duration: 2, x: 0, y: THREE.MathUtils.degToRad(90), z: 0, ease: "Power2.easeOut" });
      gsap.to(m.children[0].material.color, { duration: 2, r: colors[currentPage][m.name].r, g: colors[currentPage][m.name].g, b: colors[currentPage][m.name].b, ease: "Power2.easeOut" });
    }

    gsap.to(m.children[0].material, { duration: 2, opacity: 1, ease: "Power2.easeOut", onComplete: () => { clickable = true } });
  }
  firstLoad = false
}

const animateOut = (meshes, explode: boolean = false) => {
  let maxDegree = 45
  let maxDistance = explode ? 2 : 1
  for (var m of meshes) {
    gsap.to(m.rotation, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, x: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), y: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), z: THREE.MathUtils.degToRad(getRandomRange(-maxDegree, maxDegree)), ease: explode ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.position, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, x: getRandomRange(-maxDistance, maxDistance), y: getRandomRange(-maxDistance, maxDistance), z: getRandomRange(-maxDistance, maxDistance), ease: explode ? "Sine.easInOut" : "Power2.easInOut" });
    gsap.to(m.children[0].material, { yoyo: explode ? true : false, repeat: explode ? 1 : 0, overwrite: true, duration: explode ? 1 : 1.5, opacity: explode ? 1 : 0.15, ease: explode ? "Sine.easInOut" : "Power2.easInOut", onComplete: () => { clickable = true } });

    if (!explode) {
      gsap.to(m.children[0].material.color, { overwrite: true, duration: 1.5, r: colors[currentPage].r, g: colors[currentPage].g, b: colors[currentPage].b, ease: "Power2.easInOut" });
    }
  }
  firstLoad = false
}

const handleClick = (e) => {
  if (!clickable || currentPage !== "home") {
    return
  }

  clickable = false

  const meshes = e.eventObject.children
  animateOut(meshes, true)
}

const RGBPlane = (props: any) => {
  const config = {
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    color: props.color,
    opacity: 0,
    depthTest: false,
    transparent: true,
  }
  return (
    <mesh {...props}>
      <RoundedBox args={[1, 1, 0.01]} radius={0.01}>
        <meshBasicMaterial {...config} />
      </RoundedBox>
    </mesh>
  )
}

const RigPages = ({ page }) => {

  const { camera } = useThree();
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  const [hovered, set] = useState(Boolean)
  useCursor(hovered && currentPage === "home", 'pointer', 'auto')

  const ref = useRef<THREE.Group>(null!)
  currentPage = page.split("/")[1] === "" ? "home" : page.split("/")[1]

  useEffect(() => {
    const meshes = ref.current && ref.current.children
    if (currentPage === "home") {
      animateIn(meshes)
    } else {
      animateOut(meshes)
    }
  }, [page])

  useFrame((state, delta) => {
    let WIDTH = state.viewport.width * state.viewport.factor;
    ref.current.position.y = WIDTH < 768 ? -0.5 : 0;
    ref.current.rotation.y += delta / 25;
  })

  return (
    <group
      onPointerOver={() => set(true)} onPointerOut={() => set(false)}
      onClick={e => handleClick(e)}
      ref={ref}>
      <RGBPlane color="#FF0000" name="red" />
      <RGBPlane color="#00FF00" name="green" />
      <RGBPlane color="#0000FF" name="blue" />
    </group>
  )
}

const Rig404 = () => {
  const COUNT = 26;
  const refMesh = useRef<THREE.InstancedMesh>(null);
  const rigidBodies = useRef<RapierRigidBody[]>(null);

  const { camera } = useThree();
  camera.position.set(0, 0, 20);
  camera.lookAt(0, 0, 0);

  useEffect(() => {
    const color = ["red", "green", "blue"]
    if (refMesh.current) {
      for (let i = 0; i < COUNT * COUNT; i++) {
        refMesh.current!.setColorAt(i, new THREE.Color(color[Math.floor(Math.random() * color.length)]));
      }
      refMesh.current!.instanceColor!.needsUpdate = true;
    }

  }, []);

  const instances = useMemo(() => {
    const instances: InstancedRigidBodyProps[] = [];
    for (let row = 0; row < COUNT / 2; row++) {
      for (let column = 0; column < COUNT / 2; column++) {
        const index = row * COUNT / 2 + column;
        instances.push({
          key: `instance_${row}_${column}`,
          position: [-(COUNT / 2) / 2 + row + 0.5, Math.random() * 4 + 1, -(COUNT / 2) / 2 + column + 0.5],
          collisionGroups: interactionGroups(index === 0 ? 0 : 1)
        });
      }
    }

    return instances;
  }, []);

  return (
    <Physics gravity={[0, 0, 0]}>
      <InstancedRigidBodies
        ref={rigidBodies}
        instances={instances}
        colliders="ball"
      >
        <instancedMesh ref={refMesh} args={[undefined, undefined, COUNT * COUNT]} count={COUNT * COUNT}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthTest={false} transparent={true} />
          <Attractor
            strength={-0.3}
            range={2}
            collisionGroups={interactionGroups(0, 1)}
          />
        </instancedMesh>
      </InstancedRigidBodies>
      <Attractor strength={0.01} />
    </Physics>
  )
}

const RenderPageContent = ({ page }) => {
  if (page === "404") {
    return <Rig404 />;
  } else {
    return (
      <RigPages page={page} />
    );
  }
};

const Background = ({ page }: { page: string }) => {
  return (
    <Canvas className={style.background} camera={{ fov: 35 }} resize={{ polyfill: ResizeObserver }}
      gl={{
        powerPreference: "high-performance",
        alpha: true,
        antialias: true,
        depth: false,
        toneMapping: THREE.NoToneMapping,
      }}>
      <Float>
        <RenderPageContent page={page} />
      </Float>
    </Canvas>
  )
}

export default Background