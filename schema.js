const typeDefs = `#graphql
  """
  Entitas User untuk menampung akun pengguna.
  """
  type User {
    id: ID!
    name: String!
    email: String!
    orders: [Order!]!
  }

  """
  Entitas Product yang menyimpan data barang komoditas.
  """
  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    status: String!
    orders: [Order!]!
  }

  """
  Entitas Order untuk transaksi pembelian barang oleh pengguna.
  """
  type Order {
    id: ID!
    user_id: ID!
    product_id: ID!
    quantity: Int!
    status: String!
    user: User
    product: Product
  }

  """
  Data masukan saat menambahkan barang baru.
  """
  input CreateProductInput {
    name: String!
    price: Float!
    stock: Int!
    status: String
  }

  """
  Data masukan saat memperbarui detail barang.
  Semua kolom bersifat opsional.
  """
  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
    status: String
  }

  type Query {
    users: [User!]!
    user(id: ID = "1"): User
    products(status: String, minPrice: Float, maxPrice: Float): [Product!]!
    product(id: ID = "1"): Product
    orders: [Order!]!
    order(id: ID = "1"): Order
  }

  type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`;

module.exports = typeDefs;