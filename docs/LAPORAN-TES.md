# Laporan Pengujian FoodCycle

Tanggal: 19 November 2026 · Tool: Vitest 5 · Perintah: `pnpm test`

## Ringkasan

| Level | Jumlah kasus | Lulus | Gagal | Cara |
|---|---|---|---|---|
| Unit | 25 | 25 | 0 | Otomatis (Vitest) |
| Integrasi (validasi API) | 5 | 5 | 0 | Otomatis (Vitest) |
| Sistem | 8 | isi | isi | Manual di browser |
| Acceptance (UAT) | 4 peran | isi | isi | Calon pengguna |

Hasil otomatis: **6 file, 30 tes, semua lulus** (durasi sekitar 0,7 detik).

## 1. Unit Test (otomatis)

| ID | Modul | Skenario | Hasil yang diharapkan | Status |
|---|---|---|---|---|
| UT-R01 | refund | Pesanan belum selesai | Tidak ada batas refund | Lulus |
| UT-R02 | refund | Pesanan dibatalkan | Tidak bisa refund | Lulus |
| UT-R03 | refund | Waktu diterima | Ambil event Picked Up/Completed terakhir | Lulus |
| UT-R04 | refund | Batas refund | Tepat 48 jam setelah diterima | Lulus |
| UT-R05 | refund | URL foto | Lewat proxy private dan ter-encode | Lulus |
| UT-Q01 | quality | Skor berbobot | 40/20/20/20 menghasilkan 70 | Lulus |
| UT-Q02 | quality | Nilai di luar 0-100 | Dibatasi (clamp) | Lulus |
| UT-Q03 | quality | Rating ke skor | 5 bintang = 100 | Lulus |
| UT-Q04 | quality | Rata-rata ulasan | Fallback jika kosong, rata-rata jika ada | Lulus |
| UT-Q05 | quality | Label | Batas 90/75/60 | Lulus |
| UT-Q06 | quality | Grade dari sisa waktu | A (≥3 jam), B (≥1,5 jam), C | Lulus |
| UT-Q07 | quality | Kondisi buruk | Selalu grade C | Lulus |
| UT-Q08 | quality | Persen diskon | 50%, 0 untuk harga tidak valid | Lulus |
| UT-M01 | recommendation | Bisa dibeli | Hanya aktif, ada stok, belum lewat | Lulus |
| UT-M02 | recommendation | Restoran belum terverifikasi | Tidak direkomendasikan | Lulus |
| UT-M03 | recommendation | Kategori favorit | Peringkat teratas + alasan | Lulus |
| UT-M04 | recommendation | Limit | Maks N item, maks 2 alasan | Lulus |
| UT-F01 | food-input | Listing lengkap | Tidak ada error | Lulus |
| UT-F02 | food-input | Harga diskon ≥ harga asli | Error | Lulus |
| UT-F03 | food-input | Jadwal pickup tidak valid | Error | Lulus |
| UT-F04 | food-input | Field wajib kosong | Semua dilaporkan | Lulus |
| UT-X01 | format | Rupiah | `Rp15.000` | Lulus |
| UT-X02 | format | Hitung mundur pickup | Label benar | Lulus |
| UT-X03 | format | Waktu relatif | Label benar | Lulus |
| UT-X04 | format | Inisial nama | `DG` | Lulus |

## 2. Integration Test (otomatis)

| ID | Skenario | Hasil yang diharapkan | Status |
|---|---|---|---|
| IT-S01 | ID berisi payload SQL injection | Ditolak | Lulus |
| IT-S02 | Jumlah pecahan / di luar batas / string | Ditolak | Lulus |
| IT-S03 | Daftar item kosong atau lebih dari 50 | Ditolak | Lulus |
| IT-S04 | Body JSON rusak | Ditolak dengan error 400 | Lulus |
| IT-S05 | Error internal | Status 500, detail tidak bocor ke user | Lulus |

## 3. System Test (manual, isi saat demo)

| ID | Skenario | Langkah | Hasil yang diharapkan | Hasil aktual | Status | Bukti |
|---|---|---|---|---|---|---|
| ST-01 | Registrasi customer | Daftar, lalu login | Masuk ke /home | | | screenshot |
| ST-02 | Registrasi restoran | Daftar dengan dokumen legal | Status menunggu verifikasi | | | |
| ST-03 | Verifikasi admin | Admin menyetujui restoran | Restoran bisa membuat listing | | | |
| ST-04 | Checkout & bayar | Tambah ke keranjang, bayar sandbox Duitku | Status Payment Confirmed, stok berkurang | | | |
| ST-05 | Stok habis | Dua akun membeli porsi terakhir | Satu berhasil, satu ditolak | | | |
| ST-06 | Donasi | Customer donasi ke lembaga | Lembaga melihat dan mengonfirmasi | | | |
| ST-07 | Refund dengan foto | Pesanan Completed, ajukan refund + 1 foto | Status Pending, admin melihat foto | | | |
| ST-08 | Refund ditolak tanpa foto | Kirim tanpa foto | Tombol nonaktif / error | | | |

## 4. User Acceptance Test (isi bersama calon pengguna)

| Peran | Penguji | Tugas yang diuji | Berhasil? | Umpan balik |
|---|---|---|---|---|
| Customer | | Cari makanan, bayar, ajukan refund | | |
| Restoran | | Buat listing, proses pesanan | | |
| Lembaga | | Terima donasi | | |
| Admin | | Verifikasi mitra, tinjau refund | | |

Kriteria diterima: setiap peran menyelesaikan tugasnya tanpa bantuan, dan tidak ada bug kritis.
