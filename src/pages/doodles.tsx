import Image from 'next/legacy/image'
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
    }, []);
    return [ref, value];
  }

  const DoodleImage = ({image, ...props}) => {
    const [hoverRef, isHovered] = useHover<HTMLDivElement>();
    return (
      <div {...props} ref={hoverRef} className={style.image}>
        <LightBox image={image}>
            <Image
              alt={image.title}
              src={image.bigImage["sourceUrl"]}
              placeholder="blur"
              blurDataURL={image.smallImage["sourceUrl"]}
              priority
              width={image.bigImage["width"]}
              height={image.bigImage["height"]}
            />
            <div className={`caption ${isHovered ? "hovered" : ""}`}>{image.title}</div>
        </LightBox>
      </div>
    )
  }

  return (
    <Layout page="info">
      <Head><title>Info</title></Head>
      <h1 className={style.header}>Doodles</h1>
      <div dangerouslySetInnerHTML={{ __html: props.page.content }} />
      <Masonry
        breakpointCols={3}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
          {
            doodles.gallery.map((value, i) => {
              const images = value.mediaDetails.sizes
              const getImageData = () => {
                const title = value.title
                const source = value["sourceUrl"]
                let smallImage = {}
                let bigImage = {}
                images.map((mediaDetails) => {
                  if (mediaDetails.name === "medium_large") {
                    smallImage = mediaDetails
                  }
                  if (mediaDetails.name === "1536x1536" || "2048x2048") {
                    bigImage = mediaDetails
                  }
                })
                return { smallImage, bigImage, title, source }
              }

              return (
                <DoodleImage key={"image"+i} image={getImageData()} />
              )
            })
          }
      </Masonry>
    </Layout>
  )
}

export async function getServerSideProps({ req, res }) {
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )

  const { loading, errors, data } = await client.query({
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

export default Doodles
