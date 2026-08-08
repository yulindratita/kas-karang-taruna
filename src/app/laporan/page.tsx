"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Filter, CalendarDays, FileSpreadsheet, ChevronDown, CheckSquare, Square } from 'lucide-react';

export default function BukuBesar() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);

  // Setup Default Tanggal (Tanggal 1 bulan ini sampai tanggal terakhir bulan ini)
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  // State Filter
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  
  // State Multi-Select Kegiatan
  const [selectedKegiatan, setSelectedKegiatan] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil Data Master Kegiatan
  useEffect(() => {
    const fetchKegiatan = async () => {
      const { data } = await supabase.from('kegiatan').select('id_kegiatan, nama_kegiatan');
      if (data) setKegiatanList(data);
    };
    fetchKegiatan();
  }, []);

  // Tutup dropdown jika klik di luar elemen
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ambil Data Transaksi berdasarkan Filter
  useEffect(() => {
    const fetchTransaksi = async () => {
      setIsLoading(true);
      
      // Kueri dasar: Ambil data berelasi dan filter rentang tanggal
      let query = supabase
        .from('transaksi')
        .select(`*, kegiatan(nama_kegiatan), kategori(nama_kategori)`)
        .order('tanggal_transaksi', { ascending: true })
        .gte('tanggal_transaksi', startDate)
        .lte('tanggal_transaksi', endDate);

      // Filter Kegiatan (Hanya terapkan jika ada kegiatan yang dipilih secara spesifik)
      if (selectedKegiatan.length > 0) {
        query = query.in('id_kegiatan', selectedKegiatan);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Gagal mengambil data:", error);
      } else {
        setTransaksiList(data || []);
      }
      setIsLoading(false);
    };

    fetchTransaksi();
  }, [startDate, endDate, selectedKegiatan]);

  // Fungsi Toggle Pilihan Kegiatan
  const toggleKegiatan = (id: string) => {
    setSelectedKegiatan(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Fungsi Cetak PDF (Gunakan fungsi browser bawaan yang sudah di-styling CSS)
  const handlePrintPDF = () => {
    window.print();
  };

  // Fungsi Ekspor ke Excel (Format CSV)
  const handleExportExcel = () => {
    if (transaksiList.length === 0) return alert('Tidak ada data untuk diekspor.');

    const headers = ["No", "Tanggal", "Kegiatan", "Kategori", "Keterangan", "Masuk (Debit)", "Keluar (Kredit)", "Saldo"];
    let csv = headers.join(",") + "\n";
    let saldo = 0;

    transaksiList.forEach((row, index) => {
      const masuk = row.jenis_transaksi === 'Pemasukan' ? row.jumlah : 0;
      const keluar = row.jenis_transaksi === 'Pengeluaran' ? row.jumlah : 0;
      saldo += (masuk - keluar);

      // Membersihkan teks dari koma atau tanda kutip agar tidak merusak format Excel
      const ket = `"${(row.detail_transaksi || '').replace(/"/g, '""')}"`;
      const keg = `"${(row.kegiatan?.nama_kegiatan || '').replace(/"/g, '""')}"`;
      const kat = `"${(row.kategori?.nama_kategori || '').replace(/"/g, '""')}"`;

      csv += `${index + 1},${row.tanggal_transaksi},${keg},${kat},${ket},${masuk},${keluar},${saldo}\n`;
    });

    // Menambahkan BOM agar Excel membaca karakter khusus (UTF-8) dengan benar
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Kas_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hitung Total untuk Summary
  let saldoBerjalan = 0;
  const totalMasuk = transaksiList.filter(t => t.jenis_transaksi === 'Pemasukan').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalKeluar = transaksiList.filter(t => t.jenis_transaksi === 'Pengeluaran').reduce((acc, curr) => acc + curr.jumlah, 0);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen text-gray-900 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Tombol Aksi - Disembunyikan saat Print */}
        <div className="print:hidden mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900 font-bold transition-colors">
            <ArrowLeft size={18} className="mr-2" /> Kembali ke Dashboard
          </Link>
          
          <div className="flex gap-3">
            <button onClick={handleExportExcel} className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-sm text-sm">
              <FileSpreadsheet size={18} className="mr-2" /> Export Excel
            </button>
            <button onClick={handlePrintPDF} className="flex items-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold transition-colors shadow-sm text-sm">
              <Printer size={18} className="mr-2" /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Panel Filter Cerdas - Disembunyikan saat Print */}
        <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col lg:flex-row gap-5 items-end">
          
          {/* Rentang Tanggal */}
          <div className="w-full lg:w-1/3 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><CalendarDays size={14} className="mr-1"/> Mulai Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><CalendarDays size={14} className="mr-1"/> Sampai</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
            </div>
          </div>

          {/* Custom Multi-Select Kegiatan */}
          <div className="w-full lg:w-1/3 relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Filter size={14} className="mr-1"/> Filter Kegiatan</label>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex justify-between items-center p-2.5 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left"
            >
              <span className="truncate">
                {selectedKegiatan.length === 0 
                  ? "Semua Kegiatan" 
                  : `${selectedKegiatan.length} Kegiatan Dipilih`}
              </span>
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div 
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => setSelectedKegiatan([])}
                >
                  {selectedKegiatan.length === 0 ? <CheckSquare size={18} className="text-blue-600 mr-2" /> : <Square size={18} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-sm">Semua Kegiatan (Reset)</span>
                </div>
                {kegiatanList.map(k => (
                  <div 
                    key={k.id_kegiatan} 
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleKegiatan(k.id_kegiatan)}
                  >
                    {selectedKegiatan.includes(k.id_kegiatan) ? <CheckSquare size={18} className="text-blue-600 mr-2" /> : <Square size={18} className="text-gray-400 mr-2" />}
                    <span className="text-sm font-medium">{k.nama_kegiatan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* Kertas Laporan (Buku Besar) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
          
          {/* Kop Laporan */}
          <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-widest">Buku Besar Kas</h1>
            <p className="text-gray-700 mt-2 font-medium">
              Periode: <span className="font-bold">{startDate}</span> s/d <span className="font-bold">{endDate}</span>
            </p>
            {selectedKegiatan.length > 0 && (
              <p className="text-blue-600 font-bold mt-1 text-sm">
                Filter Kegiatan Aktif ({selectedKegiatan.length})
              </p>
            )}
          </div>

          {/* Tabel Buku Besar */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 text-center w-12">No</th>
                  <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 w-28 whitespace-nowrap">Tanggal</th>
                  <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 min-w-[200px]">Uraian Transaksi</th>
                  <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 text-right w-36 whitespace-nowrap">Debit (Masuk)</th>
                  <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 text-right w-36 whitespace-nowrap">Kredit (Keluar)</th>
                  <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 text-right w-36 whitespace-nowrap">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Memuat data pembukuan...</td></tr>
                ) : transaksiList.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Tidak ada transaksi pada rentang tanggal & filter ini.</td></tr>
                ) : (
                  transaksiList.map((item, index) => {
                    const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                    if (isPemasukan) {
                      saldoBerjalan += item.jumlah;
                    } else {
                      saldoBerjalan -= item.jumlah;
                    }

                    return (
                      <tr key={item.id_transaksi} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 border border-gray-300 text-center text-sm">{index + 1}</td>
                        <td className="p-3 border border-gray-300 text-sm whitespace-nowrap">{item.tanggal_transaksi}</td>
                        <td className="p-3 border border-gray-300 text-sm">
                          <span className="font-bold text-gray-900">{item.kategori?.nama_kategori}</span>
                          {item.detail_transaksi && <span className="text-gray-600"> - {item.detail_transaksi}</span>}
                          <span className="block text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">
                            {item.kegiatan?.nama_kegiatan}
                          </span>
                        </td>
                        <td className="p-3 border border-gray-300 text-sm text-right font-medium text-emerald-600 whitespace-nowrap">
                          {isPemasukan ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className="p-3 border border-gray-300 text-sm text-right font-medium text-rose-600 whitespace-nowrap">
                          {!isPemasukan ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className="p-3 border border-gray-300 text-sm text-right font-black bg-gray-50 whitespace-nowrap">
                          {formatRupiah(saldoBerjalan)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Footer Tabel */}
              {transaksiList.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={3} className="p-3 border border-gray-300 text-right uppercase text-sm">Total Mutasi:</td>
                    <td className="p-3 border border-gray-300 text-right text-emerald-700 whitespace-nowrap">{formatRupiah(totalMasuk)}</td>
                    <td className="p-3 border border-gray-300 text-right text-rose-700 whitespace-nowrap">{formatRupiah(totalKeluar)}</td>
                    <td className="p-3 border border-gray-300 bg-gray-200"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Kolom Tanda Tangan (Khusus Print / PDF) */}
          <div className="hidden print:flex justify-end mt-16 pt-8 break-inside-avoid">
            <div className="text-center w-64">
              <p className="mb-20 font-medium">Mengetahui,<br/>Bendahara</p>
              <p className="font-bold underline uppercase">( ....................................... )</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}