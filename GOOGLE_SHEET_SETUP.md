# Panduan Setup Google Sheets & Apps Script - MEREACH

Ikuti langkah-langkah di bawah ini untuk menghubungkan form di website MEREACH dengan Google Sheets dan sistem email otomatis.

## 1. Persiapan Google Sheets
1. Buat Google Sheets baru di [sheets.google.com](https://sheets.google.com).
2. Beri nama Spreadsheet Anda (contoh: `Database MEREACH`).
3. Buat **tiga** buah sheet (tab di bagian bawah) dengan nama persis seperti berikut:
   - `Partner MEREACH`
   - `Teman MEREACH`
   - `Team MEREACH`

### Header untuk Sheet "Partner MEREACH"
Copy dan paste teks di bawah ini ke baris pertama (Row 1):
`Timestamp`, `Nama Lengkap`, `Nama Panggilan`, `Email`, `Usia`, `WhatsApp`, `Instagram`, `TikTok`, `Domisili`, `Pekerjaan`, `Pendidikan`, `Kendaraan`, `Waktu Produktif`, `Waktu Produktif Lain`, `Sumber Info`, `Nama Teman`, `Status`

### Header untuk Sheet "Teman MEREACH"
Copy dan paste teks di bawah ini ke baris pertama (Row 1):
`Timestamp`, `Nama Lengkap`, `Email`, `WhatsApp`, `Status`

### Header untuk Sheet "Team MEREACH"
Copy dan paste teks di bawah ini ke baris pertama (Row 1):
`Nama`, `Email`, `Password`

Kemudian isi data tim MEREACH yang diizinkan login ke Dashboard.

---

## 2. Setup Google Apps Script
1. Di dalam Google Sheets Anda, klik menu **Extensions** > **Apps Script**.
2. Hapus semua kode yang ada di editor, lalu copy dan paste isi dari file `code.gs` yang sudah saya buatkan.
3. **Penting**: Cari baris `SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE'` di dalam kode.
   - Ganti `YOUR_SPREADSHEET_ID_HERE` dengan ID Spreadsheet Anda. 
   - *ID Spreadsheet bisa ditemukan di URL browser Anda: `https://docs.google.com/spreadsheets/d/ID_DISINI/edit`.*

---

## 3. Deployment (Deploy sebagai Web App)
1. Klik tombol **Deploy** di pojok kanan atas > **New Deployment**.
2. Pilih jenis (Select type): **Web App**.
3. Isi deskripsi (bebas, misal: `Initial Version`).
4. Pada bagian **Execute as**, pilih: **Me** (Email Anda).
5. Pada bagian **Who has access**, pilih: **Anyone** (Ini penting agar website bisa mengirim data tanpa login).
6. Klik **Deploy**.
7. Anda akan diminta memberikan izin (Authorize Access). Klik **Allow**.
8. **Copy Web App URL** yang muncul. URL ini akan terlihat seperti: `https://script.google.com/macros/s/XXXXX/exec`.

> **⚠️ PENTING**: Setiap kali Anda mengubah `code.gs`, buat **New Deployment** lagi agar perubahan aktif.

---

## 4. Update di Website
Setelah mendapatkan **Web App URL**, buka file `index.js` dan `dashboard.js` di folder website Anda.
Cari bagian `const SCRIPT_URL = '...';` dan tempelkan URL tersebut.

---

## Fitur yang Aktif:
- **Auto-Save**: Data masuk ke Sheet yang sesuai berdasarkan tipe pendaftar.
- **Auto-Email (Partner)**: Pendaftar Partner akan langsung menerima email konfirmasi cantik (HTML) dengan nama panggilan mereka.
- **Admin Notification**: Email `lifeatmereach@gmail.com` akan menerima notifikasi setiap ada pendaftar baru (baik Partner maupun Teman).
- **Privacy Guaranteed**: Sistem hanya mencatat data yang diinput user.
- **Dashboard**: Tim MEREACH bisa login dan memantau semua pendaftar, analisis grafik, follow-up via WhatsApp, dan kirim email penerimaan.

---
**Catatan**: Pastikan email `lifeatmereach@gmail.com` sudah disiapkan untuk menerima notifikasi.

