# Model SDLC: Agile (Scrum ringan, iteratif)

## Alasan Memilih

| Model | Cocok untuk FoodCycle? | Alasan |
|---|---|---|
| Waterfall | Tidak | Kebutuhan berubah setelah wawancara dan uji coba. Contohnya refund awalnya cukup alasan teks, lalu diminta wajib foto bukti. Waterfall sulit menerima perubahan di tengah jalan. |
| V-Model | Kurang | Kuat di pengujian, tetapi tetap berurutan seperti Waterfall. |
| Spiral | Kurang | Berfokus pada analisis risiko besar dan cocok untuk proyek besar. Terlalu berat untuk tim mahasiswa. |
| **Agile / Scrum** | **Ya** | Fitur dikirim per sprint, umpan balik pengguna langsung masuk sprint berikutnya, dan cocok dengan alur branch + pull request di GitHub. |

## Penerapan per Fase

| Fase | Kegiatan di FoodCycle | Artefak / bukti |
|---|---|---|
| Requirement | Wawancara customer, restoran, lembaga, admin; susun user story per peran | Daftar pertanyaan wawancara, product backlog |
| Design | Arsitektur, use case, activity, sequence, ERD | `docs/DESAIN-SISTEM.md` |
| Development | Implementasi per sprint di feature branch | Riwayat commit & PR di GitHub |
| Testing | Tes unit/integrasi otomatis, tes sistem manual, UAT | `tests/`, `docs/LAPORAN-TES.md` |
| Deployment | Deploy otomatis ke Vercel setiap merge ke `main`; preview per PR | Riwayat deployment Vercel |
| Maintenance | Perbaikan bug dan iterasi fitur dari umpan balik | Issue & PR lanjutan |

## Contoh Sprint (isi sesuai jadwal tim)

| Sprint | Tujuan | Hasil |
|---|---|---|
| 1 | Fondasi: auth, peran, katalog makanan | Login/registrasi, listing restoran |
| 2 | Transaksi: keranjang, checkout, stok, Duitku | Pembayaran dan penahanan stok 10 menit |
| 3 | Donasi & lembaga, kualitas dan grade makanan | Alur donasi, skor kualitas |
| 4 | Refund (alasan teks), panel admin | Pengajuan dan peninjauan refund |
| 5 | Iterasi refund: wajib foto bukti; tes otomatis; dokumentasi | Upload foto private, 30 tes Vitest |

Setiap sprint ditutup dengan review (demo ke anggota/dosen) dan retrospektif singkat: apa yang berhasil, apa yang perlu diubah.

## Peran Scrum (isi nama anggota)

| Peran | Anggota | Tanggung jawab |
|---|---|---|
| Product Owner | ... | Prioritas backlog, menerima hasil sprint |
| Scrum Master | ... | Menjaga jadwal, memimpin daily/retro |
| Developer | ... | Implementasi, tes, review PR |
