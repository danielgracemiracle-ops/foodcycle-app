# Analisis Risiko & Keamanan

## 1. Risk Register

Skala: Kemungkinan (K) dan Dampak (D) 1-5. Skor = K x D. Prioritas tinggi jika skor 12 atau lebih.

| ID | Risiko | K | D | Skor | Mitigasi | Status |
|---|---|---|---|---|---|---|
| R01 | Makanan tidak layak/basi sampai ke customer atau lembaga | 3 | 5 | 15 | Skor kualitas + grade A/B/C, batas waktu pickup, verifikasi izin pangan restoran, ulasan, refund dengan foto | Dimitigasi |
| R02 | Dua customer membeli porsi terakhir bersamaan (overselling) | 4 | 3 | 12 | Penahanan stok dalam transaksi DB, kunci baris berurutan, idempotency key, hold 10 menit | Dimitigasi |
| R03 | Refund palsu / penipuan | 3 | 3 | 9 | Hanya pemilik pesanan, status Completed, batas 48 jam, foto bukti wajib, tinjauan admin | Dimitigasi |
| R04 | Callback pembayaran dipalsukan | 2 | 5 | 10 | Verifikasi signature Duitku di server | Dimitigasi |
| R05 | Kebocoran data pribadi (NIK, NPWP, foto) | 2 | 5 | 10 | Blob private, akses lewat route yang memeriksa session & peran, scope data per peran | Dimitigasi |
| R06 | Restoran/lembaga fiktif | 3 | 4 | 12 | Registrasi dengan dokumen legal, verifikasi admin sebelum bisa berjualan | Dimitigasi |
| R07 | Sebagian data masih data contoh, belum seluruhnya di Postgres | 4 | 4 | 16 | Migrasi entitas order, refund, donasi ke Neon secara bertahap | **Terbuka** |
| R08 | Payment gateway down | 2 | 4 | 8 | Hold stok kedaluwarsa otomatis, customer bisa checkout ulang | Dimitigasi sebagian |
| R09 | Pencairan refund masih manual oleh admin | 3 | 2 | 6 | SOP admin, catatan status refund | Diterima |
| R10 | Kontribusi tim tidak merata / anggota keluar | 3 | 3 | 9 | Board tugas dengan penanggung jawab, PR review wajib | Terbuka |
| R11 | Jadwal molor | 3 | 3 | 9 | Sprint pendek, prioritas backlog | Terbuka |

## 2. Analisis Keamanan (acuan OWASP Top 10)

| Ancaman | Penanganan di kode |
|---|---|
| A01 Broken Access Control | `server/scope.ts` membatasi data per peran dan per pengguna. Refund dicek kepemilikan pesanannya. Route foto menolak tamu. |
| A02 Cryptographic Failures | Password di-hash oleh Better Auth. Token upload foto ditandatangani server. Koneksi DB memakai TLS (Neon). |
| A03 Injection | Query lewat Drizzle (parameterized). ID dan jumlah divalidasi ketat (`lib/stock-validation.ts`, diuji IT-S01). |
| A04 Insecure Design | Batas waktu refund, hold stok, verifikasi mitra dirancang sejak awal. |
| A05 Security Misconfiguration | Secret hanya di environment variable Vercel, tidak di repo. |
| A07 Identification & Auth Failures | Session cookie dikelola Better Auth, termasuk reset password. |
| A08 Data Integrity Failures | Signature callback Duitku diverifikasi. Idempotency key mencegah pembayaran ganda. |
| A09 Logging & Monitoring | Error tak terduga dicatat di server, pesan ke user tidak membocorkan detail (diuji IT-S05). |
| Upload file berbahaya | Hanya JPG/PNG/WebP, maks 4 MB, maks 3 foto, origin dicek. |

## 3. Rencana Perbaikan

1. Migrasi seluruh entitas ke Postgres (R07).
2. Tambah security header di `next.config.mjs` (`X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options`).
3. Rate limiting untuk login dan upload.
4. Tes end-to-end otomatis (Playwright) untuk alur checkout dan refund.
