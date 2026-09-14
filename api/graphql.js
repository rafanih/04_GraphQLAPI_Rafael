const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

let resolverCallCount = 0;

const typeDefs = `#graphql
  type Produk {
    id: ID!
    nama: String!
    deskripsi: String
    harga: Float!
    stok: Int!
    kategori: String
    createdAt: String
    ulasan: [Ulasan!]!
  }

  type Ulasan {
    id: ID!
    namaReviewer: String!
    komentar: String
    rating: Int
    createdAt: String
    produk: Produk
  }

  type Query {
    products: [Produk!]!
    product(id: ID!): Produk
    reviews: [Ulasan!]!
    resolverCallCount: Int!
  }

  type Mutation {
    resetResolverCallCount: Boolean!
  }
`;

const resolvers = {
  Query: {
    products: async () => {
      return await sql`SELECT * FROM produk ORDER BY id`;
    },
    product: async (_parent, { id }) => {
      const rows = await sql`SELECT * FROM produk WHERE id = ${id}`;
      return rows[0] || null;
    },
    reviews: async () => {
      return await sql`SELECT * FROM ulasan ORDER BY id`;
    },
    // Query bantu untuk membaca nilai counter dari luar,
    // dipanggil terpisah SETELAH query nested dijalankan.
    resolverCallCount: () => resolverCallCount,
  },

  Mutation: {
    // Reset counter ke 0 sebelum memulai percobaan baru,
    // supaya hasil hitungan tidak menumpuk dari request sebelumnya.
    resetResolverCallCount: () => {
      resolverCallCount = 0;
      return true;
    },
  },

  Produk: {
    createdAt: (parent) => parent.created_at,
    ulasan: async (parent) => {
      resolverCallCount++;
      console.log(
        `[N+1 TEST] Produk.ulasan dipanggil untuk produk id=${parent.id} (${parent.nama}) — total pemanggilan sejauh ini: ${resolverCallCount}`
      );
      return await sql`SELECT * FROM ulasan WHERE produk_id = ${parent.id} ORDER BY id`;
    },
  },

  Ulasan: {
    namaReviewer: (parent) => parent.nama_reviewer,
    createdAt: (parent) => parent.created_at,
    produk: async (parent) => {
      const rows = await sql`SELECT * FROM produk WHERE id = ${parent.produk_id}`;
      return rows[0] || null;
    },
  },
};

const app = express();

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, 
});

const startPromise = apolloServer.start();

app.use(
  '/api/graphql',
  cors({
    origin: [
      'https://studio.apollographql.com',
      'http://localhost:3000',
    ],
    credentials: true,
  }),
  bodyParser.json(),
  async (req, res, next) => {
    await startPromise;
    return expressMiddleware(apolloServer)(req, res, next);
  }
);

app.get('/', (_req, res) => {
  res.send('Apollo Server aktif di Vercel. Endpoint: /api/graphql');
});

module.exports = app;