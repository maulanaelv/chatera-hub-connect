# Export Database (Semua Tabel) — ZIP berisi CSV

## Tujuan
Menu baru "Export Data" di sidebar yang memungkinkan Owner & Admin mengunduh seluruh isi database sebagai satu file ZIP berisi file CSV per tabel.

## Yang dibangun

1. **Menu sidebar baru: Export Data**
   - Tambah item "Export Data" (ikon download) di `src/components/app-shell.tsx` — otomatis muncul di sidebar desktop dan drawer mobile (keduanya memakai daftar navigasi yang sama), sehingga drawer mobile juga menampilkan 6 menu.
   - Route baru `src/routes/_authenticated/export.tsx` — otomatis terlindungi gate login yang ada.

2. **Halaman Export Data**
   - Penjelasan singkat + daftar tabel yang akan diexport: `contacts`, `conversations`, `messages`, `chatera_messages`, `knowledge_base`, `knowledge_documents`, `webhook_deliveries`, `users`.
   - Tombol "Unduh Semua Data (ZIP)" dengan status loading; toast sukses/gagal (sonner sudah terpasang).
   - Head metadata sendiri (title/description/og) mengikuti pola halaman lain.

3. **Server function `exportDatabase` (src/lib/export.functions.ts)**
   - `.middleware([requireSupabaseAuth])` — hanya user login (Owner & Admin keduanya lolos, sesuai permintaan); verifikasi role via `has_role` untuk memastikan caller terdaftar di `public.users`.
   - Membaca semua tabel via `context.supabase` (RLS sebagai user).
   - Mengubah tiap tabel menjadi CSV (escape koma/kutip/newline, header kolom, nilai JSON/objek di-stringify).
   - Menggabungkan menjadi ZIP memakai `fflate` (pure-JS, aman di server runtime; di-install via `bun add fflate`).
   - Mengembalikan `{ filename, base64 }`; client mengubahnya menjadi Blob dan memicu download. Nama file menyertakan tanggal, mis. `purworejo-export-2026-09-09.zip`.

4. **Verifikasi**
   - Cek build log + `bunx tsgo --noEmit`.
   - Uji Playwright: login sebagai Owner, buka /export, klik unduh, pastikan ZIP ter-download dan menu muncul di sidebar desktop & drawer mobile.

## Catatan teknis
- Tidak ada perubahan skema database; hanya baca data.
- `webhook_deliveries` dibaca via `supabaseAdmin` (di-import dinamis di dalam handler) karena tabel itu sengaja tidak punya policy baca untuk authenticated; tabel lain via `context.supabase`.
- Tanpa migrasi, tanpa secret baru.
