"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function KelolaKegiatan() {
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchKegiatan = async () => {
    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .order('id_kegiatan', { ascending: false });
      
    if (data) setKegiatan(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const handleDelete = async (id: string) => {
    const isConfirm = window.confirm(
      'Yakin ingin menghapus kegiatan ini? Pastikan tidak ada transaksi yang terhubung dengan kegiatan ini.'
    );
    
    if (isConfirm) {
      const { error } = await supabase.from('kegiatan').delete().eq('id_kegiatan', id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
      } else {
        alert('Kegiatan berhasil dihapus!');
        fetchKegiatan(); // Refresh tabel setelah dihapus
      }
    }
  };

  return (
    <main className="p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Kembali ke Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Kelola Kategori Kegiatan</h1>
            <Link 
              href="/tambah-kegiatan" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Tambah Baru
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th className="p-4 border-b font-medium">ID</th>
                  <th className="p-4 border-b font-medium">Nama Kegiatan</th>
                  <th className="p-4 border-b font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={3} className="p-4 text-center">Memuat data...</td></tr>
                ) : kegiatan.length === 0 ? (
                  <tr><td colSpan={3} className="p-4 text-center text-gray-500">Belum ada kategori kegiatan.</td></tr>
                ) : (
                  kegiatan.map((item) => (
                    <tr key={item.id_kegiatan} className="hover:bg-gray-50">
                      <td className="p-4 border-b text-sm text-gray-600">{item.id_kegiatan}</td>
                      <td className="p-4 border-b font-medium text-gray-800">{item.nama_kegiatan}</td>
                      <td className="p-4 border-b text-center space-x-2">
                        <Link 
                          href={`/kegiatan/edit/${item.id_kegiatan}`} 
                          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(item.id_kegiatan)} 
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
                        >
                          Hapus
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
    </main>
  );
}