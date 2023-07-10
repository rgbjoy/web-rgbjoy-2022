import Art from "@/pages/Art";
import { getData } from "@/utilities/getData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Art & Design',
  description: 'Multidisciplinary digital creator & web engineer',
}

export default async function Page() {
  const query = `
    query {
      page(id: "cG9zdDo1MA==") {
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
