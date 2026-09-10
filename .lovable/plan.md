# Menu Chatbot Bertingkat (Database)

Menu awal (menu utama) dan seluruh submenu chatbot WhatsApp dipindahkan dari kode ke database, lalu bisa dikelola langsung dari halaman **Menu Bot** dengan kedalaman tak terbatas dan panel simulasi percakapan.

## Yang dibangun

**1. Penyimpanan menu di database**
Satu tabel menu yang bisa bersarang: setiap menu punya induk (kosong = menu tingkat pertama), nomor pilihan, emoji, label, isi pesan, urutan, dan status aktif/nonaktif. Karena tiap menu menunjuk ke induknya, tingkatannya bebas: 3 → 3.10 → 3.10.1 → seterusnya.

Ada juga satu baris khusus untuk **menu awal** (sapaan pembuka yang dikirim saat warga mengetik "halo" atau "0").

**2. Isi awal dari naskah resmi**
Seluruh naskah Purworejo yang sekarang ada di kode (menu 1-7, submenu 1.1 sampai 4.x, 3.10.x, dan seterusnya) diimpor sebagai data awal, lengkap dengan hubungan induk-anak berdasarkan nomornya. Tidak ada isi yang hilang.

**3. Halaman Menu Bot baru**
- Daftar menu berbentuk pohon yang bisa dibuka/tutup per tingkat.
- Tambah menu tingkat pertama, dan tambah submenu di bawah menu mana pun.
- Edit: emoji, label, nomor pilihan, isi pesan, kategori knowledge base, aktif/nonaktif.
- Naik/turun urutan dalam satu tingkat, dan hapus menu (beserta submenunya, dengan konfirmasi).
- Editor menu awal (pesan sapaan) di bagian atas halaman.
- Jika isi pesan sebuah menu dikosongkan, chatbot otomatis menyusun daftar submenunya sendiri, jadi menu perantara tidak wajib ditulis manual.

**4. Panel simulasi**
Panel di samping/bawah daftar: ketik angka seperti warga (mis. `3`, lalu `3.10`, lalu `0`), dan balasan chatbot tampil persis seperti yang akan dikirim ke WhatsApp, termasuk penanda kembali ke induk dan ke menu utama.

**5. Chatbot memakai data database**
Logika balasan otomatis membaca menu dari database, bukan lagi dari file naskah. Jika database belum terisi atau gagal diakses, chatbot tetap memakai naskah bawaan sebagai cadangan sehingga layanan tidak mati.

## Hak akses

Owner dan Admin sama-sama boleh mengelola menu bot (sesuai pengaturan hak akses yang berlaku sekarang untuk Knowledge Base dan Menu Bot). Perubahan hanya bisa dilakukan lewat akun yang sudah login.

## Catatan teknis

- Tabel `public.bot_menus`: `id`, `parent_id` (FK ke dirinya sendiri, `on delete cascade`), `key` (segmen nomor, mis. `10`), `path` (kunci penuh, mis. `3.10`, unik), `emoji`, `label`, `body`, `category`, `sort_order`, `is_active`, `created_at`, `updated_at` + trigger `update_updated_at_column`. Baris menu awal disimpan dengan `path = 'utama'` dan `parent_id` null.
- GRANT untuk `authenticated` (CRUD) dan `service_role` (ALL); RLS aktif dengan kebijakan kelola penuh untuk pengguna terautentikasi, tanpa akses anon. Webhook membaca lewat `supabaseAdmin`.
- Seed lewat migration dari isi `src/lib/purworejo-content.ts` (path, label diambil dari baris judul, body apa adanya).
- Server function baru `src/lib/bot-menus.functions.ts` (`requireSupabaseAuth`): `listBotMenus`, `upsertBotMenu`, `deleteBotMenu`, `reorderBotMenu`.
- `src/lib/chatera-bot.server.ts`: `resolveAutoReply` menjadi async, membaca peta menu dari `bot_menus` via `supabaseAdmin` (cache singkat per invocation), auto-render daftar submenu bila `body` kosong, fallback ke `PURWOREJO_CONTENT` bila query gagal atau tabel kosong. `isMenuInput` ikut memakai peta yang sama. Pemanggil di `resolveReply` dan webhook disesuaikan.
- `src/routes/_authenticated/menu-bot.tsx` ditulis ulang memakai TanStack Query + komponen shadcn yang sudah ada (Dialog, Select, Textarea, Badge), menggantikan `DUMMY_BOT_MENUS`.
- Verifikasi: `bunx tsgo --noEmit`, build log, dan Playwright login Owner → `/menu-bot` (tambah submenu, simulasi ketik `3` → `3.10` → `0`).
