"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { PlusCircle, Edit, Trash2, X, Tags, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';

export default function KelolaKategori() {
  const [kategori, setKategori] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ id_kategori: '', nama_kategori: '', jenis: 'Pemasukan' });

  // State Pop-up Konfirmasi Kustom
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    isDanger: false,
    onConfirm: () => {}
  });

  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchKategori = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('kategori').select('*').order('created_at', { ascending: false });
    if (data) setKategori(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchKategori(); }, []);

  const bukaModalTambah = () => {
    setIsEditMode(false);
    setForm({ id_kategori: '', nama_kategori: '', jenis: 'Pemasukan' });
    setIsModalOpen(true);
  };

  const bukaModalEdit = (item: any) => {
    setIsEditMode(true);
    setForm({ id_kategori: item.id_kategori, nama_kategori: item.nama_kategori, jenis: item.jenis });
    setIsModalOpen(true);
  };

  // --- ALUR SIMPAN ---
  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: isEditMode ? 'Konfirmasi Edit' : 'Tambah Kategori Baru',
      message: isEditMode ? 'Yakin ingin menyimpan perubahan pada kategori ini?' : 'Yakin ingin menambahkan kategori ini ke dalam sistem?',
      confirmText: 'Ya, Simpan',
      isDanger: false,
      onConfirm: eksekusiSimpan
    });
  };

  const eksekusiSimpan = async () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setIsSaving(true);

    if (isEditMode) {
      const { error } = await supabase.from('kategori').update({ nama_kategori: form.nama_kategori, jenis: form.jenis }).eq('id_kategori', form.id_kategori);
      if (error) alert('Gagal mengedit: ' + error.message);
    } else {
      const { error } = await supabase.from('kategori').insert([{ nama_kategori: form.nama_kategori, jenis: form.jenis }]);
      if (error) alert('Gagal menambah: ' + error.message);
    }

    setIsSaving(false);
    setIsModalOpen(false);
    fetchKategori();
  };

  // --- ALUR HAPUS ---
  const handleHapus = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Kategori Permanen',
      message: 'Peringatan: Kategori yang dihapus akan membuat data transaksi lama terkait menjadi tidak berkategori. Apakah Anda yakin?',
      confirmText: 'Ya, Tetap Hapus',
      isDanger: true,
      onConfirm: () => eksekusiHapus(id)
    });
  };

  const eksekusiHapus = async (id: string) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    const { error } = await supabase.from('kategori').delete().eq('id_kategori', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchKategori();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Kelola Kategori</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manajemen klasifikasi arus kas</p>
        </div>
        <button onClick={bukaModalTambah} className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>
          <PlusCircle size={18} className="mr-2" /> Tambah
        </button>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className={`text-xs uppercase tracking-widest border-b ${isDarkMode ? 'bg-[#111827] text-slate-400 border-slate-800' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>
                <th className="py-4 px-6 font-semibold w-16">No</th>
                <th className="py-4 px-6 font-semibold">Nama Kategori</th>
                <th className="py-4 px-6 font-semibold">Jenis Arus Kas</th>
                <th className="py-4 px-6 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
              {isLoading ? (<tr><td colSpan={4} className="py-12 text-center opacity-50">Memuat data...</td></tr>) 
              : kategori.length === 0 ? (<tr><td colSpan={4} className="py-12 text-center opacity-50">Belum ada kategori.</td></tr>) 
              : kategori.map((item, index) => (
                <tr key={item.id_kategori} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                  <td className={`py-4 px-6 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}><Tags size={16} /></div>
                      <span className="font-bold text-sm">{item.nama_kategori}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`flex items-center text-xs font-bold ${item.jenis === 'Pemasukan' ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>
                      {item.jenis === 'Pemasukan' ? <ArrowDownToLine size={14} className="mr-1.5" /> : <ArrowUpFromLine size={14} className="mr-1.5" />}
                      {item.jenis}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => bukaModalEdit(item)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-950/50' : 'text-blue-600 hover:bg-blue-50'}`}><Edit size={16} /></button>
                      <button onClick={() => handleHapus(item.id_kategori)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="text-lg font-black">{isEditMode ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-black'}`}><X size={20} /></button>
            </div>
            <form onSubmit={handleSimpan} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nama Kategori</label>
                <input type="text" value={form.nama_kategori} onChange={e => setForm({...form, nama_kategori: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required placeholder="Contoh: Konsumsi" />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Jenis Arus Kas</label>
                <select value={form.jenis} onChange={e => setForm({...form, jenis: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-bold text-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`}>
                  <option value="Pemasukan">Pemasukan (+)</option>
                  <option value="Pengeluaran">Pengeluaran (-)</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Batal</button>
                <button type="submit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 ${isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP KONFIRMASI KUSTOM */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
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