import { Metadata, GetStaticProps } from 'next';

import Link from 'next/link'
import Head from 'next/head'
import style from "./index.module.scss"
import Layout from '../components/Layout'

import { gql } from "@apollo/client";
import { client } from "../data/app";

export const metadata: Metadata = {
  title: 'Tom Fletcher',
  description: 'Multidisciplinary digital creator &amp; web engineer',
};

const IndexPage = (props) => {
  const {
    page: { home },
  } = props;

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

export const getStaticProps: GetStaticProps = async () => {

  const { errors, data } = await client.query({
    query: gql`
      query {
        page(id:"cG9zdDo1") {
          home {
            header
            subhead
            intro
            button
          }
        }
      }
    `,
  });

  if (errors) {
    return <div className="error">My CMS must be down.</div>
  }

  return {
    props: {
      page: data.page,
    }
  };
}

export default IndexPage
