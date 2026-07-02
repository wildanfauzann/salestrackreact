import React from 'react';
import { signOut } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function TopBar({ toggleSidebar }) {
  const { user } = useAuth();
  return (
    <header className="flex justify-between items-center px-container-margin h-16 bg-surface/80 backdrop-blur-md sticky top-0 w-full z-40 border-b border-white/5 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-md">
        <button onClick={toggleSidebar} className="text-on-surface-variant hover:text-secondary transition-colors p-sm rounded-full hover:bg-white/5 active:opacity-80 flex items-center justify-center">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="md:hidden font-headline-md text-headline-md font-bold text-primary">Sales Track</span>
      </div>
      <div className="flex items-center gap-lg ml-auto">
        <div className="flex items-center gap-sm">
          <button className="text-on-surface-variant hover:text-secondary transition-colors p-sm rounded-full hover:bg-white/5 active:opacity-80">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-secondary transition-colors p-sm rounded-full hover:bg-white/5 active:opacity-80">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="h-6 w-px bg-white/10"></div>
        <button 
          onClick={async () => {
            await signOut();
            window.location.href = '/login';
          }}
          className="flex items-center gap-sm text-on-surface-variant hover:text-primary transition-colors active:opacity-80"
        >
          {user?.image ? (
            <img alt="User Avatar" className="w-8 h-8 rounded-full border border-primary/30 object-cover" src={user.image.startsWith('http') ? user.image : `http://localhost:3000${user.image}`} />
          ) : (
            <img alt="User Avatar" className="w-8 h-8 rounded-full border border-primary/30" src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2d3748&color=fff`} />
          )}
          <span className="font-label-md hidden md:block">Logout</span>
        </button>
      </div>
    </header>
  );
}
