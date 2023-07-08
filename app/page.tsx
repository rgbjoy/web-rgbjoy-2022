import Home from "../components/Home";
import { getData } from "../utilites/getData";

export default async function index() {
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