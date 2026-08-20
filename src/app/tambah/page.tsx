"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PlusCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Divisi, Kegiatan, SubKegiatan, Kategori } from '@/types';

export default function TambahKas() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Data Master
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState(today);
  const [jenis, setJenis] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [idDivisi, setIdDivisi] = useState('');
  const [idKegiatan, setIdKegiatan] = useState('');
  const [idSubKegiatan, setIdSubKegiatan] = useState('');
  const [idKategori, setIdKategori] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [detail, setDetail] = useState('');

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Ya, Simpan', isDanger: false, onConfirm: () => {}
  });

  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: dataDiv } = await supabase.from('divisi').select('*').order('nama_divisi', { ascending: true });
      if (dataDiv) setDivisiList(dataDiv);

      const { data: dataKeg } = await supabase.from('kegiatan').select('*').order('nama_kegiatan', { ascending: true });
      if (dataKeg) setKegiatanList(dataKeg);

      const { data: dataSub } = await supabase.from('sub_kegiatan').select('*').order('nama_sub_kegiatan', { ascending: true });
      if (dataSub) setSubKegiatanList(dataSub);

      const { data: dataKat } = await supabase.from('kategori').select('*').order('nama_kategori', { ascending: true });
      if (dataKat) setKategoriList(dataKat);
    };
    fetchMasterData();
  }, []);

  // Filter Sub-Kegiatan berdasarkan Kegiatan yang dipilih (Cascading Dropdown)
  const subKegiatanTersaring = subKegiatanList.filter(sub => sub.id_kegiatan === idKegiatan);

  // Filter Kategori berdasarkan Jenis Kas
  const kategoriTersaring = kategoriList.filter(kat => kat.jenis === jenis);

  const handleKegiatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIdKegiatan(e.target.value);
    setIdSubKegiatan(''); // Reset sub-kegiatan saat induk kegiatan berubah
  };

  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setJenis(e.target.value as 'Pemasukan' | 'Pengeluaran');
    setIdKategori(''); // Reset kategori saat jenis kas berubah
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idKegiatan) return alert('Silakan pilih kegiatan.');
    if (!idKategori) return alert('Silakan pilih kategori.');
    if (!jumlah || Number(jumlah) <= 0) return alert('Nominal harus lebih dari 0.');

    setConfirmDialog({
      isOpen: true,
      title: 'Simpan Catatan Kas',
      message: `Apakah Anda yakin ingin mencatat ${jenis.toLowerCase()} sebesar Rp ${Number(jumlah).toLocaleString('id-ID')}?`,
      confirmText: 'Ya, Simpan',
      isDanger: false,
      onConfirm: eksekusiSimpan
    });
  };

  const eksekusiSimpan = async () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setIsLoading(true);

    const payload = {
      tanggal_transaksi: tanggal,
      jenis_transaksi: jenis,
      id_divisi: idDivisi || null,
      id_kegiatan: idKegiatan,
      id_sub_kegiatan: idSubKegiatan || null,
      id_kategori: idKategori,
      jumlah: Number(jumlah),
      detail_transaksi: detail.trim() || null
    };

    const { error } = await supabase.from('transaksi').insert([payload]);

    setIsLoading(false);
    if (error) {
      alert('Gagal menyimpan catatan kas: ' + error.message);
    } else {
      router.push('/laporan');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <PlusCircle className="text-blue-600 dark:text-cyan-400" size={28} /> Catat Kas Baru
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Input mutasi kas pemasukan atau pengeluaran organisasi
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>

        <div className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tanggal Transaksi *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${
                    isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                  }`}
                  required
                />
              </div>

              {/* Jenis Kas */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Jenis Mutasi *</label>
                <select
                  value={jenis}
                  onChange={handleJenisChange}
                  className={`w-full p-3 border rounded-xl outline-none font-bold text-sm transition-colors ${
                    isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="Pengeluaran">Pengeluaran (-)</option>
                  <option value="Pemasukan">Pemasukan (+)</option>
                </select>
              </div>
            </div>

            {/* Divisi Organisasi */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Divisi Penanggung Jawab (Opsional)</label>
              <select
                value={idDivisi}
                onChange={(e) => setIdDivisi(e.target.value)}
                className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${
                  isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <option value="">-- Tanpa Divisi Khusus --</option>
                {divisiList.map(d => (
                  <option key={d.id_divisi} value={d.id_divisi}>{d.nama_divisi}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Induk Kegiatan */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Induk Kegiatan *</label>
                <select
                  value={idKegiatan}
                  onChange={handleKegiatanChange}
                  className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${
                    isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                  }`}
                  required
                >
                  <option value="" disabled>-- Pilih Kegiatan --</option>
                  {kegiatanList.map(k => (
                    <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Kegiatan (Cascading) */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Sub-Kegiatan {!idKegiatan && '(Pilih kegiatan dulu)'}
                </label>
                <select
                  value={idSubKegiatan}
                  onChange={(e) => setIdSubKegiatan(e.target.value)}
                  disabled={!idKegiatan || subKegiatanTersaring.length === 0}
                  className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors disabled:opacity-50 ${
                    isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">
                    {!idKegiatan 
                      ? '-- Pilih Kegiatan Utama Dulu --' 
                      : subKegiatanTersaring.length === 0 
                        ? '-- Tidak Ada Sub-Kegiatan --' 
                        : '-- Pilih Sub-Kegiatan (Opsional) --'}
                  </option>
                  {subKegiatanTersaring.map(sub => (
                    <option key={sub.id_sub_kegiatan} value={sub.id_sub_kegiatan}>{sub.nama_sub_kegiatan}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kategori Kas */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kategori Kas *</label>
              <select
                value={idKategori}
                onChange={(e) => setIdKategori(e.target.value)}
                className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${
                  isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                }`}
                required
              >
                <option value="" disabled>-- Pilih Kategori {jenis} --</option>
                {kategoriTersaring.map(kat => (
                  <option key={kat.id_kategori} value={kat.id_kategori}>{kat.nama_kategori}</option>
                ))}
              </select>
            </div>

            {/* Nominal */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nominal Kas (Rp) *</label>
              <input
                type="number"
                min="1"
                placeholder="0"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                className={`w-full p-3.5 border rounded-xl outline-none font-black text-xl transition-colors ${
                  isDarkMode ? 'bg-[#1e293b] border-slate-700 text-cyan-400 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500'
                }`}
                required
              />
            </div>

            {/* Keterangan */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Keterangan / Detail (Opsional)</label>
              <textarea
                rows={3}
                placeholder="Rincian tambahan mengenai transaksi ini..."
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className={`w-full p-3 border rounded-xl outline-none text-sm resize-none transition-colors ${
                  isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-colors disabled:opacity-50 ${
                  isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
                }`}
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Catatan Kas'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pop-up Konfirmasi */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{confirmDialog.title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{confirmDialog.message}</p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className={`px-4 py-2.5 rounded-xl font-bold text-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-300 text-gray-700'}`}>Batal</button>
              <button onClick={confirmDialog.onConfirm} className={`px-4 py-2.5 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-cyan-500 text-slate-900' : 'bg-blue-600 text-white'}`}>{confirmDialog.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}