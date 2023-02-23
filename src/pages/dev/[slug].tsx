import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'

import { gql } from "@apollo/client";
import { client } from "../../data/app";

import ClientDetail from '../../components/ClientDetail'
import Layout from '../../components/Layout';

const StaticPropsDetail = (props) => {
  const {
    client: { clientPost },
  } = props;

  return (
    <Layout page="detail">
      <Head><title>{`${client ? clientPost.title : 'Client Detail'}`}</title></Head>
      <ClientDetail item={clientPost} />
    </Layout>
  )
}

export const getStaticPaths = async () => {
  const { data, errors } = await client.query({
    query: gql`
      query GetPostSlugs{
        clientPosts {
          nodes {
            slug
          }
        }
      }
    `
  });

  if (errors) {
    return <div className="error">My CMS must be down.</div>
  }

  const paths = data.clientPosts.nodes.map(post => ({
    params: { slug: post.slug }
  }));

  return { paths, fallback: false };
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { data, errors } = await client.query({
    query: gql`
      query GetPostBySlug($slug: ID!) {
        clientPost(id: $slug, idType: URI) {
          title
          content(format: RENDERED)
          client {
            title
            technologies {
              technology
            }
            date
          }
        }
      }
    `,
    variables: { slug: params.slug }
  });

  if (errors) {
    return <div className="error">My CMS must be down.</div>
  }

  return {
    props: {
      client: data,
    }
  }
}



export default StaticPropsDetail