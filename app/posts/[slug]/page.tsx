import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/pageWrapper';
import { notFound } from 'next/navigation'
import Image from 'next/image';
import Link from 'next/link'
import style from "@/pages/posts.module.scss"

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

  const { data: { posts: { edges } } } = await getData(query);
  return edges.map(({ node: { slug } }) => ({
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

  const { data: { post } } = await getData(query, { slug })

  if (!post) {
    notFound()
  }

  const featuredImage = post.featuredImage?.node;
  const imageUrl = featuredImage?.sourceUrl;
  const imageWidth = featuredImage?.mediaDetails?.width;
  const imageHeight = featuredImage?.mediaDetails?.height;

  return (
    <PageWrapper className={style.post}>
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`Featured image for ${post.title}`}
          width={imageWidth || 500}
          height={imageHeight || 300}
          layout='responsive'
        />
      )}
      <h2 className={style.header}>{post.title}</h2>
      <div className={style.content} dangerouslySetInnerHTML={{ __html: post.content }} />
      <Link href="/posts">← Back to posts</Link>
    </PageWrapper>
  );
}