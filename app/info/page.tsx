import Info from "@/pages/info.client";
import { getData } from "@/utilities/getData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Info',
  description: 'Multidisciplinary digital creator & web engineer',
}

export default async function Page() {
  const query = `
    query getInfo {
      page(id: "cG9zdDoxMw==") {
        content(format: RENDERED)
        info {
          profileImage {
            mediaDetails {
              sizes {
                sourceUrl
                width
                height
                name
              }
            }
          }
          links {
            link {
              title
              url
            }
          }
          strengths {
            title
            strengths
          }
        }
      }
    }
  `;
  const { data: { page } } = await getData(query)

  return (
    <Info {...page} />
  );
}
