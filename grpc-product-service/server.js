const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// ---------------------------------------------------------------------------
// 1. Load definisi proto
// ---------------------------------------------------------------------------
const PROTO_PATH = path.join(__dirname, "product.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// ---------------------------------------------------------------------------
// 2. Data dummy (in-memory) - silakan ganti dengan koneksi DB jika perlu
// ---------------------------------------------------------------------------
let products = [
  { id: "1", name: "Beras Premium 5kg", price: 65000, stock: 120, status: "AVAILABLE" },
  { id: "2", name: "Minyak Goreng 1L", price: 18000, stock: 0, status: "OUT_OF_STOCK" },
  { id: "3", name: "Gula Pasir 1kg", price: 15000, stock: 80, status: "AVAILABLE" },
  { id: "4", name: "Tepung Terigu 1kg", price: 12000, stock: 45, status: "AVAILABLE" },
  { id: "5", name: "Telur Ayam 1kg", price: 28000, stock: 0, status: "DISCONTINUED" },
];

// ---------------------------------------------------------------------------
// 3. Implementasi RPC handlers
// ---------------------------------------------------------------------------

// rpc GetProduct (GetProductRequest) returns (GetProductResponse)
function getProduct(call, callback) {
  const { id } = call.request;
  const found = products.find((p) => p.id === id);

  if (!found) {
    return callback({
      code: grpc.status.NOT_FOUND,
      message: `Product dengan id '${id}' tidak ditemukan`,
    });
  }

  callback(null, { product: found });
}

// rpc ListProducts (ListProductsRequest) returns (ListProductsResponse)
function listProducts(call, callback) {
  const { status } = call.request;

  const result = status
    ? products.filter((p) => p.status === status)
    : products;

  callback(null, { products: result });
}

// ---------------------------------------------------------------------------
// 4. Buat & jalankan gRPC server
// ---------------------------------------------------------------------------
function main() {
  const server = new grpc.Server();

  server.addService(productProto.ProductService.service, {
    GetProduct: getProduct,
    ListProducts: listProducts,
  });

  // Render menyuntikkan port lewat env PORT, fallback ke 50051 untuk lokal
  const PORT = process.env.PORT || 50051;
  const HOST = "0.0.0.0";

  server.bindAsync(
    `${HOST}:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error("Gagal bind server:", err);
        return;
      }
      console.log(`ProductService gRPC server berjalan di ${HOST}:${boundPort}`);
    }
  );
}

main();