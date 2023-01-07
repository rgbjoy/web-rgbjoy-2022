import { GetStaticProps } from 'next'
import Head from 'next/head'

import { Client } from '../../interfaces'
import { clientData } from '../../data/client'
import Layout from '../../components/Layout';
import Link from 'next/link'
import style from "./dev.module.scss"

import { gql } from "@apollo/client";
import { client } from "../../data/app";


const Dev = (props) => {
  const {
    clients: clients,
    page: { dev },
  } = props;


  const GetProjects = () => {
    return (
      <ul className={style.list}>
      {dev["pastProjects"].map((value, i) => {
        const title = value["title"]
        const description = value["description"]
        const link = value["link"]["url"]

        return (
          <li className={style.item} key={"projects"+i}>
            <div className={style.name}>{title}</div>
            <div className={style.description}>{description}</div>
            <a className={`${style.seemore} underline`} href={link} target="_blank" rel="noreferrer">Project link</a>
          </li>
        )
      })}
      </ul>
    )
  }

  return (
    <Layout>
      <Head><title>Developemt</title></Head>

      <div >
        <h1 className={style.header}>Development Work</h1>

        <div dangerouslySetInnerHTML={{__html:dev.intro}} />

        <h2 className={style.sectionTitle}>Clients</h2>
        <ul className={style.list}>
          {clients.map((item, i) => (
            <li className={style.item} key={"clients"+i}>
              <div className={style.name}>{item.name}</div>
              <div className={style.time}>{item.time}</div>
              <Link href="/dev/[slug]" as={`/dev/${item.slug}`} scroll={false}>
                <a className={`${style.seemore} underline`}>More details</a>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className={style.sectionTitle}>Past Projects</h2>
        <GetProjects />

      </div>
    </Layout>
  )
}


export const getStaticProps: GetStaticProps = async () => {
  const clients: Client[] = clientData
  const { loading, data, errors } = await client.query({
    query: gql`
      query postsQuery {
        page(id: "cG9zdDo0MQ==") {
          dev {
            intro
            pastProjects {
              title
              link {
                url
              }
              description
            }
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
      clients,
      page: data.page,
    },
    revalidate: 60,
  }
}

export default Dev
