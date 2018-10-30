import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { InMemoryCache } from "apollo-cache-inmemory";
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';

const GRAPHQL_URL = '358b1141.ngrok.io/v1alpha1/graphql';

const httpLink = new HttpLink({
  uri: `http://${GRAPHQL_URL}`,
  headers: {
    'x-hasura-access-key': '12345'
  }
});

const wsLink = new WebSocketLink({
  uri: `ws://${GRAPHQL_URL}`,
  options: {
    reconnect: true,
    connectionParams: {
      headers: {
        'x-hasura-access-key': '12345'
      }
    }
  }
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink,
  httpLink,
);

const cache = new InMemoryCache();

const client = new ApolloClient({
  link,
  cache
});

export default client;