"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
// CalendarDays sudah ditambahkan ke daftar import di bawah ini:
import { LogIn, LogOut, UserCircle, ShieldCheck, Sun, Moon, Search, Bell, Menu, X, ChevronDown, TrendingUp, List, Layers, FileBarChart, PlusCircle, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<any>(null);
  const [userProfil, setUserProfil] = useState<{ nama_lengkap: string; role: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inisialisasi Tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Auto Logout (Idle Timer 10 Menit)
  useEffect(() => {
    if (!user) return;
    let timeoutId: NodeJS.Timeout;
    const logoutWaktuHabis = async () => {
      await supabase.auth.signOut();
      alert('Sesi Anda telah berakhir karena tidak ada aktivitas selama 10 menit.');
      window.location.href = '/'; 
    };
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutWaktuHabis, 10 * 60 * 1000); 
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  // Cek Sesi
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profil } = await supabase.from('users_profile').select('nama_lengkap, role').eq('id', session.user.id).single(); 
        if (profil) setUserProfil(profil);
      }
      setIsLoading(false);
    };
    fetchSessionAndProfile();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session) setUserProfil(null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAksesAdmin = (path: string) => {
    if (!user) {
      alert('Akses Ditolak! Anda belum login.');
      router.push('/login');
    } else {
      router.push(path);
      setIsSidebarOpen(false); 
    }
  };

  const handleLogout = async () => {
    const isConfirm = window.confirm('Apakah Anda yakin ingin keluar?');
    if (isConfirm) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  const role = userProfil?.role?.toUpperCase() || '';
  const isBisaEdit = role === 'SUPER_ADMIN' || role === 'BENDAHARA';

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#090e17] text-gray-100' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static top-0 left-0 z-50 h-full w-72 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isDarkMode ? 'bg-[#0f172a] border-r border-slate-800/80' : 'bg-white border-r border-gray-200'}`}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cyan-50 border border-cyan-100">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-tight">Dashboard<br/>Keuangan</h1>
            </div>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>

        <div className={`mx-4 p-4 rounded-2xl mb-6 ${isDarkMode ? 'bg-[#1e293b]/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <UserCircle size={36} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={1.5} />
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{userProfil?.nama_lengkap || (user ? user.email : 'Mode Publik')}</p>
              <p className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max mt-1 ${role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' : role === 'BENDAHARA' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>{role || 'PENGAWAS'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {role === 'SUPER_ADMIN' && (
              <button onClick={() => handleAksesAdmin('/pengguna')} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}>
                <ShieldCheck size={14} className="mr-1.5" /> Akses
              </button>
            )}
            <button onClick={user ? handleLogout : () => router.push('/login')} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}`}>
              {user ? <><LogOut size={14} className="mr-1.5" /> Keluar</> : <><LogIn size={14} className="mr-1.5" /> Login</>}
            </button>
          </div>
          <div className={`mt-3 flex items-center justify-between p-1.5 rounded-lg ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-200'}`}>
            <span className={`text-[10px] font-bold ml-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            <button onClick={toggleTheme} className={`p-1.5 rounded-md shadow-sm transition-all ${isDarkMode ? 'bg-cyan-500 text-white' : 'bg-white text-amber-500'}`}>
              {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-2 mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Menu Utama</p>
          
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
            <TrendingUp size={18} className="mr-3" /> Dashboard
          </Link>
          
          {isBisaEdit && (
            <>
              <button onClick={() => handleAksesAdmin('/kegiatan')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/kegiatan' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
                <List size={18} className="mr-3" /> Kegiatan
              </button>
              <button onClick={() => handleAksesAdmin('/kategori')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/kategori' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
                <Layers size={18} className="mr-3" /> Kategori
              </button>
            </>
          )}

          <button onClick={() => handleAksesAdmin('/laporan')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/laporan' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}>
            <FileBarChart size={18} className="mr-3" /> Buku Besar
          </button>
        </nav>

        {isBisaEdit && (
          <div className="p-4 mt-auto border-t border-slate-800/50">
            <button onClick={() => handleAksesAdmin('/tambah')} className={`w-full flex items-center justify-center px-4 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>
              <PlusCircle size={18} className="mr-2" /> Catat Kas Baru
            </button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP BAR */}
        <header className={`h-20 px-6 flex items-center justify-between flex-shrink-0 z-10 transition-colors ${isDarkMode ? 'bg-[#090e17]' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className={`hidden md:flex items-center w-full max-w-md px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
              <Search size={18} className="mr-2 opacity-50" />
              <input type="text" placeholder="Cari transaksi, kategori..." className="bg-transparent border-none outline-none w-full text-sm placeholder-slate-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
              <CalendarDays size={16} className="mr-2" />
              <span>1 Jan - 31 Des 2024</span>
              <ChevronDown size={14} className="ml-3 opacity-50" />
            </div>
            <button className={`p-2.5 rounded-full relative border ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-300 hover:text-cyan-400' : 'bg-white border-slate-200 text-slate-600'}`}>
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* ISI HALAMAN DINAMIS DIMASUKKAN KE SINI */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}