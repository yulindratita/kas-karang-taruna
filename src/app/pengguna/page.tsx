"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ShieldCheck, Edit, X, Users, AlertTriangle } from 'lucide-react';

export default function KelolaPengguna() {
  const router = useRouter();
  const [pengguna, setPengguna] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // State Modal Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ id: '', nama_lengkap: '', role: 'PENGAWAS' });

  // State Modal Konfirmasi Kustom
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

  const fetchPengguna = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    
    const { data: currentUser } = await supabase.from('users_profile').select('role').eq('id', session.user.id).single();
    if (currentUser?.role !== 'SUPER_ADMIN') {
      alert('Akses Ditolak! Hanya Super Admin yang diizinkan masuk ke halaman ini.');
      router.push('/');
      return;
    }

    const { data } = await supabase.from('users_profile').select('*').order('nama_lengkap', { ascending: true });
    if (data) setPengguna(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchPengguna(); }, []);

  const bukaModalEdit = (item: any) => {
    setForm({ id: item.id, nama_lengkap: item.nama_lengkap || '', role: item.role || 'PENGAWAS' });
    setIsModalOpen(true);
  };

  // TAHAP 1: Cegah submit otomatis, panggil Pop-up Konfirmasi
  const handleSimpanEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Perubahan',
      message: `Anda yakin ingin mengubah hak akses pengguna ini menjadi ${form.role}? Akses akan langsung berlaku.`,
      confirmText: 'Ya, Simpan',
      isDanger: false,
      onConfirm: eksekusiSimpanDatabase
    });
  };

  // TAHAP 2: Jika tombol "Ya, Simpan" di Pop-up diklik
  const eksekusiSimpanDatabase = async () => {
    // Tutup pop-up konfirmasi
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    
    setIsSaving(true);
    const { error } = await supabase
      .from('users_profile')
      .update({ nama_lengkap: form.nama_lengkap, role: form.role })
      .eq('id', form.id);

    setIsSaving(false);

    if (error) {
      alert('Gagal mengupdate pengguna: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchPengguna();
    }
  };

  return (
    <DashboardLayout>
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}><ShieldCheck size={28} /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Kelola Hak Akses</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Atur nama dan jabatan pengguna aplikasi.</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${isDarkMode ? 'bg-purple-900/20 border-purple-800/50 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>Mode Super Admin Aktif</div>
      </div>

      {/* TABLE DATA */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
        <div className={`p-5 border-b flex items-center gap-3 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <Users size={18} className={isDarkMode ? 'text-slate-400' : 'text-slate-500'} />
          <h3 className="text-lg font-bold">Daftar Pengguna Terdaftar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className={`text-xs uppercase tracking-widest border-b ${isDarkMode ? 'bg-[#111827] text-slate-400 border-slate-800' : 'bg-gray-50 text-slate-500 border-gray-200'}`}>
                <th className="py-4 px-6 font-semibold">Nama Lengkap</th>
                <th className="py-4 px-6 font-semibold">Jabatan (Role)</th>
                <th className="py-4 px-6 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/80' : 'divide-gray-100'}`}>
              {isLoading ? (<tr><td colSpan={3} className="py-12 text-center text-sm opacity-50">Memuat data pengguna...</td></tr>) 
              : pengguna.length === 0 ? (<tr><td colSpan={3} className="py-12 text-center text-sm opacity-50">Belum ada pengguna.</td></tr>) 
              : pengguna.map((item) => (
                <tr key={item.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}>
                  <td className="py-4 px-6">
                    <p className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.nama_lengkap || 'Belum diatur'}</p>
                    <p className={`text-[10px] mt-0.5 font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>ID: {item.id.substring(0, 8)}...</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${item.role === 'SUPER_ADMIN' ? (isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700') : item.role === 'BENDAHARA' ? (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700') : (isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700')}`}>
                      {item.role || 'PENGAWAS'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => bukaModalEdit(item)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-950/50' : 'text-blue-600 hover:bg-blue-50'}`}><Edit size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP FORM EDIT PENGGUNA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <h3 className="text-lg font-black tracking-tight">Edit Hak Akses</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-black'}`}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSimpanEdit} className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nama Lengkap</label>
                <input type="text" value={form.nama_lengkap} onChange={e => setForm({...form, nama_lengkap: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required placeholder="Masukkan nama pengguna" />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Jabatan (Role)</label>
                <div className={`p-1 border rounded-xl flex flex-col gap-1 ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                  {['SUPER_ADMIN', 'BENDAHARA', 'PENGAWAS'].map((roleOption) => (
                    <button key={roleOption} type="button" onClick={() => setForm({ ...form, role: roleOption })} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-colors flex items-center justify-between ${form.role === roleOption ? (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-200')}`}>
                      {roleOption}
                      {form.role === roleOption && <ShieldCheck size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Batal</button>
                <button type="submit" disabled={isSaving} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 ${isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP KONFIRMASI KUSTOM (Pengganti window.confirm) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600') : (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600')}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {confirmDialog.title}
              </h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {confirmDialog.message}
              </p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Batal
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-600 text-white hover:bg-rose-700') : (isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700')}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}