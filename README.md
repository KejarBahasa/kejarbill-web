# KejarBill Frontend

Frontend web **Kejar Bill** berbasis **SvelteKit (SPA)** — aplikasi untuk membagi tagihan / utang piutang bareng teman.

Proyek ini berdiri sendiri dari backend (`kejarbill-api`). Seluruh kontrak API backend didokumentasikan di README ini supaya frontend bisa dikembangkan tanpa melihat kode backend.

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Cara Menjalankan](#cara-menjalankan)
- [Konfigurasi](#konfigurasi)
- [Struktur Proyek](#struktur-proyek)

---

## Tech Stack

| Bagian | Teknologi |
| ------ | --------- |
| Framework | [SvelteKit](https://kit.svelte.dev) (`@sveltejs/kit`) dalam mode **SPA** (`ssr=false`, `prerender=false`) |
| Rendering | Client-side rendering, `@sveltejs/adapter-static` (fallback `index.html`) |
| Bahasa | TypeScript + Svelte 5 (runes) |
| Styling | CSS murni dengan design token di `src/app.css` (tanpa framework UI) |
| Routing | File-based routing bawaan SvelteKit |
| Node | `^20.19.0` atau `>=22.12.0` |

---

## Cara Menjalankan

```bash
# install dependency
npm install

# develop (port 9000 — sesuai allowlist CORS backend)
npm run dev

# build production (output ke build/)
npm run build

# preview hasil build
npm run preview

# type-check
npm run check
```

Buka `http://localhost:9000` — halaman `/` otomatis diarahkan ke `/login`.

Backend harus berjalan agar login berfungsi. Secara default frontend memanggil API di `http://localhost:8080`.

---

## Konfigurasi

Lingkungan dikonfigurasi lewat file `.env` (jangan commit `*.env.local`):

| Variabel | Default | Keterangan |
| -------- | ------- | ---------- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL backend KejarBill |

---

## Struktur Proyek

```
frontend/
├── src/
│   ├── app.html                  # shell HTML SPA
│   ├── app.css                   # design system & komponen primitif (.btn, .input, dll)
│   ├── routes/
│   │   ├── +layout.ts            # mode SPA (ssr=false, prerender=false)
│   │   ├── +layout.svelte        # layout root (import global css)
│   │   ├── +page.ts              # redirect cerdas: /dashboard jika login, /login jika tidak
│   │   ├── (auth)/               # halaman publik tanpa navbar
│   │   │   ├── +layout.svelte
│   │   │   ├── login/+page.svelte
│   │   │   └── register/+page.svelte
│   │   └── (app)/                # halaman ter-proteksi (guard auth + sidebar)
│   │       ├── +layout.svelte    # navbar/sidebar + redirect ke /login jika belum login
│   │       ├── dashboard/+page.svelte
│   │       ├── profile/+page.svelte
│   │       ├── payments/
│   │       │   ├── +page.svelte      # daftar metode pembayaran (+ hide/unhide, default)
│   │       │   └── new/+page.svelte  # buat metode pembayaran
│   │       └── groups/
│   │           ├── +page.svelte      # daftar grup
│   │           ├── new/+page.svelte  # buat grup
│   │           └── [id]/
│   │               ├── +layout.svelte    # header + tab (Ringkasan/Expense/Settlement/Anggota)
│   │               ├── +page.svelte      # ringkasan: balances + activities
│   │           ├── expenses/+page.svelte
│   │               │   ├── new/+page.svelte  # equal | custom | itemized
│   │               │   └── [expenseId]/+page.svelte  # detail + hapus
│   │               ├── settlements/+page.svelte
│   │               │   └── [settlementId]/+page.svelte  # detail
│   │               └── members/+page.svelte
│   └── lib/
│       ├── types/                # DTO & tipe data per domain (sesuai README API)
│       │   ├── index.ts          # envelope ApiResponse, ApiError, pagination
│       │   ├── auth.ts
│       │   ├── user.ts
│       │   ├── group.ts
│       │   ├── expense.ts
│       │   ├── settlement.ts
│       │   └── paymentMethod.ts
│       ├── api/                  # pemanggil endpoint, satu file per domain
│       │   ├── client.ts         # fetch wrapper: envelope, ApiError, credentials, Bearer auth
│       │   ├── auth.ts
│       │   ├── users.ts
│       │   ├── groups.ts
│       │   ├── expenses.ts
│       │   ├── settlements.ts
│       │   └── paymentMethods.ts
│       ├── stores/
│       │   └── auth.svelte.ts    # auth store (runes) + localStorage
│       └── components/
│           ├── Brand.svelte      # logo + nama brand
│           ├── Icon.svelte       # wrapper SVG icon
│           └── Icon.paths.ts     # kumpulan path icon
├── static/favicon.svg
├── .env                          # VITE_API_BASE_URL
├── svelte.config.js
└── vite.config.ts                # port dev = 9000 (strictPort)
```
