"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function TambahKegiatan() {
  const router = useRouter();
  const dialog = useConfirmDialog();
  const { showSuccess, showError } = useToast();
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKegiatan.trim()) {
      showError('Nama kegiatan tidak boleh kosong', 'Validasi Gagal');
      return;
    }
    setIsLoading(true);

    const { error } = await supabase
      .from('kegiatan')
      .insert([{ nama_kegiatan: namaKegiatan }]);

    setIsLoading(false);

    if (error) {
      showError(error.message, 'Gagal Menyimpan Kegiatan');
    } else {
      showSuccess('Kegiatan Berhasil Ditambahkan!', 'Berhasil');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Kembali ke Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Tambah Kategori Kegiatan</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
              <input 
                type="text" 
                required 
                placeholder="Contoh: Iuran Bulanan, Konsumsi, dll" 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 placeholder-gray-400 text-gray-900"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full p-4 mt-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold rounded-lg disabled:bg-indigo-300"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}