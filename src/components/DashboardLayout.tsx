"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { LogIn, LogOut, UserCircle, ShieldCheck, Sun, Moon, Search, Bell, Menu, X, ChevronDown, TrendingUp, List, Layers, FileBarChart, PlusCircle, CalendarDays, Mail, Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<any>(null);
  const [userProfil, setUserProfil] = useState<{ nama_lengkap: string; role: string } | null>(null);
  
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
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };
  // ----------------------------------------------

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
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#090e17] text-gray-100' : 'bg-gray-50 text-slate-900'}`}>
      
      <div className={`fixed top-0 left-0 h-1 bg-cyan-500 z-[100] transition-all duration-300 ease-out ${isPageLoading ? 'w-full opacity-100' : 'w-0 opacity-0'}`} />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} ${isDesktopSidebarOpen ? 'lg:w-72' : 'lg:w-0 lg:border-none lg:opacity-0'} ${isDarkMode ? 'bg-[#0f172a] border-r border-slate-800/80' : 'bg-white border-r border-gray-200'}`}>
        <div className="p-6 flex items-center justify-between min-w-[288px]">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cyan-50 border border-cyan-100">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <div><h1 className="text-sm font-black tracking-tight leading-tight">Dashboard<br/>Keuangan</h1></div>
          </Link>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>

        <div className={`mx-4 p-4 rounded-2xl mb-6 min-w-[256px] ${isDarkMode ? 'bg-[#1e293b]/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <UserCircle size={36} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} strokeWidth={1.5} />
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{userProfil?.nama_lengkap || (user ? user.email : 'Mode Publik')}</p>
              <p className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max mt-1 ${role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' : role === 'BENDAHARA' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>{role || 'PENGAWAS'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {role === 'SUPER_ADMIN' && (
              <button onClick={() => handleAksesAdmin('/pengguna')} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}><ShieldCheck size={14} className="mr-1.5" /> Akses</button>
            )}
            
            <button onClick={user ? handleLogout : () => setIsLoginModalOpen(true)} className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-colors ${isDarkMode ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'}`}>
              {user ? <><LogOut size={14} className="mr-1.5" /> Keluar</> : <><LogIn size={14} className="mr-1.5" /> Login</>}
            </button>
            
          </div>
          <div className={`mt-3 flex items-center justify-between p-1.5 rounded-lg ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-200'}`}>
            <span className={`text-[10px] font-bold ml-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            <button onClick={toggleTheme} className={`p-1.5 rounded-md shadow-sm transition-all ${isDarkMode ? 'bg-cyan-500 text-white' : 'bg-white text-amber-500'}`}>{isDarkMode ? <Moon size={14} /> : <Sun size={14} />}</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto min-w-[288px]">
          <p className={`text-[10px] font-bold uppercase tracking-widest px-2 mb-2 mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Menu Utama</p>
          <Link href="/" onClick={() => setIsSidebarOpen(false)} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}><TrendingUp size={18} className="mr-3" /> Dashboard</Link>
          
          {isBisaEdit && (
            <>
              <button onClick={() => handleAksesAdmin('/kegiatan')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/kegiatan' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}><List size={18} className="mr-3" /> Kegiatan</button>
              <button onClick={() => handleAksesAdmin('/kategori')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/kategori' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}><Layers size={18} className="mr-3" /> Kategori</button>
            </>
          )}
          <button onClick={() => handleAksesAdmin('/laporan')} className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-colors ${pathname === '/laporan' ? (isDarkMode ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100')}`}><FileBarChart size={18} className="mr-3" /> Buku Besar</button>
        </nav>

        {isBisaEdit && (
          <div className="p-4 mt-auto border-t min-w-[288px] border-slate-800/50">
            <button onClick={() => handleAksesAdmin('/tambah')} className={`w-full flex items-center justify-center px-4 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}><PlusCircle size={18} className="mr-2" /> Catat Kas Baru</button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
        <header className={`h-20 px-6 flex items-center justify-between flex-shrink-0 z-10 transition-colors ${isDarkMode ? 'bg-[#090e17]' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-4 flex-1">
            <button onClick={toggleSidebar} className={`p-2.5 rounded-xl transition-colors ${isDarkMode ? 'bg-[#0f172a] text-slate-400 hover:text-cyan-400 border border-slate-800' : 'bg-white text-slate-500 hover:text-blue-600 border border-gray-200'}`}>
              <Menu size={20} />
            </button>
            <div className={`hidden md:flex items-center w-full max-w-md px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
              <Search size={18} className="mr-2 opacity-50" />
              <input type="text" placeholder="Cari transaksi, kategori..." className="bg-transparent border-none outline-none w-full text-sm placeholder-slate-500" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-medium border cursor-pointer ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
              <CalendarDays size={16} className="mr-2" /><span>1 Jan - 31 Des 2024</span><ChevronDown size={14} className="ml-3 opacity-50" />
            </div>
          </div>
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
          <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border transform transition-transform scale-100 ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            
            <div className="relative p-6 text-center">
              <button onClick={() => setIsLoginModalOpen(false)} className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100'}`}>
                <X size={20} />
              </button>
              <div className="mx-auto w-16 h-16 rounded-full bg-cyan-50 border-4 border-cyan-100 overflow-hidden relative mb-4">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" />
              </div>
              <h2 className={`text-xl font-black tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Selamat Datang</h2>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Masuk untuk mengakses menu kelola</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="px-6 pb-8 space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><Mail size={16} /></span>
                  <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required placeholder="nama@email.com" className={`w-full p-3 pl-10 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><Lock size={16} /></span>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required placeholder="••••••••" className={`w-full p-3 pl-10 border rounded-xl outline-none font-medium text-sm transition-colors ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-200 focus:border-cyan-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'}`} />
                </div>
              </div>
              <button type="submit" disabled={isLoggingIn} className={`w-full mt-2 flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg disabled:opacity-50 ${isDarkMode ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>
                {isLoggingIn ? 'Memverifikasi...' : 'Masuk Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP KONFIRMASI KUSTOM (Untuk Logout & Konfirmasi Lainnya) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border transform transition-transform scale-100 ${isDarkMode ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-600') : (isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600')}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className={`text-lg font-black tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {confirmDialog.title}
              </h3>
              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {confirmDialog.message}
              </p>
            </div>
            <div className={`px-6 py-4 flex justify-end gap-3 border-t ${isDarkMode ? 'border-slate-800 bg-[#111827]' : 'border-gray-100 bg-gray-50'}`}>
              <button 
                onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                Batal
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${confirmDialog.isDanger ? (isDarkMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-rose-600 text-white hover:bg-rose-700') : (isDarkMode ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400' : 'bg-blue-600 text-white hover:bg-blue-700')}`}
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