"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Edit, Trash2, X, FolderTree } from 'lucide-react';
import { Kegiatan, SubKegiatan } from '@/types';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function KelolaSubKegiatan() {
  // === STATE MANAGEMENT ===
  const dialog = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]); // Untuk dropdown pilih Induk
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Form State
  const [idKegiatan, setIdKegiatan] = useState(''); // ID Induk
  const [namaSubKegiatan, setNamaSubKegiatan] = useState('');
  const [editItem, setEditItem] = useState<SubKegiatan | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // === EFFECTS ===
  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Fetch 2 Data Sekaligus: List Sub-Kegiatan (Tabel) & List Kegiatan Utama (Dropdown)
  const fetchInitialData = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profil } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
      if (profil) setUserRole(profil.role?.toUpperCase() || '');
    }

    // 1. Ambil list Induk Kegiatan untuk Dropdown form modal
    const { data: dataKeg } = await supabase.from('kegiatan').select('*').order('nama_kegiatan', { ascending: true });
    if (dataKeg) setKegiatanList(dataKeg);

    // 2. Ambil list Sub-Kegiatan beserta relasi join table nama_kegiatan (Induknya)
    const { data: dataSub, error } = await supabase
      .from('sub_kegiatan')
      .select('*, kegiatan(nama_kegiatan)')
      .order('created_at', { ascending: true });

    if (!error && dataSub) setSubKegiatanList(dataSub as SubKegiatan[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // === HANDLERS ===
  const bukaModalTambah = () => {
    setEditItem(null);
    setIdKegiatan(kegiatanList[0]?.id_kegiatan || ''); // Set default pilihan pertama
    setNamaSubKegiatan('');
    setIsModalOpen(true);
  };

  const bukaModalEdit = (item: SubKegiatan) => {
    setEditItem(item);
    setIdKegiatan(item.id_kegiatan); // Pilih induk yang sudah ada
    setNamaSubKegiatan(item.nama_sub_kegiatan);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idKegiatan) {
      showError('Silakan pilih induk kegiatan terlebih dahulu', 'Validasi Gagal');
      return;
    }
    if (!namaSubKegiatan.trim()) {
      showError('Nama sub kegiatan tidak boleh kosong', 'Validasi Gagal');
      return;
    }

    setIsSaving(true);
    if (editItem) {
      // UPDATE DATA
      const { error } = await supabase
        .from('sub_kegiatan')
        .update({ id_kegiatan: idKegiatan, nama_sub_kegiatan: namaSubKegiatan.trim() })
        .eq('id_sub_kegiatan', editItem.id_sub_kegiatan);

      if (error) {
        showError(error.message, 'Gagal Memperbarui Sub Kegiatan');
        setIsSaving(false);
        return;
      }
      showSuccess('Sub kegiatan berhasil diperbarui', 'Berhasil');
    } else {
      // INSERT DATA
      const { error } = await supabase
        .from('sub_kegiatan')
        .insert([{ id_kegiatan: idKegiatan, nama_sub_kegiatan: namaSubKegiatan.trim() }]);

      if (error) {
        showError(error.message, 'Gagal Menambah Sub Kegiatan');
        setIsSaving(false);
        return;
      }
      showSuccess('Sub kegiatan berhasil ditambahkan', 'Berhasil');
    }
    
    setIsSaving(false);
    setIsModalOpen(false); 
    fetchInitialData();
  };

  const handleHapus = (item: SubKegiatan) => {
    dialog.openDialog(
      'Konfirmasi Hapus',
      `Yakin ingin menghapus sub-kegiatan "${item.nama_sub_kegiatan}"?`,
      async () => {
        const { error } = await supabase.from('sub_kegiatan').delete().eq('id_sub_kegiatan', item.id_sub_kegiatan);
        if (error) {
          showError(error.message, 'Gagal Menghapus Sub Kegiatan');
        } else {
          showSuccess('Sub kegiatan berhasil dihapus', 'Berhasil');
          fetchInitialData();
        }
      },
      { variant: 'danger' }
    );
  };

  const isBisaEdit = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  // === RENDER UI ===
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <FolderTree className="text-blue-600 dark:text-cyan-400" size={28} /> Kelola Sub Kegiatan
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Daftar rincian sub-kegiatan dari kegiatan utama</p>
          </div>

          {isBisaEdit && (
            <button onClick={bukaModalTambah} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-lg dark:bg-cyan-500 dark:text-slate-900">
              <Plus size={16} /> Tambah Sub Kegiatan
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
                  <th className="py-4 px-6 font-semibold">Induk Kegiatan</th>
                  <th className="py-4 px-6 font-semibold">Sub Kegiatan</th>
                  {isBisaEdit && <th className="py-4 px-6 font-semibold text-center w-28">Aksi</th>}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
                {isLoading ? (
                  <tr><td colSpan={isBisaEdit ? 4 : 3} className="py-12 text-center text-sm opacity-50">Memuat sub kegiatan...</td></tr>
                ) : subKegiatanList.length === 0 ? (
                  <tr><td colSpan={isBisaEdit ? 4 : 3} className="py-12 text-center text-sm opacity-50">Belum ada sub kegiatan yang ditambahkan.</td></tr>
                ) : (
                  subKegiatanList.map((item, index) => (
                    <tr key={item.id_sub_kegiatan} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                      <td className="py-4 px-6 text-center text-xs font-bold opacity-60">{index + 1}</td>
                      <td className="py-4 px-6">
                        {/* Menampilkan relasi nama induk */}
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${isDarkMode ? 'bg-slate-800 text-cyan-400' : 'bg-blue-50 text-blue-700'}`}>
                          {item.kegiatan?.nama_kegiatan || 'Tanpa Induk'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-sm">{item.nama_sub_kegiatan}</td>
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
              <h3 className="text-lg font-black tracking-tight">{editItem ? 'Edit Sub Kegiatan' : 'Tambah Sub Kegiatan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className={`p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Dropdown Relasi Induk */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Pilih Induk Kegiatan Utama</label>
                <select
                  value={idKegiatan}
                  onChange={(e) => setIdKegiatan(e.target.value)}
                  className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300'}`}
                  required
                >
                  <option value="" disabled>-- Pilih Kegiatan Utama --</option>
                  {kegiatanList.map(k => (
                    <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nama Sub Kegiatan</label>
                <input
                  type="text"
                  value={namaSubKegiatan}
                  onChange={(e) => setNamaSubKegiatan(e.target.value)}
                  placeholder="Contoh: Fun Run, Konsumsi Rapat"
                  className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-300'}`}
                  required
                />
              </div>
              
              {/* Form Controls */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2.5 rounded-xl font-bold text-sm border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-300 text-gray-700'}`}>Batal</button>
                <button type="submit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-cyan-500 text-slate-900' : 'bg-blue-600 text-white'}`}>
                  {isSaving ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Tambah Sub Kegiatan')}
                </button>
              </div>
            </form>
          </div>
        </div>
            )}
    </DashboardLayout>
  );
}