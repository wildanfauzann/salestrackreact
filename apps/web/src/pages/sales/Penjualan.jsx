import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';

export default function Penjualan() {
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: '',
    customerName: '',
    value: '',
    stage: 'prospek',
    expectedCloseDate: '',
    attachmentUrl: ''
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsRes, summaryRes, dashRes, custRes] = await Promise.all([
        api.get('/deals/me'),
        api.get('/deals/pipeline-summary'),
        api.get('/dashboard/sales'),
        api.get('/customers')
      ]);
      setDeals(dealsRes.data);
      setSummary(summaryRes.data);
      setDashboardData(dashRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error('Error fetching penjualan data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (dealId, newStage) => {
    try {
      await api.patch(`/deals/${dealId}/stage`, { stage: newStage });
      fetchData(); // refresh data
    } catch (err) {
      alert('Gagal memindahkan deal');
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newDeal.title);
      formData.append('customerName', newDeal.customerName);
      formData.append('value', newDeal.value);
      formData.append('stage', newDeal.stage);
      formData.append('expectedCloseDate', newDeal.expectedCloseDate);
      
      if (newDeal.attachmentUrl) {
        formData.append('attachmentUrl', newDeal.attachmentUrl);
      }
      
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      await api.post('/deals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Deal berhasil dibuat');
      setShowModal(false);
      setNewDeal({ title: '', customerName: '', value: '', stage: 'prospek', expectedCloseDate: '', attachmentUrl: '' });
      setAttachmentFile(null);
      fetchData();
    } catch (error) {
      alert('Gagal membuat deal');
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus deal ini?')) return;
    try {
      await api.delete(`/deals/${dealId}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus deal');
    }
  };

  // Group deals by stage
  const dealsByStage = {
    prospek: deals.filter(d => d.stage === 'prospek'),
    negosiasi: deals.filter(d => d.stage === 'negosiasi'),
    closing: deals.filter(d => d.stage === 'closing'),
    lose: deals.filter(d => d.stage === 'lose')
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full h-full flex flex-col">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl w-full">
        <div className="md:col-span-2 glass-card rounded-xl p-6 md:p-xl flex flex-col justify-center min-h-[140px] border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">Target Bulan Ini</h3>
              <p className="font-body-md text-on-surface-variant mt-1">
                Rp {(dashboardData?.closingValue || 0).toLocaleString('id-ID')} / Rp {(dashboardData?.targetAmount || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <span className="font-headline-xl text-secondary font-bold text-[32px]">{dashboardData?.percentage || 0}%</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-4 overflow-hidden border border-white/5">
            <div className="bg-gradient-to-r from-secondary/50 to-secondary h-full rounded-full glow-btn" style={{ width: `${dashboardData?.percentage || 0}%` }}></div>
          </div>
        </div>

        <div className="md:col-span-1 glass-card rounded-xl p-6 md:p-xl flex flex-col justify-center min-h-[140px] border-l-4 border-l-secondary">
          <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
            <span className="font-label-md text-xs uppercase tracking-wider font-semibold">Active Pipeline</span>
          </div>
          <div className="font-headline-lg text-[32px] md:text-[40px] text-on-surface font-bold leading-tight">
            {summary?.activeDealsCount || 0} Deals
          </div>
          <div className="font-body-md text-tertiary mt-2">
            Potensi: Rp {(summary?.potentialValue || 0).toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-[40px] font-bold text-on-surface leading-tight tracking-tight mb-2">Pipeline Kanban</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola status deal Anda dengan cara drag & drop.</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">

          <button onClick={() => setShowModal(true)} className="bg-[#b4b4e5] hover:bg-[#a0a0d0] text-[#0a0e1a] border border-[#b4b4e5]/30 px-6 py-2 rounded-lg font-label-md flex items-center gap-2 transition-colors font-bold">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Deal
          </button>
        </div>
      </div>

      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container rounded-xl p-5 w-[400px] max-w-[90vw] max-h-[90vh] flex flex-col shrink-0 border border-white/10 shadow-2xl relative">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="text-lg font-bold text-white">New Deal</h3>
              <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateDeal} className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
              <div>
                <label className="text-xs text-on-surface-variant font-bold mb-1 block">Judul Deal</label>
                <input 
                  type="text" required value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})}
                  className="w-full bg-surface-container-high rounded-lg p-2 text-sm text-white border border-white/10 focus:border-secondary focus:outline-none" 
                  placeholder="Cth: Implementasi ERP"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-bold mb-1 block">Nama Klien / Customer</label>
                <input 
                  type="text" required value={newDeal.customerName || ''} onChange={e => setNewDeal({...newDeal, customerName: e.target.value})}
                  className="w-full bg-surface-container-high rounded-lg p-2 text-sm text-white border border-white/10 focus:border-secondary focus:outline-none"
                  placeholder="Masukkan nama klien..."
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-bold mb-1 block">Nilai (Rp)</label>
                <input 
                  type="number" required value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: e.target.value})}
                  className="w-full bg-surface-container-high rounded-lg p-2 text-sm text-white border border-white/10 focus:border-secondary focus:outline-none" 
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant font-bold mb-1 block">Expected Close Date</label>
                <input 
                  type="date" value={newDeal.expectedCloseDate} onChange={e => setNewDeal({...newDeal, expectedCloseDate: e.target.value})}
                  className="w-full bg-surface-container-high rounded-lg p-2 text-sm text-white border border-white/10 focus:border-secondary focus:outline-none" 
                />
              </div>
              <div className="border-t border-white/10 pt-3 mt-1">
                <label className="text-xs text-on-surface-variant font-bold mb-1 block">Dokumen Pendukung (Opsional)</label>
                <p className="text-[10px] text-on-surface-variant mb-2">Pilih upload file ATAU tautan eksternal (Google Drive)</p>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    onChange={e => setAttachmentFile(e.target.files[0])}
                    className="text-xs text-on-surface-variant file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                  />
                  <div className="text-center text-on-surface-variant text-[10px] leading-none">-- ATAU --</div>
                  <input 
                    type="url" value={newDeal.attachmentUrl} onChange={e => setNewDeal({...newDeal, attachmentUrl: e.target.value})}
                    className="w-full bg-surface-container-high rounded-lg p-1.5 text-white border border-white/10 focus:border-secondary focus:outline-none text-xs"
                    placeholder="Masukkan tautan eksternal..."
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-on-primary py-2 rounded-lg font-bold mt-2 hover:bg-primary/90 transition-colors">Simpan Deal</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Deal Detail Modal */}
      {selectedDeal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDeal(null)}>
          <div className="bg-surface-container rounded-xl p-6 w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-surface-variant text-on-surface-variant rounded border border-white/10 mb-2 inline-block">
                  {selectedDeal.category || 'DEAL'}
                </span>
                <h3 className="text-xl font-bold text-white">{selectedDeal.title || 'Untitled Deal'}</h3>
                <div className="text-sm text-on-surface-variant mt-1">{selectedDeal.customer?.name || '-'}</div>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="text-white/50 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-surface-container-high p-4 rounded-lg border border-white/5">
                <div className="text-xs text-on-surface-variant mb-1">Nilai Deal</div>
                <div className="text-2xl font-bold text-secondary">Rp {parseFloat(selectedDeal.value).toLocaleString('id-ID')}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Stage</div>
                  <div className="text-sm font-bold capitalize text-white">{selectedDeal.stage}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Dibuat Pada</div>
                  <div className="text-sm font-bold text-white">{new Date(selectedDeal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Expected Close Date</div>
                  <div className="text-sm font-bold text-white">{selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Status Approval</div>
                  <div className="text-sm font-bold uppercase text-white">
                    {selectedDeal.approvalStatus ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] ${selectedDeal.approvalStatus === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30' : selectedDeal.approvalStatus === 'approved' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'bg-error/20 text-error border border-error/30'}`}>
                        {selectedDeal.approvalStatus}
                      </span>
                    ) : '-'}
                  </div>
                </div>
              </div>

              {selectedDeal.attachmentUrl && (
                <div className="border-t border-white/10 pt-4 mt-2">
                  <div className="text-xs text-on-surface-variant mb-2">Dokumen Pendukung</div>
                  <a href={selectedDeal.attachmentUrl.startsWith('http') ? selectedDeal.attachmentUrl : `http://localhost:3000${selectedDeal.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-variant hover:bg-surface-variant/80 text-on-surface rounded-lg text-sm font-bold transition-colors">
                    <span className="material-symbols-outlined text-[18px]">description</span> Buka Dokumen
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg h-full items-start">
          
          {/* Column: Prospek */}
          <div className="w-full bg-surface-container-low/30 rounded-xl border border-white/5 flex flex-col max-h-[700px]">
            <div className="p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <h3 className="font-headline-sm text-on-surface font-bold text-sm tracking-wide">Prospek</h3>
              </div>
              <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] rounded font-bold">{dealsByStage.prospek.length}</span>
            </div>
            
            <div className="p-4 pt-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {dealsByStage.prospek.map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container/40 hover:bg-surface-container/80 border border-secondary/40 rounded-lg p-4 transition-colors group shadow-[0_0_15px_rgba(93,230,255,0.05)] cursor-pointer">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold px-2 py-1 bg-surface-variant/50 text-on-surface-variant rounded-full border border-white/5">{deal.category || 'General'}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} title="Hapus Deal" className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      <button onClick={(e) => { e.stopPropagation(); handleStageChange(deal.id, 'negosiasi'); }} title="Pindahkan ke Negosiasi" className="text-on-surface-variant hover:text-secondary"><span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
                    </div>
                  </div>
                  <h4 className="font-label-md text-on-surface mb-1 font-bold">{deal.title}</h4>
                  <div className="text-xs text-on-surface-variant mb-2">{deal.customer?.name}</div>
                  <div className="font-headline-sm text-secondary mb-4 font-bold tracking-wide">Rp {parseFloat(deal.value).toLocaleString('id-ID')}</div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1 text-on-surface-variant text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Negosiasi */}
          <div className="w-full bg-surface-container-low/30 rounded-xl border border-white/5 flex flex-col max-h-[700px]">
            <div className="p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#b4b4e5]"></div>
                <h3 className="font-headline-sm text-on-surface font-bold text-sm tracking-wide">Negosiasi</h3>
              </div>
              <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] rounded font-bold">{dealsByStage.negosiasi.length}</span>
            </div>
            
            <div className="p-4 pt-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {dealsByStage.negosiasi.map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container/40 hover:bg-surface-container/80 border border-[#b4b4e5]/40 rounded-lg p-4 transition-colors group shadow-[0_0_15px_rgba(180,180,229,0.05)] cursor-pointer">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold px-2 py-1 bg-surface-variant/50 text-on-surface-variant rounded-full border border-white/5">{deal.category || 'General'}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} title="Hapus Deal" className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      <button onClick={(e) => { e.stopPropagation(); handleStageChange(deal.id, 'lose'); }} title="Lose" className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">cancel</span></button>
                      <button onClick={(e) => { e.stopPropagation(); handleStageChange(deal.id, 'closing'); }} title="Pindahkan ke Closing" className="text-on-surface-variant hover:text-tertiary"><span className="material-symbols-outlined text-[18px]">check_circle</span></button>
                    </div>
                  </div>
                  <h4 className="font-label-md text-on-surface mb-1 font-bold">{deal.title}</h4>
                  <div className="text-xs text-on-surface-variant mb-2">{deal.customer?.name}</div>
                  <div className="font-headline-sm text-[#b4b4e5] mb-4 font-bold tracking-wide">Rp {parseFloat(deal.value).toLocaleString('id-ID')}</div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1 text-on-surface-variant text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                    </div>
                    {deal.approvalStatus === 'rejected' && (
                      <span className="text-[9px] px-2 py-0.5 bg-error/20 text-error rounded font-bold border border-error/30" title="Closing ditolak manager, lengkapi data dan ajukan kembali">Rejected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Closing */}
          <div className="w-full bg-surface-container-low/30 rounded-xl border border-white/5 flex flex-col max-h-[700px]">
            <div className="p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                <h3 className="font-headline-sm text-on-surface font-bold text-sm tracking-wide">Closing</h3>
              </div>
              <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] rounded font-bold">{dealsByStage.closing.length}</span>
            </div>
            
            <div className="p-4 pt-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {dealsByStage.closing.map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container/40 hover:bg-surface-container/80 border border-tertiary/40 rounded-lg p-4 transition-colors group shadow-[0_0_15px_rgba(69,223,164,0.05)] cursor-pointer">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold px-2 py-1 bg-tertiary/20 text-tertiary rounded-full border border-tertiary/20">{deal.category || 'General'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} title="Hapus Deal" className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                  <h4 className="font-label-md text-on-surface-variant mb-1 font-bold">{deal.title}</h4>
                  <div className="text-xs text-on-surface-variant mb-2">{deal.customer?.name}</div>
                  <div className="font-headline-sm text-tertiary mb-4 font-bold tracking-wide">Rp {parseFloat(deal.value).toLocaleString('id-ID')}</div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                    <div className="flex items-center gap-1 text-tertiary text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Won {deal.updatedAt ? new Date(deal.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                    </div>
                    {deal.approvalStatus === 'pending' ? (
                      <span className="text-[9px] px-2 py-0.5 bg-[#f59e0b]/20 text-[#f59e0b] rounded font-bold border border-[#f59e0b]/30">Pending Approval</span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 bg-tertiary/20 text-tertiary rounded font-bold border border-tertiary/30">Approved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Lose (Added as requested) */}
          <div className="w-full bg-surface-container-low/30 rounded-xl border border-white/5 flex flex-col max-h-[700px] opacity-70">
            <div className="p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-error"></div>
                <h3 className="font-headline-sm text-on-surface font-bold text-sm tracking-wide">Lose</h3>
              </div>
              <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] rounded font-bold">{dealsByStage.lose.length}</span>
            </div>
            
            <div className="p-4 pt-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar grayscale-[30%]">
              {dealsByStage.lose.map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container/20 border border-error/20 rounded-lg p-4 transition-colors cursor-pointer hover:bg-surface-container/40">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold px-2 py-1 bg-surface-variant/30 text-on-surface-variant rounded-full border border-white/5">{deal.category || 'General'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} title="Hapus Deal" className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                  <h4 className="font-label-md text-on-surface-variant mb-1 font-bold line-through">{deal.title}</h4>
                  <div className="text-xs text-on-surface-variant mb-2">{deal.customer?.name}</div>
                  <div className="font-headline-sm text-on-surface-variant mb-4 font-bold tracking-wide line-through">Rp {parseFloat(deal.value).toLocaleString('id-ID')}</div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1 text-error text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px]">cancel</span>
                      Lost
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2); 
        }
      `}} />
    </div>
  );
}
