'use client'

import PageWrapper from '@/components/pageWrapper'
import style from './dev.module.scss'
import { SplitText } from '@/components/splitText'
import { Dev } from '@payload-types'
import parse, { domToReact, Element, DOMNode } from 'html-react-parser'

export default function DevClient(page: Dev) {
  const GetProjects = () => {
    return (
      <ul className={style.list}>
        {page.pastProjects?.map((value, i) => {
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

  const parseContent = (htmlContent: string) => {
    return parse(htmlContent, {
      replace: (domNode: DOMNode) => {
        if (domNode.type === 'tag' && (domNode as Element).name === 'a') {
          const { attribs, children } = domNode as Element
          return (
            <a {...attribs} className={`${attribs.class || ''} underline`}>
              {domToReact(children as DOMNode[])}
            </a>
          )
        }
      },
    })
  }

  return (
    <PageWrapper className={style.dev}>
      <h1 className={style.header}>
        <SplitText>{page.header}</SplitText>
      </h1>

      <div>{parseContent(page.content_html || '')}</div>

      <h2 className={style.sectionTitle}>Projects</h2>
      <GetProjects />
    </PageWrapper>
  )
}
