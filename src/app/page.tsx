"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, PlusCircle, List, LogIn, LogOut, UserCircle, ArrowDownRight, ArrowUpRight, CalendarDays, FileBarChart, Trash2, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfil, setUserProfil] = useState<{ nama_lengkap: string; role: string } | null>(null);

  const [saldo, setSaldo] = useState(0);
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);

  const loadTransaksi = async () => {
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select(`*, kegiatan ( nama_kegiatan )`)
      .order('tanggal_transaksi', { ascending: false });
    
    if (transaksi) {
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
  };

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        const { data: profil } = await supabase
          .from('users_profile')
          .select('nama_lengkap, role')
          .eq('id', session.user.id)
          .single(); 

        if (profil) setUserProfil(profil);
      } else {
        setUser(null);
        setUserProfil(null);
      }

      await loadTransaksi();
      setIsLoading(false);
    };

    fetchSessionAndProfile();

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

  const handleHapusTransaksi = async (id: string) => {
    const isConfirm = window.confirm('Yakin ingin membatalkan/menghapus transaksi ini? Saldo akan otomatis dikoreksi.');
    if (!isConfirm) return;

    const { error } = await supabase
      .from('transaksi')
      .delete()
      .eq('id_transaksi', id);

    if (error) {
      alert('Gagal menghapus transaksi: ' + error.message);
    } else {
      loadTransaksi();
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <main className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* === TOP BAR: Status Akses & Auth Modern === */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${user ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <UserCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status Akses</p>
              {isLoading ? (
                <p className="font-medium text-sm text-slate-600">Memeriksa sesi...</p>
              ) : user ? (
                <p className="font-bold text-slate-800 text-sm">
                  Admin: <span className="text-blue-600">{user.email}</span>
                </p>
              ) : (
                <p className="font-bold text-amber-600 text-sm">Mode Publik (Hanya Lihat)</p>
              )}
            </div>
          </div>
          
          <div>
            {user ? (
              <button onClick={handleLogout} className="flex items-center px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold transition-colors text-sm shadow-xs">
                <LogOut size={16} className="mr-2" /> Logout Admin
              </button>
            ) : (
              <Link href="/login" className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors text-sm shadow-sm">
                <LogIn size={16} className="mr-2" /> Login Admin
              </Link>
            )}
          </div>
        </div>

        {/* === HERO SECTION: Header & Tombol Navigasi Cepat === */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/80">
          
          {/* Logo & Judul */}
          <div className="flex items-center gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100">
              <Image
                src="/logo.png"
                alt="Logo Organisasi"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Dashboard Keuangan</h1>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                {user ? `Halo, ${userProfil?.nama_lengkap || 'Admin'} (${userProfil?.role || 'SUPER_ADMIN'}) 👋` : 'Ringkasan arus kas organisasi Anda.'}
              </p>
            </div>
          </div>

          {/* Tombol Aksi Cepat (Responsive Grid / Flex) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => handleAksesAdmin('/kegiatan')} className="flex items-center px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all shadow-xs">
              <List size={16} className="mr-2 text-slate-500" /> Kegiatan
            </button>
            
            <button onClick={() => handleAksesAdmin('/kategori')} className="flex items-center px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all shadow-xs">
              <Layers size={16} className="mr-2 text-slate-500" /> Kategori
            </button>

            <button onClick={() => handleAksesAdmin('/laporan')} className="flex items-center px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all shadow-xs">
              <FileBarChart size={16} className="mr-2 text-slate-500" /> Buku Besar
            </button>

            <button onClick={() => handleAksesAdmin('/tambah')} className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm">
              <PlusCircle size={18} className="mr-2" /> Catat Transaksi
            </button>
          </div>

        </div>

        {/* === KARTU RINGKASAN SALDO (Responsive Grid) === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Kartu Saldo */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Saldo Kas</p>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">{formatRupiah(saldo)}</h3>
              </div>
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-2xs">
                <Wallet size={26} />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-400">Dana bersih keseluruhan</p>
          </div>

          {/* Kartu Pemasukan */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pemasukan</p>
                <h3 className="text-3xl sm:text-4xl font-black text-emerald-600 mt-2 tracking-tight">{formatRupiah(pemasukan)}</h3>
              </div>
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shadow-2xs">
                <ArrowDownToLine size={26} />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-400">Akumulasi kas masuk</p>
          </div>

          {/* Kartu Pengeluaran */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pengeluaran</p>
                <h3 className="text-3xl sm:text-4xl font-black text-rose-600 mt-2 tracking-tight">{formatRupiah(pengeluaran)}</h3>
              </div>
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shadow-2xs">
                <ArrowUpFromLine size={26} />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-400">Akumulasi kas keluar</p>
          </div>

        </div>

        {/* === TABEL RIWAYAT TRANSAKSI TERBARU === */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/80">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">10 Riwayat Transaksi Terbaru</h2>
            <Link href="/laporan" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Lihat Semua →
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-xs tracking-wider">
                  <th className="py-4 px-3 font-bold">Transaksi</th>
                  <th className="py-4 px-3 font-bold">Keterangan</th>
                  <th className="py-4 px-3 font-bold">Status</th>
                  <th className="py-4 px-3 font-bold text-right">Nominal</th>
                  <th className="py-4 px-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-medium">Memuat data transaksi...</td></tr>
                ) : riwayatTransaksi.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-medium">Belum ada transaksi dicatat.</td></tr>
                ) : (
                  riwayatTransaksi.map((item) => {
                    const isPemasukan = item.jenis_transaksi.toLowerCase() === 'pemasukan';
                    
                    return (
                      <tr key={item.id_transaksi} className="hover:bg-slate-50/80 transition-colors group">
                        
                        <td className="py-4 px-3 min-w-[220px]">
                          <div className="flex items-center gap-3.5">
                            <div className={`p-3 rounded-2xl flex-shrink-0 ${isPemasukan ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {isPemasukan ? <ArrowDownRight size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm mb-0.5">{item.kegiatan?.nama_kegiatan || 'Kegiatan Dihapus'}</p>
                              <div className="flex items-center text-xs font-semibold text-slate-400">
                                <CalendarDays size={13} className="mr-1 text-slate-400" />
                                {item.tanggal_transaksi}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-3 max-w-xs">
                          <p className="text-sm font-medium text-slate-600 truncate">{item.detail_transaksi || '-'}</p>
                        </td>

                        <td className="py-4 px-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            isPemasukan ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isPemasukan ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span className="capitalize">{item.jenis_transaksi}</span>
                          </span>
                        </td>

                        <td className="py-4 px-3 text-right">
                          <p className={`font-black text-sm sm:text-base tracking-tight ${isPemasukan ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                          </p>
                        </td>

                        <td className="py-4 px-3 text-right">
                          {user && (
                            <button 
                              onClick={() => handleHapusTransaksi(item.id_transaksi)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors inline-flex"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
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