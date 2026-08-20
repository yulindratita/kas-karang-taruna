"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit, Trash2, X, AlertTriangle, Building2 } from 'lucide-react';
import { Divisi } from '@/types';

export default function KelolaDivisi() {
  // === STATE MANAGEMENT ===
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Form & Modal State
  const [namaDivisi, setNamaDivisi] = useState('');
  const [editItem, setEditItem] = useState<Divisi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Konfirmasi Pop-up State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Ya', isDanger: false, onConfirm: () => {}
  });

  // === EFFECTS ===
  // Cek tema (Dark/Light mode) saat komponen dimuat
  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Ambil data Divisi dari Supabase (READ)
  const fetchDivisi = async () => {
    setIsLoading(true);
    // Cek Role User untuk hak akses
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profil } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
      if (profil) setUserRole(profil.role?.toUpperCase() || '');
    }

    // Ambil data divisi, urutkan berdasarkan waktu pembuatan
    const { data, error } = await supabase.from('divisi').select('*').order('created_at', { ascending: true });
    if (!error && data) setDivisiList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDivisi();
  }, []);

  // === HANDLERS ===
  // Buka form modal dalam mode Tambah Data Baru
  const bukaModalTambah = () => {
    setEditItem(null);
    setNamaDivisi('');
    setIsModalOpen(true);
  };

  // Buka form modal dalam mode Edit Data (Populate form)
  const bukaModalEdit = (item: Divisi) => {
    setEditItem(item);
    setNamaDivisi(item.nama_divisi);
    setIsModalOpen(true);
  };

  // Proses Simpan Data (CREATE & UPDATE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaDivisi.trim()) return alert('Nama divisi tidak boleh kosong');

    setIsSaving(true);
    if (editItem) {
      // Logika Update (jika editItem tidak null)
      const { error } = await supabase.from('divisi').update({ nama_divisi: namaDivisi.trim() }).eq('id_divisi', editItem.id_divisi);
      if (error) alert('Gagal mengubah divisi: ' + error.message);
    } else {
      // Logika Insert/Tambah Baru
      const { error } = await supabase.from('divisi').insert([{ nama_divisi: namaDivisi.trim() }]);
      if (error) alert('Gagal menambah divisi: ' + error.message);
    }
    
    // Reset state & fetch ulang data terbaru
    setIsSaving(false);
    setIsModalOpen(false); 
    fetchDivisi();
  };

  // Proses Hapus Data (DELETE)
  const handleHapus = (item: Divisi) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Divisi',
      message: `Yakin ingin menghapus divisi "${item.nama_divisi}"?`,
      confirmText: 'Ya, Hapus',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false })); // Tutup dialog
        const { error } = await supabase.from('divisi').delete().eq('id_divisi', item.id_divisi);
        if (error) alert('Gagal menghapus: ' + error.message);
        else fetchDivisi();
      }
    });
  };

  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  // === RENDER UI ===
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Building2 className="text-blue-600 dark:text-cyan-400" size={28} /> Kelola Divisi
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Daftar divisi/bidang organisasi</p>
          </div>

          {isBisaEdit && (
            <button
              onClick={bukaModalTambah}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-lg dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-900"
            >
              <Plus size={16} /> Tambah Divisi Baru
            </button>
          )}
        </div>

        {/* Tabel Data */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className={`text-xs uppercase tracking-widest border-b ${isDarkMode ? 'bg-[#111827] text-slate-400 border-slate-800' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>
                  <th className="py-4 px-6 font-semibold w-16 text-center">No</th>
                  <th className="py-4 px-6 font-semibold">Nama Divisi</th>
                  {isBisaEdit && <th className="py-4 px-6 font-semibold text-center w-28">Aksi</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {isLoading ? (
                  <tr><td colSpan={isBisaEdit ? 3 : 2} className="py-12 text-center text-sm opacity-50">Memuat data divisi...</td></tr>
                ) : divisiList.length === 0 ? (
                  <tr><td colSpan={isBisaEdit ? 3 : 2} className="py-12 text-center text-sm opacity-50">Belum ada divisi yang ditambahkan.</td></tr>
                ) : (
                  divisiList.map((item, index) => (
                    <tr key={item.id_divisi} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-4 px-6 text-center text-xs font-bold opacity-60">{index + 1}</td>
                      <td className="py-4 px-6 font-bold text-sm">{item.nama_divisi}</td>
                      {isBisaEdit && (
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => bukaModalEdit(item)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-950/50' : 'text-blue-600 hover:bg-blue-50'}`}><Edit size={16} /></button>
                            <button onClick={() => handleHapus(item)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-950/50' : 'text-rose-600 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="text-lg font-black tracking-tight">{editItem ? 'Edit Divisi' : 'Tambah Divisi Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nama Divisi</label>
                <input
                  type="text"
                  value={namaDivisi}
                  onChange={(e) => setNamaDivisi(e.target.value)}
                  placeholder="Contoh: Divisi Humas, Sekber"
                  className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300'}`}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2.5 rounded-xl font-bold text-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-300'}`}>Batal</button>
                <button type="submit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-cyan-500 text-slate-900' : 'bg-blue-600 text-white'}`}>
                  {isSaving ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Tambah Divisi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {/* ... (Struktur modal sama dengan modal lainnya) ... */}
          <div className={`w-full max-w-sm rounded-2xl p-6 border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
             <div className="flex justify-center mb-4"><AlertTriangle className="text-rose-500" size={32} /></div>
             <h3 className={`text-center font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{confirmDialog.title}</h3>
             <p className={`text-center text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{confirmDialog.message}</p>
             <div className="flex justify-center gap-3">
               <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className={`px-4 py-2 rounded-xl font-bold text-sm border ${isDarkMode ? 'text-white' : 'text-black'}`}>Batal</button>
               <button onClick={confirmDialog.onConfirm} className="px-4 py-2 rounded-xl font-bold text-sm bg-rose-600 text-white">{confirmDialog.confirmText}</button>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}