import Art from "@/pages/art.client";
import { getData } from "@/utilities/getData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Art & Design',
  description: 'Multidisciplinary digital creator & software engineer',
}

export default async function Page() {
  const query = `
    query GetArt {
      page(id: "cG9zdDoxNw==") {
        content(format: RENDERED)
        artwork {
          gallery {
            title
            mediaItemUrl
            mediaType
            mediaDetails {
              width
              height
              sizes(include: MEDIUM_LARGE) {
                sourceUrl
                width
                height
              }
            }
          }
        }
      }
    }
  `;
  const { data: { page } } = await getData(query)

  return (
    <Art {...page} />
  );
}
