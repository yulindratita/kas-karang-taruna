"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Save, FileText, ArrowLeft, Plus, ShoppingCart, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TambahTransaksi() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [keranjang, setKeranjang] = useState<any[]>([]);

  const [form, setForm] = useState({
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    jenis_transaksi: 'Pemasukan',
    id_kegiatan: '',
    id_kategori: '',
    jumlah: '',
    detail_transaksi: ''
  });

  // State Pop-up Konfirmasi Kustom
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false, title: '', message: '', confirmText: 'Ya, Lanjutkan', isDanger: false, onConfirm: () => {}
  });

  useEffect(() => {
    const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchMasterData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Silakan login terlebih dahulu.');
        router.push('/');
        return;
      }
      const { data: dataKeg } = await supabase.from('kegiatan').select('id_kegiatan, nama_kegiatan');
      if (dataKeg) {
        setKegiatanList(dataKeg);
        if (dataKeg.length > 0) setForm(prev => ({ ...prev, id_kegiatan: dataKeg[0].id_kegiatan }));
      }
      const { data: dataKat } = await supabase.from('kategori').select('*');
      if (dataKat) setKategoriList(dataKat);
    };
    fetchMasterData();
  }, [router]);

  const handleTambahKeKeranjang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_kegiatan || !form.id_kategori || !form.jumlah) {
      alert('Mohon lengkapi data Kegiatan, Kategori, dan Nominal!');
      return;
    }
    const kegiatanTerpilih = kegiatanList.find(k => k.id_kegiatan === form.id_kegiatan);
    const kategoriTerpilih = kategoriList.find(k => k.id_kategori === form.id_kategori);
    const itemBaru = {
      id_temp: Date.now().toString(), ...form, jumlah: parseFloat(form.jumlah),
      nama_kegiatan: kegiatanTerpilih?.nama_kegiatan || '-', nama_kategori: kategoriTerpilih?.nama_kategori || '-'
    };
    setKeranjang([...keranjang, itemBaru]);
    setForm(prev => ({ ...prev, jumlah: '', detail_transaksi: '' }));
  };

  const handleHapusDariKeranjang = (id_temp: string) => {
    setKeranjang(keranjang.filter(item => item.id_temp !== id_temp));
  };

  // --- ALUR SIMPAN KERANJANG ---
  const handleSimpanSemua = () => {
    if (keranjang.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Simpan Transaksi',
      message: `Apakah Anda yakin ingin menyimpan ${keranjang.length} transaksi ini ke dalam buku besar secara permanen?`,
      confirmText: 'Ya, Simpan Semua',
      isDanger: false,
      onConfirm: eksekusiSimpanSemua
    });
  };

  const eksekusiSimpanSemua = async () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setIsLoading(true);

    const dataToInsert = keranjang.map(item => ({
      tanggal_transaksi: item.tanggal_transaksi, jenis_transaksi: item.jenis_transaksi,
      id_kegiatan: item.id_kegiatan, id_kategori: item.id_kategori,
      jumlah: item.jumlah, detail_transaksi: item.detail_transaksi
    }));

    const { error } = await supabase.from('transaksi').insert(dataToInsert);
    setIsLoading(false);

    if (error) {
      alert('Gagal menyimpan transaksi: ' + error.message);
    } else {
      setKeranjang([]);
      router.push('/laporan');
    }
  };

  const kategoriTersaring = kategoriList.filter(k => k.jenis === form.jenis_transaksi);
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const totalNominalKeranjang = keranjang.reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Catat Kas (Mode Keranjang)</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kumpulkan nota dalam antrean sebelum disimpan massal.</p>
          </div>
          <Link href="/" className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <ArrowLeft size={16} className="mr-2" /> Kembali
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 flex flex-col h-full rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
            <div className={`p-5 border-b flex items-center gap-3 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-50 text-blue-600'}`}><FileText size={20} /></div>
              <h3 className="text-lg font-bold">Form Input Nota</h3>
            </div>
            <form onSubmit={handleTambahKeKeranjang} className="p-6 space-y-5 flex-1">
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Jenis Arus Kas</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForm({...form, jenis_transaksi: 'Pemasukan', id_kategori: ''})} className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${form.jenis_transaksi === 'Pemasukan' ? (isDarkMode ? 'border-cyan-500 bg-cyan-500/10' : 'border-emerald-500 bg-emerald-50') : (isDarkMode ? 'border-slate-700 bg-transparent hover:border-slate-600' : 'border-gray-200 bg-transparent hover:border-gray-300')}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.jenis_transaksi === 'Pemasukan' ? (isDarkMode ? 'border-cyan-500' : 'border-emerald-600') : (isDarkMode ? 'border-slate-500' : 'border-gray-400')}`}>{form.jenis_transaksi === 'Pemasukan' && <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-cyan-500' : 'bg-emerald-600'}`} />}</div>
                    <span className={`font-bold text-sm ${form.jenis_transaksi === 'Pemasukan' ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-700') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>Pemasukan (+)</span>
                  </button>
                  <button type="button" onClick={() => setForm({...form, jenis_transaksi: 'Pengeluaran', id_kategori: ''})} className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${form.jenis_transaksi === 'Pengeluaran' ? (isDarkMode ? 'border-rose-500 bg-rose-500/10' : 'border-rose-500 bg-rose-50') : (isDarkMode ? 'border-slate-700 bg-transparent hover:border-slate-600' : 'border-gray-200 bg-transparent hover:border-gray-300')}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.jenis_transaksi === 'Pengeluaran' ? 'border-rose-500' : (isDarkMode ? 'border-slate-500' : 'border-gray-400')}`}>{form.jenis_transaksi === 'Pengeluaran' && <div className={`w-2 h-2 rounded-full bg-rose-500`} />}</div>
                    <span className={`font-bold text-sm ${form.jenis_transaksi === 'Pengeluaran' ? (isDarkMode ? 'text-rose-400' : 'text-rose-700') : (isDarkMode ? 'text-slate-400' : 'text-slate-500')}`}>Pengeluaran (-)</span>
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tanggal Transaksi</label>
                <input type="date" value={form.tanggal_transaksi} onChange={(e) => setForm({...form, tanggal_transaksi: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kegiatan</label>
                <select value={form.id_kegiatan} onChange={(e) => setForm({...form, id_kegiatan: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required>
                  <option value="" disabled>-- Pilih Kegiatan --</option>
                  {kegiatanList.map((k) => <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Kategori</label>
                <select value={form.id_kategori} onChange={(e) => setForm({...form, id_kategori: e.target.value})} className={`w-full p-3 border rounded-xl outline-none font-medium text-sm transition-colors cursor-pointer ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required>
                  <option value="" disabled>-- Pilih Kategori --</option>
                  {kategoriTersaring.map((k) => <option key={k.id_kategori} value={k.id_kategori}>{k.nama_kategori}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nominal (Rp)</label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Rp</span>
                  <input type="number" min="0" placeholder="0" value={form.jumlah} onChange={(e) => setForm({...form, jumlah: e.target.value})} className={`w-full p-3 pl-12 border rounded-xl outline-none font-black text-xl transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} required />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Keterangan Tambahan (Opsional)</label>
                <textarea rows={2} placeholder="Contoh: Beli Aqua..." value={form.detail_transaksi} onChange={(e) => setForm({...form, detail_transaksi: e.target.value})} className={`w-full p-3 border rounded-xl outline-none text-sm resize-none transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`}></textarea>
              </div>
              <button type="submit" className={`w-full flex items-center justify-center px-6 py-3.5 rounded-xl font-bold text-sm transition-colors border-2 border-dashed ${isDarkMode ? 'bg-transparent border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10' : 'bg-transparent border-blue-500/50 text-blue-600 hover:bg-blue-50'}`}>
                <Plus size={18} className="mr-2" /> Masukkan ke Antrean
              </button>
            </form>
          </div>

          <div className={`lg:col-span-7 flex flex-col h-full rounded-2xl border shadow-sm overflow-hidden ${isDarkMode ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-gray-200'}`}>
            <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}><ShoppingCart size={20} /></div>
                <h3 className="text-lg font-bold">Daftar Antrean ({keranjang.length})</h3>
              </div>
              {keranjang.length > 0 && <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>Total: {formatRupiah(totalNominalKeranjang)}</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-transparent">
              {keranjang.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center opacity-50">
                  <ShoppingCart size={64} strokeWidth={1} className={`mb-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p className={`font-medium ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Belum ada transaksi di keranjang.</p>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>Isi form di samping untuk mulai mendata.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {keranjang.map((item) => (
                    <div key={item.id_temp} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.jenis_transaksi === 'Pemasukan' ? (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700')}`}>{item.jenis_transaksi}</span>
                          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>• {item.tanggal_transaksi}</span>
                        </div>
                        <h4 className="font-bold text-sm line-clamp-1">{item.nama_kategori} - {item.nama_kegiatan}</h4>
                        {item.detail_transaksi && <p className={`text-xs mt-0.5 line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{item.detail_transaksi}</p>}
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0 mt-3 sm:mt-0 border-slate-700/50">
                        <span className={`font-black tracking-tight ${item.jenis_transaksi === 'Pemasukan' ? (isDarkMode ? 'text-cyan-400' : 'text-emerald-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>
                          {item.jenis_transaksi === 'Pemasukan' ? '+' : '-'}{formatRupiah(item.jumlah)}
                        </span>
                        <button onClick={() => handleHapusDariKeranjang(item.id_temp)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 text-gray-400 hover:bg-rose-950/50 hover:text-rose-400' : 'bg-white border text-gray-400 hover:bg-rose-50 hover:text-rose-600'}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {keranjang.length > 0 && (
              <div className={`p-5 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${isDarkMode ? 'border-slate-800 bg-[#0f172a]' : 'border-gray-100 bg-white'}`}>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pastikan data antrean sudah benar sebelum disimpan.</p>
                <button onClick={handleSimpanSemua} disabled={isLoading} className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg disabled:opacity-50 ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>
                  {isLoading ? 'Menyimpan Data...' : <><Save size={18} className="mr-2" /> Simpan {keranjang.length} Transaksi</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POP-UP KONFIRMASI KUSTOM */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600') : (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600')}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{confirmDialog.title}</h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{confirmDialog.message}</p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Batal
              </button>
              <button onClick={confirmDialog.onConfirm} className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-600 text-white hover:bg-rose-700') : (isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700')}`}>
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}