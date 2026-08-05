"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TambahTransaksi() {
  const router = useRouter();
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_kegiatan: '',
    tanggal_transaksi: '',
    jenis_transaksi: 'pemasukan',
    detail_transaksi: '',
    jumlah: ''
  });

  useEffect(() => {
    const fetchKegiatan = async () => {
      const { data } = await supabase.from('kegiatan').select('*');
      if (data && data.length > 0) {
        setKegiatan(data);
        setFormData(prev => ({ ...prev, id_kegiatan: data[0].id_kegiatan }));
      }
    };
    fetchKegiatan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 1. Cek siapa yang sedang login
    const { data: { user } } = await supabase.auth.getUser();

    // PENGECEKAN BARU: Jika tidak ada user yang login, tolak simpan!
    if (!user) {
      alert('Anda harus Login terlebih dahulu untuk menambah transaksi!');
      setIsLoading(false);
      router.push('/login'); // Lempar kembali ke halaman login
      return; // Hentikan proses
    }

    // 2. Lanjut simpan ke database jika user ada
    const { error } = await supabase
      .from('transaksi')
      .insert([
        {
          id_kegiatan: formData.id_kegiatan,
          tanggal_transaksi: formData.tanggal_transaksi,
          jenis_transaksi: formData.jenis_transaksi,
          detail_transaksi: formData.detail_transaksi,
          jumlah: Number(formData.jumlah),
          diinput_oleh: user.id // Sekarang dipastikan aman
        }
      ]);

    setIsLoading(false);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert('Transaksi Berhasil Dicatat!');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Kembali ke Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-xl shadow border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Catat Transaksi Baru</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Input Jenis Transaksi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-gray-900"
                value={formData.jenis_transaksi}
                onChange={(e) => setFormData({...formData, jenis_transaksi: e.target.value})}
              >
                <option value="pemasukan">Pemasukan</option>
                <option value="pengeluaran">Pengeluaran</option>
              </select>
            </div>

            {/* Input Kegiatan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kegiatan</label>
              <select 
                required
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-gray-900"
                value={formData.id_kegiatan}
                onChange={(e) => setFormData({...formData, id_kegiatan: e.target.value})}
              >
                <option value="" disabled>-- Pilih Kegiatan --</option>
                {kegiatan.map((item) => (
                  <option key={item.id_kegiatan} value={item.id_kegiatan}>{item.nama_kegiatan}</option>
                ))}
              </select>
            </div>

            {/* Input Tanggal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
              <input 
                type="date" required 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-gray-900"
                value={formData.tanggal_transaksi}
                onChange={(e) => setFormData({...formData, tanggal_transaksi: e.target.value})}
              />
            </div>

            {/* Input Keterangan / Detail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Detail</label>
              <input 
                type="text" required placeholder="Contoh: Iuran kas bulan ini" 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900"
                value={formData.detail_transaksi}
                onChange={(e) => setFormData({...formData, detail_transaksi: e.target.value})}
              />
            </div>

            {/* Input Nominal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
              <input 
                type="number" required min="0" placeholder="Contoh: 150000" 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 placeholder-gray-500 text-gray-900"
                value={formData.jumlah}
                onChange={(e) => setFormData({...formData, jumlah: e.target.value})}
              />
            </div>

            {/* Tombol Simpan */}
            <button type="submit" disabled={isLoading} className="w-full p-4 mt-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded-lg disabled:bg-blue-300">
              {isLoading ? 'Menyimpan Data...' : 'Simpan Transaksi'}
            </button>
            
          </form>
        </div>
      </div>
    </main>
  );
}