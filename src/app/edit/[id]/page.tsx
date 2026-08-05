"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditTransaksi() {
  const router = useRouter();
  const params = useParams(); 
  const id = params.id; // Mengambil ID dari URL

  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    id_kegiatan: '',
    tanggal_transaksi: '',
    jenis_transaksi: 'pemasukan',
    detail_transaksi: '',
    jumlah: ''
  });

  // Mengambil data transaksi lama berdasarkan ID saat halaman dimuat
  useEffect(() => {
    const fetchData = async () => {
      // Ambil daftar kegiatan
      const { data: kegData } = await supabase.from('kegiatan').select('*');
      if (kegData) setKegiatan(kegData);

      // Ambil data transaksi yang mau diedit
      const { data: trxData } = await supabase
        .from('transaksi')
        .select('*')
        .eq('id_transaksi', id)
        .single(); // Ambil 1 data spesifik

      if (trxData) {
        setFormData({
          id_kegiatan: trxData.id_kegiatan,
          tanggal_transaksi: trxData.tanggal_transaksi,
          jenis_transaksi: trxData.jenis_transaksi,
          detail_transaksi: trxData.detail_transaksi,
          jumlah: trxData.jumlah.toString()
        });
      }
      setIsFetching(false);
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from('transaksi')
      .update({
        id_kegiatan: formData.id_kegiatan,
        tanggal_transaksi: formData.tanggal_transaksi,
        jenis_transaksi: formData.jenis_transaksi,
        detail_transaksi: formData.detail_transaksi,
        jumlah: Number(formData.jumlah),
      })
      .eq('id_transaksi', id);

    setIsLoading(false);

    if (error) {
      alert('Gagal mengupdate: ' + error.message);
    } else {
      alert('Transaksi Berhasil Diperbarui!');
      router.push('/');
      router.refresh();
    }
  };

  if (isFetching) return <div className="p-10 text-center">Memuat data...</div>;

  return (
    <main className="p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Batal & Kembali
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Transaksi</h1>

          {/* Form yang sama persis dengan form tambah, hanya saja isinya sudah terisi data lama */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                value={formData.jenis_transaksi}
                onChange={(e) => setFormData({...formData, jenis_transaksi: e.target.value})}
              >
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kegiatan</label>
              <select 
                required
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                value={formData.id_kegiatan}
                onChange={(e) => setFormData({...formData, id_kegiatan: e.target.value})}
              >
                {kegiatan.map((item) => (
                  <option key={item.id_kegiatan} value={item.id_kegiatan}>{item.nama_kegiatan}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
              <input 
                type="date" required 
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                value={formData.tanggal_transaksi}
                onChange={(e) => setFormData({...formData, tanggal_transaksi: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Detail</label>
              <input 
                type="text" required
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                value={formData.detail_transaksi}
                onChange={(e) => setFormData({...formData, detail_transaksi: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
              <input 
                type="number" required min="0"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900"
                value={formData.jumlah}
                onChange={(e) => setFormData({...formData, jumlah: e.target.value})}
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full p-4 mt-2 bg-yellow-500 hover:bg-yellow-600 transition-colors text-white font-bold rounded-lg disabled:bg-yellow-300">
              {isLoading ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}