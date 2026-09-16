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
    createProduct(
      nama: String!
      deskripsi: String
      harga: Float!
      stok: Int!
      kategori: String
    ): Produk!
    updateProduct(
      id: ID!
      nama: String
      deskripsi: String
      harga: Float
      stok: Int
      kategori: String
    ): Produk
    deleteProduct(id: ID!): Boolean!
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
    resolverCallCount: () => resolverCallCount,
  },

  Mutation: {
    resetResolverCallCount: () => {
      resolverCallCount = 0;
      return true;
    },

    // Menambah produk baru, mengembalikan row yang baru dibuat.
    createProduct: async (_parent, { nama, deskripsi, harga, stok, kategori }) => {
      const rows = await sql`
        INSERT INTO produk (nama, deskripsi, harga, stok, kategori)
        VALUES (${nama}, ${deskripsi ?? null}, ${harga}, ${stok}, ${kategori ?? null})
        RETURNING *;
      `;
      return rows[0];
    },

    updateProduct: async (_parent, { id, nama, deskripsi, harga, stok, kategori }) => {
      const rows = await sql`
        UPDATE produk SET
          nama = COALESCE(${nama ?? null}, nama),
          deskripsi = COALESCE(${deskripsi ?? null}, deskripsi),
          harga = COALESCE(${harga ?? null}, harga),
          stok = COALESCE(${stok ?? null}, stok),
          kategori = COALESCE(${kategori ?? null}, kategori)
        WHERE id = ${id}
        RETURNING *;
      `;
      return rows[0] || null;
    },

    // Hapus produk berdasarkan id. Mengembalikan true kalau ada row yang terhapus.
    deleteProduct: async (_parent, { id }) => {
      const rows = await sql`
        DELETE FROM produk WHERE id = ${id} RETURNING id;
      `;
      return rows.length > 0;
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