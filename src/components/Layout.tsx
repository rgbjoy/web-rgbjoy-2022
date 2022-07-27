import React, { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import * as THREE from 'three'

type Props = {
  children?: ReactNode
  title?: string
}

const Layout = ({ children, title = 'This is the default title' }: Props) => {
  useEffect(() => {
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 2

    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.querySelector(".wrapper").prepend(renderer.domElement)

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: false,
    })

    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    window.addEventListener('resize', onWindowResize, false)
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      render()
    }

    function animate() {
      requestAnimationFrame(animate)

      cube.rotation.x += 0.01
      cube.rotation.y += 0.01

      render()
    }

    function render() {
      renderer.render(scene, camera)
    }
    animate()
  })
  return (
    <div className="wrapper">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <header>
        <nav>
          <Link href="/">
            <a>Home</a>
          </Link>
          <Link href="/about">
            <a>About</a>
          </Link>
          <Link href="/projects">
            <a>Projects</a>
          </Link>
        </nav>
      </header>
      {children}
      <footer>
        <div className="links">
          <a aria-label="RGBJOY Instagram" target="_blank" href="https://instagram.com/rgbjoy">Instagram</a>
          <a aria-label="RGBJOY Twitter" target="_blank" href="https://twitter.com/rgbjoy">Twitter</a>
          <a aria-label="RGBJOY Codepen" target="_blank" href="https://codepen.io/rgbjoy/pens/popular">Codepen</a>
          <a aria-label="RGBJOY Linkedin" target="_blank" href="https://www.linkedin.com/in/rgbjoy/">Linkedin</a>
        </div>

        <div className="social">
          <a href="m&#97;ilto&#58;%74%&#54;F%6&#68;&#37;40&#114;gbjoy&#46;co&#109;">Email</a>
          <a href="tel:+17188776858">+1 718 877 6858</a>
        </div>
      </footer>
    </div>
  )
}

export default Layout
