'use client'

import Image from 'next/image'
import PageWrapper from '@/components/pageWrapper'
import { SplitText } from '@/components/splitText'
import style from './info.module.scss'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Info } from '@payload-types'

export default function InfoClient(info: Info) {

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
        {info.links?.map((value, i) => {
          const title = value.link.title
          const url = value.link.url

          return (
            <span key={'links' + i}>
              <a
                className="underline"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {title}
              </a>
              <span>{i < (info.links?.length || 0) - 1 ? ' • ' : ''}</span>
            </span>
          )
        })}
      </div>
    )
  }

  const GetStrengths = () => {
    return (
      <div>
        {info.strengths?.map((value, i) => {
          const title = value.title
          const detail = value.strengthsList

          return (
            <div className={style.strengths} key={'strengths' + i}>
              <div>{title}</div>
              <div className={style.detail}>{detail}</div>
            </div>
          )
        })}
      </div>
    )
  }

  console.log("info.profileImage", info.profileImage)

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
              src={typeof info.profileImage === 'object' ? info.profileImage?.url ?? '' : ''}
              alt={typeof info.profileImage === 'object' ? info.profileImage?.alt ?? '' : ''}
              width={typeof info.profileImage === 'object' ? info.profileImage?.width ?? 0 : 0}
              height={typeof info.profileImage === 'object' ? info.profileImage?.height ?? 0 : 0}
              onLoad={handleImageLoad}
              priority
            />
          </motion.div>
        </div>
      </div>

      <GetLinks />

      <div dangerouslySetInnerHTML={{ __html: info.content_html || '' }} />

      <Link className={`btn ${style.btn}`} href="/dev">
        See some work
      </Link>

      <GetStrengths />
    </PageWrapper>
  )
}
