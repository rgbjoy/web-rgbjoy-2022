import Link from 'next/link'
import Head from 'next/head'
import style from "./index.module.scss"
import Layout from '../components/Layout'

const IndexPage = () => (
  <Layout page="intro">
    <Head><title>Tom Fletcher - Multidisciplinary digital creator & web engineer</title></Head>
    <div className={style.intro}>
      <h1>Tom Fletcher</h1>
      <p>Multidisciplinary digital creator & web engineer</p>

      <Link href="/work">
        <a className={`btn ${style.btn}`}>See work</a>
      </Link>
    </div>
  </Layout>
)

export default IndexPage
