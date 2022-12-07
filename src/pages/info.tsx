import Image from 'next/image'
import Head from 'next/head'
import Layout from '../components/Layout';
import style from './info.module.scss'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

import { gql } from "@apollo/client";
import { client } from "../data/app";


const Info = (props) => {

  const {
    page: { info },
  } = props;

  const animationVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  }

  const [loaded, setLoaded] = useState(false);
  const animationControls = useAnimation();
  useEffect(() => {
    if (loaded) {
      animationControls.start("visible");
    }
  }, [loaded, animationControls]);

  const handleImageLoad = () => {
    setLoaded(true)
  }

  const GetLinks = () => {
    return (
      <div className={style.links}>
      {info["links"].map((value, i) => {
        const title = value["link"]["title"]
        const url = value["link"]["url"]

        return (
          <span key={"lins"+i}>
            <a className="underline" href={url} target="_blank" rel="noreferrer">{title}</a>
            <span>{i < info["links"].length-1 ? " • " : ""}</span>
          </span>
        )
      })}
      </div>
    )
  }

  const GetStrengths = () => {
    return (
      <div>
      {info["strengths"].map((value, i) => {
        const title = value["title"]
        const detail = value["strength"]

        return (
          <div className={style.strengths} key={"strenths"+i}>
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
    info.profileImage.mediaDetails.sizes.map((mediaDetails) =>{
      if(mediaDetails.name === "medium_large") {
        smallImage = mediaDetails
      }
      if(mediaDetails.name === "1536x1536" || "2048x2048") {
        bigImage = mediaDetails
      }
    })
    return {smallImage, bigImage}
  }

  return (
    <Layout page="info">
      <Head><title>Info</title></Head>
      <div className={style.selfie}>
        <h1 className={style.header}>Info</h1>
        <div className={style.selfieWrapper}>
          <motion.div
            initial={"hidden"}
            animate={animationControls}
            variants={animationVariants}
            transition={{ ease: "easeOut", duration: 1, delay: 1 }}
          >
            <Image
              alt="Selfie"
              src={getImageData().bigImage["sourceUrl"]}
              placeholder="blur"
              blurDataURL={getImageData().smallImage["sourceUrl"]}
              width={getImageData().bigImage["width"]}
              height={getImageData().bigImage["height"]}
              priority
              onLoadingComplete={handleImageLoad}
            />
          </motion.div>
        </div>
      </div>

      <GetLinks />

      <div dangerouslySetInnerHTML={{__html:props.page.content}} />

      <Link className={`btn ${style.btn}`} href="/dev" scroll={false}>
        See some work
      </Link>

      <GetStrengths />
    </Layout>
  )
}

export async function getServerSideProps({req, res}) {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )

  const { loading, errors, data } = await client.query({
    query: gql`
      query postsQuery {
        page(id: "cG9zdDoyNA==") {
          content(format: RENDERED)
          info {
            profileImage {
              mediaDetails {
                sizes {
                  sourceUrl
                  width
                  height
                  name
                }
              }
            }
            links {
              link {
                title
                url
              }
            }
            strengths {
              title
              strength
            }
          }
        }
      }
    `,
  });

  if (loading) {
    return <div className="loadingPage">...</div>
  }

  if (errors) {
    console.error(errors);
    return null;
  }

  return {
    props: {
      page: data.page,
    },
  };
}

export default Info
