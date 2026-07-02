import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Login gagal, periksa email dan password.');
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (data?.user?.role === 'manager') {
        window.location.href = '/manager/dashboard';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan pada server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Login Card */}
      <div className="glass-card w-[90%] sm:w-[400px] rounded-2xl p-8 relative z-10 border border-white/10 shadow-2xl flex-shrink-0">
        
        {/* Logo / Branding */}
        <div className="flex flex-col items-center justify-center mb-10 gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-[#818cf8] to-[#5de6ff] rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-[28px] font-bold">query_stats</span>
          </div>
          <div className="text-center">
            <h1 className="font-outfit text-2xl font-bold text-white tracking-tight">Sales Track</h1>
            <p className="font-inter text-xs text-secondary font-semibold tracking-[0.2em] uppercase mt-1">Management Hub</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2 font-inter">Selamat Datang Kembali</h2>
          <p className="text-sm text-on-surface-variant font-inter">Masukkan email dan password untuk mengakses dashboard Anda.</p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg font-inter">
              {errorMsg}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">mail</span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                className="w-full bg-surface-container-low/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-inter text-sm focus:border-secondary focus:bg-surface-container-low focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Password</label>
              <a href="#" className="text-xs text-secondary hover:text-white transition-colors font-semibold">Lupa Password?</a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">lock</span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-container-low/50 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white font-inter text-sm focus:border-tertiary focus:bg-surface-container-low focus:ring-1 focus:ring-tertiary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">visibility_off</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 ml-1">
            <input type="checkbox" id="remember" className="rounded border-white/20 bg-surface-container-low text-secondary focus:ring-secondary focus:ring-offset-0 focus:ring-offset-transparent w-4 h-4 cursor-pointer" />
            <label htmlFor="remember" className="text-xs text-on-surface-variant cursor-pointer">Ingat Saya</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#818cf8] to-[#9fa6fa] hover:from-[#6b78f7] hover:to-[#818cf8] text-[#0a0e1a] font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:shadow-[0_0_25px_rgba(129,140,248,0.5)] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-on-surface-variant/50">
          <p>&copy; 2026 Sales Track. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
