import { getData } from "../../../utilites/getData";
import Head from 'next/head'
import Layout from '@/components/Layout';
import ClientDetail from "@/components/ClientDetail";

export async function generateStaticParams() {
  const query = `
    query GetPostSlugs{
      clientPosts {
        nodes {
          slug
        }
      }
    }
  `;

  const { data } = await getData(query)


  return data.clientPosts.nodes.map((post) => ({
    slug: post.slug,
  }))
}

export default async function page({ params }) {
  const { slug } = params
  const query = `
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
  `;

  const { data } = await getData(query, { slug });
  const { clientPost } = data;

  return (
    <Layout page="detail">
      <Head><title>{`${clientPost ? clientPost.title : 'Client Detail'}`}</title></Head>
      <ClientDetail item={clientPost} />
    </Layout>
  );
}