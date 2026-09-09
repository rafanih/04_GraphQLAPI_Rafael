# GraphQL Produk Lab — Apollo Server + Neon + Vercel

Stack: **Apollo Server v4** (GraphQL) + **Neon** (PostgreSQL serverless) + **Vercel** (hosting).
2 tabel berelasi: `produk` (1) → `ulasan` (banyak), untuk nested query di langkah 5.

---

## LANGKAH 1 — Buat database di Neon

1. Buka [neon.tech](https://neon.tech), daftar/login, buat **New Project**.
2. Setelah project jadi, buka tab **SQL Editor** di dashboard Neon.
3. Copy-paste seluruh isi file `sql/schema.sql` (dari folder ini), klik **Run**.
4. Cek hasilnya — dua query `SELECT * FROM produk;` dan `SELECT * FROM ulasan;` di baris
   terakhir file harus menampilkan data (3 baris produk, 4 baris ulasan).
5. Buka tab **Connection Details** / **Dashboard**, cari **Connection string**.
   - Kalau ada opsi **Pooled connection**, pilih itu (biasanya hostname-nya ada `-pooler`).
   - Copy connection string-nya, simpan sementara — nanti dipakai di langkah 3.

---

## LANGKAH 2 — Siapkan project di komputer

1. Extract folder `graphql-produk-apollo-vercel` dari zip.
2. Install Node.js kalau belum ada (v18 ke atas): [nodejs.org](https://nodejs.org).
3. Buka terminal di folder project, jalankan:
   ```bash
   npm install
   ```
4. Salin file environment:
   ```bash
   cp .env.example .env
   ```
   Buka `.env`, ganti `DATABASE_URL` dengan connection string Neon dari Langkah 1.

---

## LANGKAH 3 — Tes lokal dulu (opsional tapi disarankan)

1. Install Vercel CLI kalau belum ada:
   ```bash
   npm install -g vercel
   ```
2. Jalankan:
   ```bash
   vercel dev
   ```
3. Terminal akan tanya beberapa hal (set up project, pilih scope, dll) — ikuti saja default-nya
   untuk testing lokal.
4. Buka browser ke `http://localhost:3000/api/graphql`.
5. Kalau muncul halaman Apollo Server (bukan error), koneksi ke Neon sudah berhasil.

---

## LANGKAH 4 — Deploy ke Vercel

**Opsi A — lewat CLI (tercepat):**
```bash
vercel login
vercel
```
Ikuti prompt-nya (set up and deploy, pilih scope akun kamu, terima default project name, dll).
Setelah selesai, tambahkan environment variable-nya:
```bash
vercel env add DATABASE_URL
```
- Saat diminta value, paste connection string Neon kamu.
- Saat diminta environment, pilih **Production** (dan boleh juga Preview & Development).

Deploy ulang supaya environment variable-nya terpakai:
```bash
vercel --prod
```

**Opsi B — lewat dashboard Vercel:**
1. Push folder project ini ke repo GitHub baru (private juga boleh).
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/username/nama-repo.git
   git push -u origin main
   ```
   > Pastikan file `.env` **tidak** ikut ke-push (buat `.gitignore` berisi `.env` dan `node_modules`).
2. Buka [vercel.com](https://vercel.com) → **New Project** → **Import** repo GitHub kamu.
3. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan:
   - Key: `DATABASE_URL`
   - Value: connection string Neon kamu
4. Klik **Deploy**, tunggu sampai selesai.

---

## LANGKAH 5 — Pastikan endpoint hidup

1. Setelah deploy sukses, Vercel kasih URL, contoh: `https://nama-project-kamu.vercel.app`.
2. Buka `https://nama-project-kamu.vercel.app/api/graphql` di browser.
3. Kalau muncul halaman Apollo Server (tulisan "Apollo Server" atau info GraphQL), berarti
   sudah live dan tersambung ke database.
4. Kalau muncul **error 500** atau **FUNCTION_INVOCATION_FAILED** — lihat bagian
   Troubleshooting di bawah, kemungkinan besar soal `DATABASE_URL`.

---

## LANGKAH 6 — Buka lewat Apollo Sandbox

1. Susun link dengan format:
   ```
   https://studio.apollographql.com/sandbox/explorer?endpoint=https://nama-project-kamu.vercel.app/api/graphql
   ```
   Ganti `nama-project-kamu.vercel.app` dengan domain Vercel kamu yang asli.
2. Buka link itu di browser.
3. Tunggu beberapa detik — panel schema (daftar `Query`, `Produk`, `Ulasan`) harus muncul
   otomatis di sisi kiri layar. Kalau muncul, berarti introspection & CORS sudah benar.

---

## LANGKAH 7 — Jalankan query pembanding

Di panel query Sandbox (biasanya di tengah), ketik:

```graphql
query {
  products {
    nama
  }
}
```

Klik tombol **Run** (▶). Perhatikan di panel response (kanan): hanya field `nama` yang
dikembalikan per produk — bukan semua 7 kolom seperti kalau lewat REST biasa.

---

## LANGKAH 8 — Jalankan nested query (screenshot ini)

Ganti query di Sandbox dengan:

```graphql
query {
  products {
    id
    nama
    harga
    ulasan {
      namaReviewer
      komentar
      rating
    }
  }
}
```

Klik **Run**. Response akan menampilkan setiap produk lengkap dengan daftar ulasannya —
ini membuktikan dua tabel (`produk` dan `ulasan`) benar-benar terhubung lewat resolver
GraphQL, dan datanya nyata dari database Neon.

**Screenshot tampilan ini secara penuh**, pastikan terlihat:
- Address bar browser menunjukkan `studio.apollographql.com/...endpoint=https://nama-project-kamu.vercel.app/api/graphql` (bukan `localhost`).
- Query di panel tengah.
- Hasil response nested di panel kanan.

---

## LANGKAH 9 — Tulis refleksi & kumpulkan

Sesuaikan draf berikut dengan gaya bahasamu sendiri (3-5 kalimat):

> Perbedaan jumlah field yang dikembalikan ini sangat terasa manfaatnya saat aplikasi
> berjalan di jaringan lambat atau perangkat mobile dengan kuota terbatas, karena payload
> yang lebih kecil berarti waktu loading lebih cepat dan penggunaan data lebih hemat. Pada
> REST, over-fetching sering terjadi karena satu endpoint harus melayani banyak kebutuhan
> tampilan sekaligus, sehingga field yang tidak dipakai tetap terkirim. GraphQL menjadi
> sangat berguna ketika satu aplikasi punya banyak tampilan berbeda (misalnya daftar
> produk ringkas vs halaman detail produk beserta ulasannya) yang membutuhkan kombinasi
> field berbeda-beda dari resource yang sama. Namun untuk API sederhana dengan kebutuhan
> data yang seragam di semua klien, keuntungan ini kurang signifikan dan REST bisa jadi
> lebih sederhana untuk diimplementasikan dan di-cache.

Kumpulkan 3 hal sesuai format tugas:
1. Link Apollo Sandbox (dari Langkah 6).
2. Screenshot nested query (dari Langkah 8).
3. Refleksi tertulis (di atas).

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Error 500 / `FUNCTION_INVOCATION_FAILED` di `/api/graphql` | `DATABASE_URL` belum di-set di Vercel Environment Variables, atau typo. Cek di dashboard Vercel → Settings → Environment Variables, lalu redeploy (`vercel --prod`). |
| `ulasan` selalu balik `[]` kosong | Data di tabel `ulasan` belum ke-insert. Buka lagi Neon SQL Editor, jalankan ulang bagian `INSERT INTO ulasan ...` dari `schema.sql`. |
| Panel schema di Sandbox kosong / tidak muncul | Introspection mungkin ke-disable, atau endpoint salah ketik. Pastikan `introspection: true` ada di `api/graphql.js` (sudah ada di kode ini secara default). |
| Error CORS di console browser (F12) | Domain `https://studio.apollographql.com` harus persis ada di array `cors.origin` pada `api/graphql.js`, tanpa trailing slash. Setelah edit, deploy ulang. |
| `vercel dev` gagal konek ke Neon lokal | Pastikan `.env` sudah diisi dan formatnya benar (ada `?sslmode=require` di akhir). |
| Setelah redeploy, environment variable lama masih kepakai | Environment variable di Vercel butuh **redeploy** untuk aktif — jalankan `vercel --prod` lagi setelah menambah/mengubah variable. |
