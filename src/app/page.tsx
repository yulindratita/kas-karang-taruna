"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, PlusCircle, List, LogIn, LogOut, UserCircle, ArrowDownRight, ArrowUpRight, CalendarDays, FileBarChart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [saldo, setSaldo] = useState(0);
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Ambil sesi user saat pertama kali dimuat
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Ambil seluruh data transaksi beserta nama kegiatannya
      const { data: transaksi } = await supabase
        .from('transaksi')
        .select(`*, kegiatan ( nama_kegiatan )`)
        .order('tanggal_transaksi', { ascending: false });
      
      if (transaksi) {
        // HANYA TAMPILKAN 5 TRANSAKSI TERBARU DI TABEL
        setRiwayatTransaksi(transaksi.slice(0, 10));
        
        let totalMasuk = 0;
        let totalKeluar = 0;
        
        transaksi.forEach((t) => {
          const jenis = t.jenis_transaksi.toLowerCase();
          if (jenis === 'pemasukan') totalMasuk += t.jumlah;
          if (jenis === 'pengeluaran') totalKeluar += t.jumlah;
        });

        setPemasukan(totalMasuk);
        setPengeluaran(totalKeluar);
        setSaldo(totalMasuk - totalKeluar);
      }
      setIsLoading(false);
    };

    fetchData();

    // SINKRONISASI LOGIN: Pantau perubahan status login secara real-time
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAksesAdmin = (path: string) => {
    if (!user) {
      alert('Akses Ditolak! Anda bukan admin.\n\nSilakan Login Admin terlebih dahulu.');
      router.push('/login');
    } else {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    const isConfirm = window.confirm('Apakah Anda yakin ingin keluar dari akun Admin?');
    if (isConfirm) {
      await supabase.auth.signOut();
      alert('Berhasil Logout!');
      router.refresh();
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* === Status Akses === */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 gap-4">
          <div className="flex items-center text-gray-700">
            <UserCircle size={24} className="mr-3 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Status Akses</p>
              {isLoading ? (
                <p className="font-semibold">Memeriksa...</p>
              ) : user ? (
                <p className="font-bold text-blue-700 capitalize">
                  {user.email.split('@')[0]}
                </p>
              ) : (
                <p className="font-semibold text-orange-600">Mode Publik (Hanya Lihat)</p>
              )}
            </div>
          </div>
          
          {/* Ini adalah bagian tombol Logout yang sebelumnya terhapus */}
          <div>
            {user ? (
              <button onClick={handleLogout} className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm">
                <LogOut size={16} className="mr-2" /> Logout Admin
              </button>
            ) : (
              <Link href="/login" className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
                <LogIn size={16} className="mr-2" /> Login Admin
              </Link>
            )}
          </div>
        </div>

        {/* === Header & Tombol Aksi (Dengan Logo) === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          
          {/* Bagian Judul dan Logo */}
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Logo Organisasi"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover shadow-sm border border-gray-100"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard Keuangan</h1>
              <p className="text-gray-500 mt-1">Ringkasan arus kas organisasi Anda.</p>
            </div>
          </div>
          
          {/* Tombol Aksi (Kelola & Catat)
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => handleAksesAdmin('/kegiatan')} className="flex items-center justify-center px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-sm">
              <List size={20} className="mr-2" /> Kelola Kegiatan
            </button>
            <button onClick={() => handleAksesAdmin('/tambah')} className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm">
              <PlusCircle size={20} className="mr-2" /> Catat Transaksi
            </button>
          </div> */}

          {/* Tombol Aksi (Kelola, Laporan, & Catat) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button onClick={() => handleAksesAdmin('/kegiatan')} className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-sm">
              <List size={18} className="mr-2" /> Kegiatan
            </button>
            
            {/* INI TOMBOL BARU UNTUK LAPORAN */}
            <button onClick={() => handleAksesAdmin('/laporan')} className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium shadow-sm">
              <FileBarChart size={18} className="mr-2" /> Buku Besar
            </button>

            <button onClick={() => handleAksesAdmin('/tambah')} className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm">
              <PlusCircle size={20} className="mr-2" /> Catat Transaksi
            </button>
          </div>

        </div>

        

        {/* Kartu Ringkasan (Terkoneksi Database) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between mb-4">
              <h2 className="text-gray-600 font-medium">Total Saldo Kas</h2>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Wallet size={24} /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatRupiah(saldo)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between mb-4">
              <h2 className="text-gray-600 font-medium">Total Pemasukan</h2>
              <div className="p-3 bg-green-100 text-green-600 rounded-full"><ArrowDownToLine size={24} /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatRupiah(pemasukan)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between mb-4">
              <h2 className="text-gray-600 font-medium">Total Pengeluaran</h2>
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><ArrowUpFromLine size={24} /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatRupiah(pengeluaran)}</p>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi (Dikembalikan) */}
        {/* Tabel Riwayat Transaksi Modern & Ikonik */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-6">Riwayat Transaksi Terbaru</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="py-4 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaksi</th>
                  <th className="py-4 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Keterangan</th>
                  <th className="py-4 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">Memuat data...</td></tr>
                ) : riwayatTransaksi.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">Belum ada transaksi dicatat.</td></tr>
                ) : (
                  riwayatTransaksi.map((item) => {
                    // Memastikan pengecekan kebal terhadap huruf besar/kecil
                    const isPemasukan = item.jenis_transaksi.toLowerCase() === 'pemasukan';
                    
                    return (
                      <tr key={item.id_transaksi} className="hover:bg-gray-50/70 transition-colors group">
                        
                        {/* Kolom 1: Ikon, Nama Kegiatan, & Tanggal */}
                        <td className="py-4 px-2 min-w-[200px]">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl flex-shrink-0 ${isPemasukan ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {isPemasukan ? <ArrowDownRight size={22} strokeWidth={2.5} /> : <ArrowUpRight size={22} strokeWidth={2.5} />}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 mb-0.5">{item.kegiatan?.nama_kegiatan || 'Kegiatan Dihapus'}</p>
                              <div className="flex items-center text-xs font-medium text-gray-400">
                                <CalendarDays size={14} className="mr-1.5 opacity-70" />
                                {item.tanggal_transaksi}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Kolom 2: Detail Keterangan */}
                        <td className="py-4 px-2">
                          <p className="text-sm font-medium text-gray-600 line-clamp-2">{item.detail_transaksi}</p>
                        </td>

                        {/* Kolom 3: Badge Status Rounded */}
                        <td className="py-4 px-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                            isPemasukan
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isPemasukan ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span className="capitalize">{item.jenis_transaksi}</span>
                          </span>
                        </td>

                        {/* Kolom 4: Nominal Dinamis */}
                        <td className="py-4 px-2 text-right">
                          <p className={`font-extrabold text-base tracking-tight ${isPemasukan ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                          </p>
                        </td>
                        
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}