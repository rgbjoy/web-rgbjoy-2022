"use client"

import Link from 'next/link'
import style from "./Home.module.scss"
import Layout from '@/components/Layout'
import { SplitText } from '@/components/SplitText'

export default function Home(home) {
  return (
    <Layout className={style.intro}>
      <h1>
          <SplitText>
            {home.header}
          </SplitText>
          {String(process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ? "**dev**" : "")}
        </h1>
        <h2>{home.subhead}</h2>
        <p>{home.intro}</p>

        <Link className={`btn ${style.btn}`} href="/info">
          {home.button}
        </Link>
    </Layout>
  )
}
