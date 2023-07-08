import Art from "@/components/Art";
import { getData } from "../../utilites/getData";

export default async function page() {
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
