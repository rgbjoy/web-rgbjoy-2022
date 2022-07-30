import { GetStaticProps } from 'next'
import Head from 'next/head'

import { Client, Project } from '../../interfaces'
import { clientData, projectData } from '../../utils/data'
import Layout from '../../components/Layout';
import Link from 'next/link'
import style from "./work.module.scss"


type Props = {
  project: Project[]
  client: Client[]
}

const Work = ({ client, project }: Props) => (
  <Layout>
    <Head><title>Work</title></Head>

    <div className={style.work}>
      <h1>— Work</h1>

      <h2>Clients</h2>
      <ul className="clients">
        {client.map((item, i) => (
          <li key={i}>
            <div className="name">{item.name}</div>
            <div className="time">{item.time}</div>
            <Link href="/work/[slug]" as={`/work/${item.slug}`}>
              <a className="seemore">more details</a>
            </Link>
          </li>
        ))}
      </ul>

      <h2>Past Projects</h2>
      <ul className="projects">
        {project.map((item, i) => (
          <li key={i}>
            <div className="name">{item.name}</div>
            <div className="description">{item.description}</div>
            <a className="seemore" href={item.link} target="_blank" rel="noreferrer">website</a>
          </li>
        ))}
      </ul>

    </div>
  </Layout>
)

export const getStaticProps: GetStaticProps = async () => {
  const client: Client[] = clientData
  const project: Project[] = projectData
  return {
    props: {
      client,
      project
    }
  }
}

export default Work
