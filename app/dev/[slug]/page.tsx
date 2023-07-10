import { getData } from "@/utilities/getData";
import Layout from '@/components/Layout';
import ClientDetail from "@/components/ClientDetail";
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'

export async function generateMetadata({ params }) {
  const { slug } = params
  const query = `
    query GetPostBySlug($slug: ID!) {
      clientPost(id: $slug, idType: URI) {
        title
      }
    }
  `;

  const { data: {clientPost} } = await getData(query, { slug });
  return {
    title: clientPost?.title,
  }
}

export async function generateStaticParams() {
  const query = `
    query GetPosts {
      clientPosts {
        nodes {
          slug
        }
      }
    }
  `;

  const { data: {clientPosts} } = await getData(query);
  return clientPosts.nodes.map(({slug}) => ({
    params: { slug }
  }))
}

export default async function Page({ params }) {
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

  if (!clientPost) {
    notFound()
  }

  return (
    <Layout page="detail">
      <ClientDetail item={clientPost} />
    </Layout>
  );
}