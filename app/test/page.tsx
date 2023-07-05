import { getClient } from "../../lib/client";

import { gql } from "@apollo/client";

const query = gql`query {
  page(id:"cG9zdDo1") {
    home {
      header
      subhead
      intro
      button
    }
  }
}`;

export default async function Page() {
  const { data: { page: { home } } } = await getClient().query({ query });

  return <main>
    {home.header}
    {home.subhead}
  </main>;
}