// =================================================================
// DOKUMENTASI: Konfigurasi Supabase Client
// Fungsi: Menginisialisasi koneksi antara Next.js dan Database
// =================================================================

import { createClient } from '@supabase/supabase-js';

// 1. Mengambil kunci rahasia dari file .env.local
// Tanda || '' memastikan aplikasi tidak crash meskipun file .env belum terbaca
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 2. Membuat "jembatan" (client).
// Variabel 'supabase' ini yang akan kita panggil setiap kali 
// kita ingin melakukan CRUD (Create, Read, Update, Delete) ke database.
export const supabase = createClient(supabaseUrl, supabaseKey);