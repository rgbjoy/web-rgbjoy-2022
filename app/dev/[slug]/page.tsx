import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/PageWrapper';
import ClientDetail from "@/components/ClientDetail";
import { notFound } from 'next/navigation'
import style from "@/pages/Dev.module.scss"

export async function generateStaticParams() {
  'use server'
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
    title: clientPost.title,
  }
}

export default async function Page({ params }) {
  'use server'
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

  const { data: {clientPost} } = await getData(query, { slug })

  if (!clientPost) {
    notFound()
  }

  return (
    <PageWrapper className={style.dev}>
      <ClientDetail item={clientPost} />
    </PageWrapper>
  );
}