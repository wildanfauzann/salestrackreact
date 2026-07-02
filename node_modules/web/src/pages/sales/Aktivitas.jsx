import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';

export default function Aktivitas() {
  const [activeTab, setActiveTab] = useState('input');
  const [tipeAktivitas, setTipeAktivitas] = useState('visit');
  
  const [customers, setCustomers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    customerName: '',
    summary: '',
    notes: ''
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/activities/me');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      alert('Tulis nama customer terlebih dahulu');
      return;
    }
    
    setLoading(true);
    const data = new FormData();
    data.append('customerName', formData.customerName);
    data.append('type', tipeAktivitas);
    data.append('summary', formData.summary);
    data.append('notes', formData.notes);
    
    Array.from(files).forEach(file => {
      data.append('attachments', file);
    });

    try {
      await api.post('/activities', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Aktivitas berhasil disimpan');
      // Reset form
      setFormData({ customerName: '', summary: '', notes: '' });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Gagal menyimpan aktivitas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full">
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Aktivitas Sales</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Catat interaksi terbaru dan pantau riwayat prospek Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-lg overflow-x-auto whitespace-nowrap">
        <button
          className={`py-md px-lg font-label-md transition-colors border-b-2 ${
            activeTab === 'input'
              ? 'border-secondary text-on-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('input')}
        >
          Input Baru
        </button>
        <button
          className={`py-md px-lg font-label-md transition-colors border-b-2 ${
            activeTab === 'riwayat'
              ? 'border-secondary text-on-surface'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('riwayat')}
        >
          Riwayat
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'input' && (
        <div className="glass-card rounded-xl p-4 md:p-lg max-w-4xl w-full">
          <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
            
            {/* Customer Input */}
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Nama Customer / Prospek</label>
              <input 
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                placeholder="Cth: PT Sukses Makmur"
                className="w-full bg-surface-container-high border border-white/10 rounded-lg p-sm text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors"
              />
            </div>

            {/* Dua Kolom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              {/* Tipe Aktivitas */}
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Tipe Aktivitas</label>
                <div className="grid grid-cols-2 gap-sm">
                  {['visit', 'call', 'meeting', 'demo'].map((tipe) => (
                    <label 
                      key={tipe} 
                      className={`flex items-center gap-sm p-sm rounded-lg border cursor-pointer transition-colors ${
                        tipeAktivitas === tipe 
                          ? 'bg-secondary/10 border-secondary/30' 
                          : 'bg-surface-container-high border-white/5 hover:border-white/20'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="tipe_aktivitas" 
                        value={tipe}
                        checked={tipeAktivitas === tipe}
                        onChange={() => setTipeAktivitas(tipe)}
                        className="text-secondary focus:ring-secondary focus:ring-offset-surface bg-transparent border-white/20"
                      />
                      <span className="font-body-sm text-on-surface capitalize">
                        {tipe === 'visit' ? 'Visit' : tipe === 'call' ? 'Call' : tipe === 'meeting' ? 'Meeting' : 'Demo'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Hasil Diskusi */}
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Hasil Diskusi (Singkat)</label>
                <input 
                  type="text"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  required
                  placeholder="Cth: Ketertarikan awal, minta proposal"
                  className="w-full bg-surface-container-high border border-white/10 rounded-lg p-sm text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors" 
                />
              </div>
            </div>

            {/* Catatan Lengkap */}
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Catatan Lengkap</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full bg-surface-container-high border border-white/10 rounded-lg p-md text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors resize-none placeholder:text-on-surface-variant/50 min-h-[120px]" 
                placeholder="Tulis rincian aktivitas di sini..." 
              ></textarea>
            </div>


            {/* Bukti Aktivitas */}
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Bukti Aktivitas (Foto/Dokumen)</label>
              <div className="relative w-full border-2 border-dashed border-white/20 rounded-xl p-xl flex flex-col items-center justify-center bg-surface-container-lowest/50 hover:bg-white/5 transition-colors cursor-pointer group text-center">
                <input 
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => setFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-md group-hover:bg-secondary/10 transition-colors">
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant group-hover:text-secondary transition-colors">cloud_upload</span>
                </div>
                <span className="font-body-md text-on-surface mb-xs">
                  {files.length > 0 ? `${files.length} file terpilih` : 'Drag & drop atau klik untuk upload'}
                </span>
                <span className="font-label-md text-on-surface-variant">Max 5MB (JPG, PNG, PDF)</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-md border-t border-white/10 mt-sm">
              <button 
                type="submit" 
                disabled={loading}
                className="px-xl py-sm rounded-lg bg-primary text-on-primary hover:bg-primary/90 glow-btn font-label-md flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {loading ? 'Menyimpan...' : 'Simpan Aktivitas'}
              </button>
            </div>

          </form>
        </div>
      )}

      {activeTab === 'riwayat' && (
        <div className="glass-card rounded-xl overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-surface-container-high/90 text-on-surface-variant font-label-md border-b border-white/10">
                <tr>
                  <th className="p-md">Tanggal</th>
                  <th className="p-md">Customer</th>
                  <th className="p-md">Tipe</th>
                  <th className="p-md">Ringkasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.length > 0 ? history.map((act) => (
                  <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-md text-on-surface">
                      {new Date(act.activityDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-md text-on-surface">{act.customer?.name || '-'}</td>
                    <td className="p-md text-on-surface capitalize">{act.type}</td>
                    <td className="p-md text-on-surface max-w-[200px] truncate" title={act.summary}>{act.summary}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="p-md text-center text-on-surface-variant">Belum ada riwayat aktivitas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
