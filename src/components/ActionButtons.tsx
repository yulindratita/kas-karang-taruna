"use client";

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

export default function ActionButtons({ id }: { id: string }) {
  const router = useRouter();

  const dialog = useConfirmDialog();

  // Fungsi untuk menghapus data
  const handleDelete = () => {
    dialog.openDialog(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      async () => {
        const { error } = await supabase
          .from('transaksi')
          .delete()
          .eq('id_transaksi', id);

        if (error) {
          dialog.showError('Gagal', 'Gagal menghapus: ' + error.message);
        } else {
          dialog.showSuccess('Berhasil', 'Data berhasil dihapus!');
          router.refresh(); // Memuat ulang tabel di Dashboard
        }
      },
      { confirmText: 'Ya, Hapus', variant: 'danger' }
    );
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