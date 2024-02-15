import { useState, useRef, useEffect, useMemo } from 'react';

import * as THREE from 'three';
import { ResizeObserver } from "@juggle/resize-observer"
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, useCursor, RoundedBox, ScrollControls, Scroll, useScroll } from '@react-three/drei'
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



const RigPages = ({ page, ...props }) => {

  const { camera } = useThree();
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);

  const [hovered, set] = useState(Boolean)
  useCursor(hovered && currentPage === "home", 'pointer', 'auto')

  const ref = useRef<THREE.Group>(null!)
  currentPage = page.split("/")[1] === "" ? "home" : page.split("/")[1]

  const scroll = useScroll();

  useEffect(() => {
    const meshes = ref.current && ref.current.children
    if (currentPage === "home") {
      animateIn(meshes)
    } else {
      animateOut(meshes)
    }
  }, [page])

  useFrame((state, delta) => {
    ref.current.rotation.y += delta / (currentPage === "home" ? 5 : 25);

    if (currentPage !== "home") {
      scroll.el.scrollTo({top: 0})
    }
  })

  return (
    <>
      <Scroll>
        <group
          onPointerOver={() => set(true)} onPointerOut={() => set(false)}
          onClick={e => handleClick(e)}
          ref={ref}>
          <RGBPlane color="#FF0000" name="red" />
          <RGBPlane color="#00FF00" name="green" />
          <RGBPlane color="#0000FF" name="blue" />
        </group>
        <group>
          <mesh position={[0, -6, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshNormalMaterial />
          </mesh>
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

const Background = ({ page, settings }) => {
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
    <Canvas frameloop={isTabActive ? 'always' : 'never'} className={style.background} camera={{ fov: 35 }} resize={{ polyfill: ResizeObserver }}
      gl={{
        antialias: false,
        depth: false,
        toneMapping: THREE.NoToneMapping,
      }}>
      <ScrollControls pages={3} damping={0.1}>
        <Float>
          <RenderPageBackground page={page} />
        </Float>
        <Scroll html style={{"width":"100%"}}>
          {isHome && <div className="wrapper intro">
            <h1>{settings.home.homeHeader}</h1>
            <h2>{settings.home.homeSubhead}</h2>
            <p>
              {settings.home.intro}
            </p>
            <a className="btn" href="/info">{settings.home.buttonText}</a>
         </div>}
        </Scroll>
      </ScrollControls>
    </Canvas>
  )
}

export default Background