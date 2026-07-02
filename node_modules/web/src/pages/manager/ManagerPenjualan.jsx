import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';

export default function ManagerPenjualan() {
  const [deals, setDeals] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsRes, usersRes] = await Promise.all([
        api.get('/deals/team'),
        api.get('/users')
      ]);
      setDeals(dealsRes.data);
      
      const map = {};
      usersRes.data.forEach(u => {
        map[u.id] = u;
      });
      setUsersMap(map);
    } catch (err) {
      console.error('Error fetching manager deals data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeal = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus deal ini?')) return;
    try {
      await api.delete(`/deals/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus deal');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const filteredDeals = deals.filter(d => {
    if (selectedUserId && d.userId !== selectedUserId) return false;
    if (selectedDate) {
      const dealDate = new Date(d.createdAt).toISOString().split('T')[0];
      if (dealDate !== selectedDate) return false;
    }
    return true;
  });

  const getDealsByStage = (stage) => filteredDeals.filter(d => d.stage === stage);
  const getSumByStage = (stage) => getDealsByStage(stage).reduce((acc, curr) => acc + parseFloat(curr.value), 0);
  
  const activePipelineDeals = filteredDeals.filter(d => d.stage === 'prospek' || d.stage === 'negosiasi');
  const totalPipelineValue = activePipelineDeals.reduce((acc, curr) => acc + parseFloat(curr.value), 0);
  const activeDeals = activePipelineDeals.length;
  const avgDealSize = activeDeals > 0 ? totalPipelineValue / activeDeals : 0;
  const totalClosingValue = filteredDeals.filter(d => d.stage === 'closing').reduce((acc, curr) => acc + parseFloat(curr.value), 0);
  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full h-full flex flex-col">
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-on-surface-variant font-label-md mb-2 flex items-center gap-2">
            <span className="hover:text-primary cursor-pointer transition-colors">Penjualan</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface">Pipeline Tim</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Pipeline Tim</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Pantau dan kelola seluruh peluang penjualan tim Anda.</p>
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="appearance-none bg-surface-container-high hover:bg-surface-container-highest border border-white/10 px-4 py-2 pr-10 rounded-lg text-on-surface font-label-md flex items-center gap-2 transition-colors focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="">Semua Anggota</option>
              {Object.values(usersMap).filter(u => u.role === 'sales').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>

          <div className="relative">
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-surface-container-high hover:bg-surface-container-highest border border-white/10 px-4 py-2 rounded-lg text-on-surface font-label-md transition-colors focus:outline-none focus:border-primary/50 cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        {/* Total Pipeline */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-secondary flex flex-col justify-between h-[100px]">
          <div className="flex justify-between items-start">
            <div className="font-label-md text-[10px] sm:text-xs tracking-wider text-on-surface-variant uppercase font-bold">Total Pipeline Value</div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="font-headline-lg text-[22px] lg:text-[28px] text-on-surface font-bold truncate" title={formatCurrency(totalPipelineValue)}>{formatCurrency(totalPipelineValue)}</div>
        </div>

        {/* Active Deals */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-secondary flex flex-col justify-between h-[100px]">
          <div className="flex justify-between items-start">
            <div className="font-label-md text-[10px] sm:text-xs tracking-wider text-on-surface-variant uppercase font-bold">Active Deals</div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-secondary text-[18px]">trending_up</span>
            </div>
          </div>
          <div className="font-headline-lg text-[22px] lg:text-[28px] text-on-surface font-bold">{activeDeals}</div>
        </div>

        {/* Avg Deal Size */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-secondary flex flex-col justify-between h-[100px]">
          <div className="flex justify-between items-start">
            <div className="font-label-md text-[10px] sm:text-xs tracking-wider text-on-surface-variant uppercase font-bold">Avg. Deal Size</div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-secondary text-[18px]">monetization_on</span>
            </div>
          </div>
          <div className="font-headline-lg text-[22px] lg:text-[28px] text-on-surface font-bold truncate" title={formatCurrency(avgDealSize)}>{formatCurrency(avgDealSize)}</div>
        </div>

        {/* Total Closing Value */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-tertiary flex flex-col justify-between h-[100px]">
          <div className="flex justify-between items-start">
            <div className="font-label-md text-[10px] sm:text-xs tracking-wider text-on-surface-variant uppercase font-bold">Total Closing Value</div>
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
            </div>
          </div>
          <div className="font-headline-lg text-[22px] lg:text-[28px] text-tertiary font-bold truncate" title={formatCurrency(totalClosingValue)}>{formatCurrency(totalClosingValue)}</div>
        </div>
      </div>

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
                <div className="text-2xl font-bold text-secondary">{formatCurrency(selectedDeal.value)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Stage</div>
                  <div className="text-sm font-bold capitalize text-white">{selectedDeal.stage}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Sales Rep</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <img src={`https://ui-avatars.com/api/?name=${usersMap[selectedDeal.userId]?.name || 'U'}&background=2d3748&color=fff`} className="w-5 h-5 rounded-full" alt="avatar" />
                    <span className="text-sm font-bold text-white">{usersMap[selectedDeal.userId]?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Expected Close Date</div>
                  <div className="text-sm font-bold text-white">{selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Dibuat Pada</div>
                  <div className="text-sm font-bold text-white">{new Date(selectedDeal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {(selectedDeal.attachmentUrl || selectedDeal.approvalStatus) && (
                <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                  {selectedDeal.approvalStatus && (
                    <div>
                      <div className="text-xs text-on-surface-variant mb-1">Status Approval</div>
                      <div className="text-sm font-bold uppercase text-white">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${selectedDeal.approvalStatus === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30' : selectedDeal.approvalStatus === 'approved' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'bg-error/20 text-error border border-error/30'}`}>
                          {selectedDeal.approvalStatus}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedDeal.attachmentUrl && (
                    <div>
                      <div className="text-xs text-on-surface-variant mb-2">Dokumen Pendukung</div>
                      <a href={selectedDeal.attachmentUrl.startsWith('http') ? selectedDeal.attachmentUrl : `http://localhost:3000${selectedDeal.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-variant hover:bg-surface-variant/80 text-on-surface rounded-lg text-sm font-bold transition-colors">
                        <span className="material-symbols-outlined text-[18px]">description</span> Buka Dokumen
                      </a>
                    </div>
                  )}
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
          <div className="w-full glass-card rounded-xl border border-white/5 flex flex-col max-h-full border-t-[3px] border-t-on-surface-variant">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-container-low/50 sticky top-0 rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-on-surface-variant"></div>
                <h3 className="font-headline-md text-on-surface font-bold">Prospek</h3>
                <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-full font-bold">{getDealsByStage('prospek').length}</span>
              </div>
              <span className="text-on-surface-variant font-label-md text-xs font-bold truncate max-w-[80px]" title={formatCurrency(getSumByStage('prospek'))}>{formatCurrency(getSumByStage('prospek'))}</span>
            </div>
            
            <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {getDealsByStage('prospek').map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container-high/50 hover:bg-surface-container-high border border-white/5 rounded-lg p-4 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">{deal.category || 'DEAL'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} className="text-error hover:text-error/80 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <h4 className="font-headline-sm text-on-surface mb-1">{deal.title || deal.customer?.name || 'New Deal'}</h4>
                  <div className="font-headline-md text-secondary mb-4">{formatCurrency(deal.value)}</div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://ui-avatars.com/api/?name=${usersMap[deal.userId]?.name || 'U'}&background=2d3748&color=fff`} className="w-5 h-5 rounded-full" alt="avatar" />
                      <span className="text-xs font-label-md text-on-surface">{usersMap[deal.userId]?.name?.split(' ')[0] || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Negosiasi */}
          <div className="w-full glass-card rounded-xl border border-white/5 flex flex-col max-h-full border-t-[3px] border-t-[#818cf8]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-container-low/50 sticky top-0 rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#818cf8]"></div>
                <h3 className="font-headline-md text-on-surface font-bold">Negosiasi</h3>
                <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-full font-bold">{getDealsByStage('negosiasi').length}</span>
              </div>
              <span className="text-on-surface-variant font-label-md text-xs font-bold truncate max-w-[80px]" title={formatCurrency(getSumByStage('negosiasi'))}>{formatCurrency(getSumByStage('negosiasi'))}</span>
            </div>
            
            <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {getDealsByStage('negosiasi').map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container-high/50 hover:bg-surface-container-high border border-white/5 rounded-lg p-4 transition-colors cursor-pointer group shadow-[0_0_15px_rgba(255,180,171,0.05)] border-l-2 border-l-[#ffb4ab]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 bg-surface-variant text-on-surface-variant rounded border border-white/10">{deal.category || 'DEAL'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} className="text-error hover:text-error/80 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <h4 className="font-headline-sm text-on-surface mb-1">{deal.title || deal.customer?.name || 'New Deal'}</h4>
                  <div className="font-headline-md text-secondary mb-4">{formatCurrency(deal.value)}</div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://ui-avatars.com/api/?name=${usersMap[deal.userId]?.name || 'U'}&background=2d3748&color=fff`} className="w-5 h-5 rounded-full" alt="avatar" />
                      <span className="text-xs font-label-md text-on-surface">{usersMap[deal.userId]?.name?.split(' ')[0] || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Closing */}
          <div className="w-full glass-card rounded-xl border border-white/5 flex flex-col max-h-full border-t-[3px] border-t-tertiary">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-container-low/50 sticky top-0 rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                <h3 className="font-headline-md text-on-surface font-bold">Closing</h3>
                <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-full font-bold">{getDealsByStage('closing').length}</span>
              </div>
              <span className="text-on-surface-variant font-label-md text-xs font-bold truncate max-w-[80px]" title={formatCurrency(getSumByStage('closing'))}>{formatCurrency(getSumByStage('closing'))}</span>
            </div>
            
            <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {getDealsByStage('closing').map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container-high/50 hover:bg-surface-container-high border border-white/5 rounded-lg p-4 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 bg-tertiary/10 text-tertiary rounded border border-tertiary/20">{deal.category || 'DEAL'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} className="text-error hover:text-error/80 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <h4 className="font-headline-sm text-on-surface mb-1">{deal.title || deal.customer?.name || 'New Deal'}</h4>
                  <div className="font-headline-md text-tertiary mb-4">{formatCurrency(deal.value)}</div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://ui-avatars.com/api/?name=${usersMap[deal.userId]?.name || 'U'}&background=2d3748&color=fff`} className="w-5 h-5 rounded-full" alt="avatar" />
                      <span className="text-xs font-label-md text-on-surface">{usersMap[deal.userId]?.name?.split(' ')[0] || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Lose */}
          <div className="w-full glass-card rounded-xl border border-white/5 flex flex-col max-h-full border-t-[3px] border-t-error">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-container-low/50 sticky top-0 rounded-t-xl z-10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <h3 className="font-headline-md text-on-surface font-bold">Lose</h3>
                <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-full font-bold">{getDealsByStage('lose').length}</span>
              </div>
              <span className="text-on-surface-variant font-label-md text-xs font-bold truncate max-w-[80px]" title={formatCurrency(getSumByStage('lose'))}>{formatCurrency(getSumByStage('lose'))}</span>
            </div>
            
            <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar grayscale-[30%]">
              {getDealsByStage('lose').map(deal => (
                <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="bg-surface-container-high/50 hover:bg-surface-container-high border border-error/10 rounded-lg p-4 transition-colors cursor-pointer group opacity-80 hover:opacity-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">{deal.category || 'DEAL'}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} className="text-error hover:text-error/80 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <h4 className="font-headline-sm text-on-surface-variant mb-1 line-through">{deal.title || deal.customer?.name || 'New Deal'}</h4>
                  <div className="font-headline-md text-on-surface-variant mb-4 line-through">{formatCurrency(deal.value)}</div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <img src={`https://ui-avatars.com/api/?name=${usersMap[deal.userId]?.name || 'U'}&background=2d3748&color=fff`} className="w-5 h-5 rounded-full" alt="avatar" />
                      <span className="text-xs font-label-md text-on-surface">{usersMap[deal.userId]?.name?.split(' ')[0] || 'Unknown'}</span>
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
