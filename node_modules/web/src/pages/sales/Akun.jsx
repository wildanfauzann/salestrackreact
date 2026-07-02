import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { authClient } from '../../lib/auth';

export default function Akun() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', currentPassword: '', password: '', confirmPassword: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      setFormData({ name: res.data.name || '', phone: res.data.phone || '', currentPassword: '', password: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error fetching user data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok!');
      return;
    }

    try {
      const payload = { name: formData.name, phone: formData.phone };
      await api.patch('/users/me', payload);
      
      if (formData.password) {
        if (!formData.currentPassword) {
          alert('Anda harus memasukkan password saat ini untuk mengganti password.');
          return;
        }
        
        const res = await authClient.changePassword({
          newPassword: formData.password,
          currentPassword: formData.currentPassword,
          revokeOtherSessions: true
        });
        
        if (res.error) {
          alert('Gagal mengganti password: ' + res.error.message);
          return;
        }
      }

      alert('Profil berhasil diperbarui!');
      fetchData();
    } catch (err) {
      alert('Gagal memperbarui profil');
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('photo', file);

    try {
      await api.post('/users/me/photo', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchData();
    } catch (err) {
      alert('Gagal mengunggah foto profil');
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('Hapus foto profil?')) return;
    try {
      await api.patch('/users/me', { image: null });
      fetchData();
    } catch (err) {
      alert('Gagal menghapus foto profil');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-[800px] mx-auto w-full h-full flex flex-col">
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-[40px] font-bold text-on-surface leading-tight tracking-tight mb-2">Profil Akun</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Kelola informasi pribadi dan pengaturan keamanan akun Anda.</p>
      </div>

      <div className="glass-card rounded-xl border border-white/5 flex flex-col overflow-hidden shadow-xl mb-lg">
        {/* Profile Header Background */}
        <div className="h-32 bg-gradient-to-r from-secondary/20 via-primary/20 to-tertiary/20 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-surface-container-high border-4 border-[#0a0e1a] flex items-center justify-center overflow-hidden shadow-lg relative">
                {user?.image ? (
                  <img src={user.image.startsWith('http') ? user.image : `http://localhost:3000${user.image}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2d3748&color=fff&size=150`} alt="Avatar" className="w-full h-full object-cover" />
                )}
                {user?.image && (
                  <button onClick={handleDeletePhoto} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-error hover:text-error/80">
                    <span className="material-symbols-outlined text-[24px]">delete</span>
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleUploadPhoto}
              />
              <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-[#0a0e1a] flex items-center justify-center border-2 border-[#0a0e1a] hover:bg-primary/90 transition-colors shadow-md z-10">
                <span className="material-symbols-outlined text-[16px] font-bold">photo_camera</span>
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info Display */}
        <div className="px-6 pt-16 pb-6 border-b border-white/5">
          <h3 className="font-headline-md text-on-surface font-bold text-xl">{user?.name}</h3>
          <p className="font-body-sm text-secondary font-semibold uppercase tracking-wider text-xs mt-1 capitalize">{user?.role}</p>
        </div>

        {/* Edit Form */}
        <div className="p-6">
          <h4 className="font-headline-sm text-on-surface mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">person</span>
            Informasi Pribadi
          </h4>
          
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Nama Lengkap</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">badge</span>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-on-surface font-body-md focus:border-secondary focus:bg-surface-container-low focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Nomor Telepon</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">call</span>
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-on-surface font-body-md focus:border-secondary focus:bg-surface-container-low focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Email (Read Only)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30 text-[18px]">mail</span>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    readOnly
                    className="w-full bg-surface-container-highest/20 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-on-surface-variant font-body-md focus:outline-none cursor-not-allowed opacity-70" 
                  />
                </div>
              </div>
            </div>

            <hr className="border-white/5 my-2" />

            <h4 className="font-headline-sm text-on-surface mb-2 mt-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">lock</span>
              Keamanan Password
            </h4>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Password Saat Ini</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">key</span>
                  <input 
                    type="password" 
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Masukkan password saat ini"
                    className="w-full bg-surface-container-low/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-on-surface font-body-md focus:border-tertiary focus:bg-surface-container-low focus:ring-1 focus:ring-tertiary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Password Baru</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">lock_reset</span>
                    <input 
                      type="password" 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimal 8 karakter"
                      className="w-full bg-surface-container-low/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-on-surface font-body-md focus:border-tertiary focus:bg-surface-container-low focus:ring-1 focus:ring-tertiary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant font-bold ml-1">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">lock_reset</span>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Ulangi password baru"
                      className="w-full bg-surface-container-low/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-on-surface font-body-md focus:border-tertiary focus:bg-surface-container-low focus:ring-1 focus:ring-tertiary focus:outline-none transition-all placeholder:text-on-surface-variant/30" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/5">
              <button type="button" onClick={fetchData} className="px-6 py-2.5 rounded-lg text-on-surface-variant font-label-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                Batal
              </button>
              <button type="submit" className="bg-[#b4b4e5] hover:bg-[#a0a0d0] text-[#0a0e1a] px-8 py-2.5 rounded-lg font-label-md flex items-center gap-2 transition-colors font-bold shadow-lg shadow-[#b4b4e5]/20">
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
