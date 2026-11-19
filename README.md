# FoodCycle

Marketplace makanan berlebih (surplus food). Restoran menjual sisa produksi yang masih layak dengan harga diskon, customer membelinya untuk diri sendiri atau mendonasikannya ke lembaga sosial, dan admin mengawasi verifikasi mitra, pesanan, serta refund.

## Peran Pengguna

| Peran | Yang bisa dilakukan |
|---|---|
| Customer | Jelajah & cari makanan, rekomendasi, keranjang, checkout + bayar (Duitku), lacak pesanan, donasi ke lembaga, ulasan, refund dengan foto bukti |
| Restoran (mitra) | Registrasi dengan dokumen legal, kelola listing & stok, proses pesanan, lihat penjualan, ulasan, dan dampak |
| Lembaga | Registrasi dengan dokumen legal, terima dan konfirmasi donasi, riwayat donasi |
| Admin | Verifikasi restoran/lembaga, moderasi makanan, pantau pesanan & donasi, tinjau refund dan keluhan, laporan |

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Recharts |
| Autentikasi | Better Auth (password di-hash, session cookie) |
| Database | Neon Postgres + Drizzle ORM |
| Penyimpanan file | Vercel Blob (private) untuk foto bukti refund dan dokumen legal |
| Pembayaran | Duitku (payment gateway) |
| Hosting | Vercel |
| Testing | Vitest |

## Menjalankan Secara Lokal

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # menjalankan seluruh tes otomatis
```

Variabel lingkungan yang dibutuhkan: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY`.

## Struktur Folder

```
app/                  Halaman per peran: (customer), restaurant, institution, admin, (auth); route API di app/api
components/           Komponen UI per peran
lib/                  Logika bisnis murni (kualitas, grade, rekomendasi, refund, stok) + skema DB
server/               Kode khusus server: checkout, Duitku, scope akses, layanan per domain
services/             Klien layanan dan data contoh
tests/                Tes unit dan integrasi (Vitest)
docs/                 Dokumentasi proyek
```

## Dokumentasi

- [Model SDLC](docs/SDLC.md)
- [Desain sistem: arsitektur & UML](docs/DESAIN-SISTEM.md)
- [Analisis risiko & keamanan](docs/RISIKO-KEAMANAN.md)
- [Laporan pengujian](docs/LAPORAN-TES.md)

## Alur Kontribusi Tim

1. Ambil tugas dari board proyek, buat branch `nama/fitur` dari `main`.
2. Commit kecil dengan pesan jelas (`feat:`, `fix:`, `test:`, `docs:`).
3. Jalankan `pnpm test` sebelum push.
4. Buka pull request, minta review minimal 1 anggota lain, lalu merge.
