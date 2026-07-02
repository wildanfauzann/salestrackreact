import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function ManagerTarget() {
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [editing, setEditing] = useState(false);
  const [tempAmount, setTempAmount] = useState('');

  const fetchTarget = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/targets?month=${filterMonth}&year=${filterYear}`);
      setTargetAmount(res.data.targetAmount || '');
      setTempAmount(res.data.targetAmount || '');
    } catch (error) {
      alert('Gagal mengambil data target');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarget();
    setEditing(false);
  }, [filterMonth, filterYear]);

  const handleSave = async () => {
    try {
      await api.post('/targets', {
        month: filterMonth,
        year: filterYear,
        targetAmount: Number(tempAmount)
      });
      alert('Target perusahaan berhasil disimpan');
      setEditing(false);
      fetchTarget();
    } catch (error) {
      alert('Gagal menyimpan target');
    }
  };

  const monthName = new Date(filterYear, filterMonth - 1).toLocaleString('id-ID', { month: 'long' });

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-5xl mx-auto w-full">
      
      {/* Header Section */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="text-center md:text-left">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">Target Perusahaan</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola target pencapaian global untuk seluruh tim sales.</p>
        </div>
        
        {/* Modern Filter Pills */}
        <div className="flex items-center justify-center gap-3 bg-surface-container/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md self-center md:self-auto shadow-lg">
          <div className="relative group">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="appearance-none bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg px-6 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary/50 cursor-pointer pr-10 transition-colors"
            >
              {[...Array(12).keys()].map(i => (
                <option key={i+1} value={i+1} className="bg-surface-container text-on-surface">
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm group-hover:text-on-surface transition-colors">expand_more</span>
          </div>
          
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          
          <div className="relative group">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="appearance-none bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg px-6 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-primary/50 cursor-pointer pr-10 transition-colors"
            >
              {[...Array(5).keys()].map(i => {
                const y = new Date().getFullYear() - 2 + i;
                return <option key={y} value={y} className="bg-surface-container text-on-surface">{y}</option>;
              })}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm group-hover:text-on-surface transition-colors">expand_more</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[576px] mx-auto relative mt-4 group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-300"></div>
        
        <div className="relative glass-card rounded-[2rem] p-8 md:p-12 border border-white/10 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl bg-surface/40 backdrop-blur-xl">
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none"></div>
          
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
              <div className="text-on-surface-variant font-label-lg animate-pulse">Memuat data target...</div>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-surface-container-high to-surface-container flex items-center justify-center mb-8 shadow-inner border border-white/10 z-10 relative group-hover:scale-110 transition-transform duration-500 ease-out">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="material-symbols-outlined text-5xl text-primary drop-shadow-[0_0_15px_rgba(189,194,255,0.6)] relative z-10">track_changes</span>
              </div>

              <h3 className="font-headline-md text-on-surface mb-3 z-10">Target {monthName} {filterYear}</h3>
              <p className="font-body-sm text-on-surface-variant mb-10 z-10 max-w-[384px]">
                Tetapkan target ambisius untuk memotivasi tim sales mencapai rekor penjualan baru bulan ini.
              </p>

              {editing ? (
                <div className="w-full z-10">
                  <div className="relative flex items-center mb-8">
                    <span className="absolute left-6 text-3xl font-bold text-on-surface-variant select-none">Rp</span>
                    <input
                      type="number"
                      value={tempAmount}
                      onChange={(e) => setTempAmount(e.target.value)}
                      className="bg-surface-container-highest/50 backdrop-blur-sm border-2 border-primary/30 rounded-2xl py-5 pl-20 pr-6 text-4xl md:text-5xl font-bold text-primary w-full focus:outline-none focus:border-primary focus:bg-surface-container-highest transition-all shadow-[0_0_20px_rgba(189,194,255,0.1)] focus:shadow-[0_0_30px_rgba(189,194,255,0.2)]"
                      autoFocus
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                    <button 
                      onClick={() => { setEditing(false); setTempAmount(targetAmount); }} 
                      className="px-8 py-3.5 rounded-xl border border-white/10 text-on-surface-variant font-label-lg hover:bg-white/5 transition-colors w-full sm:w-auto"
                    >
                      Batalkan
                    </button>
                    <button 
                      onClick={handleSave} 
                      className="px-8 py-3.5 rounded-xl bg-primary text-on-primary font-bold font-label-lg hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(189,194,255,0.3)] transition-all w-full sm:w-auto"
                    >
                      Simpan Target
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full z-10 flex flex-col items-center">
                  {targetAmount ? (
                    <div className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-10 drop-shadow-[0_0_25px_rgba(189,194,255,0.4)] whitespace-nowrap tracking-tight">
                      Rp {Number(targetAmount).toLocaleString('id-ID')}
                    </div>
                  ) : (
                    <div className="text-4xl md:text-5xl font-bold text-on-surface-variant/50 mb-10 whitespace-nowrap tracking-tight">
                      Belum Diatur
                    </div>
                  )}
                  
                  <button
                    onClick={() => setEditing(true)}
                    className="group/btn px-8 py-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg transition-all border border-white/10 flex items-center justify-center gap-3 w-full sm:w-auto hover:shadow-lg hover:border-primary/30"
                  >
                    <span className="material-symbols-outlined text-xl text-primary group-hover/btn:rotate-12 transition-transform">edit_square</span>
                    {targetAmount ? 'Ubah Target' : 'Atur Target Sekarang'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
