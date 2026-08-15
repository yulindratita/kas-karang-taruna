"use client";

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Trash2, AlertTriangle, ArrowRight, ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp, FilterX } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Transaksi } from '@/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ChartDataItem {
  tanggal: string;
  Pemasukan: number;
  Pengeluaran: number;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams?.get('q') || '';
  const start = searchParams?.get('start') || '';
  const end = searchParams?.get('end') || '';

  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // State untuk Statistik Kartu
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);

  // State Pop-up Konfirmasi Kustom
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    isDanger: false,
    onConfirm: () => {}
  });

  const fetchUserRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profil } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profil?.role) setUserRole(profil.role.toUpperCase());
    } else {
      setUserRole('');
    }
  };

  const fetchDataDashboard = async () => {
    setIsLoading(true);

    let query = supabase
      .from('transaksi')
      .select('*, kegiatan(nama_kegiatan), kategori(nama_kategori)')
      .order('tanggal_transaksi', { ascending: true })
      .order('created_at', { ascending: true });

    if (start) query = query.gte('tanggal_transaksi', start);
    if (end) query = query.lte('tanggal_transaksi', end);

    const { data, error } = await query;

    if (!error && data) {
      let filteredData = data as Transaksi[];

      // Filter pencarian teks di client (mencakup detail_transaksi, nama_kategori, nama_kegiatan, jenis_transaksi)
      if (q) {
        const queryLower = q.toLowerCase();
        filteredData = filteredData.filter((item) => {
          const detailMatch = item.detail_transaksi?.toLowerCase().includes(queryLower);
          const kategoriMatch = item.kategori?.nama_kategori?.toLowerCase().includes(queryLower);
          const kegiatanMatch = item.kegiatan?.nama_kegiatan?.toLowerCase().includes(queryLower);
          const jenisMatch = item.jenis_transaksi?.toLowerCase().includes(queryLower);
          return detailMatch || kategoriMatch || kegiatanMatch || jenisMatch;
        });
      }

      // 1. Hitung total pemasukan, pengeluaran, saldo dari data yang terfilter
      let masuk = 0;
      let keluar = 0;
      const groupedChart: { [key: string]: { tanggal: string; Pemasukan: number; Pengeluaran: number } } = {};

      filteredData.forEach((t) => {
        const nominal = Number(t.jumlah) || 0;
        const tgl = t.tanggal_transaksi;

        if (!groupedChart[tgl]) {
          groupedChart[tgl] = { tanggal: tgl, Pemasukan: 0, Pengeluaran: 0 };
        }

        if (t.jenis_transaksi === 'Pemasukan') {
          masuk += nominal;
          groupedChart[tgl].Pemasukan += nominal;
        } else if (t.jenis_transaksi === 'Pengeluaran') {
          keluar += nominal;
          groupedChart[tgl].Pengeluaran += nominal;
        }
      });

      setTotalMasuk(masuk);
      setTotalKeluar(keluar);
      setTotalSaldo(masuk - keluar);

      // 2. Format data grafik
      setChartData(Object.values(groupedChart));

      // 3. Ambil 5 riwayat terbaru (dibalik agar yang paling baru di atas)
      const listTerbaru = [...filteredData].reverse().slice(0, 5);
      setTransaksi(listTerbaru);
    } else {
      console.error("Gagal mengambil data:", error);
    }

    setIsLoading(false);
  };

  useEffect(() => { 
    fetchDataDashboard(); 
    fetchUserRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserRole();
      } else {
        setUserRole('');
      }
    });

    return () => authListener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, start, end]);

  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';
  const hasActiveFilter = Boolean(q || start || end);

  const handleResetFilter = () => {
    router.push('/');
  };

  const handleHapus = (id: string) => {
    if (!isBisaEdit) {
      alert('Anda tidak memiliki hak akses untuk menghapus transaksi.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan dan akan mempengaruhi saldo akhir.',
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => eksekusiHapus(id)
    });
  };

  const eksekusiHapus = async (id: string) => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchDataDashboard();
  };

  const formatRupiah = (angka: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="space-y-6">
      
      {/* HEADER & FILTER STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard Keuangan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan kondisi finansial organisasi secara real-time.</p>
        </div>

        {hasActiveFilter && (
          <button
            onClick={handleResetFilter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 w-fit"
          >
            <FilterX size={14} /> Reset Filter
          </button>
        )}
      </div>

      {/* 3 KARTU STATISTIK (DASHBOARD CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kartu Saldo Total */}
        <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-800/80">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Saldo Kas</p>
              <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{formatRupiah(totalSaldo)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <Wallet size={24} />
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {hasActiveFilter ? 'Saldo berdasarkan filter aktif' : 'Akumulasi seluruh kas masuk dan keluar'}
          </p>
        </div>

        {/* Kartu Total Pemasukan */}
        <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-800/80">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pemasukan</p>
              <h3 className="text-2xl font-black mt-1 text-emerald-600 dark:text-cyan-400">{formatRupiah(totalMasuk)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ArrowDownToLine size={24} />
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Jumlah total dana masuk (Debit)</p>
        </div>

        {/* Kartu Total Pengeluaran */}
        <div className="p-6 rounded-2xl border shadow-sm relative overflow-hidden transition-colors bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-800/80">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pengeluaran</p>
              <h3 className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{formatRupiah(totalKeluar)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <ArrowUpFromLine size={24} />
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Jumlah total dana keluar (Kredit)</p>
        </div>

      </div>

      {/* GRAFIK TREN MUTASI KAS (LINE CHART) */}
      <div className="p-6 rounded-2xl border shadow-sm transition-colors bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-800/80">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600 dark:text-cyan-400" />
            <h3 className="text-lg font-bold">Tren Mutasi Kas</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {chartData.length} Titik Tanggal
          </span>
        </div>

        <div className="h-72 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-sm opacity-50">Memuat visualisasi grafik...</div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm opacity-50">Tidak ada data untuk ditampilkan dalam grafik.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="tanggal" fontSize={11} tickMargin={8} stroke="#888888" />
                <YAxis fontSize={11} tickFormatter={(val) => `Rp${(val / 1000).toLocaleString()}k`} stroke="#888888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                  formatter={(value: unknown) => [formatRupiah(Number(value) || 0), '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Pengeluaran" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABEL RIWAYAT TERBARU */}
      <div className="rounded-2xl border shadow-sm overflow-hidden transition-colors bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-800/80">
        <div className="p-5 border-b flex justify-between items-center border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold">Riwayat Terbaru</h3>
          <Link href="/laporan" className="px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            Lihat Semua <ArrowRight size={14} className="ml-1.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-xs uppercase tracking-widest border-b bg-gray-50 text-slate-500 border-gray-200 dark:bg-[#111827] dark:text-slate-400 dark:border-slate-800">
                <th className="py-4 px-6 font-semibold">Tanggal</th>
                <th className="py-4 px-6 font-semibold">Deskripsi</th>
                <th className="py-4 px-6 font-semibold">Kategori</th>
                <th className="py-4 px-6 font-semibold text-right">Jumlah</th>
                {isBisaEdit && <th className="py-4 px-6 font-semibold text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={isBisaEdit ? 5 : 4} className="py-12 text-center text-sm opacity-50">Memuat riwayat...</td></tr>
              ) : transaksi.length === 0 ? (
                <tr><td colSpan={isBisaEdit ? 5 : 4} className="py-12 text-center text-sm opacity-50">Tidak ada transaksi ditemukan.</td></tr>
              ) : (
                transaksi.map((item) => {
                  const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                  return (
                    <tr key={item.id_transaksi} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{item.tanggal_transaksi}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.detail_transaksi || item.kegiatan?.nama_kegiatan || '-'}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-md text-xs font-bold border bg-gray-50 border-gray-200 text-gray-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400">
                          {item.kategori?.nama_kategori || '-'}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-right font-black text-sm ${isPemasukan ? 'text-emerald-600 dark:text-cyan-400' : 'text-gray-900 dark:text-white'}`}>
                        {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                      </td>
                      {isBisaEdit && (
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleHapus(item.id_transaksi)} className="p-2 rounded-lg transition-colors text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50" title="Hapus Transaksi">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP KONFIRMASI KUSTOM */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-700">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2 text-gray-900 dark:text-white">{confirmDialog.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">{confirmDialog.message}</p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-[#111827]">
              <button onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))} className="px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border bg-white border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                Batal
              </button>
              <button onClick={confirmDialog.onConfirm} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${confirmDialog.isDanger ? 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600' : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-cyan-500 dark:text-slate-900 dark:hover:bg-cyan-400'}`}>
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm opacity-50">Memuat dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}