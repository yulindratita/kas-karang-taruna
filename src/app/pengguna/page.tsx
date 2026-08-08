"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldCheck, UserCog, Edit, X, Save } from 'lucide-react';

export default function KelolaPengguna() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);

  // --- STATE UNTUK MODAL EDIT PROFIL ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    nama_lengkap: '',
    role: ''
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    // 1. Cek Sesi Login
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('Silakan login terlebih dahulu!');
      router.push('/login');
      return;
    }

    // 2. Cek apakah yang login adalah SUPER_ADMIN
    const { data: myProfile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (myProfile?.role?.toUpperCase() !== 'SUPER_ADMIN') {
      alert('Akses Ditolak! Halaman ini khusus untuk SUPER_ADMIN.');
      router.push('/');
      return;
    }
    
    setCurrentUserRole(myProfile.role);

    // 3. Ambil seluruh data pengguna
    const { data: allUsers, error } = await supabase
      .from('users_profile')
      .select('*')
      .order('nama_lengkap', { ascending: true });

    if (!error && allUsers) {
      setUsersList(allUsers);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [router]);

  // --- FUNGSI BUKA MODAL ---
  const bukaModalEdit = (user: any) => {
    setEditForm({
      id: user.id,
      nama_lengkap: user.nama_lengkap || '',
      role: user.role || 'KETUA' // Default KETUA jika kosong
    });
    setIsEditModalOpen(true);
  };

  // --- FUNGSI SIMPAN PERUBAHAN ---
  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from('users_profile')
      .update({ 
        nama_lengkap: editForm.nama_lengkap,
        role: editForm.role 
      })
      .eq('id', editForm.id);

    setIsSaving(false);

    if (error) {
      alert('Gagal memperbarui data pengguna: ' + error.message);
    } else {
      setIsEditModalOpen(false);
      fetchUsers(); // Refresh tabel setelah berhasil
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-10 font-sans text-gray-900 selection:bg-purple-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigasi */}
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold transition-colors mb-2">
          <ArrowLeft size={18} className="mr-2" /> Kembali ke Dashboard
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck size={32} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Kelola Hak Akses</h1>
              <p className="text-gray-500 text-sm font-medium mt-1">Atur nama dan jabatan pengguna aplikasi.</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-bold text-sm inline-flex items-center">
            <UserCog size={16} className="mr-2" /> Mode Super Admin
          </div>
        </div>

        {/* Tabel Pengguna */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center">
              <Users size={20} className="mr-2 text-gray-400" /> Daftar Pengguna Terdaftar
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                  <th className="py-4 px-6 border-b border-gray-100">Nama Lengkap</th>
                  <th className="py-4 px-6 border-b border-gray-100">Jabatan (Role)</th>
                  <th className="py-4 px-6 border-b border-gray-100 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={3} className="py-12 text-center text-gray-400 font-medium text-sm">Memuat daftar pengguna...</td></tr>
                ) : usersList.length === 0 ? (
                  <tr><td colSpan={3} className="py-12 text-center text-gray-400 font-medium text-sm">Belum ada pengguna.</td></tr>
                ) : (
                  usersList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-900">{item.nama_lengkap || 'Belum Diatur'}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {item.id.substring(0, 8)}...</p>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold ${
                          item.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700' :
                          item.role === 'BENDAHARA' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {item.role || 'PENGAWAS'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => bukaModalEdit(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                          title="Edit Profil"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                      
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL EDIT PROFIL PENGGUNA */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-900">Edit Profil & Jabatan</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-6">
              <form id="form-edit-user" onSubmit={handleSimpanEdit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={editForm.nama_lengkap} 
                    onChange={(e) => setEditForm({...editForm, nama_lengkap: e.target.value})} 
                    placeholder="Contoh: Budi Santoso"
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm transition-all" 
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hak Akses (Role)</label>
                  <select 
                    value={editForm.role} 
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})} 
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm transition-all cursor-pointer">
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh)</option>
                    <option value="BENDAHARA">BENDAHARA (Kelola Keuangan)</option>
                    <option value="PENGAWAS">PENGAWAS (Hanya Pantau Laporan)</option>
                  </select>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                Batal
              </button>
              <button type="submit" form="form-edit-user" disabled={isSaving} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-sm flex items-center">
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}