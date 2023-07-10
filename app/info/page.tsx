import Info from "@/pages/Info";
import { getData } from "@/utilities/getData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Info',
  description: 'Multidisciplinary digital creator & web engineer',
}

export default async function page() {
  const query = `
    query getInfo {
      page(id: "cG9zdDoyNA==") {
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
            strength
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
