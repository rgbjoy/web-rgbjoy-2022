import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/pageWrapper';
import ClientDetail from "@/components/clientDetail";
import { notFound } from 'next/navigation'
import style from "@/pages/dev.module.scss"

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

export async function generateMetadata({ params }) {
  const { slug } = params
  const query = `
    query GetTitles($slug: ID!) {
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
  const { slug } = params
  const query = `
    query GetPostBySlug($slug: ID!) {
      clientPost(id: $slug, idType: URI) {
        title
        content(format: RENDERED)

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