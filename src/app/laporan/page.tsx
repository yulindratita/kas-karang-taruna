"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, FileText, Filter, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Laporan() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // State Data
  const [transaksiMentah, setTransaksiMentah] = useState<any[]>([]);
  const [transaksiFilter, setTransaksiFilter] = useState<any[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  
  // State Filter (Default: Bulan & Tahun saat ini)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1); // 1 - 12
  const [tahun, setTahun] = useState(new Date().getFullYear());

  // State Ringkasan
  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 });

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const namaBulan = [
    "Semua Bulan", "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Akses Ditolak! Anda harus login sebagai admin.');
        router.push('/login');
        return;
      }
      setAdminEmail(session.user.email || 'Admin');

      const { data } = await supabase
        .from('transaksi')
        .select(`*, kegiatan ( nama_kegiatan )`)
        .order('tanggal_transaksi', { ascending: false });

      if (data) {
        setTransaksiMentah(data);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    if (transaksiMentah.length === 0) return;

    const dataTersaring = transaksiMentah.filter((t) => {
      const [y, m] = t.tanggal_transaksi.split('-');
      const filterTahun = parseInt(y) === tahun;
      const filterBulan = bulan === 0 ? true : parseInt(m) === bulan; 
      return filterTahun && filterBulan;
    });

    setTransaksiFilter(dataTersaring);

    let masuk = 0;
    let keluar = 0;
    dataTersaring.forEach((t) => {
      if (t.jenis_transaksi.toLowerCase() === 'pemasukan') masuk += t.jumlah;
      if (t.jenis_transaksi.toLowerCase() === 'pengeluaran') keluar += t.jumlah;
    });

    setSummary({ pemasukan: masuk, pengeluaran: keluar, saldo: masuk - keluar });
  }, [transaksiMentah, bulan, tahun]);


  // EKSPOR EXCEL (Dengan Urutan Kolom Baru)
  const exportToExcel = () => {
    const dataToExport: any[] = transaksiFilter.map((t, index) => ({
      'No': index + 1,
      'Tanggal': t.tanggal_transaksi,
      'Kegiatan': t.kegiatan?.nama_kegiatan || 'Kegiatan Dihapus',
      'Jenis Transaksi (D/K)': t.jenis_transaksi,
      'Keterangan': t.detail_transaksi,
      'Nominal (Rp)': t.jumlah
    }));

    dataToExport.push({});
    dataToExport.push({ 'Keterangan': 'TOTAL PEMASUKAN', 'Nominal (Rp)': summary.pemasukan });
    dataToExport.push({ 'Keterangan': 'TOTAL PENGELUARAN', 'Nominal (Rp)': summary.pengeluaran });
    dataToExport.push({ 'Keterangan': 'SALDO AKHIR', 'Nominal (Rp)': summary.saldo });
    dataToExport.push({});
    dataToExport.push({ 'No': 'Dicetak Oleh:', 'Tanggal': adminEmail });
    dataToExport.push({ 'No': 'Periode:', 'Tanggal': `${bulan === 0 ? 'Semua Bulan' : namaBulan[bulan]} ${tahun}` });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan');
    
    XLSX.writeFile(workbook, `Laporan_Kas_${namaBulan[bulan]}_${tahun}.xlsx`);
  };

  // EKSPOR PDF (Dengan Urutan Kolom Baru)
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('Laporan Keuangan Organisasi', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${bulan === 0 ? 'Semua Bulan' : namaBulan[bulan]} ${tahun}`, 14, 26);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 31);
    doc.text(`Dicetak oleh: ${adminEmail}`, 14, 36);

    const tableData = transaksiFilter.map((t, index) => [
      index + 1,
      t.tanggal_transaksi,
      t.kegiatan?.nama_kegiatan || '-',
      t.jenis_transaksi,
      t.detail_transaksi,
      formatRupiah(t.jumlah)
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['No', 'Tanggal', 'Kegiatan', 'Jenis Transaksi (D/K)', 'Keterangan', 'Nominal (Rp)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 42;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Total Pemasukan: ${formatRupiah(summary.pemasukan)}`, 14, finalY + 10);
    doc.text(`Total Pengeluaran: ${formatRupiah(summary.pengeluaran)}`, 14, finalY + 16);
    doc.text(`Saldo Akhir:     ${formatRupiah(summary.saldo)}`, 14, finalY + 22);

    doc.save(`Laporan_Kas_${namaBulan[bulan]}_${tahun}.pdf`);
  };

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900 font-bold mb-6 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Kembali ke Dashboard
        </Link>

        {/* Panel Filter */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
              <Filter size={16} className="mr-2" /> Filter Bulan
            </label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900 font-bold"
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
            >
              {namaBulan.map((nama, i) => (
                <option key={i} value={i}>{nama}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-bold text-gray-900 mb-2">Tahun</label>
            <input 
              type="number" 
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900 font-bold"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Panel Ringkasan Khusus Periode Ini */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
            <p className="text-sm font-bold text-gray-600 mb-1">Saldo Periode Ini</p>
            <p className="text-2xl font-black text-gray-900">{formatRupiah(summary.saldo)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-emerald-500">
            <p className="text-sm font-bold text-gray-600 mb-1">Pemasukan Periode Ini</p>
            <p className="text-2xl font-black text-emerald-700">{formatRupiah(summary.pemasukan)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-rose-500">
            <p className="text-sm font-bold text-gray-600 mb-1">Pengeluaran Periode Ini</p>
            <p className="text-2xl font-black text-rose-700">{formatRupiah(summary.pengeluaran)}</p>
          </div>
        </div>

        {/* Tabel Laporan & Tombol Export */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Buku Besar Transaksi</h1>
              <p className="text-gray-700 text-sm mt-1 font-medium flex items-center">
                <User size={14} className="mr-1" /> Dicetak oleh: <span className="font-bold text-blue-700 ml-1">{adminEmail || 'Memuat...'}</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button onClick={exportToExcel} disabled={isLoading || transaksiFilter.length === 0} className="flex items-center justify-center px-4 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-xl font-black transition-colors disabled:opacity-50">
                <FileSpreadsheet size={18} className="mr-2" /> Unduh Excel
              </button>
              <button onClick={exportToPDF} disabled={isLoading || transaksiFilter.length === 0} className="flex items-center justify-center px-4 py-2.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300 rounded-xl font-black transition-colors disabled:opacity-50">
                <FileText size={18} className="mr-2" /> Unduh PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="py-4 px-3 text-xs font-black text-gray-700 uppercase tracking-wider">No</th>
                  <th className="py-4 px-3 text-xs font-black text-gray-700 uppercase tracking-wider">Tanggal</th>
                  <th className="py-4 px-3 text-xs font-black text-gray-700 uppercase tracking-wider">Kegiatan</th>
                  <th className="py-4 px-3 text-xs font-black text-gray-700 uppercase tracking-wider">Jenis (D/K)</th>
                  <th className="py-4 px-3 text-xs font-black text-gray-700 uppercase tracking-wider">Keterangan</th>
                  <th className="py-4 px-3 text-xs font-black text-gray-700 uppercase tracking-wider text-right">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-900 font-bold">Mengambil data...</td></tr>
                ) : transaksiFilter.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-900 font-bold">Tidak ada transaksi pada periode ini.</td></tr>
                ) : (
                  transaksiFilter.map((item, index) => {
                    const isPemasukan = item.jenis_transaksi.toLowerCase() === 'pemasukan';
                    return (
                      <tr key={item.id_transaksi} className="hover:bg-blue-50/50">
                        <td className="py-4 px-3 text-sm font-bold text-gray-600">
                          {index + 1}
                        </td>
                        <td className="py-4 px-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                          {item.tanggal_transaksi}
                        </td>
                        <td className="py-4 px-3 text-sm font-black text-gray-900">
                          {item.kegiatan?.nama_kegiatan || '-'}
                        </td>
                        <td className="py-4 px-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-black ${isPemasukan ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                            {item.jenis_transaksi}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-sm font-bold text-gray-700">
                          {item.detail_transaksi}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <p className={`font-black text-sm ${isPemasukan ? 'text-emerald-700' : 'text-gray-900'}`}>
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