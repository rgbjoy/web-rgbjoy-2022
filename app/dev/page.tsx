import Dev from "@/pages/Dev";
import { getData } from "../../utilities/getData";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Development',
  description: 'Multidisciplinary digital creator & web engineer',
}

export default async function page() {
  const query = `
    query {
      clientPosts(where: {orderby: {order: ASC, field: MENU_ORDER}}) {
        nodes {
          title
          slug
          client {
            date
            title
          }
        }
      }
      page(id: "cG9zdDo0MQ==") {
        dev {
          intro
          pastProjects {
            title
            link {
              url
            }
            description
          }
        }
      }
    }
  `;

  const { data } = await getData(query)

  return (
    <Dev {...data} />
  );
}
