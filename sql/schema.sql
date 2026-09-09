CREATE TABLE IF NOT EXISTS produk (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  harga NUMERIC(12, 2) NOT NULL,
  stok INTEGER NOT NULL DEFAULT 0,
  kategori VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ulasan (
  id SERIAL PRIMARY KEY,
  produk_id INTEGER NOT NULL REFERENCES produk(id) ON DELETE CASCADE,
  nama_reviewer VARCHAR(150) NOT NULL,
  komentar TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO produk (id, nama, deskripsi, harga, stok, kategori) VALUES
  (1, 'Kopi Arabika 250g', 'Kopi arabika single origin dari Aceh', 75000, 120, 'Minuman'),
  (2, 'Teh Hijau Premium', 'Teh hijau organik kemasan 100g', 45000, 80, 'Minuman'),
  (3, 'Keripik Singkong', 'Keripik singkong renyah original', 20000, 200, 'Makanan Ringan')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('produk', 'id'),
  COALESCE((SELECT MAX(id) FROM produk), 1)
);

INSERT INTO ulasan (produk_id, nama_reviewer, komentar, rating) VALUES
  (1, 'Budi', 'Aromanya kuat, cocok untuk pecinta kopi hitam.', 5),
  (1, 'Sinta', 'Enak tapi agak asam untuk selera saya.', 3),
  (2, 'Rahmat', 'Wangi melati, bikin rileks setelah kerja.', 4),
  (3, 'Dewi', 'Renyah dan gurih, cocok buat camilan sore.', 5)
ON CONFLICT DO NOTHING;

SELECT * FROM produk;
SELECT * FROM ulasan;
