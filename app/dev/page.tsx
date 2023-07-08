import Dev from "@/components/Dev";
import { getData } from "../../utilites/getData";

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
