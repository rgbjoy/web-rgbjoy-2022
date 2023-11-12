import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/pageWrapper';
import { notFound } from 'next/navigation'
import Link from 'next/link'
import style from "@/pages/posts.module.scss"

export const runtime = 'edge'
export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  const query = `
    query getPosts {
      posts {
        edges {
          node {
            slug
          }
        }
      }
    }
  `;

  const { data: {posts: {edges}} } = await getData(query);
  return edges.map(({node: {slug}}) => ({
    params: { slug }
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const query = `
    query GetPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        content
      }
    }
  `;

  const { data: {post} } = await getData(query, { slug });

  return {
    title: post?.title,
  }
}

export default async function Page({ params }) {
  const { slug } = params
  const query = `
    query GetPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        content
      }
    }
  `;

  const { data: {post} } = await getData(query, { slug })

  if (!post) {
    notFound()
  }

  return (
    <PageWrapper className={style.post}>
      <h2 className={style.header}>{post.title}</h2>
      <div className={style.content} dangerouslySetInnerHTML={{__html: post.content}} />
      <Link href="/posts">Back to posts</Link>
    </PageWrapper>
  );
}