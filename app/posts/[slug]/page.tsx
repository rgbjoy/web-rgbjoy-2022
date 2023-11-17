import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/pageWrapper';
import { notFound } from 'next/navigation'
import Image from 'next/image';
import Link from 'next/link'
import style from "./post.module.scss"
import { Suspense } from "react";
import { PostData } from "@/models/types";

export const dynamicParams = true
export const revalidate = 3600

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const query = `
    query getPosts {
      posts {
        nodes {
          slug
        }
      }
    }
  `;

  const { data: {posts: {nodes}} } = await getData(query);

  if (!nodes) {
    return []
  }

  return nodes.map(({ slug }) => ({
    params: { slug }
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const query = `
    query GetPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
      }
    }
  `;

  const { data: { post } } = await getData(query, { slug });

  if (!post) {
    return {}
  }

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
      featuredImage {
        node {
          sourceUrl
          mediaDetails {
            width
            height
          }
        }
      }
    }
  }
  `;

  const { data: { post } } = await getData(query, { slug }) as { data: { post: PostData } }

  if (!post) {
    notFound()
  }

  const featuredImage = post.featuredImage?.node;
  const imageUrl = featuredImage?.sourceUrl;
  const imageWidth = featuredImage?.mediaDetails?.width;
  const imageHeight = featuredImage?.mediaDetails?.height;

  return (
    <PageWrapper className={style.post}>
      <Suspense fallback={<div>Loading...</div>}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={`Featured image for ${post.title}`}
            width={imageWidth || 500}
            height={imageHeight || 300}
            priority
          />
        )}
      </Suspense>
      <h2 className={style.header}>{post.title}</h2>
      <div className={style.content} dangerouslySetInnerHTML={{ __html: post.content }} />
      <Link href="/posts">← Back to posts</Link>
    </PageWrapper>
  );
}