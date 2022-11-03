import { GetStaticProps } from 'next'
import Head from 'next/head'

import { Client } from '../../interfaces'
import { clientData } from '../../data/client'
import Layout from '../../components/Layout';
import Link from 'next/link'
import style from "./work.module.scss"

import { gql } from "@apollo/client";
import { client } from "../../data/app";


const Work = (props) => {
  const {
    clients: clients,
    page: { work },
  } = props;


  const GetProjects = () => {
    return (
      <ul className={style.list}>
      {work["pastProjects"].map((value, i) => {
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
      <Head><title>Work</title></Head>

      <div >
        <h1 className={style.header}>Work</h1>

        <div dangerouslySetInnerHTML={{__html:work.intro}} />

        <h2 className={style.sectionTitle}>Clients</h2>
        <ul className={style.list}>
          {clients.map((item, i) => (
            <li className={style.item} key={"clients"+i}>
              <div className={style.name}>{item.name}</div>
              <div className={style.time}>{item.time}</div>
              <Link className={`${style.seemore} underline`} href="/work/[slug]" as={`/work/${item.slug}`} scroll={false}>
                More details
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
  const { data, errors } = await client.query({
    query: gql`
    query postsQuery {
      page(id: "cG9zdDo0MQ==") {
        work {
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

  return {
    props: {
      clients,
      page: data.page,
    }
  }
}

export default Work
