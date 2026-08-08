"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash2, Tag, Layers } from 'lucide-react';

export default function KelolaKategori() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  
  // State untuk Form Tambah Kategori
  const [namaKategori, setNamaKategori] = useState('');
  const [jenis, setJenis] = useState('Pemasukan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil Data Kategori
  const fetchKategori = async () => {
    const { data, error } = await supabase
      .from('kategori')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching kategori:', error);
    } else {
      setKategoriList(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Proteksi Halaman: Pastikan yang masuk adalah admin
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Akses Ditolak! Silakan login.');
        router.push('/login');
        return;
      }
      fetchKategori();
    };
    checkUser();
  }, [router]);

  // Fungsi Tambah Kategori
  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori) return alert('Nama kategori tidak boleh kosong!');
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from('kategori')
      .insert([{ nama_kategori: namaKategori, jenis: jenis }]);

    if (error) {
      alert('Gagal menambahkan kategori: ' + error.message);
    } else {
      setNamaKategori('');
      fetchKategori(); // Refresh tabel
    }
    setIsSubmitting(false);
  };

  // Fungsi Hapus Kategori
  const handleHapus = async (id: string, nama: string) => {
    const isConfirm = window.confirm(`Yakin ingin menghapus kategori "${nama}"?`);
    if (!isConfirm) return;

    const { error } = await supabase
      .from('kategori')
      .delete()
      .eq('id_kategori', id);

    if (error) {
      alert('Gagal menghapus kategori (Mungkin sedang digunakan di transaksi): ' + error.message);
    } else {
      fetchKategori();
    }
  };

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900 font-bold mb-6 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Kembali ke Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Kelola Kategori</h1>
            <p className="text-gray-500 font-medium mt-1">Buat kategori spesifik untuk merapikan pembukuan kas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Form Tambah */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <PlusCircle size={18} className="mr-2 text-blue-600" /> Tambah Baru
              </h2>
              <form onSubmit={handleTambah} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Kategori</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Konsumsi"
                    value={namaKategori}
                    onChange={(e) => setNamaKategori(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Arus Kas</label>
                  <select 
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50 focus:bg-white font-semibold"
                  >
                    <option value="Pemasukan">Pemasukan (+)</option>
                    <option value="Pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </form>
            </div>
          </div>

          {/* Tabel Daftar Kategori */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Tag size={18} className="mr-2 text-blue-600" /> Daftar Kategori Tersedia
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50">
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-tl-xl">Kategori</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Jenis</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right rounded-tr-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr><td colSpan={3} className="py-8 text-center text-gray-500 font-medium">Memuat data...</td></tr>
                    ) : kategoriList.length === 0 ? (
                      <tr><td colSpan={3} className="py-8 text-center text-gray-500 font-medium">Belum ada kategori. Silakan buat di samping.</td></tr>
                    ) : (
                      kategoriList.map((item) => (
                        <tr key={item.id_kategori} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-800">{item.nama_kategori}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${item.jenis === 'Pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {item.jenis}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button 
                              onClick={() => handleHapus(item.id_kategori, item.nama_kategori)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Kategori"
                            >
                              <Trash2 size={18} />
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

        </div>
      </div>
    </main>
  );
}