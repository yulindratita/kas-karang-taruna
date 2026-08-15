"use client";

import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LogIn, LogOut, UserCircle, ShieldCheck, Sun, Moon, Search, Menu, X, TrendingUp, List, Layers, FileBarChart, PlusCircle, CalendarDays, Mail, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types';

function HeaderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchKeyword, setSearchKeyword] = useState(searchParams?.get('q') || '');
  const [startDate, setStartDate] = useState(searchParams?.get('start') || '');
  const [endDate, setEndDate] = useState(searchParams?.get('end') || '');

  useEffect(() => {
    setSearchKeyword(searchParams?.get('q') || '');
    setStartDate(searchParams?.get('start') || '');
    setEndDate(searchParams?.get('end') || '');
  }, [searchParams]);

  const updateFilters = (q: string, start: string, end: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (q) params.set('q', q); else params.delete('q');
    if (start) params.set('start', start); else params.delete('start');
    if (end) params.set('end', end); else params.delete('end');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <div className="flex items-center justify-between flex-1 gap-4">
      <div className="hidden md:flex items-center w-full max-w-md px-3.5 py-2.5 rounded-xl border bg-white border-slate-200 text-slate-600 dark:bg-[#0f172a] dark:border-slate-800 dark:text-slate-300">
        <Search size={18} className="mr-2 opacity-50 flex-shrink-0" />
        <input
          type="text"
          placeholder="Cari transaksi, kategori... (Tekan Enter)"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilters(searchKeyword, startDate, endDate);
            }
          }}
          className="bg-transparent border-none outline-none w-full text-sm placeholder-slate-400 dark:placeholder-slate-500"
        />
        {searchKeyword && (
          <button
            type="button"
            onClick={() => {
              setSearchKeyword('');
              updateFilters('', startDate, endDate);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border bg-white border-slate-200 text-slate-600 dark:bg-[#0f172a] dark:border-slate-800 dark:text-slate-300 ml-auto">
        <CalendarDays size={15} className="opacity-60 flex-shrink-0 text-blue-600 dark:text-cyan-400" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            updateFilters(searchKeyword, e.target.value, endDate);
          }}
          className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
          title="Tanggal Mulai"
        />
        <span className="text-slate-400 font-bold">s/d</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            updateFilters(searchKeyword, startDate, e.target.value);
          }}
          className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
          title="Tanggal Akhir"
        />
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
              updateFilters(searchKeyword, '', '');
            }}
            className="ml-1 text-slate-400 hover:text-rose-500"
            title="Reset Filter Tanggal"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfil, setUserProfil] = useState<UserProfile | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State untuk Pop-up Login
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State Pop-up Konfirmasi Kustom (Untuk Logout & lainnya jika diperlukan)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    isDanger: false,
    onConfirm: () => {}
  });

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

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

  useEffect(() => {
    if (!user) return;
    let timeoutId: NodeJS.Timeout;
    const logoutWaktuHabis = async () => {
      await supabase.auth.signOut();
      alert('Sesi Anda telah berakhir karena tidak ada aktivitas.');
      window.location.reload(); 
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

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profil } = await supabase.from('users_profile').select('nama_lengkap, role').eq('id', session.user.id).single(); 
        if (profil) setUserProfil(profil as UserProfile);
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setIsLoggingIn(false);

    if (error) {
      alert('Login gagal: ' + error.message);
    } else {
      setIsLoginModalOpen(false);
      window.location.reload(); 
    }
  };

  const handleAksesAdmin = (path: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      router.push(path);
      setIsSidebarOpen(false); 
    }
  };

  // --- ALUR LOGOUT DENGAN CUSTOM CONFIRMATION ---
  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari akun Anda? Anda harus login kembali untuk mengelola data.',
      confirmText: 'Ya, Keluar',
      isDanger: true,
      onConfirm: eksekusiLogout
    });
  };

  const eksekusiLogout = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const role = userProfil?.role?.toUpperCase() || '';
  const isBisaEdit = role === 'SUPER_ADMIN' || role === 'BENDAHARA';

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-300 bg-gray-50 text-slate-900 dark:bg-[#090e17] dark:text-gray-100">
      
      <div className={`fixed top-0 left-0 h-1 bg-cyan-500 z-[100] transition-all duration-300 ease-out ${isPageLoading ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap bg-white border-r border-gray-200 dark:bg-[#0f172a] dark:border-slate-800/80 ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} ${isDesktopSidebarOpen ? 'lg:w-72' : 'lg:w-0 lg:border-none lg:opacity-0'}`}>
        <div className="p-6 flex items-center justify-between min-w-[288px]">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cyan-50 border border-cyan-100">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <div><h1 className="text-sm font-black tracking-tight leading-tight">Dashboard<br/>Keuangan</h1></div>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>

        <div className="mx-4 p-4 rounded-2xl mb-6 min-w-[256px] bg-slate-50 border border-slate-200 dark:bg-[#1e293b]/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <UserCircle size={36} className="text-blue-600 dark:text-cyan-400" strokeWidth={1.5} />
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{userProfil?.nama_lengkap || (user ? user.email : 'Mode Publik')}</p>
              <p className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max mt-1 ${role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' : role === 'BENDAHARA' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>{role || 'PENGAWAS'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {role === 'SUPER_ADMIN' && (
              <button onClick={() => handleAksesAdmin('/pengguna')} className="flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-transparent"><ShieldCheck size={14} className="mr-1.5" /> Akses</button>
            )}
            
            <button onClick={user ? handleLogout : () => setIsLoginModalOpen(true)} className="flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400">
              {user ? <><LogOut size={14} className="mr-1.5" /> Keluar</> : <><LogIn size={14} className="mr-1.5" /> Login</>}
            </button>
            
          </div>
          <div className="mt-3 flex items-center justify-between p-1.5 rounded-lg bg-slate-200 dark:bg-[#0f172a]">
            <span className="text-[10px] font-bold ml-2 text-slate-600 dark:text-slate-400">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            <button onClick={toggleTheme} className="p-1.5 rounded-md shadow-sm transition-all bg-white text-amber-500 dark:bg-cyan-500 dark:text-white">{isDarkMode ? <Moon size={14} /> : <Sun size={14} />}</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto min-w-[288px]">
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2 mt-4 text-slate-400 dark:text-slate-500">Menu Utama</p>
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/' ? 'bg-blue-50 text-blue-700 font-bold dark:bg-cyan-500/10 dark:text-cyan-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}><TrendingUp size={18} className="mr-3" /> Dashboard</Link>
          
          {isBisaEdit && (
            <>
              <button onClick={() => handleAksesAdmin('/kegiatan')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/kegiatan' ? 'bg-blue-50 text-blue-700 font-bold dark:bg-cyan-500/10 dark:text-cyan-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}><List size={18} className="mr-3" /> Kegiatan</button>
              <button onClick={() => handleAksesAdmin('/kategori')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/kategori' ? 'bg-blue-50 text-blue-700 font-bold dark:bg-cyan-500/10 dark:text-cyan-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}><Layers size={18} className="mr-3" /> Kategori</button>
            </>
          )}
          <button onClick={() => handleAksesAdmin('/laporan')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/laporan' ? 'bg-blue-50 text-blue-700 font-bold dark:bg-cyan-500/10 dark:text-cyan-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}><FileBarChart size={18} className="mr-3" /> Buku Besar</button>
        </nav>

        {isBisaEdit && (
          <div className="p-4 mt-auto border-t min-w-[288px] border-slate-200 dark:border-slate-800/50">
            <button onClick={() => handleAksesAdmin('/tambah')} className="w-full flex items-center justify-center px-4 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-900 dark:shadow-cyan-500/20"><PlusCircle size={18} className="mr-2" /> Catat Kas Baru</button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
        <header className="h-20 px-6 flex items-center justify-between flex-shrink-0 z-10 transition-colors bg-gray-50 dark:bg-[#090e17] gap-4">
          <button onClick={toggleSidebar} className="p-2.5 rounded-xl transition-colors bg-white text-slate-500 hover:text-blue-600 border border-gray-200 dark:bg-[#0f172a] dark:text-slate-400 dark:hover:text-cyan-400 dark:border-slate-800 flex-shrink-0">
            <Menu size={20} />
          </button>
          
          <Suspense fallback={<div className="flex-1" />}>
            <HeaderFilters />
          </Suspense>
        </header>

        <div className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-0 transition-opacity duration-300 ${isPageLoading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </div>

      {/* POP-UP MODAL LOGIN KUSTOM */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border transform transition-transform scale-100 bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-700">
            
            <div className="relative p-6 text-center">
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors text-gray-400 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
              <div className="mx-auto w-16 h-16 rounded-full bg-cyan-50 border-4 border-cyan-100 overflow-hidden relative mb-4">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" />
              </div>
              <h2 className="text-xl font-black tracking-tight mb-1 text-slate-900 dark:text-white">Selamat Datang</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Masuk untuk mengakses menu kelola</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="px-6 pb-8 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"><Mail size={16} /></span>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="nama@email.com" className="w-full p-3 pl-10 border rounded-xl outline-none font-medium text-sm transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-200 dark:focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"><Lock size={16} /></span>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" className="w-full p-3 pl-10 border rounded-xl outline-none font-medium text-sm transition-colors bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 dark:bg-[#1e293b] dark:border-slate-700 dark:text-slate-200 dark:focus:border-cyan-500" />
                </div>
              </div>
              <button type="submit" disabled={isLoggingIn} className="w-full mt-2 flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-900 dark:shadow-cyan-500/20">
                {isLoggingIn ? 'Memverifikasi...' : 'Masuk Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP KONFIRMASI KUSTOM (Untuk Logout & Konfirmasi Lainnya) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 bg-white border-gray-200 dark:bg-[#0f172a] dark:border-slate-700">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-cyan-500/20 dark:text-cyan-400'}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2 text-gray-900 dark:text-white">
                {confirmDialog.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {confirmDialog.message}
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-[#111827]">
              <button 
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))} 
                className="px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border bg-white border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${confirmDialog.isDanger ? 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600' : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-cyan-500 dark:text-slate-900 dark:hover:bg-cyan-400'}`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}