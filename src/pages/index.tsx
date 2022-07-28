import Link from 'next/link'
import Head from 'next/head'
import style from "./index.module.scss"
import Layout from '../components/Layout'

const IndexPage = () => (
  <Layout page="intro">
    <Head><title>Tom Fletcher - creative digital engineer</title></Head>
    <div className={style.intro}>
      <h1>Tom Fletcher</h1>
      <p>creative digital engineer</p>

      <Link href="/projects">
        <a className="btn">Check out my work</a>
      </Link>
    </div>
  </Layout>
)

export default IndexPage
