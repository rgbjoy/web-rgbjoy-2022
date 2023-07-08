import Head from "next/head"
import Link from "next/link"
import Layout from "@/components/Layout"
import style from "./not-found.module.scss"

const Custom404 = () => (
  <Layout page="404">
    <Head><title>404</title></Head>
    <h1>Uh oh.</h1>
    <Link className={`btn ${style.btn}`} href="/">
      Go back
    </Link>
  </Layout>
)

export default Custom404
