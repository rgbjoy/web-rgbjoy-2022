import { useState, useRef, useEffect } from 'react';

import * as THREE from 'three';
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, useCursor, RoundedBox, ScrollControls, Scroll, useScroll, useGLTF, useAnimations, Html } from '@react-three/drei'
import ParticlesManager from "./particleManager"
import Rig404 from './rig404';

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

  const groupAnimRef = useRef<THREE.Group>(null);
  const { nodes, animations } = useGLTF("/Intro.glb");
  const { actions } = useAnimations(animations, groupAnimRef);
  useEffect(() => {
    if (actions.animation_0) {
      actions.animation_0.reset().play().paused = true
    }
  }, [])
  useFrame(() => {
    if (actions.animation_0) {
      const scrollThreshold = 0;

      if (scroll.offset > scrollThreshold) {
        const adjustedScrollOffset = (scroll.offset - scrollThreshold) / (1 - scrollThreshold);
        actions.animation_0.time = actions.animation_0.getClip().duration * adjustedScrollOffset;
      }
    }
  });

  const [hovered, set] = useState(Boolean)
  useCursor(hovered && currentPage === "home", 'pointer', 'auto')

  const groupRef = useRef<THREE.Group>(null!)
  currentPage = page.split("/")[1] === "" ? "home" : page.split("/")[1]

  const scroll = useScroll();

  useEffect(() => {
    const meshes = groupRef.current && groupRef.current.children
    if (currentPage === "home") {
      animateIn(meshes)
    } else {
      animateOut(meshes)
    }
  }, [page])

  useFrame((state, delta) => {
    groupRef.current.rotation.y += delta / (currentPage === "home" ? 5 : 25);

    if (currentPage !== "home") {
      scroll.el.scrollTo({ top: 0 })
    }
  })

  const centerBlockRef = useRef<THREE.Mesh>(null)
  const centerBlockLightRef = useRef<THREE.PointLight>(null)
  useFrame((state, delta) => {
    // move chance back and forth on the x axis
    if (centerBlockRef.current && centerBlockLightRef.current) {
      centerBlockRef.current.position.x = Math.sin(state.clock.getElapsedTime()) * 1
      centerBlockLightRef.current.position.x = Math.sin(state.clock.getElapsedTime()) * 1
    }
  })

  const { height } = useThree((state) => state.viewport)
  const config = {
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthTest: false,
  }

  return (

    <>
      <Scroll>
        <group
          onPointerOver={() => set(true)} onPointerOut={() => set(false)}
          onClick={e => handleClick(e)}
          ref={groupRef}>
          <RGBPlane color="#FF0000" name="red" />
          <RGBPlane color="#00FF00" name="green" />
          <RGBPlane color="#0000FF" name="blue" />
        </group>
      </Scroll>
      <Scroll>
        <group ref={groupAnimRef} position={[0, -height, 0]}>
          <group>
            <ambientLight color={"white"} intensity={0.1} />
            <mesh
              name="Cube"
              geometry={(nodes.Cube as THREE.Mesh).geometry}
            >
              <mesh
                ref={centerBlockRef}
                name="Sphere"
                castShadow
                receiveShadow
                geometry={(nodes.Sphere as THREE.Mesh).geometry}
                position={[nodes.Sphere.position.x, nodes.Sphere.position.y, nodes.Sphere.position.z]}
              >
                <meshBasicMaterial color={"white"} />
              </mesh>
              <mesh
                name="Torus"
                castShadow
                receiveShadow
                geometry={(nodes.Torus as THREE.Mesh).geometry}
                position={[nodes.Torus.position.x, nodes.Torus.position.y, nodes.Torus.position.z]}
              >
                <meshBasicMaterial color={"white"} />
              </mesh>
              <meshPhysicalMaterial  roughness={1} color={"white"} />
            </mesh>
            <pointLight
              ref={centerBlockLightRef}
              name="PointLight"
              color={"white"}
              castShadow
              receiveShadow
              position={[nodes.Sphere.position.x, nodes.Sphere.position.y, nodes.Sphere.position.z]}
              intensity={0.1}
              />
          </group>

          <Html position={[0, 0, 0]} style={{width: "200px", top:"200vh"}}>
            <a href="/art" className="btn">See my art</a>
          </Html>
        </group>
      </Scroll>
    </>
  )
}

const RenderPageBackground = ({ page }) => {
  const data = useScroll()
  const [scrolledDown, setScrolledDown] = useState(false)

  useFrame((state, delta) => {
    setScrolledDown(data.range(0, 1 / 3) >= 1 ? true : false)
  })

  if (page === "404") {
    return <Rig404 />
  }

  return (
    <>
      <ParticlesManager
        maxParticles={25}
        maxVelocity={2}
        emitInterval={200} //ms
        canReset={page === "/" && !scrolledDown ? true : false}
      />
      <RigPages page={page} />
    </>
  )
};

const Background = ({ page, homeData }) => {
  const [isTabActive, setIsTabActive] = useState(true);
  const [isHome, setIsHome] = useState(false);

  useEffect(() => {
    setIsHome(page === "/");
  }, [page]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Canvas frameloop={isTabActive ? 'always' : 'never'} className={style.background} camera={{ fov: 35, position: [0, 0, 7] }} resize={{ polyfill: ResizeObserver }}
      gl={{
        antialias: false,
        toneMapping: THREE.NoToneMapping,
      }}>
      <ScrollControls pages={2} damping={0.1}>
        <Float>
          <RenderPageBackground page={page} />
        </Float>
        <Scroll html style={{ "width": "100%" }}>
          {isHome && <div className="wrapper intro">
            <h1>{homeData.header}</h1>
            <h2>{homeData.subhead}</h2>
            <p>
              {homeData.intro}
            </p>
            <a className="btn" href="/info">{homeData.button}</a>
          </div>}
        </Scroll>
      </ScrollControls>
    </Canvas>
  )
}

export default Background