const { GraphQLError } = require('graphql');
const db = require('./db');

let userOrdersCallTracker = 0;

/**
 * Konversi field price dari string PostgreSQL ke tipe Float/Number
 */
function normalizeProductRecord(data) {
  if (!data) return null;
  return {
    ...data,
    price: data.price != null ? Number(data.price) : 0.0,
  };
}

const resolvers = {
  Query: {
    users: async () => {
      const { rows } = await db.query('SELECT * FROM users');
      return rows;
    },

    user: async (_, args) => {
      const searchId = args.id || '1';
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [searchId]);
      return rows[0] || null;
    },

    products: async (_, { status, minPrice, maxPrice }) => {
      let sqlQuery = 'SELECT * FROM products WHERE 1=1';
      const bindParams = [];

      if (status != null) {
        bindParams.push(status);
        sqlQuery += ` AND status = $${bindParams.length}`;
      }
      if (minPrice != null) {
        bindParams.push(minPrice);
        sqlQuery += ` AND price >= $${bindParams.length}`;
      }
      if (maxPrice != null) {
        bindParams.push(maxPrice);
        sqlQuery += ` AND price <= $${bindParams.length}`;
      }

      const { rows } = await db.query(sqlQuery, bindParams);
      return rows.map(normalizeProductRecord);
    },

    product: async (_, args) => {
      const searchId = args.id || '1';
      const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [searchId]);
      return normalizeProductRecord(rows[0]);
    },

    orders: async () => {
      const { rows } = await db.query('SELECT * FROM orders');
      return rows;
    },

    order: async (_, args) => {
      const searchId = args.id || '1';
      const { rows } = await db.query('SELECT * FROM orders WHERE id = $1', [searchId]);
      return rows[0] || null;
    },
  },

  Mutation: {
    createProduct: async (_, { input }) => {
      const productStatus = input.status || 'ACTIVE';
      const queryText = `
        INSERT INTO products (name, price, stock, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const { rows } = await db.query(queryText, [
        input.name,
        input.price,
        input.stock,
        productStatus,
      ]);

      return normalizeProductRecord(rows[0]);
    },

    updateProduct: async (_, { id, input }) => {
      const updateClauses = [];
      const queryParams = [];

      const fieldsToCheck = ['name', 'price', 'stock', 'status'];
      for (const field of fieldsToCheck) {
        if (input[field] !== undefined && input[field] !== null) {
          queryParams.push(input[field]);
          updateClauses.push(`${field} = $${queryParams.length}`);
        }
      }

      // Jika tidak ada data yang perlu di-update
      if (updateClauses.length === 0) {
        const currentRecord = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (currentRecord.rows.length === 0) {
          throw new GraphQLError(`Product with id ${id} not found`, {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return normalizeProductRecord(currentRecord.rows[0]);
      }

      queryParams.push(id);
      const updateQuery = `UPDATE products SET ${updateClauses.join(', ')} WHERE id = $${queryParams.length} RETURNING *`;
      const result = await db.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        throw new GraphQLError(`Product with id ${id} not found`, {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return normalizeProductRecord(result.rows[0]);
    },

    deleteProduct: async (_, { id }) => {
      const { rowCount } = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      return rowCount > 0;
    },
  },

  User: {
    orders: async (parent) => {
      userOrdersCallTracker += 1;
      console.log(
        `[N+1 MONITOR] User.orders dipanggil untuk user_id=${parent.id} — total pemanggilan: ${userOrdersCallTracker}`
      );

      const { rows } = await db.query('SELECT * FROM orders WHERE user_id = $1', [parent.id]);
      return rows;
    },
  },

  Product: {
    orders: async (parent) => {
      const { rows } = await db.query('SELECT * FROM orders WHERE product_id = $1', [parent.id]);
      return rows;
    },
  },

  Order: {
    user: async (parent) => {
      if (!parent.user_id) return null;
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return rows[0] || null;
    },
    product: async (parent) => {
      if (!parent.product_id) return null;
      const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [parent.product_id]);
      return normalizeProductRecord(rows[0]);
    },
  },
};

module.exports = resolvers;