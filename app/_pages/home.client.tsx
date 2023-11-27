"use client"

import Link from 'next/link'
import style from "./home.module.scss"
import PageWrapper from '@/components/pageWrapper'
import { SplitText } from '@/components/splitText'
import { HomeData } from 'models/types'

export default function Home(home:HomeData) {
  return (
    <PageWrapper className={style.intro}>
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
    </PageWrapper>
  )
}
