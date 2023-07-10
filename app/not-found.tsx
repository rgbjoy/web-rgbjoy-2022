import Link from "next/link"
import Layout from "@/components/Layout"
import style from "./not-found.module.scss"
import { Metadata } from 'next'

export const metadata = {
  title: '404',
  description: 'Multidisciplinary digital creator & web engineer',
}

const Custom404 = () => (
  <Layout page="404">
    <h1>Uh oh.</h1>
    <Link className={`btn ${style.btn}`} href="/">
      Go back
    </Link>
  </Layout>
)

export default Custom404
