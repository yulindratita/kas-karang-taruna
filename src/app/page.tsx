// =================================================================
// DOKUMENTASI: Halaman Dashboard Utama
// =================================================================

import { supabase } from '@/lib/supabase';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, PlusCircle, List } from 'lucide-react';
import Link from 'next/link';
import ActionButtons from '@/components/ActionButtons';

export default async function Home() {
  const { data: transaksi, error } = await supabase
    .from('transaksi')
    .select(`
      *,
      kegiatan ( nama_kegiatan )
    `)
    .order('tanggal_transaksi', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500">Error: {error.message}</div>;
  }

  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  if (transaksi) {
    transaksi.forEach((trx) => {
      if (trx.jenis_transaksi === 'pemasukan') {
        totalPemasukan += Number(trx.jumlah);
      } else if (trx.jenis_transaksi === 'pengeluaran') {
        totalPengeluaran += Number(trx.jumlah);
      }
    });
  }

  const saldoSaatIni = totalPemasukan - totalPengeluaran;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <main className="p-8 md:p-12 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Dashboard & Tombol Aksi */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Keuangan</h1>
            <p className="text-gray-500 mt-1">Ringkasan arus kas organisasi Anda saat ini.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Tombol Kelola Kegiatan */}
            <Link 
              href="/kegiatan" 
              className="flex items-center justify-center px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors shadow-sm"
            >
              <List size={20} className="mr-2" />
              Kelola Kegiatan
            </Link>

            {/* Tombol Catat Transaksi Baru */}
            <Link 
              href="/tambah" 
              className="flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              <PlusCircle size={20} className="mr-2" />
              Catat Transaksi
            </Link>
          </div>
        </div>

        {/* ========================================== */}
        {/* BAGIAN 1: KARTU RINGKASAN (KPI CARDS) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sisa Saldo Saat Ini</p>
              <h2 className="text-2xl font-bold text-gray-800">{formatRupiah(saldoSaatIni)}</h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <ArrowDownToLine size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pemasukan</p>
              <h2 className="text-2xl font-bold text-gray-800">{formatRupiah(totalPemasukan)}</h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <ArrowUpFromLine size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
              <h2 className="text-2xl font-bold text-gray-800">{formatRupiah(totalPengeluaran)}</h2>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BAGIAN 2: TABEL TRANSAKSI TERAKHIR */}
        {/* ========================================== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Aktivitas Terakhir</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 font-medium border-b border-gray-100">Tanggal</th>
                  <th className="p-4 font-medium border-b border-gray-100">Kegiatan</th>
                  <th className="p-4 font-medium border-b border-gray-100">Keterangan</th>
                  <th className="p-4 font-medium border-b border-gray-100">Jenis</th>
                  <th className="p-4 font-medium border-b border-gray-100 text-right">Nominal</th>
                  <th className="p-4 font-medium border-b border-gray-100 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!transaksi || transaksi.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Belum ada transaksi yang dicatat. Silakan klik tombol &quot;Catat Transaksi Baru&quot; di atas.
                    </td>
                  </tr>
                ) : (
                  transaksi.slice(0, 5).map((trx) => (
                    <tr key={trx.id_transaksi} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 border-b border-gray-100 text-sm text-gray-600">
                        {trx.tanggal_transaksi}
                      </td>
                      <td className="p-4 border-b border-gray-100 text-sm text-gray-800 font-medium">
                        {trx.kegiatan?.nama_kegiatan || '-'}
                      </td>
                      <td className="p-4 border-b border-gray-100 text-sm text-gray-600">
                        {trx.detail_transaksi}
                      </td>
                      <td className="p-4 border-b border-gray-100 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          trx.jenis_transaksi === 'pemasukan' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {trx.jenis_transaksi}
                        </span>
                      </td>
                      <td className={`p-4 border-b border-gray-100 text-sm font-bold text-right ${
                        trx.jenis_transaksi === 'pemasukan' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trx.jenis_transaksi === 'pemasukan' ? '+' : '-'}{formatRupiah(Number(trx.jumlah))}
                      </td>
                      <td className="p-4 border-b border-gray-100 text-center">
                        <ActionButtons id={trx.id_transaksi} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}