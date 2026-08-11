"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Printer, Filter, CalendarDays, FileSpreadsheet, ChevronDown, CheckSquare, Square, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

export default function BukuBesar() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedKegiatan, setSelectedKegiatan] = useState<string[]>([]);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // State Pop-up Konfirmasi Kustom
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Ya, Lanjutkan', isDanger: false, onConfirm: () => {}
  });

  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
        if (data) setUserRole(data.role?.toUpperCase() || '');
      }
      const { data: dataKeg } = await supabase.from('kegiatan').select('id_kegiatan, nama_kegiatan');
      if (dataKeg) setKegiatanList(dataKeg);
      const { data: dataKat } = await supabase.from('kategori').select('*');
      if (dataKat) setKategoriList(dataKat);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const toggleKegiatan = (id: string) => setSelectedKegiatan(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

  const bukaModalEdit = (transaksi: any) => {
    setEditForm({
      id_transaksi: transaksi.id_transaksi, tanggal_transaksi: transaksi.tanggal_transaksi,
      jenis_transaksi: transaksi.jenis_transaksi, id_kegiatan: transaksi.id_kegiatan,
      id_kategori: transaksi.id_kategori, jumlah: transaksi.jumlah, detail_transaksi: transaksi.detail_transaksi || ''
    });
    setIsEditModalOpen(true);
  };

  // --- ALUR SIMPAN EDIT ---
  const handleSimpanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: 'Simpan Perubahan',
      message: 'Apakah Anda yakin ingin menyimpan perubahan pada mutasi kas ini? Perhitungan saldo akan langsung menyesuaikan.',
      confirmText: 'Ya, Simpan',
      isDanger: false,
      onConfirm: eksekusiSimpanEdit
    });
  };

  const eksekusiSimpanEdit = async () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setIsSaving(true);
    const { error } = await supabase.from('transaksi').update({
      tanggal_transaksi: editForm.tanggal_transaksi, jenis_transaksi: editForm.jenis_transaksi,
      id_kegiatan: editForm.id_kegiatan, id_kategori: editForm.id_kategori,
      jumlah: editForm.jumlah, detail_transaksi: editForm.detail_transaksi
    }).eq('id_transaksi', editForm.id_transaksi);
    
    setIsSaving(false);
    if (error) alert('Gagal memperbarui: ' + error.message);
    else { setIsEditModalOpen(false); fetchTransaksi(); }
  };

  // --- ALUR HAPUS ---
  const handleHapus = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi',
      message: 'Anda yakin ingin menghapus catatan mutasi kas ini secara permanen? Data yang dihapus tidak dapat dikembalikan.',
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: () => eksekusiHapus(id)
    });
  };

  const eksekusiHapus = async (id: string) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchTransaksi();
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
    link.href = url; link.download = `Laporan_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  let saldoBerjalan = 0;
  const totalMasuk = transaksiList.filter(t => t.jenis_transaksi === 'Pemasukan').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalKeluar = transaksiList.filter(t => t.jenis_transaksi === 'Pengeluaran').reduce((acc, curr) => acc + curr.jumlah, 0);
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  const kategoriTersaring = kategoriList.filter(k => k.jenis === editForm.jenis_transaksi);
  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  return (
    <DashboardLayout>
      <div className="print:bg-white print:text-black space-y-6">
        
        <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Buku Besar Kas</h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Rekapitulasi seluruh mutasi keuangan organisasi</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleExportExcel} className={`flex-1 md:flex-none flex justify-center items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              <FileSpreadsheet size={16} className="mr-2" /> Excel
            </button>
            <button onClick={handlePrintPDF} className={`flex-1 md:flex-none flex justify-center items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
              <Printer size={16} className="mr-2" /> Cetak PDF
            </button>
          </div>
        </div>

        <div className={`print:hidden p-5 rounded-2xl border shadow-sm flex flex-col lg:flex-row gap-4 lg:items-end transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="w-full lg:w-1/3 flex gap-3">
            <div className="flex-1">
              <label className={`block text-xs font-bold mb-1.5 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}><CalendarDays size={14} className="mr-1"/> Mulai</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} />
            </div>
            <div className="flex-1">
              <label className={`block text-xs font-bold mb-1.5 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}><CalendarDays size={14} className="mr-1"/> Sampai</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} />
            </div>
          </div>
          <div className="w-full lg:w-1/3 relative" ref={dropdownRef}>
            <label className={`block text-xs font-bold mb-1.5 flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}><Filter size={14} className="mr-1"/> Filter Kegiatan</label>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full flex justify-between items-center p-2.5 border rounded-xl outline-none font-medium text-sm text-left transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
              <span className="truncate">{selectedKegiatan.length === 0 ? "Semua Kegiatan" : `${selectedKegiatan.length} Dipilih`}</span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className={`absolute z-10 w-full mt-2 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center p-3 cursor-pointer border-b ${isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-100'}`} onClick={() => setSelectedKegiatan([])}>
                  {selectedKegiatan.length === 0 ? <CheckSquare size={18} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={18} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-sm">Semua Kegiatan</span>
                </div>
                {kegiatanList.map(k => (
                  <div key={k.id_kegiatan} className={`flex items-center p-3 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`} onClick={() => toggleKegiatan(k.id_kegiatan)}>
                    {selectedKegiatan.includes(k.id_kegiatan) ? <CheckSquare size={18} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={18} className="text-gray-400 mr-2" />}
                    <span className="text-sm font-medium">{k.nama_kegiatan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`p-6 rounded-2xl border shadow-sm overflow-hidden print:border-none print:shadow-none transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="hidden print:block text-center mb-6 pt-4 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-widest text-black">Buku Besar Kas</h1>
            <p className="mt-1 font-medium text-black">Periode: {startDate} s/d {endDate}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap print:border-collapse print:border print:border-black print:text-black">
              <thead>
                <tr className={`text-xs uppercase tracking-widest border-b print:border-black ${isDarkMode ? 'bg-[#111827] text-slate-400 border-slate-800' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>
                  <th className="py-4 px-4 font-semibold text-center print:border print:border-black">No</th>
                  <th className="py-4 px-4 font-semibold print:border print:border-black">Tanggal</th>
                  <th className="py-4 px-4 font-semibold print:border print:border-black">Uraian Transaksi</th>
                  <th className="py-4 px-4 font-semibold text-right print:border print:border-black">Masuk (Debit)</th>
                  <th className="py-4 px-4 font-semibold text-right print:border print:border-black">Keluar (Kredit)</th>
                  <th className="py-4 px-4 font-semibold text-right print:border print:border-black">Saldo</th>
                  {isBisaEdit && <th className="py-4 px-4 font-semibold text-center print:hidden">Aksi</th>}
                </tr>
              </thead>
              <tbody className={`divide-y print:divide-black ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {isLoading ? (<tr><td colSpan={isBisaEdit ? 7 : 6} className="py-12 text-center text-sm opacity-50">Memuat data...</td></tr>) 
                : transaksiList.length === 0 ? (<tr><td colSpan={isBisaEdit ? 7 : 6} className="py-12 text-center text-sm opacity-50">Tidak ada transaksi.</td></tr>) 
                : (
                  transaksiList.map((item, index) => {
                    const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                    if (isPemasukan) saldoBerjalan += item.jumlah; else saldoBerjalan -= item.jumlah;
                    return (
                      <tr key={item.id_transaksi} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 px-4 text-center text-xs print:border print:border-black">{index + 1}</td>
                        <td className={`py-3 px-4 text-xs font-medium print:border print:border-black ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.tanggal_transaksi}</td>
                        <td className="py-3 px-4 print:border print:border-black">
                          <p className="font-bold text-sm truncate max-w-[220px]">{item.kategori?.nama_kategori}</p>
                          {item.detail_transaksi && <p className={`text-xs mt-0.5 truncate max-w-[250px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.detail_transaksi}</p>}
                          <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>{item.kegiatan?.nama_kegiatan}</span>
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-semibold print:border print:border-black ${isPemasukan ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-600') : (isDarkMode ? 'text-slate-600' : 'text-slate-300')}`}>
                          {isPemasukan ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-semibold print:border print:border-black ${!isPemasukan ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : (isDarkMode ? 'text-slate-600' : 'text-slate-300')}`}>
                          {!isPemasukan ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-black print:border print:border-black ${isDarkMode ? 'bg-[#111827]/50' : 'bg-gray-50'}`}>
                          {formatRupiah(saldoBerjalan)}
                        </td>
                        {isBisaEdit && (
                          <td className="py-3 px-4 text-center print:hidden">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => bukaModalEdit(item)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-950/50' : 'text-blue-600 hover:bg-blue-50'}`}><Edit size={16} /></button>
                              <button onClick={() => handleHapus(item.id_transaksi)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
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
                  <tr className={`font-bold border-t-2 print:border-black print:text-black ${isDarkMode ? 'bg-[#111827] border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                    <td colSpan={3} className="py-4 px-4 text-right text-sm print:border print:border-black">TOTAL MUTASI:</td>
                    <td className={`py-4 px-4 text-right text-sm print:border print:border-black ${isDarkMode ? 'text-cyan-400' : 'text-emerald-700'}`}>{formatRupiah(totalMasuk)}</td>
                    <td className={`py-4 px-4 text-right text-sm print:border print:border-black ${isDarkMode ? 'text-rose-400' : 'text-rose-700'}`}>{formatRupiah(totalKeluar)}</td>
                    <td className="py-4 px-4 print:border print:border-black"></td>
                    {isBisaEdit && <td className="py-4 px-4 print:hidden"></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="text-lg font-black tracking-tight">Edit Transaksi</h3>
              <button onClick={() => setIsEditModalOpen(false)} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-black'}`}><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="form-edit" onSubmit={handleSimpanEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tanggal</label>
                    <input type="date" value={editForm.tanggal_transaksi} onChange={(e) => setEditForm({...editForm, tanggal_transaksi: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Jenis Kas</label>
                    <select value={editForm.jenis_transaksi} onChange={(e) => setEditForm({...editForm, jenis_transaksi: e.target.value, id_kategori: ''})} className={`w-full p-2.5 border rounded-xl outline-none font-bold text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`}>
                      <option value="Pemasukan">Pemasukan (+)</option>
                      <option value="Pengeluaran">Pengeluaran (-)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Pilih Kegiatan</label>
                  <select value={editForm.id_kegiatan} onChange={(e) => setEditForm({...editForm, id_kegiatan: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required>
                    {kegiatanList.map((k) => <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kategori</label>
                  <select value={editForm.id_kategori} onChange={(e) => setEditForm({...editForm, id_kategori: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required>
                    <option value="" disabled>-- Pilih Kategori --</option>
                    {kategoriTersaring.map((k) => <option key={k.id_kategori} value={k.id_kategori}>{k.nama_kategori}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nominal (Rp)</label>
                  <input type="number" min="0" value={editForm.jumlah} onChange={(e) => setEditForm({...editForm, jumlah: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-black text-lg transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Keterangan / Detail</label>
                  <textarea rows={2} value={editForm.detail_transaksi} onChange={(e) => setEditForm({...editForm, detail_transaksi: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none text-sm resize-none transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`}></textarea>
                </div>
              </form>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Batal</button>
              <button type="submit" form="form-edit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-sm ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP KONFIRMASI KUSTOM */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity print:hidden">
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