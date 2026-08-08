"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Save, Wallet, Plus, Trash2, ShoppingCart } from 'lucide-react';

export default function TambahTransaksi() {
  const [isLoading, setIsLoading] = useState(false);
  
  // State Data Master
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);

  // State Keranjang
  const [keranjang, setKeranjang] = useState<any[]>([]);

  // State Form Input
  const [idKegiatan, setIdKegiatan] = useState('');
  const [idKategori, setIdKategori] = useState('');
  const [jenisTransaksi, setJenisTransaksi] = useState('Pemasukan');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [detail, setDetail] = useState('');

  // Mengambil Data Master
  useEffect(() => {
    const fetchData = async () => {
      const { data: dataKegiatan } = await supabase.from('kegiatan').select('*').order('created_at', { ascending: false });
      if (dataKegiatan) setKegiatanList(dataKegiatan);

      const { data: dataKategori } = await supabase.from('kategori').select('*');
      if (dataKategori) setKategoriList(dataKategori);
    };
    fetchData();
  }, []);

  const kategoriTersaring = kategoriList.filter(k => k.jenis === jenisTransaksi);

  const handleTambahKeranjang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idKegiatan || !idKategori || !jumlah) {
      alert('Harap lengkapi Kegiatan, Kategori, dan Nominal!');
      return;
    }

    const namaKegiatan = kegiatanList.find(k => k.id_kegiatan === idKegiatan)?.nama_kegiatan;
    const namaKategori = kategoriList.find(k => k.id_kategori === idKategori)?.nama_kategori;

    const itemBaru = {
      id_temp: Date.now(),
      idKegiatan,
      namaKegiatan,
      idKategori,
      namaKategori,
      jenisTransaksi,
      jumlah: parseFloat(jumlah),
      tanggal,
      detail
    };

    setKeranjang([...keranjang, itemBaru]);
    setJumlah('');
    setDetail('');
  };

  const handleHapusKeranjang = (id_temp: number) => {
    const keranjangBaru = keranjang.filter(item => item.id_temp !== id_temp);
    setKeranjang(keranjangBaru);
  };

  const handleSimpanKeDatabase = async () => {
    if (keranjang.length === 0) return;
    const isConfirm = window.confirm(`Yakin ingin menyimpan ${keranjang.length} transaksi ini ke database?`);
    if (!isConfirm) return;

    setIsLoading(true);

    const payloadDatabase = keranjang.map(item => ({
      id_kegiatan: item.idKegiatan,
      id_kategori: item.idKategori,
      jenis_transaksi: item.jenisTransaksi,
      jumlah: item.jumlah,
      tanggal_transaksi: item.tanggal,
      detail_transaksi: item.detail
    }));

    const { error } = await supabase.from('transaksi').insert(payloadDatabase);
    setIsLoading(false);

    if (error) {
      alert('Gagal menyimpan transaksi: ' + error.message);
    } else {
      alert(`${keranjang.length} Transaksi berhasil dicatat ke sistem!`);
      setKeranjang([]); 
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const totalMasuk = keranjang.filter(i => i.jenisTransaksi === 'Pemasukan').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalKeluar = keranjang.filter(i => i.jenisTransaksi === 'Pengeluaran').reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <main className="p-6 md:p-10 font-sans bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-6xl mx-auto">
        
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900 font-bold mb-6 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Kembali ke Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
            <Wallet size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Catat Transaksi (Massal)</h1>
            <p className="text-gray-500 font-medium mt-1">Kumpulkan data di keranjang, lalu simpan sekaligus.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* BAGIAN KIRI: Form Input */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Form Input Nota</h2>
            
            <form onSubmit={handleTambahKeranjang} className="space-y-5">
              
              {/* Jenis Transaksi (Radio Buttons) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Jenis Arus Kas</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                    jenisTransaksi === 'Pemasukan' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="jenis" 
                      value="Pemasukan"
                      checked={jenisTransaksi === 'Pemasukan'}
                      onChange={(e) => { setJenisTransaksi(e.target.value); setIdKategori(''); }}
                      className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="ml-2 font-bold text-sm">Pemasukan (+)</span>
                  </label>

                  <label className={`flex-1 flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                    jenisTransaksi === 'Pengeluaran' 
                      ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="jenis" 
                      value="Pengeluaran"
                      checked={jenisTransaksi === 'Pengeluaran'}
                      onChange={(e) => { setJenisTransaksi(e.target.value); setIdKategori(''); }}
                      className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="ml-2 font-bold text-sm">Pengeluaran (-)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-medium text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kegiatan</label>
                <select value={idKegiatan} onChange={(e) => setIdKegiatan(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-medium text-sm" required>
                  <option value="" disabled>-- Pilih Kegiatan --</option>
                  {kegiatanList.map((k) => <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                <select value={idKategori} onChange={(e) => setIdKategori(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-medium text-sm" required>
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {kategoriTersaring.map((k) => <option key={k.id_kategori} value={k.id_kategori}>{k.nama_kategori}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nominal (Rp)</label>
                <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} min="0" placeholder="0" className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none font-black text-lg" required />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Keterangan Tambahan</label>
                <textarea rows={2} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Contoh: Beli Aqua" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 outline-none text-sm resize-none"></textarea>
              </div>

              <button type="submit" className="w-full flex items-center justify-center p-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-colors">
                <Plus size={18} className="mr-2" /> Tambah ke Keranjang
              </button>
            </form>
          </div>

          {/* BAGIAN KANAN: Keranjang & Preview */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex-1">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <ShoppingCart size={22} className="mr-2 text-blue-600" />
                  Daftar Antrean (<span className="text-blue-600 ml-1">{keranjang.length}</span>)
                </h2>
                
                {keranjang.length > 0 && (
                  <button onClick={handleSimpanKeDatabase} disabled={isLoading} className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors disabled:opacity-50">
                    <Save size={18} className="mr-2" />
                    {isLoading ? 'Menyimpan...' : 'Simpan ke Database'}
                  </button>
                )}
              </div>

              {keranjang.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">Belum ada transaksi di keranjang.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[400px] pr-2">
                  <div className="space-y-3">
                    {keranjang.map((item, index) => (
                      <div key={item.id_temp} className="flex justify-between items-center p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white transition-colors group">
                        <div className="flex gap-4">
                          <div className={`flex flex-col justify-center items-center w-10 h-10 rounded-full font-black text-sm ${item.jenisTransaksi === 'Pemasukan' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm mb-0.5">{item.namaKategori} <span className="text-gray-400 font-normal">| {item.namaKegiatan}</span></p>
                            <p className="text-xs text-gray-500 font-medium">{item.tanggal} • {item.detail || 'Tanpa keterangan'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className={`font-black tracking-tight ${item.jenisTransaksi === 'Pemasukan' ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {item.jenisTransaksi === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.jumlah)}
                          </p>
                          <button onClick={() => handleHapusKeranjang(item.id_temp)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kotak Ringkasan Nominal */}
            {keranjang.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                  <p className="text-emerald-600 text-sm font-bold mb-1">Total Pemasukan Antrean</p>
                  <p className="text-2xl font-black text-emerald-700">{formatRupiah(totalMasuk)}</p>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl">
                  <p className="text-rose-600 text-sm font-bold mb-1">Total Pengeluaran Antrean</p>
                  <p className="text-2xl font-black text-rose-700">{formatRupiah(totalKeluar)}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}