"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/DashboardLayout'; // Panggil cangkang layout
import Link from 'next/link';

export default function Dashboard() {
  const [saldo, setSaldo] = useState(0);
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState<any[]>([]);
  const [dataGrafik, setDataGrafik] = useState<any[]>([]);
  const [dataPie, setDataPie] = useState<any[]>([]);
  
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Pantau tema saat komponen dimuat
  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    // Opsional: Observer jika tema berubah tiba-tiba
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const loadTransaksi = useCallback(async () => {
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select(`*, kegiatan ( nama_kegiatan ), kategori ( nama_kategori )`)
      .order('tanggal_transaksi', { ascending: false });
    
    if (transaksi) {
      setRiwayatTransaksi(transaksi.slice(0, 10)); 
      
      let totalMasuk = 0; let totalKeluar = 0;
      const grafikBulanan: Record<string, { name: string; Pemasukan: number; Pengeluaran: number }> = {};
      const pieKategoriRaw: Record<string, number> = {};
      
      transaksi.forEach((t) => {
        const jenis = t.jenis_transaksi.toLowerCase();
        if (jenis === 'pemasukan') totalMasuk += t.jumlah;
        if (jenis === 'pengeluaran') {
          totalKeluar += t.jumlah;
          const kat = t.kategori?.nama_kategori || 'Lainnya';
          pieKategoriRaw[kat] = (pieKategoriRaw[kat] || 0) + t.jumlah;
        }

        const tanggal = new Date(t.tanggal_transaksi);
        const bulan = tanggal.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        
        if (!grafikBulanan[bulan]) grafikBulanan[bulan] = { name: bulan, Pemasukan: 0, Pengeluaran: 0 };
        if (jenis === 'pemasukan') grafikBulanan[bulan].Pemasukan += t.jumlah;
        if (jenis === 'pengeluaran') grafikBulanan[bulan].Pengeluaran += t.jumlah;
      });

      setPemasukan(totalMasuk); setPengeluaran(totalKeluar); setSaldo(totalMasuk - totalKeluar);
      setDataGrafik(Object.values(grafikBulanan).reverse().slice(-6));

      const pieFormatted = Object.keys(pieKategoriRaw).map(key => ({ name: key, value: pieKategoriRaw[key] }));
      setDataPie(pieFormatted);
    }
  }, []);

  useEffect(() => {
    loadTransaksi();
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role?.toUpperCase() || '');
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [loadTransaksi]);

  const handleHapusTransaksi = async (id: string) => {
    const isConfirm = window.confirm('Yakin ingin menghapus transaksi ini?');
    if (!isConfirm) return;
    await supabase.from('transaksi').delete().eq('id_transaksi', id);
    loadTransaksi();
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const formatPendek = (angka: number) => `Rp${(angka / 1000).toLocaleString('id-ID')}k`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-4 rounded-xl shadow-lg border ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-100'}`}>
          <p className={`font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
          <p className={`font-semibold text-sm ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>Pemasukan: {formatRupiah(payload[0].value)}</p>
          <p className={`font-semibold text-sm ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>Pengeluaran: {formatRupiah(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  const PIE_COLORS = ['#06b6d4', '#f43f5e', '#8b5cf6', '#f59e0b', '#10b981']; 
  const textColor = isDarkMode ? '#9ca3af' : '#64748b';
  const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9';
  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  return (
    <DashboardLayout>
      {/* KONTEN EKSKLUSIF DASHBOARD DIMULAI DARI SINI */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Statistik Arus Kas</h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tren Pemasukan & Pengeluaran (6 Bulan Terakhir)</p>
          </div>
        </div>
        <div className="w-full h-[250px]">
          {dataGrafik.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataGrafik} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatPendek} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDarkMode ? '#1e293b' : '#e2e8f0', strokeWidth: 2 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: textColor }} />
                <Line type="monotone" dataKey="Pemasukan" stroke={isDarkMode ? '#22d3ee' : '#0ea5e9'} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Pengeluaran" stroke={isDarkMode ? '#f43f5e' : '#e11d48'} strokeWidth={3} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Memuat grafik...</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Saldo Kas</p>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'}`}><Wallet size={16} /></div>
          </div>
          <h3 className="text-3xl font-black tracking-tight truncate mb-1">{formatRupiah(saldo)}</h3>
          <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total dana tersedia saat ini</p>
          <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${isDarkMode ? 'bg-cyan-500' : 'hidden'}`}></div>
        </div>

        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pemasukan</p>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-100 text-emerald-600'}`}><ArrowDownToLine size={16} /></div>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <h3 className="text-3xl font-black tracking-tight truncate">{formatRupiah(pemasukan)}</h3>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pengeluaran</p>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600'}`}><ArrowUpFromLine size={16} /></div>
          </div>
          <div className="flex items-end gap-2 mb-1">
            <h3 className="text-3xl font-black tracking-tight truncate">{formatRupiah(pengeluaran)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="mb-6">
            <h2 className="text-lg font-bold tracking-tight">Arus Masuk vs Keluar</h2>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Perbandingan volume transaksi per bulan</p>
          </div>
          <div className="w-full h-[220px]">
            {dataGrafik.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataGrafik} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatPendek} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Pemasukan" fill={isDarkMode ? '#22d3ee' : '#0ea5e9'} radius={[2, 2, 0, 0]} maxBarSize={12} />
                  <Bar dataKey="Pengeluaran" fill={isDarkMode ? '#f43f5e' : '#e11d48'} radius={[2, 2, 0, 0]} maxBarSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Data tidak tersedia.</div>
            )}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Alokasi Anggaran</h2>
          </div>
          <div className="flex-1 w-full relative min-h-[180px] flex justify-center items-center mt-4">
            {dataPie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataPie} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {dataPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ borderRadius: '8px', backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none', color: isDarkMode ? '#fff' : '#000' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Keluar</span>
                  <span className="text-sm font-black">{formatPendek(pengeluaran)}</span>
                </div>
              </>
            ) : (
              <div className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Belum ada pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
        <div className={`p-5 flex justify-between items-center border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Riwayat Terbaru</h2>
          </div>
          <Link href="/laporan" className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Lihat Semua</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className={`text-[10px] uppercase tracking-widest ${isDarkMode ? 'bg-[#111827] text-slate-500 border-b border-slate-800' : 'bg-gray-50 text-slate-400 border-b border-gray-100'}`}>
                <th className="py-4 px-6 font-semibold">Tanggal</th>
                <th className="py-4 px-6 font-semibold">Deskripsi</th>
                <th className="py-4 px-6 font-semibold">Kategori</th>
                <th className="py-4 px-6 font-semibold text-right">Jumlah</th>
                {isBisaEdit && <th className="py-4 px-6 font-semibold text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-gray-50'}`}>
              {isLoading ? (
                <tr><td colSpan={isBisaEdit ? 5 : 4} className="py-8 text-center text-sm opacity-50">Memuat data...</td></tr>
              ) : riwayatTransaksi.length === 0 ? (
                <tr><td colSpan={isBisaEdit ? 5 : 4} className="py-8 text-center text-sm opacity-50">Belum ada transaksi.</td></tr>
              ) : (
                riwayatTransaksi.map((item) => {
                  const isPemasukan = item.jenis_transaksi.toLowerCase() === 'pemasukan';
                  return (
                    <tr key={item.id_transaksi} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className={`py-3.5 px-6 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.tanggal_transaksi}</td>
                      <td className="py-3.5 px-6"><p className="text-sm font-bold truncate max-w-[200px]">{item.detail_transaksi || item.kegiatan?.nama_kegiatan || '-'}</p></td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-slate-600'}`}>{item.kategori?.nama_kategori || 'Umum'}</span>
                      </td>
                      <td className={`py-3.5 px-6 text-right text-sm font-black ${isPemasukan ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-600') : ''}`}>
                        {isPemasukan ? '+' : '-'}{formatRupiah(item.jumlah)}
                      </td>
                      {isBisaEdit && (
                        <td className="py-3.5 px-6 text-center">
                          <button onClick={() => handleHapusTransaksi(item.id_transaksi)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-500 hover:text-rose-400 hover:bg-rose-900/30' : 'text-gray-300 hover:text-rose-600 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
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
    </DashboardLayout>
  );
}