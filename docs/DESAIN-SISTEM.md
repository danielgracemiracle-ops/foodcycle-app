# Desain Sistem FoodCycle

Diagram ditulis dalam Mermaid sehingga tampil langsung di GitHub. Untuk laporan, buka di [mermaid.live](https://mermaid.live) lalu ekspor ke PNG.

## 1. Arsitektur

```mermaid
flowchart LR
  U[Browser<br/>Customer / Restoran / Lembaga / Admin] --> N

  subgraph V[Vercel]
    N[Next.js 16 App Router<br/>Halaman per peran]
    SA[Server Actions<br/>app/actions/service.ts]
    API[Route Handlers<br/>/api/auth, /api/refund-photos,<br/>/api/legal-docs, /api/payments/duitku/callback]
    SC[server/scope.ts<br/>pembatasan data per peran]
    N --> SA --> SC
    N --> API
  end

  SC --> DB[(Neon Postgres<br/>Drizzle ORM)]
  API --> AUTH[Better Auth]
  AUTH --> DB
  API --> BLOB[(Vercel Blob private<br/>foto refund, dokumen legal)]
  SA --> DUITKU[Duitku<br/>Payment Gateway]
  DUITKU -- callback --> API
```

## 2. Use Case

```mermaid
flowchart LR
  C((Customer))
  R((Restoran))
  L((Lembaga))
  A((Admin))

  subgraph FoodCycle
    UC1[Registrasi & login]
    UC2[Jelajah & rekomendasi makanan]
    UC3[Checkout & bayar]
    UC4[Lacak pesanan]
    UC5[Donasi ke lembaga]
    UC6[Ajukan refund + foto bukti]
    UC7[Beri ulasan]
    UC8[Kelola listing & stok]
    UC9[Proses pesanan]
    UC10[Terima & konfirmasi donasi]
    UC11[Verifikasi mitra & lembaga]
    UC12[Tinjau refund]
    UC13[Lihat laporan]
  end

  C --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7
  R --- UC1 & UC8 & UC9
  L --- UC1 & UC10
  A --- UC11 & UC12 & UC13
```

## 3. Activity Diagram: Checkout & Pembayaran

```mermaid
flowchart TD
  S([Mulai]) --> A1[Customer menambah makanan ke keranjang]
  A1 --> A2[Checkout: pilih untuk diri sendiri atau donasi]
  A2 --> D1{Stok cukup?}
  D1 -- Tidak --> E1[Tampilkan sisa stok, minta kurangi jumlah] --> A1
  D1 -- Ya --> A3[Stok ditahan 10 menit]
  A3 --> A4[Arahkan ke halaman pembayaran Duitku]
  A4 --> D2{Dibayar sebelum 10 menit?}
  D2 -- Tidak --> E2[Penahanan kedaluwarsa, stok dikembalikan] --> X([Selesai])
  D2 -- Ya --> A5[Callback Duitku diverifikasi signature-nya]
  A5 --> A6[Pesanan: Payment Confirmed]
  A6 --> A7[Restoran konfirmasi, siapkan, siap diambil]
  A7 --> A8[Picked Up, lalu Completed]
  A8 --> X
```

## 4. Activity Diagram: Refund

```mermaid
flowchart TD
  S([Pesanan Completed]) --> D1{Masih dalam 48 jam?}
  D1 -- Tidak --> X1[Tombol refund tidak tersedia] --> E([Selesai])
  D1 -- Ya --> A1[Customer menulis alasan 10-500 karakter]
  A1 --> A2[Upload 1-3 foto bukti JPG/PNG/WebP maks 4 MB]
  A2 --> A3[Server cek pemilik pesanan, status, batas waktu, token foto]
  A3 --> A4[Refund: Pending]
  A4 --> D2{Admin meninjau}
  D2 -- Setuju --> A5[Approved, admin transfer manual] --> E
  D2 -- Tolak --> A6[Rejected + alasan] --> E
```

## 5. Sequence Diagram: Upload Foto Bukti Refund

```mermaid
sequenceDiagram
  actor C as Customer
  participant UI as Refund Dialog
  participant R as /api/refund-photos
  participant B as Vercel Blob (private)
  participant S as requestRefund (Server Action)

  C->>UI: Pilih foto
  UI->>R: POST foto (cookie session)
  R->>R: Cek login, origin, tipe & ukuran file
  R->>B: Simpan di path milik customer
  R-->>UI: pathname + token bertanda tangan
  C->>UI: Kirim pengajuan
  UI->>S: orderId, alasan, foto + token
  S->>S: Verifikasi token milik customer ini, cek pesanan & 48 jam
  S-->>UI: Refund Pending
```

## 6. Sequence Diagram: Pembayaran Duitku

```mermaid
sequenceDiagram
  actor C as Customer
  participant App as Next.js (checkout-core)
  participant DB as Neon Postgres
  participant D as Duitku

  C->>App: Checkout
  App->>DB: holdStock (transaksi, idempotency key)
  App->>D: Buat transaksi (merchant code + signature)
  D-->>App: URL pembayaran
  App-->>C: Redirect ke Duitku
  C->>D: Bayar
  D->>App: Callback /api/payments/duitku/callback
  App->>App: Verifikasi signature
  App->>DB: Tandai checkout paid
  App-->>C: Halaman sukses
```

## 7. Class Diagram (Model Data Utama)

```mermaid
classDiagram
  class User { id; name; email; role }
  class Restaurant { id; ownerId; name; city; rating; verification }
  class Institution { id; ownerId; name; verification }
  class Food { id; restaurantId; name; category; price; originalPrice; quantity; pickupStart; pickupEnd; quality; status }
  class Order { id; customerId; restaurantId; type; status; total; history }
  class OrderItem { foodId; quantity; price; grade }
  class Donation { id; orderId; institutionId; status }
  class Refund { id; orderId; customerId; reason; photos; status }
  class Review { orderId; foodQuality; packaging; experience }
  class FoodStock { foodId; quantity }
  class Checkout { idempotencyKey; holderId; status; expiresAt }
  class StockHold { checkoutKey; foodId; quantity }

  User "1" -- "0..1" Restaurant : memiliki
  User "1" -- "0..1" Institution : memiliki
  Restaurant "1" -- "*" Food
  User "1" -- "*" Order : customer
  Order "1" -- "*" OrderItem
  OrderItem "*" -- "1" Food
  Order "1" -- "0..1" Donation
  Institution "1" -- "*" Donation
  Order "1" -- "0..1" Refund
  Order "1" -- "0..1" Review
  Food "1" -- "1" FoodStock
  Checkout "1" -- "*" StockHold
```

Tabel Postgres saat ini (`lib/db/schema.ts`): `food_stock`, `checkouts`, `stock_holds`, serta tabel Better Auth. Entitas lain masih dilayani oleh lapisan layanan dengan data contoh (`services/mock-db.ts`). Memindahkannya ke Postgres tercatat sebagai risiko R07.
