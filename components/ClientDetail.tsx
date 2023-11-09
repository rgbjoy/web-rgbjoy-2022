"use client"

import Link from 'next/link'
import style from './ClientDetail.module.scss'
import { SplitText } from '@/components/splitText'

const ClientDetail = ({ item }) => {
  return (
    <>
      <h1 className={style.header}>
        <SplitText>
          {item.title}
        </SplitText>
      </h1>
      <p>{item.client.date} • {item.client.title}</p>
      <div className={style.subhead} dangerouslySetInnerHTML={{ __html: item.content }} />
      <div className={`${style.subhead} ${style.technology}`}>
        Technology:
        <ul className={style.technologyList}>
          {item.client.technologies.map((item, i) => {
            return (<li key={i}>{item.technology}</li>)
          })}
        </ul>
      </div>
      <Link className={`${style.back} underline`} href="/dev">
        Back to work
      </Link>
    </>
  )
}

export default ClientDetail
