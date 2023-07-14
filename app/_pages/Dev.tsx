"use client"

import Layout from '@/components/Layout';
import Link from 'next/link'
import style from "./Dev.module.scss"
import { SplitText } from '@/components/SplitText';

export default function Dev(data) {

  const {
    clientPosts: { nodes },
    page: { dev },
  } = data;

  const GetProjects = () => {
    return (
      <ul className={style.list}>
        {dev.pastProjects.map((value, i) => {
          const title = value["title"]
          const description = value["description"]
          const link = value["link"]["url"]

          return (
            <li className={style.item} key={"projects" + i}>
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
    <Layout className={style.dev}>
      <h1 className={style.header}>
        <SplitText>
          Development
        </SplitText>
      </h1>

      <div dangerouslySetInnerHTML={{ __html: data.page.content }} />

      <h2 className={style.sectionTitle}>Clients</h2>
      <ul className={style.list}>
        {nodes.map((item, i) => (
          <li className={style.item} key={"clients" + i}>
            <div className={style.name}>{item.title}</div>
            <div className={style.date}>{item.client.date}</div>
            <Link className={`${style.seemore} underline`} href={`/dev/${item.slug}`}>
              More details
            </Link>
          </li>
        ))}
      </ul>

      <h2 className={style.sectionTitle}>Past Projects</h2>
      <GetProjects />
    </Layout>
  )
}