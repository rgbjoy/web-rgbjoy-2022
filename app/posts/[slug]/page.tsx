import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/pageWrapper';
import formatDate from '@/components/formatDate';
import { notFound } from 'next/navigation'
import Image from 'next/image';
import Link from 'next/link'
import style from "./post.module.scss"
import { PostData } from "@/models/types";
import parse from 'html-react-parser';
import { Suspense } from "react";

export const dynamicParams = true
export const revalidate = 3600

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

  const { data: { posts: { nodes } } } = await getData(query);

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
        excerpt
        featuredImage {
          node {
            sourceUrl(size: MEDIUM)
          }
        }
      }
    }
  `;

  const { data: { post } } = await getData(query, { slug });

  if (!post) {
    return {}
  }

  return {
    title: post?.title,
    description: post?.excerpt,
    openGraph: {
      images: [
        {
          url: post?.featuredImage?.node?.sourceUrl,
        },
      ],
    },
  }
}

export default async function Page({ params }) {
  const { slug } = params
  const query = `
    query GetPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        date
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

  const authorStructuredData = {
    "@context": "http://schema.org",
    "@type": "Person",
    "name": "Tom Fletcher",
    "url": "https://instagram.com/rgbjoy",
  };

  const featuredImage = post.featuredImage?.node;
  const imageUrl = featuredImage?.sourceUrl;
  const imageWidth = featuredImage?.mediaDetails?.width;
  const imageHeight = featuredImage?.mediaDetails?.height;

  const replaceImageTag = (node) => {
    if (node.type === 'tag' && node.name === 'img') {
      let { src, alt, width, height } = node.attribs;
      return <Image src={src} alt={alt} width={width} height={height} />;
    }

    if (node.type === 'tag' && node.name === 'iframe') {
      let { srcdoc } = node.attribs;
      const heightMatch = srcdoc.match(/createCanvas\(windowWidth,\s*(\d+)\)/);
      let height = '300px'; // default height

      if (heightMatch && heightMatch[1]) {
        height = `${heightMatch[1]}px`;
      }

      return (
        <iframe scrolling={"no"} srcDoc={srcdoc} width="100%" height={height}></iframe>
      );
    }
  };

  const contentWithNextImage = parse(post.content, {
    replace: replaceImageTag,
  });

  return (
    <PageWrapper className={style.post}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorStructuredData) }}
      />
      {imageUrl && (
        <Suspense>
          <Image itemProp="image" className={style.featuredImage} src={imageUrl} alt={`Featured image for ${post.title}`} width={imageWidth || 500} height={imageHeight || 300}
          priority
        />
        </Suspense>
      )}
      <h2 itemProp="headline" className={style.title}>{post.title}</h2>
      <h3 itemProp="datePublished" className={style.date}>{formatDate(post.date)}</h3>
      <div className={style.content}>{contentWithNextImage}</div>
      <Link href="/posts">← Back to posts</Link>
    </PageWrapper>
  );
}