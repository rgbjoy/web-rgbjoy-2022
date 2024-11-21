'use client'

import PageWrapper from '@/components/pageWrapper'
import { SplitText } from '@/components/splitText'
import formatDate from '@/components/formatDate'
import style from './posts.module.scss'
import Link from 'next/link'
import { PostsData } from '@/models/types'

export default function Posts({ posts }: { posts: PostsData }) {
  return (
    <PageWrapper className={style.posts}>
      <h1 className={style.header}>
        <SplitText>Posts</SplitText>
      </h1>
      {posts.nodes.map((node) => {
        return (
          <div key={node.slug}>
            <p className={style.date}>{formatDate(node.date)}</p>
            <Link
              className={`underline ${style.postLink}`}
              href={`/posts/${node.slug}`}
            >
              {node.title}
            </Link>
          </div>
        )
      })}
    </PageWrapper>
  )
}
