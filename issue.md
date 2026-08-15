# Rencana Perbaikan Proyek: Kas Karang Taruna

Dokumen ini berisi daftar perbaikan (issues) yang perlu diselesaikan untuk mengoptimalkan proyek. Dokumen ini disusun secara mendetail agar dapat dieksekusi dengan mudah oleh *developer* atau *AI assistant*.

---

## Issue 1: Optimasi Performa - Client-Side Aggregation (KRITIKAL)

**Masalah:**
Di `src/app/page.tsx`, perhitungan total pemasukan, pengeluaran, dan saldo dilakukan dengan mengambil *seluruh* baris data transaksi ke client (browser) lalu dijumlahkan menggunakan Javascript. Ini akan sangat lambat ketika data bertambah banyak.

**Tugas (Tasks):**

1. **Buat Fungsi RPC (Remote Procedure Call) di Supabase (PostgreSQL)**
   Jalankan query SQL berikut di SQL Editor pada dashboard Supabase Anda untuk membuat fungsi perhitungan di sisi database:
   ```sql
   CREATE OR REPLACE FUNCTION get_statistik_kas()
   RETURNS json AS $$
   DECLARE
     total_pemasukan numeric;
     total_pengeluaran numeric;
     total_saldo numeric;
   BEGIN
     -- Hitung Pemasukan
     SELECT COALESCE(SUM(jumlah), 0) INTO total_pemasukan 
     FROM transaksi 
     WHERE jenis_transaksi = 'Pemasukan';
     
     -- Hitung Pengeluaran
     SELECT COALESCE(SUM(jumlah), 0) INTO total_pengeluaran 
     FROM transaksi 
     WHERE jenis_transaksi = 'Pengeluaran';
     
     -- Hitung Saldo
     total_saldo := total_pemasukan - total_pengeluaran;
     
     RETURN json_build_object(
       'pemasukan', total_pemasukan,
       'pengeluaran', total_pengeluaran,
       'saldo', total_saldo
     );
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Perbarui `src/app/page.tsx` untuk Memanggil RPC**
   Ubah fungsi `fetchDataDashboard` di dalam `src/app/page.tsx`. Ganti logika pengambilan data `.select('jenis_transaksi, jumlah')` dan perulangan `.forEach()` dengan panggilan `.rpc()`.

   *Sebelum:*
   ```typescript
   const { data: semuaData } = await supabase.from('transaksi').select('jenis_transaksi, jumlah');
   // ... (logika forEach untuk menghitung total)
   ```

   *Sesudah (Kode Baru):*
   ```typescript
   const { data: statData, error: statError } = await supabase.rpc('get_statistik_kas');
   
   if (statData && !statError) {
     setTotalMasuk(statData.pemasukan);
     setTotalKeluar(statData.pengeluaran);
     setTotalSaldo(statData.saldo);
   } else {
     console.error("Gagal mengambil statistik:", statError);
   }
   ```

---

## Issue 2: Refactor `any` Types ke TypeScript Interfaces (MENENGAH)

**Masalah:**
Penggunaan `any` menghilangkan perlindungan *type checking* dari TypeScript, yang berpotensi menyebabkan *runtime error*.

**Tugas (Tasks):**

1. **Buat File Type Definition**
   Buat file baru: `src/types/index.ts` (atau langsung definisikan di atas file `page.tsx`).
   ```typescript
   export interface Transaksi {
     id_transaksi: string;
     jenis_transaksi: 'Pemasukan' | 'Pengeluaran';
     jumlah: number;
     tanggal_transaksi: string;
     detail_transaksi: string;
     created_at: string;
     kegiatan?: { nama_kegiatan: string };
     kategori?: { nama_kategori: string };
   }

   export interface UserProfile {
     nama_lengkap: string;
     role: 'SUPER_ADMIN' | 'BENDAHARA' | 'PENGAWAS';
   }
   ```

2. **Terapkan Types di State**
   - Di `src/app/page.tsx`: 
     Ubah `const [transaksi, setTransaksi] = useState<any[]>([]);` menjadi `useState<Transaksi[]>([]);`
   - Di `src/components/DashboardLayout.tsx`: 
     Ubah `const [user, setUser] = useState<any>(null);` menggunakan bawaan tipe Supabase:
     ```typescript
     import { User } from '@supabase/supabase-js';
     const [user, setUser] = useState<User | null>(null);
     ```

---

## Issue 3: Ganti Teks Tanggal Hardcoded Menjadi Dinamis (RINGAN)

**Masalah:**
Di `src/components/DashboardLayout.tsx` baris ~237, rentang tahun tertulis permanen `"1 Jan - 31 Des 2024"`.

**Tugas (Tasks):**

1. Buka `src/components/DashboardLayout.tsx`.
2. Gunakan `getFullYear()` untuk mendapatkan tahun aktif.
   *Sebelum:*
   ```tsx
   <span>1 Jan - 31 Des 2024</span>
   ```
   *Sesudah:*
   ```tsx
   <span>1 Jan - 31 Des {new Date().getFullYear()}</span>
   ```

---

## Issue 4: Optimasi Styling Tailwind CSS (Dark Mode) (RINGAN)

**Masalah:**
Penulisan *conditional class* (ternary operator) untuk *Dark Mode* membuat kode JSX sangat panjang dan sulit dibaca.

**Tugas (Tasks):**

1. Di file `tailwind.config.ts` (jika menggunakan Tailwind v3) pastikan `darkMode: 'class'` aktif. Karena ini menggunakan Tailwind v4 (`@tailwindcss/postcss`), Anda cukup menambahkan class `dark` di elemen `<html>`. (Hal ini sepertinya sudah berjalan di fungsi `toggleTheme`).
2. Ganti semua penggunaan ternary operator Javascript di *class* dengan *utility class* `dark:` dari Tailwind.

   *Contoh Sebelum (di `page.tsx` & `DashboardLayout.tsx`):*
   ```tsx
   <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-gray-200'}`}>
   ```
   
   *Contoh Sesudah (Refactor):*
   ```tsx
   <div className="p-6 rounded-2xl border bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-800">
   ```
3. Sisir file `src/app/page.tsx` dan `src/components/DashboardLayout.tsx` dan hapus variabel pengecekan `isDarkMode` di dalam `className`, ganti dengan pendekatan *utility class* `dark:text-slate-400`, `dark:bg-slate-800`, dsb.
