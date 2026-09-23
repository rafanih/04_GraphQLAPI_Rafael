const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');

const typeDefs = require('../../../schema');
const resolvers = require('../../../resolvers');

const defaultGraphqlDoc = `query FetchUsersOrdersProducts {
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

const serverInstance = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      document: defaultGraphqlDoc,
    }),
  ],
});

const nextApiHandler = startServerAndCreateNextHandler(serverInstance, {
  context: async (req) => ({ req }),
});

const routeHandler = async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://studio.apollographql.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-apollo-tracing',
      },
    });
  }

  const res = await nextApiHandler(req);
  res.headers.set('Access-Control-Allow-Origin', 'https://studio.apollographql.com');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
};

module.exports = {
  GET: routeHandler,
  POST: routeHandler,
  OPTIONS: routeHandler,
};
