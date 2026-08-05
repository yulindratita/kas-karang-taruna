"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus } from 'lucide-react';

export default function TambahTransaksi() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  
  // State untuk Data Master (Satu Kegiatan)
  const [idKegiatan, setIdKegiatan] = useState('');

  // State untuk Data Detail (Banyak Transaksi)
  const [barisTransaksi, setBarisTransaksi] = useState([
    { tanggal_transaksi: '', jenis_transaksi: 'Pemasukan', detail_transaksi: '', jumlah: '' }
  ]);

  // TAMBAHAN BARU: Pengecekan Login Saat Halaman Dimuat
  useEffect(() => {
    const cekAkses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Anda tidak memiliki akses ke halaman ini. Silakan Login!');
        router.push('/login');
      }
    };
    cekAkses();
  }, [router]);

  // Mengambil daftar kegiatan untuk dropdown
  useEffect(() => {
    const fetchKegiatan = async () => {
      const { data } = await supabase.from('kegiatan').select('*').order('nama_kegiatan', { ascending: true });
      if (data) setKegiatanList(data);
    };
    fetchKegiatan();
  }, []);

  // Fungsi Tambah Baris Form
  const tambahBaris = () => {
    setBarisTransaksi([
      ...barisTransaksi, 
      { tanggal_transaksi: '', jenis_transaksi: 'Pemasukan', detail_transaksi: '', jumlah: '' }
    ]);
  };

  // Fungsi Hapus Baris Form
  const hapusBaris = (index: number) => {
    const dataBaru = [...barisTransaksi];
    dataBaru.splice(index, 1);
    setBarisTransaksi(dataBaru);
  };

  // Fungsi Update Input pada baris tertentu
  const handleChangeBaris = (index: number, field: string, value: string) => {
    const dataBaru: any = [...barisTransaksi];
    dataBaru[index][field] = value;
    setBarisTransaksi(dataBaru);
  };

  // Simpan Semua Data ke Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Sesi admin berakhir. Silakan login ulang.');
      router.push('/login');
      return;
    }

    if (!idKegiatan) {
      alert('Pilih kategori kegiatan terlebih dahulu!');
      setIsLoading(false);
      return;
    }

    // 1. Memformat data array sesuai struktur database
    const payload = barisTransaksi.map((baris) => ({
      id_kegiatan: idKegiatan,
      diinput_oleh: user.id,
      tanggal_transaksi: baris.tanggal_transaksi,
      jenis_transaksi: baris.jenis_transaksi,
      detail_transaksi: baris.detail_transaksi,
      jumlah: Number(baris.jumlah)
    }));

    // 2. Insert banyak data sekaligus (Batch Insert)
    const { error } = await supabase.from('transaksi').insert(payload);

    setIsLoading(false);

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      alert(`${barisTransaksi.length} Transaksi Berhasil Dicatat!`);
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Kembali ke Dashboard
        </Link>
        
        <div className="bg-white p-6 md:p-8 rounded-xl shadow border border-gray-200">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Catat Transaksi Berantai</h1>

          <form onSubmit={handleSubmit}>
            {/* Bagian Master: Pilih Kegiatan */}
            <div className="mb-8 p-5 bg-blue-50 rounded-lg border border-blue-100">
              <label className="block text-sm font-semibold text-blue-900 mb-2">Kegiatan Utama (Satu untuk semua transaksi di bawah)</label>
              <select 
                required
                className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900 font-medium"
                value={idKegiatan}
                onChange={(e) => setIdKegiatan(e.target.value)}
              >
                <option value="" disabled>-- Pilih Kegiatan --</option>
                {kegiatanList.map((k) => (
                  <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>
                ))}
              </select>
            </div>

            {/* Bagian Detail: Daftar Transaksi */}
            <div className="space-y-4 mb-6">
              {barisTransaksi.map((baris, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-3 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                  
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal</label>
                    <input type="date" required 
                      className="w-full p-2.5 border border-gray-300 rounded-md outline-none focus:border-blue-500 bg-white text-gray-900 font-medium" 
                      value={baris.tanggal_transaksi} 
                      onChange={(e) => handleChangeBaris(index, 'tanggal_transaksi', e.target.value)} />
                  </div>

                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Jenis</label>
                    <select 
                      className="w-full p-2.5 border border-gray-300 rounded-md outline-none focus:border-blue-500 bg-white text-gray-900 font-medium" 
                      value={baris.jenis_transaksi} 
                      onChange={(e) => handleChangeBaris(index, 'jenis_transaksi', e.target.value)}>
                      {/* Koreksi Istilah Akuntansi */}
                      <option value="Pemasukan">Pemasukan (Debit)</option>
                      <option value="Pengeluaran">Pengeluaran (Kredit)</option>
                    </select>
                  </div>

                  <div className="w-full md:w-1/3">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan Detail</label>
                    <input type="text" required placeholder="Contoh: Konsumsi rapat" 
                      className="w-full p-2.5 border border-gray-300 rounded-md outline-none focus:border-blue-500 bg-white text-gray-900 font-medium placeholder:text-gray-400" 
                      value={baris.detail_transaksi} 
                      onChange={(e) => handleChangeBaris(index, 'detail_transaksi', e.target.value)} />
                  </div>

                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nominal (Rp)</label>
                    <input type="number" required placeholder="50000" min="0" 
                      className="w-full p-2.5 border border-gray-300 rounded-md outline-none focus:border-blue-500 bg-white text-gray-900 font-medium placeholder:text-gray-400" 
                      value={baris.jumlah} 
                      onChange={(e) => handleChangeBaris(index, 'jumlah', e.target.value)} />
                  </div>

                  {barisTransaksi.length > 1 && (
                    <button type="button" onClick={() => hapusBaris(index)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 h-11 px-3 flex items-center justify-center">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4 pt-4 border-t border-gray-200">
              <button type="button" onClick={tambahBaris} className="flex items-center text-blue-700 hover:bg-blue-100 font-bold px-4 py-2 bg-blue-50 rounded-lg transition-colors">
                <Plus size={18} className="mr-2" /> Tambah Baris Transaksi
              </button>

              <button type="submit" disabled={isLoading} className="w-full md:w-auto px-8 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-lg disabled:bg-gray-400 shadow-md">
                {isLoading ? 'Menyimpan...' : `Simpan ${barisTransaksi.length} Transaksi`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}