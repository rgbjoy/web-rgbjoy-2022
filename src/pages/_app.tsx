import type { AppProps } from 'next/app'
import React, { useRef, useState } from 'react'
import Link from 'next/link'
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

function Stars(props: any) {
  const ref = useRef<THREE.Points>(null!);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }))
  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 500
    ref.current.rotation.y -= delta / 500
  })
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#ffa0e0" size={0.003} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  )
}

export default function MyApp({ Component, pageProps, router }: AppProps) {
  const url = `https://rgbjoy.com${router.route}`

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
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          <CameraShake yawFrequency={0.02} pitchFrequency={0.02} rollFrequency={0.02} />
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
        <Component {...pageProps} url={url} />
      </AnimatePresence>

      <header>
        <nav>
          <Link href="/about">
            <a>About me</a>
          </Link>
          <Link href="/projects">
            <a>Projects</a>
          </Link>
        </nav>
      </header>

      <div className="badge">2022 Portfolio</div>

      <footer>
        <div className="links">
          <a aria-label="RGBJOY Instagram" target="_blank" rel="noreferrer" href="https://instagram.com/rgbjoy">Instagram</a>
          <a aria-label="RGBJOY Twitter" target="_blank" rel="noreferrer" href="https://twitter.com/rgbjoy">Twitter</a>
          <a aria-label="RGBJOY Codepen" target="_blank" rel="noreferrer" href="https://codepen.io/rgbjoy/pens/popular">Codepen</a>
          <a aria-label="RGBJOY Linkedin" target="_blank" rel="noreferrer" href="https://www.linkedin.com/in/rgbjoy/">Linkedin</a>
        </div>

        <div className="social">
          <a href="m&#97;ilto&#58;%74%&#54;F%6&#68;&#37;40&#114;gbjoy&#46;co&#109;">Email</a>
          <a href="tel:+17188776858">+1 718 877 6858</a>
        </div>
      </footer>
    </>
  )
}