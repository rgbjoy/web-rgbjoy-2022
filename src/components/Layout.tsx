import React, { useRef, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import * as THREE from "three";
import { CameraShake } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from "maath/random";

type Props = {
  children?: React.ReactNode
  title?: string
}

function Stars(props:any) {
  const ref = useRef<THREE.Points>(null!);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }))
  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 1000
    ref.current.rotation.y -= delta / 1000
  })
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#ffa0e0" size={0.003} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  )
}


const Layout = ({ children, title = 'This is the default title' }: Props) => {


  return (
    <>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
        <CameraShake yawFrequency={0.02} pitchFrequency={0.02} rollFrequency={0.02} />
      </Canvas>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <header>
        <nav>
          <Link href="/">
            <a>Home</a>
          </Link>
          <Link href="/about">
            <a>About me</a>
          </Link>
          <Link href="/projects">
            <a>Projects</a>
          </Link>
        </nav>
      </header>
      <div className="wrapper">
        {children}
      </div>
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

export default Layout
