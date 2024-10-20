'use client'

import Image from 'next/image'
import PageWrapper from '@/components/pageWrapper'
import { SplitText } from '@/components/splitText'
import style from './info.module.scss'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { InfoData } from 'models/types'

export default function Info(page: InfoData) {
  const animationVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  }

  const [loaded, setLoaded] = useState(false)
  const animationControls = useAnimation()
  useEffect(() => {
    if (loaded) {
      animationControls.start('visible')
    }
  }, [loaded, animationControls])

  const handleImageLoad = () => {
    setLoaded(true)
  }

  const GetLinks = () => {
    return (
      <div className={style.links}>
        {page.info.links.map((value, i) => {
          const title = value['link']['title']
          const url = value['link']['url']

          return (
            <span key={'lins' + i}>
              <a
                className="underline"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {title}
              </a>
              <span>{i < page.info['links'].length - 1 ? ' • ' : ''}</span>
            </span>
          )
        })}
      </div>
    )
  }

  const GetStrengths = () => {
    return (
      <div>
        {page.info.strengths.map((value, i) => {
          const title = value['title']
          const detail = value['strengths']

          return (
            <div className={style.strengths} key={'strenths' + i}>
              <div>{title}</div>
              <div className={style.detail}>{detail}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const getImageData = () => {
    let smallImage = {}
    let bigImage = {}
    page.info.profileImage.mediaDetails.sizes.map((mediaDetails) => {
      if (mediaDetails.name === 'medium_large') {
        smallImage = mediaDetails
      }
      if (mediaDetails.name === '1536x1536' || '2048x2048') {
        bigImage = mediaDetails
      }
    })
    return { smallImage, bigImage }
  }

  return (
    <PageWrapper className={style.info}>
      <div className={style.selfie}>
        <h1 className={style.header}>
          <SplitText>Info</SplitText>
        </h1>
        <div className={style.selfieWrapper}>
          <motion.div
            initial={'hidden'}
            animate={animationControls}
            variants={animationVariants}
            transition={{ ease: 'easeOut', duration: 1, delay: 1 }}
          >
            <Image
              alt="Selfie"
              src={getImageData().bigImage['sourceUrl']}
              placeholder="blur"
              blurDataURL={getImageData().smallImage['sourceUrl']}
              width={getImageData().bigImage['width']}
              height={getImageData().bigImage['height']}
              priority
              onLoad={handleImageLoad}
            />
          </motion.div>
        </div>
      </div>

      <GetLinks />

      <div dangerouslySetInnerHTML={{ __html: page.content }} />

      <Link className={`btn ${style.btn}`} href="/dev">
        See some work
      </Link>

      <GetStrengths />
    </PageWrapper>
  )
}
