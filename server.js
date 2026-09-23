require('dotenv').config();
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { startStandaloneServer } = require('@apollo/server/standalone');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const initialGraphqlQuery = `query FetchUsersOrdersProducts {
  users {
    id
    name
    email
    orders {
      id
      quantity
      status
      product {
        id
        name
        price
        stock
        status
      }
    }
  }
}`;

const apolloInstance = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      document: initialGraphqlQuery,
    }),
  ],
});

const serverPort = Number(process.env.PORT || 4000);

const bootServer = async () => {
  const { url: serverUrl } = await startStandaloneServer(apolloInstance, {
    listen: { port: serverPort },
  });
  console.log(`🚀 GraphQL Server active on: ${serverUrl}`);
};

bootServer();
