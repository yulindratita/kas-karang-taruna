"use client";

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ActionButtons({ id }: { id: string }) {
  const router = useRouter();

  // Fungsi untuk menghapus data
  const handleDelete = async () => {
    // Munculkan dialog konfirmasi sebelum menghapus
    const isConfirm = window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?');
    
    if (isConfirm) {
      const { error } = await supabase
        .from('transaksi')
        .delete()
        .eq('id_transaksi', id);

      if (error) {
        alert('Gagal menghapus: ' + error.message);
      } else {
        alert('Data berhasil dihapus!');
        router.refresh(); // Memuat ulang tabel di Dashboard
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      <Link 
        href={`/edit/${id}`} 
        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium transition-colors"
      >
        Edit
      </Link>
      <button 
        onClick={handleDelete} 
        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
      >
        Hapus
      </button>
    </div>
  );
}