import { ApolloClient, InMemoryCache } from "@apollo/client";
import { AGRICSHIELD_SUBQUERY_ENDPOINT } from "../utils/constants";

const client = new ApolloClient({
  uri: AGRICSHIELD_SUBQUERY_ENDPOINT,
  cache: new InMemoryCache(),
});

export default client;
