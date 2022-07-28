import type { AppProps } from 'next/app'
import React, { useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { AnimatePresence } from 'framer-motion'
import 'normalize.css/normalize.css';
import "../styles/global.scss"
import * as THREE from "three";
import { CameraShake } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";

import * as random from "maath/random";
import ActiveLink from '../components/ActiveLink';

function Stars(props: any) {
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

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  return (
    <>
      <Canvas className="background" camera={{ position: [0, 0, 1] }}
        gl={{
          powerPreference: "high-performance",
          alpha: false,
          antialias: false,
          stencil: false,
          depth: false
        }}>
        <color attach="background" args={["#121212"]} />
        <EffectComposer multisampling={0} disableNormalPass={true}>
          <Stars />
          <Noise opacity={0.05} />
          {/* <Vignette eskil={false} offset={0.1} darkness={0.5} /> */}
          <CameraShake yawFrequency={0.1} pitchFrequency={0.1} rollFrequency={0.1} />
        </EffectComposer>
      </Canvas>

      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <AnimatePresence
        exitBeforeEnter
        initial={false}
        onExitComplete={() => window.scrollTo(0, 0)}
      >
        <Component {...pageProps} />
      </AnimatePresence>

      <header>
        <nav>
          {router.pathname !== "/" ? <ActiveLink activeClassName="active" href="/">
            <a>/</a>
          </ActiveLink> : ""}
          <ActiveLink activeClassName="active" href="/info">
            <a>Info</a>
          </ActiveLink>
          <ActiveLink activeClassName="active" href="/work">
            <a>Work</a>
          </ActiveLink>
        </nav>
      </header>

      <div className="badge">2022 Portfolio</div>

      <footer>
        <div className="footer-wrapper">
          <div className="links">
            <a target="_blank" rel="noreferrer" href="https://instagram.com/rgbjoy">Instagram</a>
            <a target="_blank" rel="noreferrer" href="https://twitter.com/rgbjoy">Twitter</a>
            <a target="_blank" rel="noreferrer" href="https://codepen.io/rgbjoy/pens/popular">Codepen</a>
            <a target="_blank" rel="noreferrer" href="https://github.com/rgbjoy/">Github</a>
          </div>
          <div className="line"></div>
        </div>
      </footer>
    </>
  )
}