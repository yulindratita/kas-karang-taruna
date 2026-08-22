"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Printer, Filter, CalendarDays, FileSpreadsheet, ChevronDown, CheckSquare, Square, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Divisi, Kegiatan, SubKegiatan, Kategori } from '@/types';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export default function BukuBesar() {
  const router = useRouter();
  const dialog = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(true);
  
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  
  const [userRole, setUserRole] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Default Filter Tanggal
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  // State Filter
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedDivisi, setSelectedDivisi] = useState<string[]>([]);
  const [selectedKegiatan, setSelectedKegiatan] = useState<string[]>([]);
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<string[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string[]>([]);
  
  // State Dropdown Filter
  const [isDropdownDivOpen, setIsDropdownDivOpen] = useState(false);
  const [isDropdownKegOpen, setIsDropdownKegOpen] = useState(false);
  const [isDropdownSubOpen, setIsDropdownSubOpen] = useState(false);
  const [isDropdownKatOpen, setIsDropdownKatOpen] = useState(false);
  
  const dropdownDivRef = useRef<HTMLDivElement>(null);
  const dropdownKegRef = useRef<HTMLDivElement>(null);
  const dropdownSubRef = useRef<HTMLDivElement>(null);
  const dropdownKatRef = useRef<HTMLDivElement>(null);

  // State Paginasi
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // State Modal Edit & Konfirmasi
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

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

      const { data: dataDiv } = await supabase.from('divisi').select('*').order('nama_divisi', { ascending: true });
      if (dataDiv) setDivisiList(dataDiv);

      const { data: dataKeg } = await supabase.from('kegiatan').select('*').order('nama_kegiatan', { ascending: true });
      if (dataKeg) setKegiatanList(dataKeg);

      const { data: dataSub } = await supabase.from('sub_kegiatan').select('*').order('nama_sub_kegiatan', { ascending: true });
      if (dataSub) setSubKegiatanList(dataSub);

      const { data: dataKat } = await supabase.from('kategori').select('*').order('nama_kategori', { ascending: true });
      if (dataKat) setKategoriList(dataKat);
    };
    fetchInitialData();
  }, []);

  // Menutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownDivRef.current && !dropdownDivRef.current.contains(event.target as Node)) setIsDropdownDivOpen(false);
      if (dropdownKegRef.current && !dropdownKegRef.current.contains(event.target as Node)) setIsDropdownKegOpen(false);
      if (dropdownSubRef.current && !dropdownSubRef.current.contains(event.target as Node)) setIsDropdownSubOpen(false);
      if (dropdownKatRef.current && !dropdownKatRef.current.contains(event.target as Node)) setIsDropdownKatOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTransaksi = async () => {
    setIsLoading(true);
    let query = supabase
      .from('transaksi')
      .select(`*, divisi(nama_divisi), kegiatan(nama_kegiatan), sub_kegiatan(nama_sub_kegiatan), kategori(nama_kategori)`)
      .order('tanggal_transaksi', { ascending: true })
      .gte('tanggal_transaksi', startDate)
      .lte('tanggal_transaksi', endDate);

    if (selectedDivisi.length > 0) query = query.in('id_divisi', selectedDivisi);
    if (selectedKegiatan.length > 0) query = query.in('id_kegiatan', selectedKegiatan);
    if (selectedSubKegiatan.length > 0) query = query.in('id_sub_kegiatan', selectedSubKegiatan);
    if (selectedKategori.length > 0) query = query.in('id_kategori', selectedKategori);

    const { data, error } = await query;
    if (!error) {
      setTransaksiList(data || []);
      setCurrentPage(1);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransaksi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedDivisi, selectedKegiatan, selectedSubKegiatan, selectedKategori]);

  const toggleDivisi = (id: string) => setSelectedDivisi(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleKegiatan = (id: string) => {
    setSelectedKegiatan(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      // Reset sub-kegiatan tersaring jika kegiatan diubah
      setSelectedSubKegiatan([]);
      return next;
    });
  };
  const toggleSubKegiatan = (id: string) => setSelectedSubKegiatan(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleKategori = (id: string) => setSelectedKategori(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

  // Sub-kegiatan yang relevan dengan filter kegiatan aktif
  const subKegiatanTersaringFilter = selectedKegiatan.length > 0
    ? subKegiatanList.filter(s => selectedKegiatan.includes(s.id_kegiatan))
    : subKegiatanList;

  const bukaModalEdit = (transaksi: any) => {
    setEditForm({
      id_transaksi: transaksi.id_transaksi,
      tanggal_transaksi: transaksi.tanggal_transaksi,
      jenis_transaksi: transaksi.jenis_transaksi,
      id_divisi: transaksi.id_divisi || '',
      id_kegiatan: transaksi.id_kegiatan || '',
      id_sub_kegiatan: transaksi.id_sub_kegiatan || '',
      id_kategori: transaksi.id_kategori || '',
      jumlah: transaksi.jumlah,
      detail_transaksi: transaksi.detail_transaksi || ''
    });
    setIsEditModalOpen(true);
  };

    const handleSimpanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    dialog.openDialog(
      'Simpan Perubahan',
      'Apakah Anda yakin ingin menyimpan perubahan pada mutasi kas ini?',
      eksekusiSimpanEdit,
      { confirmText: 'Ya, Simpan' }
    );
  };

  const eksekusiSimpanEdit = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('transaksi').update({
      tanggal_transaksi: editForm.tanggal_transaksi,
      jenis_transaksi: editForm.jenis_transaksi,
      id_divisi: editForm.id_divisi || null,
      id_kegiatan: editForm.id_kegiatan,
      id_sub_kegiatan: editForm.id_sub_kegiatan || null,
      id_kategori: editForm.id_kategori,
      jumlah: editForm.jumlah,
      detail_transaksi: editForm.detail_transaksi || null
    }).eq('id_transaksi', editForm.id_transaksi);
    
    setIsSaving(false);
    if (error) dialog.showError('Gagal', 'Gagal memperbarui: ' + error.message);
    else { setIsEditModalOpen(false); fetchTransaksi(); }
  };

  const handleHapus = (id: string) => {
    dialog.openDialog(
      'Hapus Transaksi',
      'Anda yakin ingin menghapus catatan mutasi kas ini secara permanen?',
      () => eksekusiHapus(id),
      { confirmText: 'Ya, Hapus', variant: 'danger' }
    );
  };

  const eksekusiHapus = async (id: string) => {
    const { error } = await supabase.from('transaksi').delete().eq('id_transaksi', id);
    if (error) dialog.showError('Gagal', 'Gagal menghapus: ' + error.message);
    else fetchTransaksi();
  };

  const handlePrintPDF = () => window.print();

  const handleExportExcel = () => {
    if (transaksiList.length === 0) return dialog.showWarning('Peringatan', 'Tidak ada data.');
    const printDate = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    const separator = ';'; 
    let csv = `Laporan Buku Besar Kas\n`;
    csv += `Periode:;${startDate} s/d ${endDate}\n`;
    csv += `Dicetak pada:;${printDate}\n\n`;

    const headers = ["No", "Tanggal", "Divisi", "Kegiatan Utama", "Sub Kegiatan", "Kategori", "Keterangan", "Masuk (Debit)", "Keluar (Kredit)", "Saldo"];
    csv += headers.join(separator) + "\n";

    let saldo = 0;
    let totalMasuk = 0;
    let totalKeluar = 0;

    transaksiList.forEach((row, index) => {
      const masuk = row.jenis_transaksi === 'Pemasukan' ? row.jumlah : 0;
      const keluar = row.jenis_transaksi === 'Pengeluaran' ? row.jumlah : 0;
      saldo += (masuk - keluar);
      totalMasuk += masuk;
      totalKeluar += keluar;
      
      const div = `"${(row.divisi?.nama_divisi || '-').replace(/"/g, '""')}"`;
      const keg = `"${(row.kegiatan?.nama_kegiatan || '-').replace(/"/g, '""')}"`;
      const sub = `"${(row.sub_kegiatan?.nama_sub_kegiatan || '-').replace(/"/g, '""')}"`;
      const kat = `"${(row.kategori?.nama_kategori || '-').replace(/"/g, '""')}"`;
      const ket = `"${(row.detail_transaksi || '').replace(/"/g, '""')}"`;
      
      csv += `${index + 1}${separator}${row.tanggal_transaksi}${separator}${div}${separator}${keg}${separator}${sub}${separator}${kat}${separator}${ket}${separator}${masuk}${separator}${keluar}${separator}${saldo}\n`;
    });

    csv += `\nTOTAL${separator}${separator}${separator}${separator}${separator}${separator}${separator}${totalMasuk}${separator}${totalKeluar}${separator}${saldo}\n`;
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `Laporan_Kas_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  
  // Hitung Saldo Berjalan & Total
  let tempSaldo = 0;
  let totalMasukSemua = 0;
  let totalKeluarSemua = 0;
  
  const fullData = transaksiList.map((item, index) => {
    const isPemasukan = item.jenis_transaksi === 'Pemasukan';
    if (isPemasukan) {
      tempSaldo += item.jumlah;
      totalMasukSemua += item.jumlah;
    } else {
      tempSaldo -= item.jumlah;
      totalKeluarSemua += item.jumlah;
    }
    return { ...item, urutan: index + 1, computedSaldo: tempSaldo };
  });

  // Logika Paginasi
  const totalPages = Math.ceil(fullData.length / itemsPerPage);
  const paginatedData = fullData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const subKegiatanModalEdit = subKegiatanList.filter(s => s.id_kegiatan === editForm.id_kegiatan);
  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  return (
    <DashboardLayout>
      {/* CSS CETAK PDF PERSISI */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Sembunyikan elemen web layout */
          aside, header, nav, button, .print\\:hidden {
            display: none !important;
          }
          body, html, main, div {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
          }
          table { 
            page-break-inside: auto; 
            width: 100% !important; 
            border-collapse: collapse !important;
          }
          tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          @page { 
            margin: 1.5cm; 
            size: A4 portrait;
          }
        }
      `}} />

      <div className="space-y-6">
        
        {/* TOP HEADER */}
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

        {/* AREA FILTER UTAMA */}
        <div className={`print:hidden p-5 rounded-2xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          
          {/* Tanggal Mulai */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-xs font-bold flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <CalendarDays size={14} className="mr-1"/> Mulai
              </label>
              {startDate !== defaultStart && (
                <button onClick={() => setStartDate(defaultStart)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <X size={10} className="mr-0.5"/> Reset
                </button>
              )}
            </div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-xs transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          </div>

          {/* Tanggal Sampai */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-xs font-bold flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <CalendarDays size={14} className="mr-1"/> Sampai
              </label>
              {endDate !== defaultEnd && (
                <button onClick={() => setEndDate(defaultEnd)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <X size={10} className="mr-0.5"/> Reset
                </button>
              )}
            </div>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-xs transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
          </div>

          {/* Filter Divisi */}
          <div className="relative" ref={dropdownDivRef}>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-xs font-bold flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Filter size={14} className="mr-1"/> Divisi
              </label>
              {selectedDivisi.length > 0 && (
                <button onClick={() => setSelectedDivisi([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <X size={10} className="mr-0.5"/> Reset
                </button>
              )}
            </div>
            <button onClick={() => setIsDropdownDivOpen(!isDropdownDivOpen)} className={`w-full flex justify-between items-center p-2.5 border rounded-xl outline-none font-medium text-xs text-left transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
              <span className="truncate">{selectedDivisi.length === 0 ? "Semua Divisi" : `${selectedDivisi.length} Dipilih`}</span>
              <ChevronDown size={14} className={`transition-transform ${isDropdownDivOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownDivOpen && (
              <div className={`absolute z-20 w-full mt-2 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center p-2.5 cursor-pointer border-b ${isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-100'}`} onClick={() => setSelectedDivisi([])}>
                  {selectedDivisi.length === 0 ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-xs">Semua Divisi</span>
                </div>
                {divisiList.map(d => (
                  <div key={d.id_divisi} className={`flex items-center p-2.5 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`} onClick={() => toggleDivisi(d.id_divisi)}>
                    {selectedDivisi.includes(d.id_divisi) ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                    <span className="text-xs font-medium">{d.nama_divisi}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Filter Kegiatan Utama */}
          <div className="relative" ref={dropdownKegRef}>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-xs font-bold flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Filter size={14} className="mr-1"/> Kegiatan
              </label>
              {selectedKegiatan.length > 0 && (
                <button onClick={() => { setSelectedKegiatan([]); setSelectedSubKegiatan([]); }} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <X size={10} className="mr-0.5"/> Reset
                </button>
              )}
            </div>
            <button onClick={() => setIsDropdownKegOpen(!isDropdownKegOpen)} className={`w-full flex justify-between items-center p-2.5 border rounded-xl outline-none font-medium text-xs text-left transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
              <span className="truncate">{selectedKegiatan.length === 0 ? "Semua Kegiatan" : `${selectedKegiatan.length} Dipilih`}</span>
              <ChevronDown size={14} className={`transition-transform ${isDropdownKegOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownKegOpen && (
              <div className={`absolute z-20 w-full mt-2 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center p-2.5 cursor-pointer border-b ${isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-100'}`} onClick={() => { setSelectedKegiatan([]); setSelectedSubKegiatan([]); }}>
                  {selectedKegiatan.length === 0 ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-xs">Semua Kegiatan</span>
                </div>
                {kegiatanList.map(k => (
                  <div key={k.id_kegiatan} className={`flex items-center p-2.5 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`} onClick={() => toggleKegiatan(k.id_kegiatan)}>
                    {selectedKegiatan.includes(k.id_kegiatan) ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                    <span className="text-xs font-medium">{k.nama_kegiatan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter Sub Kegiatan */}
          <div className="relative" ref={dropdownSubRef}>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-xs font-bold flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Filter size={14} className="mr-1"/> Sub Kegiatan
              </label>
              {selectedSubKegiatan.length > 0 && (
                <button onClick={() => setSelectedSubKegiatan([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <X size={10} className="mr-0.5"/> Reset
                </button>
              )}
            </div>
            <button onClick={() => setIsDropdownSubOpen(!isDropdownSubOpen)} className={`w-full flex justify-between items-center p-2.5 border rounded-xl outline-none font-medium text-xs text-left transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
              <span className="truncate">{selectedSubKegiatan.length === 0 ? "Semua Sub" : `${selectedSubKegiatan.length} Dipilih`}</span>
              <ChevronDown size={14} className={`transition-transform ${isDropdownSubOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownSubOpen && (
              <div className={`absolute z-20 w-full mt-2 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center p-2.5 cursor-pointer border-b ${isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-100'}`} onClick={() => setSelectedSubKegiatan([])}>
                  {selectedSubKegiatan.length === 0 ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-xs">Semua Sub</span>
                </div>
                {subKegiatanTersaringFilter.map(sub => (
                  <div key={sub.id_sub_kegiatan} className={`flex items-center p-2.5 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`} onClick={() => toggleSubKegiatan(sub.id_sub_kegiatan)}>
                    {selectedSubKegiatan.includes(sub.id_sub_kegiatan) ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                    <span className="text-xs font-medium">{sub.nama_sub_kegiatan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter Kategori */}
          <div className="relative" ref={dropdownKatRef}>
            <div className="flex justify-between items-center mb-1.5">
              <label className={`text-xs font-bold flex items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Filter size={14} className="mr-1"/> Kategori
              </label>
              {selectedKategori.length > 0 && (
                <button onClick={() => setSelectedKategori([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                  <X size={10} className="mr-0.5"/> Reset
                </button>
              )}
            </div>
            <button onClick={() => setIsDropdownKatOpen(!isDropdownKatOpen)} className={`w-full flex justify-between items-center p-2.5 border rounded-xl outline-none font-medium text-xs text-left transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
              <span className="truncate">{selectedKategori.length === 0 ? "Semua Kategori" : `${selectedKategori.length} Dipilih`}</span>
              <ChevronDown size={14} className={`transition-transform ${isDropdownKatOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownKatOpen && (
              <div className={`absolute z-20 w-full mt-2 border rounded-xl shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center p-2.5 cursor-pointer border-b ${isDarkMode ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-gray-50 border-gray-100'}`} onClick={() => setSelectedKategori([])}>
                  {selectedKategori.length === 0 ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                  <span className="font-bold text-xs">Semua Kategori</span>
                </div>
                {kategoriList.map(k => (
                  <div key={k.id_kategori} className={`flex items-center p-2.5 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`} onClick={() => toggleKategori(k.id_kategori)}>
                    {selectedKategori.includes(k.id_kategori) ? <CheckSquare size={16} className={isDarkMode ? 'text-cyan-400 mr-2' : 'text-blue-600 mr-2'} /> : <Square size={16} className="text-gray-400 mr-2" />}
                    <span className="text-xs font-medium">{k.nama_kategori}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TABEL HASIL DILAYAR WEB */}
        <div className={`rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'} print:hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className={`text-xs uppercase tracking-widest border-b ${isDarkMode ? 'bg-[#111827] text-slate-400 border-slate-800' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>
                  <th className="py-4 px-4 font-semibold text-center">No</th>
                  <th className="py-4 px-4 font-semibold">Tanggal</th>
                  <th className="py-4 px-4 font-semibold">Uraian Transaksi</th>
                  <th className="py-4 px-4 font-semibold text-right">Masuk (Debit)</th>
                  <th className="py-4 px-4 font-semibold text-right">Keluar (Kredit)</th>
                  <th className="py-4 px-4 font-semibold text-right">Saldo</th>
                  {isBisaEdit && <th className="py-4 px-4 font-semibold text-center w-20">Aksi</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {isLoading ? (<tr><td colSpan={isBisaEdit ? 7 : 6} className="py-12 text-center text-sm opacity-50">Memuat data...</td></tr>) 
                : paginatedData.length === 0 ? (<tr><td colSpan={isBisaEdit ? 7 : 6} className="py-12 text-center text-sm opacity-50">Filter aktif tidak memiliki data. Silakan reset filter.</td></tr>) 
                : (
                  paginatedData.map((item) => {
                    const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                    return (
                      <tr key={item.id_transaksi} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 px-4 text-center text-xs">{item.urutan}</td>
                        <td className={`py-3 px-4 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.tanggal_transaksi}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-sm truncate max-w-[220px]">{item.kategori?.nama_kategori}</p>
                          {item.detail_transaksi && <p className={`text-xs mt-0.5 truncate max-w-[250px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.detail_transaksi}</p>}
                          
                          {/* HIERARKI: [DIVISI] KEGIATAN - SUB KEGIATAN */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {item.divisi?.nama_divisi && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                [{item.divisi.nama_divisi}]
                              </span>
                            )}
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                              {item.kegiatan?.nama_kegiatan || '-'}
                              {item.sub_kegiatan?.nama_sub_kegiatan ? ` - ${item.sub_kegiatan.nama_sub_kegiatan}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-semibold ${isPemasukan ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-600') : (isDarkMode ? 'text-slate-600' : 'text-slate-300')}`}>
                          {isPemasukan ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-semibold ${!isPemasukan ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') : (isDarkMode ? 'text-slate-600' : 'text-slate-300')}`}>
                          {!isPemasukan ? formatRupiah(item.jumlah) : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right text-sm font-black ${isDarkMode ? 'bg-[#111827]/50' : 'bg-gray-50'}`}>
                          {formatRupiah(item.computedSaldo)}
                        </td>
                        {isBisaEdit && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => bukaModalEdit(item)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-950/50' : 'text-blue-600 hover:bg-blue-50'}`} title="Edit Transaksi"><Edit size={16} /></button>
                              <button onClick={() => handleHapus(item.id_transaksi)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'}`} title="Hapus Transaksi"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* KONTROL PAGINASI & TOTAL */}
          <div className={`p-5 border-t flex flex-col md:flex-row justify-between items-center gap-4 ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tampilkan:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                className={`p-2 border rounded-xl outline-none font-bold text-xs transition-colors cursor-pointer ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-cyan-400' : 'bg-white border-gray-300 text-blue-600'}`}
              >
                <option value={20}>20 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
              <span className={`text-xs ml-2 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total: {fullData.length} data</span>
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Halaman {currentPage} dari {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors border ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`p-2 rounded-lg transition-colors border ${currentPage === totalPages || totalPages === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AREA KHUSUS CETAK PDF (Hanya Muncul Saat Print / window.print()) */}
        <div className="hidden print-area">
          <div className="text-center mb-6 pt-2 border-b-2 border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-widest text-black">Buku Besar Kas</h1>
            <p className="mt-1 font-medium text-black text-sm">Periode: {startDate} s/d {endDate}</p>
            <p className="mt-1 font-medium text-black text-xs">Dicetak pada: {new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>

          <table className="w-full text-left border-collapse border border-black text-black text-xs">
            <thead>
              <tr className="uppercase tracking-widest border-b border-black font-bold">
                <th className="py-2 px-2 border border-black text-center w-10">No</th>
                <th className="py-2 px-2 border border-black w-24">Tanggal</th>
                <th className="py-2 px-2 border border-black">Uraian Transaksi</th>
                <th className="py-2 px-2 border border-black text-right w-28">Masuk (Debit)</th>
                <th className="py-2 px-2 border border-black text-right w-28">Keluar (Kredit)</th>
                <th className="py-2 px-2 border border-black text-right w-32">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {fullData.map((item) => {
                const isPemasukan = item.jenis_transaksi === 'Pemasukan';
                return (
                  <tr key={`print-${item.id_transaksi}`}>
                    <td className="py-2 px-2 border border-black text-center">{item.urutan}</td>
                    <td className="py-2 px-2 border border-black">{item.tanggal_transaksi}</td>
                    <td className="py-2 px-2 border border-black">
                      <p className="font-bold text-sm">{item.kategori?.nama_kategori}</p>
                      {item.detail_transaksi && <p className="text-xs mt-0.5">{item.detail_transaksi}</p>}
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-1">
                        {item.divisi?.nama_divisi ? `[${item.divisi.nama_divisi}] ` : ''}
                        {item.kegiatan?.nama_kegiatan || '-'}
                        {item.sub_kegiatan?.nama_sub_kegiatan ? ` - ${item.sub_kegiatan.nama_sub_kegiatan}` : ''}
                      </p>
                    </td>
                    <td className="py-2 px-2 border border-black text-right font-semibold">
                      {isPemasukan ? formatRupiah(item.jumlah) : '-'}
                    </td>
                    <td className="py-2 px-2 border border-black text-right font-semibold">
                      {!isPemasukan ? formatRupiah(item.jumlah) : '-'}
                    </td>
                    <td className="py-2 px-2 border border-black text-right font-bold">
                      {formatRupiah(item.computedSaldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {fullData.length > 0 && (
              <tfoot>
                <tr className="font-bold border-t-2 border-black bg-gray-100">
                  <td colSpan={3} className="py-3 px-2 border border-black text-right font-black">TOTAL MUTASI / SALDO AKHIR:</td>
                  <td className="py-3 px-2 border border-black text-right font-black">{formatRupiah(totalMasukSemua)}</td>
                  <td className="py-3 px-2 border border-black text-right font-black">{formatRupiah(totalKeluarSemua)}</td>
                  <td className="py-3 px-2 border border-black text-right font-black bg-gray-200">{formatRupiah(tempSaldo)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>

      {/* POP-UP MODAL EDIT KUSTOM */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="text-lg font-black tracking-tight">Edit Transaksi</h3>
              <button onClick={() => setIsEditModalOpen(false)} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-200'}`}><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <form id="form-edit" onSubmit={handleSimpanEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tanggal</label>
                    <input type="date" value={editForm.tanggal_transaksi} onChange={(e) => setEditForm({...editForm, tanggal_transaksi: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`} required />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Jenis Kas</label>
                    <select value={editForm.jenis_transaksi} onChange={(e) => setEditForm({...editForm, jenis_transaksi: e.target.value, id_kategori: ''})} className={`w-full p-2.5 border rounded-xl outline-none font-bold text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                      <option value="Pemasukan">Pemasukan (+)</option>
                      <option value="Pengeluaran">Pengeluaran (-)</option>
                    </select>
                  </div>
                </div>

                {/* Divisi */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Divisi Organisasi</label>
                  <select value={editForm.id_divisi} onChange={(e) => setEditForm({...editForm, id_divisi: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                    <option value="">-- Tanpa Divisi Khusus --</option>
                    {divisiList.map(d => <option key={d.id_divisi} value={d.id_divisi}>{d.nama_divisi}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Kegiatan */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Pilih Kegiatan</label>
                    <select value={editForm.id_kegiatan} onChange={(e) => setEditForm({...editForm, id_kegiatan: e.target.value, id_sub_kegiatan: ''})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`} required>
                      {kegiatanList.map((k) => <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>)}
                    </select>
                  </div>

                  {/* Sub Kegiatan */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Sub-Kegiatan</label>
                    <select value={editForm.id_sub_kegiatan} onChange={(e) => setEditForm({...editForm, id_sub_kegiatan: e.target.value})} disabled={subKegiatanModalEdit.length === 0} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors disabled:opacity-50 ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                      <option value="">-- Tanpa Sub Kegiatan --</option>
                      {subKegiatanModalEdit.map((sub) => <option key={sub.id_sub_kegiatan} value={sub.id_sub_kegiatan}>{sub.nama_sub_kegiatan}</option>)}
                    </select>
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kategori</label>
                  <select value={editForm.id_kategori} onChange={(e) => setEditForm({...editForm, id_kategori: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`} required>
                    <option value="" disabled>-- Pilih Kategori --</option>
                    {kategoriList.filter(k => k.jenis === editForm.jenis_transaksi).map((k) => <option key={k.id_kategori} value={k.id_kategori}>{k.nama_kategori}</option>)}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nominal (Rp)</label>
                  <input type="number" min="1" value={editForm.jumlah} onChange={(e) => setEditForm({...editForm, jumlah: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-black text-lg transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`} required />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Keterangan / Detail</label>
                  <textarea rows={2} value={editForm.detail_transaksi} onChange={(e) => setEditForm({...editForm, detail_transaksi: e.target.value})} className={`w-full p-2.5 border rounded-xl outline-none text-sm resize-none transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300 text-gray-900'}`}></textarea>
                </div>
              </form>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className={`px-5 py-2.5 rounded-xl font-bold text-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-300 text-gray-700'}`}>Batal</button>
              <button type="submit" form="form-edit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}