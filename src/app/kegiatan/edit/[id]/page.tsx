"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditKegiatan() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('kegiatan')
        .select('*')
        .eq('id_kegiatan', id)
        .single();

      if (data) setNamaKegiatan(data.nama_kegiatan);
      setIsFetching(false);
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from('kegiatan')
      .update({ nama_kegiatan: namaKegiatan })
      .eq('id_kegiatan', id);

    setIsLoading(false);

    if (error) {
      alert('Gagal mengupdate: ' + error.message);
    } else {
      alert('Kategori Kegiatan Berhasil Diperbarui!');
      router.push('/kegiatan'); // Kembali ke daftar kegiatan
    }
  };

  if (isFetching) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <main className="p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">
        <Link href="/kegiatan" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Batal & Kembali
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Kategori Kegiatan</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-gray-900"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full p-4 mt-2 bg-yellow-500 hover:bg-yellow-600 transition-colors text-white font-bold rounded-lg disabled:bg-yellow-300"
            >
              {isLoading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}