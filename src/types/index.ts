export interface Transaksi {
  id_transaksi: string;
  jenis_transaksi: 'Pemasukan' | 'Pengeluaran';
  jumlah: number;
  tanggal_transaksi: string;
  detail_transaksi?: string;
  created_at?: string;
  kegiatan?: { nama_kegiatan: string } | null;
  kategori?: { nama_kategori: string } | null;
}

export interface UserProfile {
  nama_lengkap: string;
  role: 'SUPER_ADMIN' | 'BENDAHARA' | 'PENGAWAS' | string;
}

export interface StatistikKas {
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}
