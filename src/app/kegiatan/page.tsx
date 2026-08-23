"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { PlusCircle, Edit, Trash2, X, Activity } from 'lucide-react';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function KelolaKegiatan() {
  const dialog = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // State Modal Form (Tanpa kolom status)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ id_kegiatan: '', nama_kegiatan: '' });

  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchKegiatan = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('kegiatan').select('*').order('created_at', { ascending: false });
    if (data) setKegiatan(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchKegiatan(); }, []);

  const bukaModalTambah = () => {
    setIsEditMode(false);
    setForm({ id_kegiatan: '', nama_kegiatan: '' });
    setIsModalOpen(true);
  };

  const bukaModalEdit = (item: any) => {
    setIsEditMode(true);
    setForm({ id_kegiatan: item.id_kegiatan, nama_kegiatan: item.nama_kegiatan });
    setIsModalOpen(true);
  };

  const handleSimpan = (e: React.FormEvent) => {
    e.preventDefault();
    dialog.openDialog(
      isEditMode ? 'Konfirmasi Perubahan' : 'Tambah Kegiatan Baru',
      isEditMode ? 'Yakin ingin menyimpan perubahan kegiatan ini?' : 'Yakin ingin menambahkan kegiatan ini ke dalam sistem?',
      eksekusiSimpan,
      { confirmText: 'Ya, Simpan' }
    );
  };

  const eksekusiSimpan = async () => {
    setIsSaving(true);

    if (isEditMode) {
      const { error } = await supabase.from('kegiatan').update({ nama_kegiatan: form.nama_kegiatan }).eq('id_kegiatan', form.id_kegiatan);
      if (error) {
        showError(error.message, 'Gagal Mengedit Kegiatan');
        setIsSaving(false);
        return;
      }
      showSuccess('Data kegiatan berhasil diperbarui', 'Berhasil');
    } else {
      const { error } = await supabase.from('kegiatan').insert([{ nama_kegiatan: form.nama_kegiatan }]);
      if (error) {
        showError(error.message, 'Gagal Menambah Kegiatan');
        setIsSaving(false);
        return;
      }
      showSuccess('Data kegiatan berhasil ditambahkan', 'Berhasil');
    }

    setIsSaving(false);
    setIsModalOpen(false);
    fetchKegiatan();
  };

  const handleHapus = (id: string) => {
    dialog.openDialog(
      'Hapus Kegiatan Permanen',
      'Peringatan: Menghapus kegiatan ini akan berdampak pada transaksi yang sudah terhubung. Apakah Anda benar-benar yakin?',
      () => eksekusiHapus(id),
      { confirmText: 'Ya, Hapus Saja', variant: 'danger' }
    );
  };

  const eksekusiHapus = async (id: string) => {
    const { error } = await supabase.from('kegiatan').delete().eq('id_kegiatan', id);
    if (error) {
      showError(error.message, 'Gagal Menghapus Kegiatan');
    } else {
      showSuccess('Data kegiatan berhasil dihapus', 'Berhasil');
      fetchKegiatan();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Kelola Kegiatan</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manajemen program dan acara organisasi</p>
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
                <th className="py-4 px-6 font-semibold">Nama Kegiatan</th>
                <th className="py-4 px-6 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
              {isLoading ? (<tr><td colSpan={3} className="py-12 text-center opacity-50">Memuat data...</td></tr>) 
              : kegiatan.length === 0 ? (<tr><td colSpan={3} className="py-12 text-center opacity-50">Belum ada kegiatan.</td></tr>) 
              : kegiatan.map((item, index) => (
                <tr key={item.id_kegiatan} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                  <td className={`py-4 px-6 text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{index + 1}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}><Activity size={16} /></div>
                      <span className="font-bold text-sm">{item.nama_kegiatan}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => bukaModalEdit(item)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-950/50' : 'text-blue-600 hover:bg-blue-50'}`}><Edit size={16} /></button>
                      <button onClick={() => handleHapus(item.id_kegiatan)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="text-lg font-black">{isEditMode ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-black'}`}><X size={20} /></button>
            </div>
            <form onSubmit={handleSimpan} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nama Kegiatan</label>
                <input type="text" value={form.nama_kegiatan} onChange={e => setForm({...form, nama_kegiatan: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required placeholder="Contoh: Rapat Akhir Tahun" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Batal</button>
                <button type="submit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 ${isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}