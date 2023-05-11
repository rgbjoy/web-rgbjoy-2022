import { GetStaticProps } from 'next'

import Head from 'next/head'
import Layout from '../components/Layout';
import Masonry from 'react-masonry-css'
import style from './art.module.scss'
import Media from '../components/Media';

import { gql } from "@apollo/client";
import { apolloClient } from "../data/apolloClient";

import { useState, useEffect, useRef } from "react";
import LightBox from '../components/Lightbox';

const Art = props => {

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

  const DoodleImage = ({media, ...props}) => {
    const [hoverRef, isHovered] = useHover<HTMLDivElement>();

    return (
      <div {...props} ref={hoverRef} className={style.media}>
        <LightBox media={media}>
            <div className={`thumbnail ${isHovered ? "hovered" : ""}`}>
              <Media media={media} thumbnail />
            </div>
            <div className="caption">{media.title}</div>
        </LightBox>
      </div>
    )
  }

  return (
    <Layout page="art">
      <Head><title>Art & Design</title></Head>

      <h1 className={style.header}>Art & Design</h1>

      <div dangerouslySetInnerHTML={{ __html: props.page.content }} />
      <Masonry
        breakpointCols={2}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
          {
            artwork.gallery.map((media, i) => {
              return (
                <DoodleImage key={"media"+i} media={media} />
              )
            })
          }
      </Masonry>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const { errors, data } = await apolloClient.query({
    query: gql`
      query {
        page(id: "cG9zdDo1MA==") {
          content(format: RENDERED)
          artwork {
            gallery {
              title
              mediaItemUrl
              mediaType
              mediaDetails {
                width
                height
                sizes(include: MEDIUM_LARGE) {
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

  if (errors) {
    return <div className="error">My CMS must be down.</div>
  }

  return {
    props: {
      page: data.page,
    },
    revalidate: 60,
  };
}

export default Art
