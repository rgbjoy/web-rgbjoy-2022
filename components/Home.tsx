"use client"

import Link from 'next/link'
import Head from 'next/head'
import style from "./Home.module.scss"
import Layout from './Layout'

const Home = home => {
  return (
    <Layout page="intro">
      <Head><title>Tom Fletcher - Multidisciplinary digital creator &amp; web engineer</title></Head>
      <div className={style.intro}>

        <h1>{home.header} {String(process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ? "**dev**" : "")}</h1>
        <h2>{home.subhead}</h2>
        <p>{home.intro}</p>

        <Link className={`btn ${style.btn}`} href="/info" scroll={false}>
          {home.button}
        </Link>
      </div>
    </Layout>
  )
}

export default Home
