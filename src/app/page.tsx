"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, PlusCircle, List, LogIn, LogOut, UserCircle, ArrowDownRight, ArrowUpRight, CalendarDays, FileBarChart, Trash2, Layers, TrendingUp, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfil, setUserProfil] = useState<{ nama_lengkap: string; role: string } | null>(null);

  const [saldo, setSaldo] = useState(0);
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);
  const [dataGrafik, setDataGrafik] = useState<any[]>([]);

  // State untuk efek Sticky & Shrink Banner
  const [isScrolled, setIsScrolled] = useState(false);

  // Pantau Scroll Layar
  useEffect(() => {
    const handleScroll = () => {
      // Jika di-scroll lebih dari 20 pixel, aktifkan mode 'mengecil'
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadTransaksi = useCallback(async () => {
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select(`*, kegiatan ( nama_kegiatan )`)
      .order('tanggal_transaksi', { ascending: false });
    
    if (transaksi) {
      setRiwayatTransaksi(transaksi.slice(0, 10));
      
      let totalMasuk = 0;
      let totalKeluar = 0;
      const grafikBulanan: Record<string, { name: string; Pemasukan: number; Pengeluaran: number }> = {};
      
      transaksi.forEach((t) => {
        const jenis = t.jenis_transaksi.toLowerCase();
        if (jenis === 'pemasukan') totalMasuk += t.jumlah;
        if (jenis === 'pengeluaran') totalKeluar += t.jumlah;

        const tanggal = new Date(t.tanggal_transaksi);
        const bulan = tanggal.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        
        if (!grafikBulanan[bulan]) {
          grafikBulanan[bulan] = { name: bulan, Pemasukan: 0, Pengeluaran: 0 };
        }
        
        if (jenis === 'pemasukan') grafikBulanan[bulan].Pemasukan += t.jumlah;
        if (jenis === 'pengeluaran') grafikBulanan[bulan].Pengeluaran += t.jumlah;
      });

      setPemasukan(totalMasuk);
      setPengeluaran(totalKeluar);
      setSaldo(totalMasuk - totalKeluar);
      setDataGrafik(Object.values(grafikBulanan).reverse().slice(-6));
    }
  }, []);

  useEffect(() => {
    loadTransaksi();

    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profil } = await supabase.from('users_profile').select('nama_lengkap, role').eq('id', session.user.id).single(); 
        if (profil) setUserProfil(profil);
      } else {
        setUser(null);
        setUserProfil(null);
      }
      setIsLoading(false);
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session) setUserProfil(null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadTransaksi]);

  const handleAksesAdmin = (path: string) => {
    if (!user) {
      alert('Akses Ditolak! Anda belum login.');
      router.push('/login');
    } else {
      router.push(path);
    }
  };

  const handleLogout = async () => {
    const isConfirm = window.confirm('Apakah Anda yakin ingin keluar?');
    if (isConfirm) {
      await supabase.auth.signOut();
      alert('Berhasil Logout!');
      router.refresh();
    }
  };

  const handleHapusTransaksi = async (id: string) => {
    const isConfirm = window.confirm('Yakin ingin menghapus transaksi ini? Saldo akan dikoreksi otomatis.');
    if (!isConfirm) return;

    const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);

    if (error) {
      alert('Gagal menghapus transaksi: ' + error.message);
    } else {
      loadTransaksi();
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          <p className="text-emerald-600 font-semibold text-sm">Pemasukan: {formatRupiah(payload[0].value)}</p>
          <p className="text-rose-600 font-semibold text-sm">Pengeluaran: {formatRupiah(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  // --- LOGIKA HAK AKSES (RBAC) ---
  const role = userProfil?.role?.toUpperCase() || '';
  const isBisaEdit = role === 'SUPER_ADMIN' || role === 'BENDAHARA';

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900 selection:bg-blue-100 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* === CONTAINER 1: HERO / BANNER (STICKY & SHRINK) === */}
        {/* Menambahkan z-40 agar selalu di atas elemen lain, dan backdrop-blur agar keren transparan */}
        <div 
          className={`sticky top-2 md:top-4 z-40 transition-all duration-300 ease-in-out flex items-center bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm
            ${isScrolled ? 'p-3 sm:p-4 gap-3 rounded-2xl' : 'p-6 md:p-8 gap-5 rounded-3xl'}
          `}
        >
          <div 
            className={`relative flex-shrink-0 rounded-full overflow-hidden border border-gray-100 bg-gray-50 transition-all duration-300 ease-in-out
              ${isScrolled ? 'w-10 h-10' : 'w-16 h-16 sm:w-20 sm:h-20'}
            `}
          >
            <Image src="/logo.png" alt="Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 
              className={`font-black text-gray-900 tracking-tight transition-all duration-300 ease-in-out
                ${isScrolled ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}
              `}
            >
              Dashboard Keuangan
            </h1>
            <p 
              className={`text-gray-500 font-medium transition-all duration-300 ease-in-out overflow-hidden
                ${isScrolled ? 'h-0 opacity-0 text-[0px]' : 'h-5 opacity-100 text-sm mt-1'}
              `}
            >
              Transparansi arus kas organisasi.
            </p>
          </div>
        </div>

        {/* === CONTAINER 2: STATUS PROFIL & TOMBOL KONTROL === */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm relative z-10">
          
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${user ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              <UserCircle size={24} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Status Akses</p>
              {isLoading ? (
                <p className="font-semibold text-sm text-gray-500">Memeriksa sesi...</p>
              ) : user ? (
                <p className="font-bold text-gray-900 text-sm flex items-center">
                  <span className="truncate max-w-[120px] sm:max-w-xs">{userProfil?.nama_lengkap || user.email}</span>
                  <span className={`font-bold ml-2 px-2 py-0.5 rounded-md text-[10px] whitespace-nowrap ${role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : role === 'BENDAHARA' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {role || 'PENGAWAS'}
                  </span>
                </p>
              ) : (
                <p className="font-bold text-gray-600 text-sm">Mode Publik (Hanya Lihat)</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isBisaEdit && (
              <>
                <button onClick={() => handleAksesAdmin('/kegiatan')} className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors">
                  <List size={16} className="mr-2 text-gray-400" /> Kegiatan
                </button>
                <button onClick={() => handleAksesAdmin('/kategori')} className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors">
                  <Layers size={16} className="mr-2 text-gray-400" /> Kategori
                </button>
              </>
            )}

            <button onClick={() => handleAksesAdmin('/laporan')} className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-bold text-sm transition-colors">
              <FileBarChart size={16} className="mr-2 text-gray-400" /> Laporan
            </button>
            
            {role === 'SUPER_ADMIN' && (
              <button onClick={() => handleAksesAdmin('/pengguna')} className="flex items-center px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg font-bold text-sm transition-colors">
                <ShieldCheck size={16} className="mr-2" /> Hak Akses
              </button>
            )}

            {isBisaEdit && (
              <button onClick={() => handleAksesAdmin('/tambah')} className="flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm">
                <PlusCircle size={18} className="mr-2" /> Catat
              </button>
            )}

            <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>

            {user ? (
              <button onClick={handleLogout} className="flex items-center px-4 py-2 hover:bg-rose-50 text-rose-600 rounded-lg font-bold transition-colors text-sm border border-transparent hover:border-rose-100">
                <LogOut size={16} className="mr-2" /> Keluar
              </button>
            ) : (
              <Link href="/login" className="flex items-center px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold transition-colors text-sm shadow-sm">
                <LogIn size={16} className="mr-2" /> Login
              </Link>
            )}
          </div>
        </div>

        {/* === KARTU RINGKASAN SALDO === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Total Saldo Kas</p>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20} /></div>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{formatRupiah(saldo)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Pemasukan</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ArrowDownToLine size={20} /></div>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tight">{formatRupiah(pemasukan)}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Pengeluaran</p>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ArrowUpFromLine size={20} /></div>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-rose-600 tracking-tight">{formatRupiah(pengeluaran)}</h3>
          </div>
        </div>

        {/* === GRID TENGAH: GRAFIK & TABEL === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Statistik Arus Kas</h2>
                <p className="text-xs font-semibold text-gray-400 mt-0.5">Tren 6 Bulan Terakhir</p>
              </div>
            </div>
            
            <div className="w-full flex-1 min-h-[300px]">
              {dataGrafik.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataGrafik} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-sm">
                  Belum ada data untuk ditampilkan grafik.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Riwayat Terbaru</h2>
              <button onClick={() => handleAksesAdmin('/laporan')} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                Lihat Semua
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left h-full">
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td className="py-12 text-center text-gray-400 font-medium text-sm">Memuat data...</td></tr>
                  ) : riwayatTransaksi.length === 0 ? (
                    <tr><td className="py-12 text-center text-gray-400 font-medium text-sm">Belum ada transaksi.</td></tr>
                  ) : (
                    riwayatTransaksi.slice(0, 5).map((item) => {
                      const isPemasukan = item.jenis_transaksi.toLowerCase() === 'pemasukan';
                      return (
                        <tr key={item.id_transaksi} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="p-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${isPemasukan ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {isPemasukan ? <ArrowDownRight size={18} strokeWidth={3} /> : <ArrowUpRight size={18} strokeWidth={3} />}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-sm">{item.kategori?.nama_kategori || 'Transaksi'}</p>
                                  <div className="flex items-center text-xs font-medium text-gray-400 mt-0.5">
                                    {item.tanggal_transaksi}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <p className={`font-black text-sm tracking-tight ${isPemasukan ? 'text-emerald-600' : 'text-gray-900'}`}>
                                  {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                                </p>
                                {isBisaEdit && (
                                  <button onClick={() => handleHapusTransaksi(item.id_transaksi)} className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
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
      </div>
    </main>
  );
}