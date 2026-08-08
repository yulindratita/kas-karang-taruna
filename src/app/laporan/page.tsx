"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Filter, CalendarDays, FileSpreadsheet, ChevronDown, CheckSquare, Square, Edit, Trash2, X } from 'lucide-react';

export default function BukuBesar() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  
  // Hak Akses State
  const [userRole, setUserRole] = useState('');

  // Setup Default Tanggal
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedKegiatan, setSelectedKegiatan] = useState<string[]>([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- STATE UNTUK MODAL EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Cek Role dan Ambil Master Data
  useEffect(() => {
    const fetchInitialData = async () => {
      // Cek sesi dan role untuk memunculkan tombol aksi
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role?.toUpperCase() || '');
      }

      // Ambil daftar kegiatan & kategori
      const { data: dataKeg } = await supabase.from('kegiatan').select('id_kegiatan, nama_kegiatan');
      if (dataKeg) setKegiatanList(dataKeg);

      const { data: dataKat } = await supabase.from('kategori').select('*');
      if (dataKat) setKategoriList(dataKat);
    };
    fetchInitialData();
  }, []);

  // Tutup dropdown klik luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi Tarik Data Transaksi
  const fetchTransaksi = async () => {
    setIsLoading(true);
    let query = supabase
      .from('transaksi')
      .select(`*, kegiatan(nama_kegiatan), kategori(nama_kategori)`)
      .order('tanggal_transaksi', { ascending: true })
      .gte('tanggal_transaksi', startDate)
      .lte('tanggal_transaksi', endDate);

    if (selectedKegiatan.length > 0) query = query.in('id_kegiatan', selectedKegiatan);

    const { data, error } = await query;
    if (!error) setTransaksiList(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransaksi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedKegiatan]);

  const toggleKegiatan = (id: string) => {
    setSelectedKegiatan(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // --- FUNGSI HAPUS ---
  const handleHapus = async (id: string) => {
    const isConfirm = window.confirm('Yakin ingin menghapus secara permanen transaksi ini dari Buku Besar?');
    if (!isConfirm) return;

    const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      fetchTransaksi(); // Refresh data otomatis
    }
  };

  // --- FUNGSI BUKA MODAL EDIT ---
  const bukaModalEdit = (transaksi: any) => {
    setEditForm({
      id_transaksi: transaksi.id_transaksi,
      tanggal_transaksi: transaksi.tanggal_transaksi,
      jenis_transaksi: transaksi.jenis_transaksi,
      id_kegiatan: transaksi.id_kegiatan,
      id_kategori: transaksi.id_kategori,
      jumlah: transaksi.jumlah,
      detail_transaksi: transaksi.detail_transaksi || ''
    });
    setIsEditModalOpen(true);
  };

  // --- FUNGSI SIMPAN EDIT ---
  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from('transaksi')
      .update({
        tanggal_transaksi: editForm.tanggal_transaksi,
        jenis_transaksi: editForm.jenis_transaksi,
        id_kegiatan: editForm.id_kegiatan,
        id_kategori: editForm.id_kategori,
        jumlah: editForm.jumlah,
        detail_transaksi: editForm.detail_transaksi
      })
      .eq('id_transaksi', editForm.id_transaksi);

    setIsSaving(false);

    if (error) {
      alert('Gagal memperbarui: ' + error.message);
    } else {
      setIsEditModalOpen(false);
      fetchTransaksi(); // Refresh data setelah diedit
    }
  };

  const handlePrintPDF = () => window.print();

  const handleExportExcel = () => {
    if (transaksiList.length === 0) return alert('Tidak ada data.');
    const headers = ["No", "Tanggal", "Kegiatan", "Kategori", "Keterangan", "Masuk (Debit)", "Keluar (Kredit)", "Saldo"];
    let csv = headers.join(",") + "\n";
    let saldo = 0;

    transaksiList.forEach((row, index) => {
      const masuk = row.jenis_transaksi === 'Pemasukan' ? row.jumlah : 0;
      const keluar = row.jenis_transaksi === 'Pengeluaran' ? row.jumlah : 0;
      saldo += (masuk - keluar);
      const ket = `"${(row.detail_transaksi || '').replace(/"/g, '""')}"`;
      const keg = `"${(row.kegiatan?.nama_kegiatan || '').replace(/"/g, '""')}"`;
      const kat = `"${(row.kategori?.nama_kategori || '').replace(/"/g, '""')}"`;
      csv += `${index + 1},${row.tanggal_transaksi},${keg},${kat},${ket},${masuk},${keluar},${saldo}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  let saldoBerjalan = 0;
  const totalMasuk = transaksiList.filter(t => t.jenis_transaksi === 'Pemasukan').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalKeluar = transaksiList.filter(t => t.jenis_transaksi === 'Pengeluaran').reduce((acc, curr) => acc + curr.jumlah, 0);
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // Filter Kategori di Modal
  const kategoriTersaring = kategoriList.filter(k => k.jenis === editForm.jenis_transaksi);
  
  // Cek apakah user punya wewenang edit (Super Admin)
  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen text-gray-900 print:bg-white print:p-0 selection:bg-blue-100">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
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

        {/* FILTER PANEL */}
        <div className="print:hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col lg:flex-row gap-5 items-end">
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

          <div className="w-full lg:w-1/3 relative" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Filter size={14} className="mr-1"/> Filter Kegiatan</label>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex justify-between items-center p-2.5 border border-gray-300 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left"
            >
              <span className="truncate">{selectedKegiatan.length === 0 ? "Semua Kegiatan" : `${selectedKegiatan.length} Kegiatan Dipilih`}</span>
              <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100" onClick={() => setSelectedKegiatan([])}>
                  {selectedKegiatan.length === 0 ? <CheckSquare size={18} className="text-blue-600 mr-2" /> : <Square size={18} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-sm">Semua Kegiatan (Reset)</span>
                </div>
                {kegiatanList.map(k => (
                  <div key={k.id_kegiatan} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer" onClick={() => toggleKegiatan(k.id_kegiatan)}>
                    {selectedKegiatan.includes(k.id_kegiatan) ? <CheckSquare size={18} className="text-blue-600 mr-2" /> : <Square size={18} className="text-gray-400 mr-2" />}
                    <span className="text-sm font-medium">{k.nama_kegiatan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KERTAS BUKU BESAR */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-widest">Buku Besar Kas</h1>
            <p className="text-gray-700 mt-2 font-medium">Periode: <span className="font-bold">{startDate}</span> s/d <span className="font-bold">{endDate}</span></p>
          </div>

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
                  {/* Kolom Aksi Hanya Muncul Jika User = SuperAdmin/Bendahara & Tidak Sedang Di-Print */}
                  {isBisaEdit && <th className="p-3 border border-gray-300 text-sm font-bold text-gray-800 text-center w-24 print:hidden">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={isBisaEdit ? 7 : 6} className="p-8 text-center text-gray-500 font-medium">Memuat data pembukuan...</td></tr>
                ) : transaksiList.length === 0 ? (
                  <tr><td colSpan={isBisaEdit ? 7 : 6} className="p-8 text-center text-gray-500 font-medium">Tidak ada transaksi pada rentang tanggal & filter ini.</td></tr>
                ) : (
                  transaksiList.map((item, index) => {
                    const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                    if (isPemasukan) saldoBerjalan += item.jumlah; else saldoBerjalan -= item.jumlah;

                    return (
                      <tr key={item.id_transaksi} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 border border-gray-300 text-center text-sm">{index + 1}</td>
                        <td className="p-3 border border-gray-300 text-sm whitespace-nowrap">{item.tanggal_transaksi}</td>
                        <td className="p-3 border border-gray-300 text-sm">
                          <span className="font-bold text-gray-900">{item.kategori?.nama_kategori}</span>
                          {item.detail_transaksi && <span className="text-gray-600"> - {item.detail_transaksi}</span>}
                          <span className="block text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">{item.kegiatan?.nama_kegiatan}</span>
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
                        {/* Tombol Aksi di Buku Besar */}
                        {isBisaEdit && (
                          <td className="p-2 border border-gray-300 text-center print:hidden">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => bukaModalEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Transaksi">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleHapus(item.id_transaksi)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Hapus Transaksi">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {transaksiList.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={3} className="p-3 border border-gray-300 text-right uppercase text-sm">Total Mutasi:</td>
                    <td className="p-3 border border-gray-300 text-right text-emerald-700 whitespace-nowrap">{formatRupiah(totalMasuk)}</td>
                    <td className="p-3 border border-gray-300 text-right text-rose-700 whitespace-nowrap">{formatRupiah(totalKeluar)}</td>
                    <td className="p-3 border border-gray-300 bg-gray-200"></td>
                    {isBisaEdit && <td className="p-3 border border-gray-300 bg-gray-200 print:hidden"></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="hidden print:flex justify-end mt-16 pt-8 break-inside-avoid">
            <div className="text-center w-64">
              <p className="mb-20 font-medium">Mengetahui,<br/>Bendahara</p>
              <p className="font-bold underline uppercase">( ....................................... )</p>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL EDIT TRANSAKSI (Hanya Muncul Jika isEditModalOpen = true) */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-900">Edit Transaksi</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="form-edit" onSubmit={handleSimpanEdit} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal</label>
                    <input type="date" value={editForm.tanggal_transaksi} onChange={(e) => setEditForm({...editForm, tanggal_transaksi: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-medium text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Kas</label>
                    <select value={editForm.jenis_transaksi} onChange={(e) => setEditForm({...editForm, jenis_transaksi: e.target.value, id_kategori: ''})} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-bold text-sm">
                      <option value="Pemasukan">Pemasukan (+)</option>
                      <option value="Pengeluaran">Pengeluaran (-)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Kegiatan</label>
                  <select value={editForm.id_kegiatan} onChange={(e) => setEditForm({...editForm, id_kegiatan: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-medium text-sm" required>
                    {kegiatanList.map((k) => <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                  <select value={editForm.id_kategori} onChange={(e) => setEditForm({...editForm, id_kategori: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-medium text-sm" required>
                    <option value="" disabled>-- Pilih Kategori --</option>
                    {kategoriTersaring.map((k) => <option key={k.id_kategori} value={k.id_kategori}>{k.nama_kategori}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nominal (Rp)</label>
                  <input type="number" min="0" value={editForm.jumlah} onChange={(e) => setEditForm({...editForm, jumlah: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-black text-lg" required />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Keterangan / Detail</label>
                  <textarea rows={2} value={editForm.detail_transaksi} onChange={(e) => setEditForm({...editForm, detail_transaksi: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none text-sm resize-none"></textarea>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                Batal
              </button>
              <button type="submit" form="form-edit" disabled={isSaving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-sm flex items-center">
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}