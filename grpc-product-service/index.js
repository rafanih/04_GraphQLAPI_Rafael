require('dotenv').config({ path: __dirname + '/.env' });
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon butuh SSL
});

const packageDef = protoLoader.loadSync('product.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(proto.ProductService.service, {
  GetProduct: async (call, callback) => {
    try {
      const result = await pool.query(
        'SELECT * FROM produk WHERE id = $1',
        [call.request.id]
      );
      const row = result.rows[0];

      if (!row) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Product not found'
        });
      }

      callback(null, {
        id: row.id,
        nama: row.nama,
        deskripsi: row.deskripsi,
        harga: parseFloat(row.harga),
        stok: row.stok,
        kategori: row.kategori
      });
    } catch (err) {
      console.error(err);
      callback({
        code: grpc.status.INTERNAL,
        message: err.message
      });
    }
  }
});

const PORT = process.env.PORT || 50051;
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`gRPC server berjalan di port ${port}`);
  }
);