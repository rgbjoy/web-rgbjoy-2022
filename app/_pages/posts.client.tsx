
"use client"

import PageWrapper from '@/components/pageWrapper';
import { SplitText } from '@/components/splitText';
import style from './posts.module.scss'
import Link from 'next/link';


export default function Posts({ posts }) {
  return (
    <PageWrapper className={style.posts}>
      <h1 className={style.header}>
        <SplitText>
          Posts
        </SplitText>
      </h1>
      <div>
      {
        posts.map(({ node }) => {
          return (
            <div key={node.slug}>
              <Link href={`/posts/${node.slug}`}>
                <div className={style.postLink} dangerouslySetInnerHTML={{ __html: node.title }} />
              </Link>
              <p className={style.date}>{node.date}</p>
            </div>
          )
        })
      }
      </div>

    </PageWrapper>
  )
}