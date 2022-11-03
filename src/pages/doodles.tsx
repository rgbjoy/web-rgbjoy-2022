import Image from 'next/image'
import Head from 'next/head'
import Layout from '../components/Layout';
import Masonry from 'react-masonry-css'
import style from './doodles.module.scss'

import { gql } from "@apollo/client";
import { client } from "../data/app";


const Doodles = (props) => {

  const {
    page: { doodles },
  } = props;

  const GetDoodles = () => {

    return (
      <Masonry
        breakpointCols={3}
        className={style['my-masonry-grid']}
        columnClassName="my-masonry-grid_column">
          {doodles["doodle"].map((value, i) => {
            const image = value["image"]["mediaDetails"]["sizes"][4]
            const alt = value["image"]["altText"]
            const src = image["sourceUrl"]
            const width = image["width"]
            const height = image["height"]

            return (
              <div key={i}>
                <Image
                  src={src}
                  priority
                  width={width}
                  height={height}
                  alt={alt}
                />
                <h3>{value["title"]}</h3>
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
      <GetDoodles />
    </Layout>
  )
}

export async function getStaticProps() {
  const { data, errors } = await client.query({
    query: gql`
      query postsQuery {
        page(id: "cG9zdDo1MA==") {
          doodles {
            doodle {
              title
              image {
                altText
                mediaDetails {
                  sizes {
                    sourceUrl
                    width
                    height
                    name
                  }
                }
              }
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
