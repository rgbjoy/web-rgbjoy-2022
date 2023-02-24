import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  // My WordPress GraphQL endpoint.
  uri: process.env.WORDPRESS_API_URL,
  // Apollo Cacheing
  cache: new InMemoryCache(),
});