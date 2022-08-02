import Link from 'next/link'
import Head from 'next/head'
import style from "./index.module.scss"
import Layout from '../components/Layout'

const IndexPage = () => (
  <Layout page="intro">
    <Head><title>Tom Fletcher - Multidisciplinary digital creator & web engineer</title></Head>
    <div className={style.intro}>
      <h1>Tom Fletcher {String(process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ? "**dev**" : "")}</h1>
      <p>Multidisciplinary digital creator &amp; web engineer</p>

      <Link href="/info">
        <a className={`btn ${style.btn}`}>Learn more</a>
      </Link>
    </div>
  </Layout>
)

export default IndexPage
