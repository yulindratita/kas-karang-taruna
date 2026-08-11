"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Trash2, AlertTriangle, ArrowRight, Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function DashboardContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const filterYear = searchParams.get('year') || new Date().getFullYear().toString();

  // FIX: State ini akan mencegah Recharts melakukan render di Server (mencegah blank screen)
  const [isMounted, setIsMounted] = useState(false);
  
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [userRole, setUserRole] = useState('');
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Ya, Lanjutkan', isDanger: false, onConfirm: () => {}
  });

  useEffect(() => {
    setIsMounted(true); // Komponen telah di-mount di browser
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchDataDashboard = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let currentRole = 'PENGAWAS';
      if (session) {
        const { data: profile } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
        if (profile) currentRole = profile.role?.toUpperCase() || 'PENGAWAS';
      }
      setUserRole(currentRole);

      const startDate = `${filterYear}-01-01`;
      const endDate = `${filterYear}-12-31`;

      // 1. Ambil Data Untuk Grafik & Kartu (DIFILTER TAHUN & SEARCH)
      let queryStats = supabase
        .from('transaksi')
        .select('tanggal_transaksi, jenis_transaksi, jumlah, detail_transaksi')
        .gte('tanggal_transaksi', startDate)
        .lte('tanggal_transaksi', endDate)
        .order('tanggal_transaksi', { ascending: true });

      if (search) {
        queryStats = queryStats.ilike('detail_transaksi', `%${search}%`);
      }

      const { data: semuaData, error: errorStats } = await queryStats;
      if (errorStats) throw errorStats;

      if (semuaData) {
        let masuk = 0;
        let keluar = 0;
        const rekapHarian: Record<string, { tanggal: string, Pemasukan: number, Pengeluaran: number }> = {};

        semuaData.forEach(t => {
          if (t.jenis_transaksi === 'Pemasukan') masuk += t.jumlah;
          else if (t.jenis_transaksi === 'Pengeluaran') keluar += t.jumlah;

          if (!rekapHarian[t.tanggal_transaksi]) {
            rekapHarian[t.tanggal_transaksi] = { tanggal: t.tanggal_transaksi, Pemasukan: 0, Pengeluaran: 0 };
          }
          if (t.jenis_transaksi === 'Pemasukan') rekapHarian[t.tanggal_transaksi].Pemasukan += t.jumlah;
          if (t.jenis_transaksi === 'Pengeluaran') rekapHarian[t.tanggal_transaksi].Pengeluaran += t.jumlah;
        });

        setTotalMasuk(masuk);
        setTotalKeluar(keluar);
        setTotalSaldo(masuk - keluar);
        setChartData(Object.values(rekapHarian));
      }

      // 2. Ambil 5 Riwayat Terbaru 
      let queryHistory = supabase
        .from('transaksi')
        .select('*, kegiatan(nama_kegiatan), kategori(nama_kategori)')
        .gte('tanggal_transaksi', startDate)
        .lte('tanggal_transaksi', endDate)
        .order('tanggal_transaksi', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (search) {
        queryHistory = queryHistory.ilike('detail_transaksi', `%${search}%`);
      }

      const { data: riwayatTerbaru, error: errorHistory } = await queryHistory;
      if (errorHistory) throw errorHistory;
      
      if (riwayatTerbaru) setTransaksi(riwayatTerbaru);

    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDataDashboard(); }, [search, filterYear]);

  const handleHapus = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
        if (error) alert('Gagal menghapus: ' + error.message);
        else fetchDataDashboard();
      }
    });
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard Keuangan</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ringkasan data filter: Tahun {filterYear} {search && `| Pencarian: "${search}"`}</p>
        </div>

        {/* 3 KARTU STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Saldo Kas</p>
                <h3 className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatRupiah(totalSaldo)}</h3>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}><Wallet size={24} /></div>
            </div>
            <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Akumulasi filter berjalan</p>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Pemasukan</p>
                <h3 className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-cyan-400' : 'text-emerald-600'}`}>{formatRupiah(totalMasuk)}</h3>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><ArrowDownToLine size={24} /></div>
            </div>
            <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Jumlah dana masuk (Debit)</p>
          </div>

          <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Pengeluaran</p>
                <h3 className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>{formatRupiah(totalKeluar)}</h3>
              </div>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><ArrowUpFromLine size={24} /></div>
            </div>
            <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Jumlah dana keluar (Kredit)</p>
          </div>
        </div>

        {/* GRAFIK ARUS KAS (Hanya di-render jika isMounted === true) */}
        {!isLoading && isMounted && chartData.length > 0 && (
          <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-6">Tren Arus Kas (Berdasarkan Filter)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="tanggal" stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                    formatter={(value: number) => formatRupiah(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                  <Line type="monotone" dataKey="Pemasukan" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Pemasukan (+)" />
                  <Line type="monotone" dataKey="Pengeluaran" stroke="#fb7185" strokeWidth={3} dot={{ r: 4, fill: '#fb7185', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Pengeluaran (-)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TABEL RIWAYAT TERBARU */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
            <h3 className="text-lg font-bold">Riwayat Terbaru (Filter Aktif)</h3>
            <Link href={`/laporan?year=${filterYear}`} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Lihat Semua <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className={`text-xs uppercase tracking-widest border-b ${isDarkMode ? 'bg-[#111827] text-slate-400 border-slate-800' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>
                  <th className="py-4 px-6 font-semibold">Tanggal</th>
                  <th className="py-4 px-6 font-semibold">Deskripsi</th>
                  <th className="py-4 px-6 font-semibold">Kategori</th>
                  <th className="py-4 px-6 font-semibold text-right">Jumlah</th>
                  {isBisaEdit && <th className="py-4 px-6 font-semibold text-center w-24">Aksi</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {isLoading ? (<tr><td colSpan={isBisaEdit ? 5 : 4} className="py-12 text-center text-sm opacity-50">Memuat riwayat...</td></tr>) 
                : transaksi.length === 0 ? (<tr><td colSpan={isBisaEdit ? 5 : 4} className="py-12 text-center text-sm opacity-50">Data tidak ditemukan.</td></tr>) 
                : transaksi.map((item) => {
                  const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                  return (
                    <tr key={item.id_transaksi} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className={`py-4 px-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.tanggal_transaksi}</td>
                      <td className="py-4 px-6">
                        <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.detail_transaksi || item.kegiatan?.nama_kegiatan || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold border ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                          {item.kategori?.nama_kategori}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-right font-black text-sm ${isPemasukan ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-600') : (isDarkMode ? 'text-white' : 'text-gray-900')}`}>
                        {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                      </td>
                      {isBisaEdit && (
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleHapus(item.id_transaksi)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'}`}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* POP-UP KONFIRMASI KUSTOM */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600') : (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600')}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{confirmDialog.title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{confirmDialog.message}</p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Batal
              </button>
              <button onClick={confirmDialog.onConfirm} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-600 text-white hover:bg-rose-700') : (isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700')}`}>
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#090e17] flex items-center justify-center text-cyan-400 font-bold">Memuat Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}