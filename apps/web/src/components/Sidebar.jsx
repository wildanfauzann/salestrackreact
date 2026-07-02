import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const getPath = (path) => {
    if (isManager) {
      if (path === '/') return '/manager/dashboard';
      return `/manager${path}`;
    }
    return path;
  };

  return (
    <nav className={`flex flex-col h-full py-lg px-md bg-surface/80 backdrop-blur-xl fixed left-0 top-0 w-[260px] border-r border-white/10 shadow-xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between gap-sm mb-xl px-sm">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
            <span className="material-symbols-outlined text-primary font-bold">query_stats</span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold whitespace-nowrap">Sales Track</h1>
            <p className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Management Hub</p>
          </div>
        </div>
        <button className="md:hidden text-on-surface-variant p-1 rounded-md hover:bg-white/10" onClick={() => setIsOpen(false)}>
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
      <div className="flex flex-col gap-sm mt-md flex-1">
        <NavLink to={getPath('/')} className={({ isActive }) => `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 shadow-[inset_4px_0_0_0_#5de6ff]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
          <span className="material-symbols-outlined" style={ { fontVariationSettings: "'FILL' 1" } }>dashboard</span>
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to={getPath('/absensi')} className={({ isActive }) => `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 shadow-[inset_4px_0_0_0_#5de6ff]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
          <span className="material-symbols-outlined" style={ { fontVariationSettings: "'FILL' 1" } }>calendar_today</span>
          <span>Absensi</span>
        </NavLink>
        
        <NavLink to={getPath('/aktivitas')} className={({ isActive }) => `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 shadow-[inset_4px_0_0_0_#5de6ff]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
          <span className="material-symbols-outlined">pending_actions</span>
          <span>Aktivitas</span>
        </NavLink>
        
        <NavLink to={getPath('/penjualan')} className={({ isActive }) => `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 shadow-[inset_4px_0_0_0_#5de6ff]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
          <span className="material-symbols-outlined">payments</span>
          <span>Penjualan</span>
        </NavLink>
        
        {isManager && (
          <NavLink to={getPath('/target')} className={({ isActive }) => `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 shadow-[inset_4px_0_0_0_#5de6ff]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
            <span className="material-symbols-outlined">track_changes</span>
            <span>Target Sales</span>
          </NavLink>
        )}
        
        <NavLink to={getPath('/akun')} className={({ isActive }) => `flex items-center gap-md px-md py-sm rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isActive ? 'text-secondary font-bold border-r-2 border-secondary bg-white/5 shadow-[inset_4px_0_0_0_#5de6ff]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
          <span className="material-symbols-outlined">person</span>
          <span>Akun</span>
        </NavLink>
      </div>
    </nav>
  );
}
