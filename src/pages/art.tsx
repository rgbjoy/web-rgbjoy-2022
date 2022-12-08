import Image from 'next/image'
import Head from 'next/head'
import Layout from '../components/Layout';
import Masonry from 'react-masonry-css'
import style from './art.module.scss'

import { gql } from "@apollo/client";
import { client } from "../data/app";

import { useState, useEffect, useRef } from "react";
import LightBox from '../components/Lightbox';

const Art = (props) => {

  const {
    page: { artwork },
  } = props;

  function useHover<HTMLDivElement>() {
    const [value, setValue] = useState<boolean>(false);
    const ref: any = useRef<HTMLDivElement | null>(null);
    const handleMouseOver = ():void => setValue(true)
    const handleMouseOut = ():void => setValue(false)

    useEffect(() => {
      const node: any = ref.current;
      if (node) {
        node.addEventListener("mouseover", handleMouseOver);
        node.addEventListener("mouseout", handleMouseOut);
        node.addEventListener("click", handleMouseOut);

        return () => {
          node.removeEventListener("mouseover", handleMouseOver);
          node.removeEventListener("mouseout", handleMouseOut);
          node.removeEventListener("click", handleMouseOut);
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
            <div className={isHovered ? "hovered" : ""}>
              <Image
                alt={image.title}
                src={image.sourceUrl}
                placeholder="blur"
                blurDataURL={image.mediaDetails.sizes[0].sourceUrl}
                priority
                width={image.mediaDetails.width}
                height={image.mediaDetails.height}
              />
            </div>
            <div className="caption">{image.title}</div>
        </LightBox>
      </div>
    )
  }

  return (
    <Layout page="info">
      <Head><title>Artwork</title></Head>

      <h1 className={style.header}>Artwork</h1>

      <div dangerouslySetInnerHTML={{ __html: props.page.content }} />
      <Masonry
        breakpointCols={3}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
          {
            artwork.gallery.map((image, i) => {
              return (
                <DoodleImage key={"image"+i} image={image} />
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
          artwork {
            gallery {
              sourceUrl
              title
              mediaDetails {
                width
                height
                sizes(include: MEDIUM) {
                  sourceUrl
                  width
                  height
                }
              }
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

export default Art
