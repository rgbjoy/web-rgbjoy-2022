import Home from "@/pages//Home";
import { getData } from "@/utilities/getData";
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tom Fletcher - Multidisciplinary digital creator & web engineer',
  description: 'Multidisciplinary digital creator & web engineer',
}

export default async function Page() {
  const query = `
    query getHome {
      page(id:"cG9zdDo1") {
        home {
          header
          subhead
          intro
          button
        }
      }
    }
  `;
  const { data: { page: { home } } } = await getData(query)

  return (
    <Home {...home} />
  );
}