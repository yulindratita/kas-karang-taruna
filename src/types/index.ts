export interface Transaksi {
  id_transaksi: string;
  jenis_transaksi: 'Pemasukan' | 'Pengeluaran';
  jumlah: number;
  tanggal_transaksi: string;
  detail_transaksi?: string;
  created_at?: string;
  kegiatan?: { nama_kegiatan: string } | null;
  kategori?: { nama_kategori: string } | null;
  divisi?: { nama_divisi: string } | null;
  sub_kegiatan?: { nama_sub_kegiatan: string } | null;
  id_divisi?: string | null;
  id_kegiatan?: string;
  id_sub_kegiatan?: string | null;
  id_kategori?: string;
}

export interface Divisi {
  id_divisi: string;
  nama_divisi: string;
  created_at?: string;
}

export interface Kegiatan {
  id_kegiatan: string;
  nama_kegiatan: string;
  created_at?: string;
}

export interface SubKegiatan {
  id_sub_kegiatan: string;
  id_kegiatan: string;
  nama_sub_kegiatan: string;
  created_at?: string;
  kegiatan?: { nama_kegiatan: string } | null;
}

export interface Kategori {
  id_kategori: string;
  nama_kategori: string;
  jenis?: string;
  created_at?: string;
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

export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // ms, default 3000
}

export type DialogVariant = 'confirm' | 'alert' | 'success' | 'error' | 'warning' | 'info';

// Toast types
export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  position: ToastPosition;
}

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastOptions {
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: ToastPosition;
}
