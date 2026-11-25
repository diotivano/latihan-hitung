# Latihan Hitung Dasar

Aplikasi latihan hitung dasar (tambah, kurang, kali, bagi) untuk membangun fondasi berhitung cepat sebelum masuk soal TIU SKD CPNS. Berbasis situs statis tanpa build, dirancang **mobile-first** dengan dukungan PWA offline. Semua path bersifat relatif (`./`) sehingga langsung berjalan di GitHub Pages (subpath `/<repo>/` maupun domain utama) dan Netlify.

## Struktur File
- `index.html` — struktur halaman & markup aksesibilitas
- `style.css` — gaya tampilan mobile-first (terang & gelap otomatis)
- `app.js` — logika latihan, trik hitung cepat, progres lokal, dan registrasi PWA
- `sw.js` — Service Worker untuk mode offline
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — metadata & ikon PWA
- `.nojekyll` — agar GitHub Pages menyajikan file statis langsung tanpa Jekyll
- `netlify.toml` — konfigurasi header jika di-deploy ke Netlify

## Deploy ke GitHub Pages (Direkomendasikan)
1. Unggah seluruh file di folder ini ke repositori GitHub Anda (branch `main`).
2. Buka **Settings → Pages** di repositori GitHub.
3. Pada **Build and deployment**, pilih:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` dan folder `/ (root)`, lalu klik **Save**.
4. Tunggu 1–2 menit, aplikasi akan aktif di `https://<username>.github.io/<nama-repo>/`.

## Deploy ke Netlify (Alternatif)
- Cara tercepat: buka https://app.netlify.com/drop lalu seret folder ini.
- Atau hubungkan lewat Git dengan **Build command**: kosong, **Publish directory**: `.`.

## Mengubah isi
Setiap kali mengubah `index.html`, `style.css`, atau `app.js`, naikkan nilai `VERSION` di `sw.js` (misalnya `"v7"`) agar perangkat yang sudah pernah membuka aplikasi segera mengambil versi terbaru.
