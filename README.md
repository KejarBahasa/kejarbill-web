# KejarBill Frontend

KejarBill adalah aplikasi web untuk mencatat pengeluaran bersama, membagi tagihan, dan melacak utang-piutang antar peserta grup. Frontend ini menyediakan pengalaman untuk membuat grup, mencatat expense, melihat tagihan, mencatat settlement, serta mengelola metode pembayaran.

Frontend berjalan sebagai aplikasi client-side dan berkomunikasi dengan backend KejarBill melalui REST API.

## Fitur Utama

- Registrasi, login, refresh session, dan logout.
- Dashboard grup dengan total pengeluaran, utang, piutang, dan aktivitas terbaru.
- Expense dengan tiga model pembagian:
  - Bagi rata dengan pembagian remainder rupiah yang deterministic.
  - Custom split dengan nominal per peserta.
  - Itemized split dengan banyak peserta per item.
- Preview pembagian dan agregasi beban setiap peserta.
- Detail tagihan per penerima dengan status belum bayar, sebagian, atau lunas.
- Settlement untuk mencatat pelunasan utang secara penuh.
- Modal settlement dengan pilihan channel dan metode pembayaran penerima.
- Reveal nomor rekening melalui endpoint backend yang terotorisasi, lalu copy ke clipboard.
- Manajemen anggota, role owner/admin/member, dan guest participant.
- Pengelolaan payment method pribadi: tambah, edit, default, hide, dan unhide.
- Optimistic UI sederhana dengan loading state, toast, dan error message berbahasa Indonesia.

## Teknologi

- SvelteKit dalam mode SPA.
- Svelte 5 dengan runes dan TypeScript.
- Vite sebagai development server dan production bundler.
- CSS vanilla dengan design token di `src/app.css`.
- `@sveltejs/adapter-static` untuk menghasilkan aplikasi static SPA.

## Arsitektur Frontend

```text
Browser
  |
  v
SvelteKit SPA
  |- routes/       halaman dan routing
  |- lib/api/      client REST per domain
  |- lib/types/    tipe request dan response
  |- lib/stores/   auth dan toast state
  |- lib/utils/    format tanggal, rupiah, dan error
  `- components/  komponen UI bersama
  |
  v
KejarBill API
http://localhost:8080/v1
```

### Struktur Domain

- `src/routes/(auth)` berisi login dan register.
- `src/routes/(app)` berisi halaman terproteksi setelah login.
- `src/routes/(app)/groups/[id]` berisi dashboard grup, expense, settlement, detail tagihan, dan anggota.
- `src/routes/(app)/payments` berisi metode pembayaran pribadi.
- `src/lib/api` berisi pemanggil API untuk auth, groups, expenses, settlements, dan payment methods.
- `src/lib/types` berisi kontrak data yang digunakan oleh UI.
- `src/lib/components` berisi komponen visual kecil seperti brand dan icon.

## Integrasi Backend

Base URL backend dikonfigurasi lewat environment variable:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Request terproteksi menggunakan access token Bearer. Refresh token web dikelola melalui cookie httpOnly backend. API client frontend juga menangani response envelope, refresh token ketika menerima `401`, retry request satu kali, serta normalisasi error.

Contoh konfigurasi lokal:

```text
Frontend : http://localhost:9000
Backend  : http://localhost:8080
API      : http://localhost:8080/v1
```

Expense dan settlement menggunakan timestamp dengan konteks Asia/Jakarta di UI. Frontend mengirim timestamp dengan offset `+07:00`, sementara backend dapat menormalisasinya ke UTC untuk penyimpanan.

## Menjalankan Project

Persyaratan:

- Node.js `20.19+` atau `22.12+`.
- Backend KejarBill berjalan dan dapat diakses oleh frontend.

Install dependency:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:9000`.

Type-check:

```bash
npm run check
```

Build production:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

## Konfigurasi Environment

| Variable | Default | Keterangan |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | URL dasar backend KejarBill |

Contoh file `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Catatan Keamanan

- Access token digunakan hanya untuk request API terproteksi.
- Refresh token web disimpan sebagai cookie httpOnly oleh backend.
- Nomor rekening normal ditampilkan dalam bentuk masked.
- Nomor rekening lengkap hanya diambil melalui endpoint reveal yang melakukan authorization di backend.
- Plaintext nomor rekening hanya digunakan sementara untuk ditampilkan atau disalin ke clipboard.
- Data sensitif tidak disimpan di URL, localStorage, atau sessionStorage.

## Status Project

Frontend utama sudah mencakup alur autentikasi, grup, expense, detail tagihan, settlement, anggota, guest, payment method, dan edit expense dengan optimistic version check. Backend tetap menjadi sumber kebenaran untuk authorization, validasi bisnis, ledger, settlement, dan konflik data.
