
"use client"

import Image from 'next/image'
import PageWrapper from '@/components/pageWrapper';
import { SplitText } from '@/components/splitText';
import style from './posts.module.scss'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';


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
            <Link href={`/posts/${node.slug}`} key={node.slug}>
              <div className={style.postLink} dangerouslySetInnerHTML={{ __html: node.title }} />
            </Link>
          )
        })
      }
      </div>

    </PageWrapper>
  )
}