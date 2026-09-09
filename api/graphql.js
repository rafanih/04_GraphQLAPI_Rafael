const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

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
  },

  Produk: {
    createdAt: (parent) => parent.created_at,
    // Nested resolver: hanya dieksekusi kalau field "ulasan" diminta di query.
    // Ini yang membuktikan dua tabel benar-benar terhubung lewat GraphQL.
    ulasan: async (parent) => {
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

// -------------------------------------------------------
// Setup Apollo Server + Express.
// Express app itu sendiri adalah function (req, res) => void,
// jadi Vercel Node.js runtime bisa langsung memakainya sebagai
// handler serverless function tanpa perlu app.listen().
// -------------------------------------------------------
const app = express();

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // WAJIB aktif supaya Apollo Sandbox bisa membaca schema
});

// Apollo Server v4 butuh di-start (async) sebelum middleware-nya dipakai.
// Di lingkungan serverless, start() ini cukup dipanggil sekali dan
// di-cache lewat promise, supaya invocation berikutnya (warm start)
// tidak start ulang.
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
