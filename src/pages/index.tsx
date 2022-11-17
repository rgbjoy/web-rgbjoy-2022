import Link from 'next/link'
import Head from 'next/head'
import style from "./index.module.scss"
import Layout from '../components/Layout'

import { gql } from "@apollo/client";
import { client } from "../data/app";

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

export async function getServerSideProps({req, res}) {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )

  const { loading, errors, data } = await client.query({
    query: gql`
      query postsQuery{
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

  if (loading) {
    return <div className="loadingPage">...</div>
  }

  if (errors) {
    console.error(errors);
    return null;
  }

  return {
    props: {
      page: data.page,
    },
  };
}

export default IndexPage
