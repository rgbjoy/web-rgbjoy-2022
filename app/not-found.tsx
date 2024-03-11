import Link from "next/link"
import Layout from "@/components/pageWrapper"
import style from "./not-found.module.scss"

export const metadata = {
  title: '404',
  description: 'Multidisciplinary digital creator & software engineer',
}

const Custom404 = () => (
  <Layout className={style.notFound}>
    <h1>Have you tried turning it off and on again?</h1>
    <Link className={`btn ${style.btn}`} href="/">
      Reset
    </Link>
  </Layout>
)

export default Custom404
