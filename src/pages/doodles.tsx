import Image from 'next/image'
import Head from 'next/head'
import Layout from '../components/Layout';
import Masonry from 'react-masonry-css'
import style from './doodles.module.scss'

import { gql } from "@apollo/client";
import { client } from "../data/app";
import LightBox from '../components/Lightbox';

const Doodles = (props) => {

  const {
    page: { doodles },
  } = props;

  const Doodles = () => {
    return (
      <Masonry
        breakpointCols={3}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
          {doodles.gallery.map((value, i) => {
            const images = value.mediaDetails.sizes
            let smallImage = {}
            let bigImage = {}
            images.map((mediaDetails) => {
              if(mediaDetails.name === "medium_large") {
                smallImage = mediaDetails
              }
              if(mediaDetails.name === "1536x1536" || "2048x2048") {
                bigImage = mediaDetails
              }
            })
            return (
              <div key={i}>
                <LightBox src={value.sourceUrl} alt="value.title">
                  <Image
                    src={bigImage["sourceUrl"]}
                    placeholder="blur"
                    blurDataURL={smallImage["sourceUrl"]}
                    priority
                    width={bigImage["width"]}
                    height={bigImage["height"]}
                    quality={100}
                    alt={value.title}
                  />
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
      <Doodles />
    </Layout>
  )
}

export async function getStaticProps() {
  const { data, errors } = await client.query({
    query: gql`
      query postsQuery {
        page(id: "cG9zdDo1MA==") {
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
