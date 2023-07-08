import Info from "@/components/Info";
import { getData } from "../../utilites/getData";

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
  const { data: { page: { info } } } = await getData(query)

  return (
    <Info {...info} />
  );
}
