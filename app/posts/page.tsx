import { getData } from "@/utilities/getData";
import PageWrapper from '@/components/pageWrapper';
import { Metadata } from "next";
import Link from "next/link";
import Posts from "@/pages/posts.client";

export const metadata: Metadata = {
  title: 'Info',
  description: 'Multidisciplinary digital creator & web engineer',
}

export const runtime = 'edge'
export const revalidate = 60

export default async function Page() {
  const query = `
    query getPosts {
      posts {
        edges {
          node {
            slug
            title
            content
          }
        }
      }
    }
  `;

  const { data: { posts: { edges } } } = await getData(query)

  return (
    <Posts posts={edges}  />
  );
}