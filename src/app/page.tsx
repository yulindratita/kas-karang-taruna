"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Trash2, AlertTriangle, ArrowRight, ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Transaksi, StatistikKas } from '@/types';

export default function Dashboard() {
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Statistik Kartu
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Ya, Lanjutkan', isDanger: false, onConfirm: () => {}
  });

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

    // 1. Ambil statistik via Supabase RPC (dengan fallback jika RPC belum dibuat di Supabase)
    const { data: statData, error: statError } = await supabase.rpc('get_statistik_kas');

    if (statData && !statError) {
      const stats = statData as StatistikKas;
      setTotalMasuk(Number(stats.pemasukan) || 0);
      setTotalKeluar(Number(stats.pengeluaran) || 0);
      setTotalSaldo(Number(stats.saldo) || 0);
    } else {
      // Fallback penghitungan jika RPC get_statistik_kas belum terpasang di database Supabase
      const { data: semuaData } = await supabase.from('transaksi').select('jenis_transaksi, jumlah');
      if (semuaData) {
        let masuk = 0;
        let keluar = 0;
        semuaData.forEach((t: { jenis_transaksi: string; jumlah: number }) => {
          if (t.jenis_transaksi === 'Pemasukan') masuk += Number(t.jumlah) || 0;
          else if (t.jenis_transaksi === 'Pengeluaran') keluar += Number(t.jumlah) || 0;
        });
        setTotalMasuk(masuk);
        setTotalKeluar(keluar);
        setTotalSaldo(masuk - keluar);
      }
    }

      if (semuaData) {
        let masuk = 0;
        let keluar = 0;
        const rekapHarian: Record<string, { tanggal: string, Pemasukan: number, Pengeluaran: number }> = {};

    if (riwayatTerbaru) {
      setTransaksi(riwayatTerbaru as Transaksi[]);
    }
    setIsLoading(false);
  };

  useEffect(() => { 
    fetchDataDashboard(); 
  }, []);

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

  const eksekusiHapus = async (id: string) => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchDataDashboard();
  };

  const formatRupiah = (angka: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dashboard Keuangan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan kondisi finansial organisasi secara real-time.</p>
        </div>

        {/* 3 KARTU STATISTIK */}
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
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Akumulasi seluruh kas masuk dan keluar</p>
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
                  <tr><td colSpan={5} className="py-12 text-center text-sm opacity-50">Memuat riwayat...</td></tr>
                ) : transaksi.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-sm opacity-50">Belum ada transaksi tercatat.</td></tr>
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
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleHapus(item.id_transaksi)} className="p-2 rounded-lg transition-colors text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50">
                            <Trash2 size={16} />
                          </button>
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