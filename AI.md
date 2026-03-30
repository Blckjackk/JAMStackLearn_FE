# AI Playbook - Astro App

Dokumen ini adalah patokan saat memakai AI agar project Astro tetap terstruktur, konsisten, dan rapi.

## 1. Tujuan

- Menjaga struktur folder tetap jelas.
- Mencegah perubahan liar di banyak file yang tidak perlu.
- Menyamakan gaya coding, naming, dan pola implementasi.
- Memastikan setiap perubahan punya validasi (lint, typecheck, build ringan).

## 2. Konteks Project

- Framework: Astro + React + TypeScript.
- Styling: Tailwind + komponen UI di `src/components/ui`.
- Service API: `src/services`.
- Type definitions: `src/types`.
- Halaman Astro: `src/pages`.
- Shared layout: `src/layouts`.

## 3. Struktur Folder Patokan

Gunakan struktur ini saat menambah fitur baru:

- `src/pages` untuk routing halaman.
- `src/components` untuk komponen presentasi dan dashboard.
- `src/components/ui` hanya untuk komponen UI reusable (button, input, dialog, dll).
- `src/services` untuk komunikasi API (fetch, axios, wrapper endpoint).
- `src/types` untuk semua interface/type DTO.
- `src/hooks` untuk custom hooks reusable.
- `src/lib` untuk utilitas umum.
- `src/styles` untuk global style dan token.

Aturan penting:

- Jangan campur logic API di komponen jika sudah ada service.
- Jangan define type inline besar di komponen; pindahkan ke `src/types`.
- Satu file komponen idealnya punya satu tanggung jawab utama.

## 4. Konvensi Wajib

- Gunakan TypeScript strict-friendly (hindari `any` kecuali terpaksa).
- Gunakan nama yang deskriptif:
  - Komponen: PascalCase.
  - Hook: camelCase dengan prefix `use`.
  - Service function: camelCase berbasis aksi (`getProjects`, `createTask`).
- Semua endpoint API disentralisasi di folder `src/services`.
- Reuse type yang sudah ada sebelum membuat type baru.
- Hindari duplikasi UI; cek dulu `src/components/ui`.

## 5. Alur Kerja AI (Wajib Diikuti)

Saat AI diminta mengerjakan task:

1. Analisis request dan sebut file yang akan diubah.
2. Buat rencana singkat langkah implementasi.
3. Implementasi dengan perubahan minimum yang diperlukan.
4. Jalankan validasi: `npm run lint` dan `npm run typecheck` (minimal salah satu jika waktu terbatas).
5. Beri ringkasan hasil + file yang diubah + alasan teknis.

## 6. Prompt Master (Copy-Paste)

Gunakan prompt ini setiap kali mau minta AI coding:

```text
Kamu adalah AI engineer untuk project Astro saya.
Ikuti semua aturan di file AI.md ini.

Task: <isi task>

Batasan:
- Fokus hanya pada file yang relevan.
- Jangan ubah struktur besar tanpa alasan kuat.
- Pakai service layer untuk API call.
- Pakai type yang reusable dari src/types.
- Hasil akhir harus rapi, konsisten, dan mudah di-maintain.

Output yang saya mau:
1) Rencana singkat
2) Daftar file yang diubah
3) Perubahan kode
4) Cara verifikasi
5) Risiko/regresi jika ada
```

## 7. Prompt Siap Pakai

### A. Tambah fitur baru

```text
Tambahkan fitur <nama fitur> sesuai aturan AI.md.
Gunakan arsitektur yang sudah ada (services, types, components).
Jangan refactor file di luar scope fitur.
```

### B. Rapikan kode yang sudah ada

```text
Rapikan module <nama module> sesuai AI.md.
Fokus pada: pemisahan service, perapihan type, dan simplifikasi komponen.
Jaga behavior lama tetap sama.
```

### C. Audit struktur project

```text
Audit struktur Astro project ini terhadap aturan AI.md.
Sebutkan pelanggaran prioritas tinggi dulu, lalu berikan TODO yang actionable.
```

## 8. Checklist Done

Sebuah task dianggap selesai jika:

- Scope perubahan jelas dan terbatas.
- Tidak ada duplikasi logic yang tidak perlu.
- Type aman dan konsisten.
- UI dan data flow tetap stabil.
- Validasi dasar sudah dijalankan.

## 9. Larangan

- Jangan menambah dependency baru tanpa alasan.
- Jangan ubah naming pattern yang sudah konsisten.
- Jangan memindahkan banyak file sekaligus tanpa kebutuhan jelas.
- Jangan melakukan optimasi prematur yang menurunkan keterbacaan.

---

Jika bingung saat implementasi, pilih solusi yang paling sederhana, paling mudah dirawat, dan paling sedikit risiko regresi.
