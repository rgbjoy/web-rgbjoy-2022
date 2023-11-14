import { getData } from "@/utilities/getData";
import { Metadata } from "next";
import Posts from "@/pages/posts.client";

export const metadata: Metadata = {
  title: 'Info',
  description: 'Multidisciplinary digital creator & web engineer',
}

export const runtime = 'edge'
export const revalidate = 3600

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