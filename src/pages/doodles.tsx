import Image from 'next/image'
import Head from 'next/head'
import Layout from '../components/Layout';
import Masonry from 'react-masonry-css'
import style from './doodles.module.scss'

import { gql } from "@apollo/client";
import { client } from "../data/app";

import { motion, useAnimation } from 'framer-motion';

import { useState, useEffect, useRef } from "react";
import LightBox from '../components/Lightbox';

const Doodles = (props) => {

  const {
    page: { doodles },
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

  function useHover<HTMLDivElement>() {
    const [value, setValue] = useState<boolean>(false);
    const ref: any = useRef<HTMLDivElement | null>(null);
    const handleMouseOver = (): void => setValue(true);
    const handleMouseOut = (): void => setValue(false);
    useEffect(() => {
        const node: any = ref.current;
        if (node) {
          node.addEventListener("mouseover", handleMouseOver);
          node.addEventListener("mouseout", handleMouseOut);
          return () => {
            node.removeEventListener("mouseover", handleMouseOver);
            node.removeEventListener("mouseout", handleMouseOut);
          };
        }
      },[]);
    return [ref, value];
  }

  const Doodles = () => {
    const [hoverRef, isHovered] = useHover<HTMLDivElement>();

    return (
      <Masonry
        breakpointCols={3}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
          {doodles.gallery.map((value, i) => {
            const images = value.mediaDetails.sizes
            const getImageData = () => {
              let smallImage = {}
              let bigImage = {}
              images.map((mediaDetails) =>{
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
              <div key={i} ref={hoverRef}>
                <LightBox src={value.sourceUrl} alt="value.title">
                  <motion.div
                    initial={"hidden"}
                    animate={animationControls}
                    variants={animationVariants}
                    transition={{ ease: "easeOut", duration: 1, delay: 1 }}
                  >
                    <Image
                      alt={value.title}
                      src={getImageData().bigImage["sourceUrl"]}
                      placeholder="blur"
                      blurDataURL={getImageData().smallImage["sourceUrl"]}
                      priority
                      width={getImageData().bigImage["width"]}
                      height={getImageData().bigImage["height"]}
                      onLoadingComplete={handleImageLoad}
                    />
                  </motion.div>
                  <div className={isHovered ? "cheese" : ""}></div>
                </LightBox>
              </div>
            )
          })}
      </Masonry>
    )
  }

  return (
    <Layout page="info">
      <Head><title>Info</title></Head>
      <h1 className={style.header}>Doodles</h1>
      <div dangerouslySetInnerHTML={{__html:props.page.content}} />
      <Doodles />
    </Layout>
  )
}

export async function getServerSideProps({req, res}) {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )

  const { data, errors } = await client.query({
    query: gql`
      query postsQuery {
        page(id: "cG9zdDo1MA==") {
          content(format: RENDERED)
          doodles {
            gallery {
              sourceUrl
              mediaDetails {
                sizes {
                  name
                  width
                  height
                  sourceUrl
                }
              }
              title
            }
          }
        }
      }
    `,
  });
  return {
    props: {
      page: data.page,
    },
  };
}

export default Doodles
