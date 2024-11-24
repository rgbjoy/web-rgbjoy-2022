'use client'

import PageWrapper from '@/components/pageWrapper'
import style from './dev.module.scss'
import { SplitText } from '@/components/splitText'
import { Dev } from '@payload-types'

export default function DevClient(dev: Dev) {
  const GetProjects = () => {
    return (
      <ul className={style.list}>
        {dev.pastProjects?.map((value, i) => {
          const title = value.title
          const description = value.description
          const link = value.link.url

          return (
            <li className={style.item} key={'projects' + i}>
              <a className="link" href={link} target="_blank" rel="noreferrer">
                <div className={style.name}>{title}</div>
                <div className={style.description}>{description}</div>
              </a>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <PageWrapper className={style.dev}>
      <h1 className={style.header}>
        <SplitText>{dev.header}</SplitText>
      </h1>

      <div dangerouslySetInnerHTML={{ __html: dev.content_html || '' }} />

      <h2 className={style.sectionTitle}>Projects</h2>
      <GetProjects />
    </PageWrapper>
  )
}
