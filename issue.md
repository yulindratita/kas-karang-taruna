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

---

## Issue 5: Bug Login Role PENGAWAS Bisa Menghapus Transaksi (KRITIKAL)

**Masalah:**
Di `src/app/page.tsx`, tabel Riwayat Terbaru merender kolom "Aksi" dengan tombol "Hapus" (Ikon `Trash2`) untuk *semua pengguna* tanpa mengecek *role* otorisasinya. Akibatnya, `PENGAWAS` (yang seharusnya read-only) atau pengguna yang tidak berhak dapat melihat tombol hapus dan memicu fungsi hapus. State tentang `role` saat ini hanya ada di `DashboardLayout.tsx` dan tidak tersedia di `page.tsx`.

**Tugas (Tasks):**

1. **Ambil Data Role User di `src/app/page.tsx`**
   Tambahkan state `userRole` dan fungsi untuk mengambil *profile user* ke dalam file `page.tsx`.
   
   *1. Tambahkan State (di bawah state lain):*
   ```tsx
   const [userRole, setUserRole] = useState<string>('');
   ```

   *2. Buat fungsi logika pengambilan role di dalam `page.tsx`:*
   ```tsx
   const fetchUserRole = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     if (session) {
       const { data: profil } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
       if (profil) setUserRole(profil.role);
     }
   };
   ```

   *3. Panggil fungsi di `useEffect`:*
   ```tsx
   useEffect(() => { 
     fetchDataDashboard(); 
     fetchUserRole();
   }, []);
   ```

2. **Kondisikan Tombol Hapus Berdasarkan Role (Frontend)**
   Sembunyikan kolom "Aksi" di dalam tabel jika user BUKAN `SUPER_ADMIN` atau `BENDAHARA`.
   
   *1. Buat variabel boolean untuk hak akses:*
   ```tsx
   const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';
   ```

   *2. Pada tag `<thead>` Tabel (Baris Header Aksi):*
   ```tsx
   {/* Tampilkan kolom Aksi HANYA JIKA bisa edit */}
   {isBisaEdit && <th className="py-4 px-6 font-semibold text-center w-24">Aksi</th>}
   ```

   *3. Pada tag `<tbody>` dalam `transaksi.map()` (Kolom Tombol):*
   ```tsx
   {isBisaEdit && (
     <td className="py-4 px-6 text-center">
       <button onClick={() => handleHapus(item.id_transaksi)} className="p-2 rounded-lg transition-colors text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50">
         <Trash2 size={16} />
       </button>
     </td>
   )}
   ```

3. **Terapkan Kebijakan Keamanan (RLS) di Database Supabase (Backend)**
   Keamanan di antarmuka (frontend) bisa dibobol jika *endpoint* database dibiarkan terbuka. Lindungi tabel transaksi Anda secara absolut melalui SQL. Jalankan SQL ini di **SQL Editor Supabase**:
   
   ```sql
   -- Aktifkan RLS pada tabel transaksi
   ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;

   -- Hapus policy delete lama jika sudah ada (Opsional, amankan jika perlu)
   -- DROP POLICY IF EXISTS "Izinkan hapus hanya untuk admin/bendahara" ON transaksi;

   -- Buat aturan yang MENGUNCI fitur hapus dari sembarang user
   CREATE POLICY "Izinkan hapus hanya untuk admin/bendahara" ON transaksi
   FOR DELETE
   USING (
     (SELECT role FROM users_profile WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'BENDAHARA')
   );
   ```

---

## Issue 6: Aktifasi Filter Global & Penambahan Line Chart (MENENGAH)

**Masalah:**
Input *Search* (Pencarian) dan *Date Range* (Periode Tanggal) di *header* `DashboardLayout.tsx` saat ini hanya berupa tampilan UI mati (statis). Selain itu, *dashboard* belum memiliki visualisasi grafik pergerakan kas.

**Tugas (Tasks):**

**Tahap 1: Sinkronisasi Filter ke URL (di `src/components/DashboardLayout.tsx`)**
Agar filter dapat digunakan oleh halaman anak (seperti `page.tsx`), kita akan menggunakan URL Parameters (`?q=...&start=...`).
1. **Import Hooks Next.js**:
   ```tsx
   import { useRouter, useSearchParams, usePathname } from 'next/navigation';
   ```
2. **Definisikan State Filter**:
   Gunakan default bulan ini, lalu sinkronkan jika ada URL parameter.
   ```tsx
   const searchParams = useSearchParams();
   const querySearch = searchParams.get('q') || '';
   const queryStart = searchParams.get('start') || '';
   const queryEnd = searchParams.get('end') || '';

   const [searchKeyword, setSearchKeyword] = useState(querySearch);
   const [startDate, setStartDate] = useState(queryStart);
   const [endDate, setEndDate] = useState(queryEnd);
   ```
3. **Fungsi Update URL**:
   Buat fungsi untuk mengupdate URL setiap kali filter diubah.
   ```tsx
   const updateFilter = (q: string, start: string, end: string) => {
     const params = new URLSearchParams(searchParams.toString());
     if (q) params.set('q', q); else params.delete('q');
     if (start) params.set('start', start); else params.delete('start');
     if (end) params.set('end', end); else params.delete('end');
     router.push(`${pathname}?${params.toString()}`);
   };
   ```
4. **Hubungkan UI ke State**:
   - Pada tag `<input type="text" placeholder="Cari transaksi..."/>` berikan `value={searchKeyword}` dan handler `onChange` + `onKeyDown={e => e.key === 'Enter' && updateFilter(searchKeyword, startDate, endDate)}`.
   - Ganti *placeholder* rentang tanggal menjadi `<input type="date">` untuk `startDate` dan `endDate`, dan panggil `updateFilter` pada saat `onChange`.

**Tahap 2: Menambahkan Library Chart**
1. Buka terminal, lalu jalankan perintah:
   ```bash
   npm install recharts
   ```

**Tahap 3: Implementasi Filter dan Line Chart (di `src/app/page.tsx`)**
1. **Import Recharts & Next.js Hooks**:
   ```tsx
   import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
   import { useSearchParams } from 'next/navigation';
   ```
2. **Tambahkan State Chart Data & Ambil Parameter**:
   ```tsx
   const searchParams = useSearchParams();
   const q = searchParams.get('q') || '';
   const start = searchParams.get('start') || '';
   const end = searchParams.get('end') || '';
   
   // State baru untuk data grafik
   const [chartData, setChartData] = useState<any[]>([]);
   ```
3. **Modifikasi `fetchDataDashboard` Agar Mendukung Filter**:
   - Jika *filter* aktif, RPC agregasi global *tidak bisa dipakai* karena data di layar harus menyesuaikan filter. Gunakan `.select()` ke tabel `transaksi`.
   ```tsx
   let query = supabase.from('transaksi').select('*, kegiatan(nama_kegiatan), kategori(nama_kategori)').order('tanggal_transaksi', { ascending: true });
   
   if (start) query = query.gte('tanggal_transaksi', start);
   if (end) query = query.lte('tanggal_transaksi', end);
   if (q) query = query.ilike('detail_transaksi', `%${q}%`); // Opsi tambahan: ilike('jenis_transaksi')
   ```
   - Setelah data (`semuaData`) difetch, olah data tersebut menjadi 3 hal sekaligus:
     * Menghitung `totalMasuk`, `totalKeluar`, `totalSaldo`.
     * Mengambil 5 data terbaru untuk tabel (dengan fungsi `slice(-5).reverse()`).
     * **Mengelompokkan data per tanggal** untuk `chartData`.
     ```typescript
     // Algoritma grouping untuk Chart:
     const grouped = semuaData.reduce((acc: any, curr: any) => {
       const date = curr.tanggal_transaksi;
       if (!acc[date]) acc[date] = { tanggal: date, Pemasukan: 0, Pengeluaran: 0 };
       acc[date][curr.jenis_transaksi] += curr.jumlah;
       return acc;
     }, {});
     setChartData(Object.values(grouped));
     ```
4. **Tambahkan UI Line Chart**:
   - Letakkan di antara "3 Kartu Statistik" dan "Tabel Riwayat Terbaru".
   ```tsx
   {/* WIDGET GRAFIK */}
   <div className="p-6 rounded-2xl border shadow-sm bg-white dark:bg-[#0f172a] border-gray-200 dark:border-slate-800/80 mb-6">
     <h3 className="text-lg font-bold mb-4">Tren Mutasi Kas</h3>
     <div className="h-72 w-full">
       <ResponsiveContainer width="100%" height="100%">
         <LineChart data={chartData}>
           <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
           <XAxis dataKey="tanggal" fontSize={12} tickMargin={10} />
           <YAxis fontSize={12} tickFormatter={(val) => `Rp${val/1000}K`} />
           <Tooltip formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)} />
           <Legend />
           <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
           <Line type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
         </LineChart>
       </ResponsiveContainer>
     </div>
   </div>
   ```
5. **Tambahkan Dependency Array pada `useEffect`**:
   Ubah `useEffect` di `page.tsx` agar memanggil fetch ulang jika URL params berubah.
   ```tsx
   useEffect(() => { 
     fetchDataDashboard(); 
     fetchUserRole();
   }, [q, start, end]); // <--- Tambahkan depedency ini
   ```

---

## Issue 7: Optimasi UI/UX Mobile (Filter Responsif & Layout Card) (MENENGAH)

**Masalah:**
Di layar HP (*mobile Android/iOS*), input pencarian dan filter tanggal disembunyikan total karena kendala ruang (menggunakan `hidden md:flex`). Selain itu, tabel data memanjang ke kanan (*horizontal scroll*) sehingga tidak ergonomis saat dilihat di layar kecil.

**Tugas (Tasks):**

**Tahap 1: Memperbaiki Filter yang Hilang di Layar Kecil (`src/components/DashboardLayout.tsx`)**
1. Buka file `src/components/DashboardLayout.tsx`.
2. Pada komponen `HeaderFilters` (di fungsi `return`), kita akan merubah agar filter membungkus (*wrap*) saat ruang menyempit.
   - **Ganti struktur pembungkus utama** dari `<div className="flex items-center justify-between flex-1 gap-4">` menjadi:
     ```tsx
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-1 gap-3 w-full">
     ```
   - **Hapus pengekang responsif** pada *Search Input*: Ganti `<div className="hidden md:flex items-center w-full max-w-md ...">` menjadi `<div className="flex items-center w-full max-w-md ...">`.
   - **Hapus pengekang responsif** pada *Date Range*: Ganti `<div className="hidden sm:flex items-center gap-2 ...">` menjadi `<div className="flex items-center gap-2 ... w-full sm:w-auto">`.

**Tahap 2: Merubah Tabel Riwayat menjadi Format Kartu (Cards) di Mobile (`src/app/page.tsx`)**
1. Buka file `src/app/page.tsx`.
2. Sembunyikan tabel bawaan khusus di *mobile* dengan menambahkan `hidden md:block` pada `div` pembungkus tabel:
   ```tsx
   <div className="hidden md:block overflow-x-auto">
     <table className="w-full text-left whitespace-nowrap">
       {/* ... isi tabel ... */}
     </table>
   </div>
   ```
3. Tambahkan tampilan alternatif **Daftar Kartu (Cards)** tepat di bawah blok tabel tersebut. Tampilan ini khusus untuk HP (`md:hidden`):
   ```tsx
   {/* TAMPILAN KARTU UNTUK MOBILE */}
   <div className="md:hidden flex flex-col divide-y divide-gray-100 dark:divide-slate-800/80">
     {isLoading ? (
       <div className="p-8 text-center text-sm opacity-50">Memuat riwayat...</div>
     ) : transaksi.length === 0 ? (
       <div className="p-8 text-center text-sm opacity-50">Tidak ada transaksi ditemukan.</div>
     ) : (
       transaksi.map((item) => {
         const isPemasukan = item.jenis_transaksi === 'Pemasukan';
         return (
           <div key={item.id_transaksi} className="p-4 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-slate-800/40">
             <div className="flex justify-between items-start">
               <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                 {item.detail_transaksi || item.kegiatan?.nama_kegiatan || '-'}
               </p>
               <span className={`font-black text-sm whitespace-nowrap ml-3 ${isPemasukan ? 'text-emerald-600 dark:text-cyan-400' : 'text-gray-900 dark:text-white'}`}>
                 {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
               </span>
             </div>
             <div className="flex justify-between items-center mt-1">
               <span className="text-xs text-slate-500 dark:text-slate-400">{item.tanggal_transaksi}</span>
               <div className="flex items-center gap-2">
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400">
                   {item.kategori?.nama_kategori || '-'}
                 </span>
                 {isBisaEdit && (
                   <button onClick={() => handleHapus(item.id_transaksi)} className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50">
                     <Trash2 size={14} />
                   </button>
                 )}
               </div>
             </div>
           </div>
         );
       })
     )}
   </div>
   ```

**Tahap 3: Jadikan Aplikasi Android Native-like (PWA)**
1. Buat file `public/manifest.json`.
   ```json
   {
     "name": "Kas Karang Taruna",
     "short_name": "KasKita",
     "icons": [
       {
         "src": "/logo.png",
         "sizes": "192x192",
         "type": "image/png"
       },
       {
         "src": "/logo.png",
         "sizes": "512x512",
         "type": "image/png"
       }
     ],
     "theme_color": "#090e17",
     "background_color": "#ffffff",
     "display": "standalone",
     "orientation": "portrait"
   }
   ```
2. Di file `src/app/layout.tsx`, tambahkan tag manifest di head:
   ```tsx
   export const metadata: Metadata = {
     title: "Dashboard Kas",
     description: "Sistem Manajemen Kas",
     manifest: "/manifest.json",
   };
   ```
