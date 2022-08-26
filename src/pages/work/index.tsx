import { GetStaticProps } from 'next'
import Head from 'next/head'

import { Client, Project } from '../../interfaces'
import { projectData } from '../../data/project'
import { clientData } from '../../data/client'
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

    <div >
      <h1 className={style.header}>Work</h1>

      <p>I&apos;m currently looking for a full-time position. <a href="m&#97;ilto&#58;%74%&#54;F%6&#68;&#37;40&#114;gbjoy&#46;co&#109;">Email me</a> to see more.</p>

      <h2 className={style.sectionTitle}>Clients</h2>
      <ul className={style.list}>
        {client.map((item, i) => (
          <li className={style.item} key={i}>
            <div className={style.name}>{item.name}</div>
            <div className={style.time}>{item.time}</div>
            <Link href="/work/[slug]" as={`/work/${item.slug}`} scroll={false}>
              <a className={`${style.seemore} underline`}>More details</a>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className={style.sectionTitle}>Past Projects</h2>
      <ul className={style.list}>
        {project.map((item, i) => (
          <li className={style.item} key={i}>
            <div className={style.name}>{item.name}</div>
            <div className={style.description}>{item.description}</div>
            <a className={`${style.seemore} underline`} href={item.link} target="_blank" rel="noreferrer">Project link</a>
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
