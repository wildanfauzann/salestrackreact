import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import * as XLSX from 'xlsx';

export default function ManagerAktivitas() {
  const [activeTab, setActiveTab] = useState('daftar');
  const [activities, setActivities] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  const toLocalISOString = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedGraphDate, setSelectedGraphDate] = useState(toLocalISOString());
  const [hiddenSeries, setHiddenSeries] = useState({ visit: false, call: false, meeting: false, demo: false });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, usersRes] = await Promise.all([
        api.get('/activities/team'),
        api.get('/users')
      ]);
      setActivities(actRes.data);
      
      const map = {};
      usersRes.data.forEach(u => {
        map[u.id] = u;
      });
      setUsersMap(map);
    } catch (err) {
      console.error('Error fetching manager aktivitas data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  const filteredActivities = activities.filter(act => {
    if (selectedUserId && act.userId !== selectedUserId) return false;
    if (selectedType && act.type !== selectedType) return false;
    if (selectedDate) {
      const actDate = toLocalISOString(act.activityDate || act.createdAt);
      if (actDate !== selectedDate) return false;
    }
    return true;
  });

  const productivityData = Object.values(usersMap)
    .filter(u => u.role === 'sales')
    .map(user => {
      const userActivities = activities.filter(act => {
        if (act.userId !== user.id) return false;
        if (selectedGraphDate) {
          const actDate = toLocalISOString(act.activityDate || act.createdAt);
          if (actDate !== selectedGraphDate) return false;
        }
        return true;
      });
      return {
        name: user.name.split(' ')[0],
        total: userActivities.length,
        visit: userActivities.filter(a => a.type === 'visit').length,
        call: userActivities.filter(a => a.type === 'call').length,
        meeting: userActivities.filter(a => a.type === 'meeting').length,
        demo: userActivities.filter(a => a.type === 'demo').length,
      };
    })
    .sort((a, b) => b.total - a.total); // Sort by total activities descending

  const handleLegendClick = (e) => {
    const { dataKey } = e;
    if (dataKey) {
      setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
    }
  };

  const renderCustomLegend = (props) => {
    const { payload, onClick } = props;
    return (
      <ul className="flex justify-center gap-6 pt-5 m-0 p-0 list-none">
        {payload.map((entry, index) => {
          const isHidden = hiddenSeries[entry.dataKey];
          return (
            <li 
              key={`item-${index}`} 
              className={`flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80 ${isHidden ? 'opacity-50' : ''}`}
              onClick={() => onClick(entry)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className={`text-sm text-on-surface-variant ${isHidden ? 'line-through' : ''}`}>
                {entry.value}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  const handleExport = () => {
    if (filteredActivities.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const dataToExport = filteredActivities.map(act => {
      const user = usersMap[act.userId];
      const actDate = new Date(act.activityDate || act.createdAt);
      return {
        'Tanggal & Waktu': actDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
        'Nama Sales': user?.name || 'Unknown',
        'Pelanggan / Prospek': act.customer?.name || '-',
        'Alamat Pelanggan': act.customer?.address || '-',
        'Tipe Aktivitas': act.type,
        'Status': act.dealStatus || 'Completed',
        'Ringkasan (Summary)': act.summary || '-',
        'Catatan Lengkap': act.notes || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Aktivitas');
    XLSX.writeFile(workbook, `Laporan_Aktivitas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full">
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface text-primary">Aktivitas Tim</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Pantau dan kelola aktivitas harian tim sales Anda.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto whitespace-nowrap gap-6 mb-lg">
        <button
          className={`py-md font-label-md transition-colors border-b-2 uppercase tracking-wider text-xs font-bold ${
            activeTab === 'daftar'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('daftar')}
        >
          Daftar
        </button>
        <button
          className={`py-md font-label-md transition-colors border-b-2 uppercase tracking-wider text-xs font-bold ${
            activeTab === 'produktivitas'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          }`}
          onClick={() => setActiveTab('produktivitas')}
        >
          Produktivitas
        </button>
      </div>

      {activeTab === 'daftar' && (
        <div className="flex flex-col gap-lg">
          
          {/* Filter Section */}
          <div className="glass-card rounded-xl p-md flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              {/* Tanggal */}
              <div className="relative">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-surface-container-high hover:bg-surface-container-highest border border-white/10 px-4 py-2 rounded-lg text-on-surface font-label-md transition-colors focus:outline-none focus:border-primary/50 cursor-pointer [color-scheme:dark]"
                />
              </div>
              
              {/* Pilih Sales */}
              <div className="relative">
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="appearance-none bg-surface-container-high hover:bg-surface-container-highest border border-white/10 px-4 py-2 pr-10 rounded-lg text-on-surface font-label-md transition-colors focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="">Semua Sales</option>
                  {Object.values(usersMap).filter(u => u.role === 'sales').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
              
              {/* Tipe Aktivitas */}
              <div className="relative">
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="appearance-none bg-surface-container-high hover:bg-surface-container-highest border border-white/10 px-4 py-2 pr-10 rounded-lg text-on-surface font-label-md transition-colors focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="">Semua Tipe</option>
                  <option value="visit">Visit</option>
                  <option value="call">Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="demo">Demo</option>
                </select>
                <span className="material-symbols-outlined text-[18px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
            
            <button onClick={handleExport} className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-lg py-sm rounded-lg font-label-md flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Data
            </button>
          </div>

          {/* Table Section */}
          <div className="glass-card rounded-xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-body-sm text-body-sm whitespace-nowrap min-w-[1000px]">
                <thead className="bg-surface-container-high/30 text-on-surface font-label-md border-b border-white/10">
                  <tr>
                    <th className="px-lg py-md w-[150px]">Tanggal & Waktu</th>
                    <th className="px-lg py-md w-[200px]">Sales</th>
                    <th className="px-lg py-md w-[250px]">Pelanggan / Prospek</th>
                    <th className="px-lg py-md w-[150px]">Tipe Aktivitas</th>
                    <th className="px-lg py-md">Status / Catatan</th>
                    <th className="px-lg py-md text-center w-[80px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredActivities.length > 0 ? filteredActivities.map(act => {
                    const user = usersMap[act.userId];
                    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                    const actDate = new Date(act.activityDate || act.createdAt);
                    return (
                      <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-lg py-4">
                          <div className="font-semibold text-on-surface">{actDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <div className="text-on-surface-variant text-xs mt-0.5">{actDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-lg py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-[10px] shrink-0 border border-white/10">
                              {initials}
                            </div>
                            <span className="text-on-surface text-sm whitespace-normal leading-tight">{user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-lg py-4">
                          <div className="font-semibold text-on-surface">{act.customer?.name || '-'}</div>
                          <div className="text-on-surface-variant text-xs mt-0.5 truncate max-w-[200px]">{act.customer?.address || '-'}</div>
                        </td>
                        <td className="px-lg py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border ${act.type === 'visit' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'} capitalize`}>
                            <span className="material-symbols-outlined text-[14px]">{act.type === 'visit' ? 'storefront' : act.type === 'call' ? 'call' : act.type === 'meeting' ? 'groups' : 'desktop_windows'}</span>
                            {act.type}
                          </span>
                        </td>
                        <td className="px-lg py-4">
                          <div className="font-semibold text-tertiary capitalize">{act.dealStatus || 'Completed'}</div>
                          <div className="text-on-surface-variant text-xs mt-0.5 truncate max-w-[250px]" title={act.summary}>{act.summary}</div>
                        </td>
                        <td className="px-lg py-4 text-center">
                          <button onClick={() => setSelectedActivity(act)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-on-surface-variant hover:text-secondary hover:border-secondary transition-colors mx-auto">
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="px-lg py-8 text-center text-on-surface-variant">Belum ada aktivitas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {activeTab === 'produktivitas' && (
        <div className="glass-card rounded-xl p-lg w-full flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="font-headline-md text-on-surface">Produktivitas Tim Sales</h3>
            <div className="flex flex-wrap items-center gap-3">
              <input 
                type="date"
                value={selectedGraphDate}
                onChange={(e) => setSelectedGraphDate(e.target.value)}
                className="bg-surface-container-high hover:bg-surface-container-highest border border-white/10 px-4 py-1.5 rounded-lg text-on-surface font-label-md transition-colors focus:outline-none focus:border-primary/50 cursor-pointer [color-scheme:dark]"
              />
              <span className="text-on-surface-variant font-label-md bg-surface-container-high px-4 py-1.5 rounded-full border border-white/5">
                Total Aktivitas: <strong className="text-secondary">{productivityData.reduce((acc, curr) => acc + curr.total, 0)}</strong>
              </span>
            </div>
          </div>
          
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productivityData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F1F1F', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#E3E3E3' }}
                  itemStyle={{ color: '#E3E3E3' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Legend content={renderCustomLegend} onClick={handleLegendClick} />
                <Bar hide={hiddenSeries.visit} dataKey="visit" name="Visit" stackId="a" fill="#D2E823" radius={[0, 0, 4, 4]} />
                <Bar hide={hiddenSeries.call} dataKey="call" name="Call" stackId="a" fill="#A8C7FA" />
                <Bar hide={hiddenSeries.meeting} dataKey="meeting" name="Meeting" stackId="a" fill="#FFB4AB" />
                <Bar hide={hiddenSeries.demo} dataKey="demo" name="Demo" stackId="a" fill="#E8B0FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setSelectedActivity(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="font-headline-md text-on-surface mb-6 border-b border-white/10 pb-4">Detail Aktivitas</h3>
            
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-on-surface-variant mb-1 font-label-md uppercase tracking-wider">Tanggal & Waktu</div>
                  <div className="font-body-md text-on-surface bg-surface-container-high/30 p-3 rounded-lg border border-white/5">
                    {new Date(selectedActivity.activityDate || selectedActivity.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1 font-label-md uppercase tracking-wider">Tipe Aktivitas</div>
                  <div className="font-body-md text-on-surface bg-surface-container-high/30 p-3 rounded-lg border border-white/5 capitalize flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">{selectedActivity.type === 'visit' ? 'storefront' : selectedActivity.type === 'call' ? 'call' : selectedActivity.type === 'meeting' ? 'groups' : 'desktop_windows'}</span>
                    {selectedActivity.type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1 font-label-md uppercase tracking-wider">Sales</div>
                  <div className="font-body-md text-on-surface bg-surface-container-high/30 p-3 rounded-lg border border-white/5">
                    {usersMap[selectedActivity.userId]?.name || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1 font-label-md uppercase tracking-wider">Pelanggan</div>
                  <div className="font-body-md text-on-surface bg-surface-container-high/30 p-3 rounded-lg border border-white/5">
                    {selectedActivity.customer?.name || '-'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-on-surface-variant mb-1 font-label-md uppercase tracking-wider">Ringkasan (Summary)</div>
                <div className="font-body-md text-on-surface bg-surface-container-high/30 p-4 rounded-lg border border-white/5 min-h-[60px]">
                  {selectedActivity.summary || '-'}
                </div>
              </div>

              <div>
                <div className="text-xs text-on-surface-variant mb-1 font-label-md uppercase tracking-wider">Catatan Lengkap</div>
                <div className="font-body-md text-on-surface bg-surface-container-high/30 p-4 rounded-lg border border-white/5 min-h-[100px] whitespace-pre-wrap">
                  {selectedActivity.notes || 'Tidak ada catatan tambahan.'}
                </div>
              </div>

              {selectedActivity.attachmentUrls && selectedActivity.attachmentUrls.length > 0 && (
                <div>
                  <div className="text-xs text-on-surface-variant mb-3 font-label-md uppercase tracking-wider">Lampiran</div>
                  <div className="flex flex-wrap gap-4">
                    {selectedActivity.attachmentUrls.map((url, i) => (
                      <a key={i} href={url.startsWith('/') ? `http://localhost:3000${url}` : url} target="_blank" rel="noreferrer" className="block group">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 relative bg-surface-container flex items-center justify-center">
                          {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <img src={url.startsWith('/') ? `http://localhost:3000${url}` : url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <span className="material-symbols-outlined text-[32px] text-primary">description</span>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">open_in_new</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
