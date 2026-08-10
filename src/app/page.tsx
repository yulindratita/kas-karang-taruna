"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// Tambahan Ikon Sun dan Moon untuk Dark Mode
import { Wallet, ArrowDownToLine, ArrowUpFromLine, PlusCircle, List, LogIn, LogOut, UserCircle, ArrowDownRight, ArrowUpRight, CalendarDays, FileBarChart, Trash2, Layers, TrendingUp, ShieldCheck, Sun, Moon } from 'lucide-react';
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

  // --- STATE UNTUK DARK MODE & EFEK STICKY ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Inisialisasi Dark Mode dari LocalStorage saat web dimuat
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fungsi Toggle Dark Mode
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // --- FITUR AUTO LOGOUT (IDLE TIMER 10 MENIT) ---
  useEffect(() => {
    if (!user) return;
    let timeoutId: NodeJS.Timeout;

    const logoutWaktuHabis = async () => {
      await supabase.auth.signOut();
      alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 10 menit. Silakan login kembali.');
      window.location.href = '/'; 
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutWaktuHabis, 10 * 60 * 1000); 
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

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
    return () => authListener.subscription.unsubscribe();
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

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Pemasukan: {formatRupiah(payload[0].value)}</p>
          <p className="text-rose-600 dark:text-rose-400 font-semibold text-sm">Pengeluaran: {formatRupiah(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  const role = userProfil?.role?.toUpperCase() || '';
  const isBisaEdit = role === 'SUPER_ADMIN' || role === 'BENDAHARA';

  return (
    <main className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100 selection:bg-purple-900' : 'bg-gray-50 text-gray-900 selection:bg-blue-100'} relative`}>
      <div className="max-w-6xl mx-auto space-y-5 md:space-y-6">
        
        {/* === CONTAINER 1: HERO / BANNER === */}
        <div className={`flex items-center gap-4 md:gap-5 p-5 md:p-6 rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
            <Image src="/logo.png" alt="Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight">Dashboard Keuangan</h1>
            <p className={`text-xs md:text-sm font-medium mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Transparansi arus kas organisasi.</p>
          </div>
        </div>

        {/* === PANEL KONTROL (2 KONTAINER SIMETRIS) === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 relative z-10">
          
          {/* BAGIAN KIRI (Profil & Pengaturan) */}
          <div className={`lg:col-span-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${user ? (isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                <UserCircle size={24} strokeWidth={2} />
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Status Akses</p>
                {isLoading ? (
                  <p className="font-semibold text-sm text-gray-500">Memeriksa sesi...</p>
                ) : user ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-sm truncate max-w-[150px]">{userProfil?.nama_lengkap || user.email}</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] w-max font-bold ${
                      role === 'SUPER_ADMIN' ? (isDarkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-700') : 
                      role === 'BENDAHARA' ? (isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700') : 
                      (isDarkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700')
                    }`}>
                      {role || 'PENGAWAS'}
                    </span>
                  </div>
                ) : (
                  <p className="font-bold text-gray-500 text-sm">Mode Publik</p>
                )}
              </div>
            </div>

            {/* Grup Tombol Profil */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              <button onClick={toggleTheme} className={`flex-1 sm:flex-none p-2.5 flex justify-center items-center rounded-xl font-bold transition-colors border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'}`} title="Ubah Tema">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {role === 'SUPER_ADMIN' && (
                <button onClick={() => handleAksesAdmin('/pengguna')} className={`flex-1 sm:flex-none flex justify-center items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-purple-900/30 border-purple-800/50 text-purple-400 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}>
                  <ShieldCheck size={16} className="mr-2" /> Hak Akses
                </button>
              )}

              {user ? (
                <button onClick={handleLogout} className={`flex-1 sm:flex-none flex justify-center items-center px-4 py-2.5 rounded-xl font-bold transition-colors text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-rose-400 hover:bg-gray-600 hover:border-rose-500/50' : 'bg-white border-gray-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200'}`}>
                  <LogOut size={16} className="sm:mr-0 md:mr-2" /> <span className="hidden md:inline">Keluar</span>
                </button>
              ) : (
                <Link href="/login" className="flex-1 sm:flex-none flex justify-center items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-sm shadow-sm">
                  <LogIn size={16} className="mr-2" /> Login
                </Link>
              )}
            </div>
          </div>

          {/* BAGIAN KANAN (Operasional Kas - TATA LETAK GRID RAPI) */}
          <div className={`lg:col-span-7 grid ${isBisaEdit ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'} gap-3 p-5 rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {isBisaEdit && (
              <>
                <button onClick={() => handleAksesAdmin('/kegiatan')} className={`flex flex-col items-center justify-center p-3 sm:py-4 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                  <List size={20} className={`mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} /> Kegiatan
                </button>
                <button onClick={() => handleAksesAdmin('/kategori')} className={`flex flex-col items-center justify-center p-3 sm:py-4 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                  <Layers size={20} className={`mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} /> Kategori
                </button>
              </>
            )}

            <button onClick={() => handleAksesAdmin('/laporan')} className={`flex flex-col items-center justify-center p-3 sm:py-4 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
              <FileBarChart size={20} className={`mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} /> Laporan
            </button>

            {isBisaEdit && (
              <button onClick={() => handleAksesAdmin('/tambah')} className="flex flex-col items-center justify-center p-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm border border-transparent">
                <PlusCircle size={20} className="mb-1.5 opacity-90" /> Catat Kas
              </button>
            )}
          </div>

        </div>

        {/* === KARTU RINGKASAN SALDO === */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 relative z-10">
          <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-5">
              <p className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Saldo Kas</p>
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Wallet size={20} /></div>
            </div>
            <h3 className="text-3xl font-black tracking-tight truncate">{formatRupiah(saldo)}</h3>
          </div>

          <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-5">
              <p className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pemasukan</p>
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><ArrowDownToLine size={20} /></div>
            </div>
            <h3 className={`text-3xl font-black tracking-tight truncate ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatRupiah(pemasukan)}</h3>
          </div>

          <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-5">
              <p className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pengeluaran</p>
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><ArrowUpFromLine size={20} /></div>
            </div>
            <h3 className={`text-3xl font-black tracking-tight truncate ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>{formatRupiah(pengeluaran)}</h3>
          </div>
        </div>

        {/* === GRID TENGAH: GRAFIK & TABEL === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 relative z-10">
          
          {/* CHART AREA */}
          <div className={`p-6 md:p-8 rounded-2xl border flex flex-col shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <TrendingUp size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Statistik Arus Kas</h2>
                <p className={`text-xs font-semibold mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tren 6 Bulan Terakhir</p>
              </div>
            </div>
            
            <div className="w-full flex-1 min-h-[250px] md:min-h-[300px]">
              {dataGrafik.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataGrafik} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f1f5f9'} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`} tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#1f2937' : '#f8fafc' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: isDarkMode ? '#d1d5db' : '#4b5563' }} />
                    <Bar dataKey="Pemasukan" fill={isDarkMode ? '#34d399' : '#10b981'} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Pengeluaran" fill={isDarkMode ? '#fb7185' : '#f43f5e'} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-medium text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Belum ada data grafik.
                </div>
              )}
            </div>
          </div>

          {/* TABLE AREA */}
          <div className={`rounded-2xl border overflow-hidden flex flex-col h-full shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-6 border-b flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <h2 className="text-lg font-black tracking-tight">Riwayat Terbaru</h2>
              <button onClick={() => handleAksesAdmin('/laporan')} className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                Lihat Semua
              </button>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left h-full">
                <tbody className={`divide-y transition-colors duration-300 ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {isLoading ? (
                    <tr><td className={`py-12 text-center font-medium text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Memuat data...</td></tr>
                  ) : riwayatTransaksi.length === 0 ? (
                    <tr><td className={`py-12 text-center font-medium text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Belum ada transaksi.</td></tr>
                  ) : (
                    riwayatTransaksi.slice(0, 5).map((item) => {
                      const isPemasukan = item.jenis_transaksi.toLowerCase() === 'pemasukan';
                      return (
                        <tr key={item.id_transaksi} className={`transition-colors group ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/80'}`}>
                          <td className="p-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 truncate pr-4">
                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${isPemasukan ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDarkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                                  {isPemasukan ? <ArrowDownRight size={18} strokeWidth={2.5} /> : <ArrowUpRight size={18} strokeWidth={2.5} />}
                                </div>
                                <div className="truncate">
                                  <p className="font-bold text-sm truncate">{item.kategori?.nama_kategori || 'Transaksi'}</p>
                                  <div className={`flex items-center text-xs font-medium mt-0.5 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {item.tanggal_transaksi} <span className="mx-1.5 text-[8px]">•</span> {item.kegiatan?.nama_kegiatan}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2 flex-shrink-0">
                                <p className={`font-black text-sm md:text-base tracking-tight ${isPemasukan ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-gray-100' : 'text-gray-900')}`}>
                                  {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                                </p>
                                {isBisaEdit && (
                                  <button onClick={() => handleHapusTransaksi(item.id_transaksi)} className={`p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${isDarkMode ? 'text-gray-500 hover:text-rose-400 hover:bg-rose-900/30' : 'text-gray-300 hover:text-rose-600 hover:bg-rose-50'}`}>
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