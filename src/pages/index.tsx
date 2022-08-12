import Link from 'next/link'
import Head from 'next/head'
import style from "./index.module.scss"
import Layout from '../components/Layout'

const IndexPage = () => (
  <Layout page="intro">
    <Head><title>Tom Fletcher - Multidisciplinary digital creator &amp; web engineer</title></Head>
    <div className={style.intro}>

      <h1>Tom Fletcher {String(process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ? "**dev**" : "")}</h1>
      <h2>Multidisciplinary digital creator &amp; web engineer</h2>
      <p>A passion of crafting details and making functional software for human beings</p>

      <Link href="/info">
        <a className={`btn ${style.btn}`}>Learn more</a>
      </Link>
    </div>
  </Layout>
)

export default IndexPage
