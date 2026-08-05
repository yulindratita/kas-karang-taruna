"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Fungsi dari Supabase untuk memeriksa Email dan Password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert('Login Berhasil!');
      router.push('/'); // Kembali ke dashboard setelah sukses
      router.refresh();
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login Administrator</h1>
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" required
              placeholder="Masukkan email Anda"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" required
              placeholder="••••••••"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full p-4 mt-2 bg-gray-900 hover:bg-black transition-colors text-white font-bold rounded-lg disabled:bg-gray-400"
          >
            {isLoading ? 'Memeriksa kredensial...' : 'Masuk'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="hover:underline">&larr; Kembali ke Dashboard</Link>
        </div>
      </div>
    </main>
  );
}