import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [activitiesToday, setActivitiesToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('6months');
  const [showDeals, setShowDeals] = useState(true);
  const [showValue, setShowValue] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, attRes, actRes] = await Promise.all([
          api.get(`/dashboard/sales?period=${periodFilter}`),
          api.get('/attendance/today').catch(() => ({ data: null })), // handle 404 gracefully
          api.get('/activities/today').catch(() => ({ data: [] }))
        ]);
        
        setDashboardData(dashRes.data);
        setAttendanceToday(attRes.data);
        setActivitiesToday(Array.isArray(actRes.data) ? actRes.data : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [periodFilter]);

  const chartData = dashboardData?.trendData || [];
  
  const closingValue = dashboardData?.closingValue || dashboardData?.closingValueThisMonth || 0;
  const targetAmount = dashboardData?.targetAmount || 0;
  const targetPercentage = targetAmount > 0 ? Math.min((closingValue / targetAmount) * 100, 100).toFixed(1) : 0;

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `Rp${(value / 1000000000).toFixed(1).replace('.0', '')}M`;
    if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1).replace('.0', '')}Jt`;
    if (value >= 1000) return `Rp${(value / 1000).toFixed(1).replace('.0', '')}Rb`;
    return `Rp${value}`;
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-container-margin md:pt-lg space-y-xl max-w-6xl mx-auto w-full">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline-xl text-headline-xl text-primary drop-shadow-[0_0_10px_rgba(189,194,255,0.3)]">Selamat Pagi, {user?.name || 'Wildan'}! 👋</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Here's your performance overview for today.</p>
        </div>
        <button 
          onClick={() => navigate('/aktivitas')}
          className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:neon-glow transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          <span className="material-symbols-outlined" data-icon="add">add</span>
          New Action
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-lg">
        <div className="glass-panel stat-card-border rounded-xl p-md flex flex-col justify-between hover:bg-surface-container-high transition-colors duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">Status Absen</span>
            <div className="p-2 rounded-full bg-tertiary-container/20 text-tertiary">
              <span className="material-symbols-outlined text-sm" data-icon="fact_check">fact_check</span>
            </div>
          </div>
          <div>
            {attendanceToday ? (
              <>
                <div className="font-headline-lg text-headline-lg text-tertiary drop-shadow-[0_0_8px_rgba(69,223,164,0.4)]">
                  {attendanceToday.status === 'hadir' || attendanceToday.status === 'present' ? '✅ Hadir' : attendanceToday.status === 'izin' ? '🏖️ Izin (Approved)' : '⚠️ Terlambat'}
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  {attendanceToday.status === 'izin' ? 'Anda sedang izin hari ini' : `Check-in: ${new Date(attendanceToday.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </>
            ) : (
              <>
                <div className="font-headline-lg text-headline-lg text-on-surface-variant">➖ Belum Absen</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Silakan check-in hari ini</div>
              </>
            )}
          </div>
        </div>
        <div className="glass-panel stat-card-border rounded-xl p-md flex flex-col justify-between hover:bg-surface-container-high transition-colors duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">Target Bulan</span>
            <div className="p-2 rounded-full bg-secondary-container/20 text-secondary">
              <span className="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="font-headline-lg text-headline-lg text-primary">{targetPercentage}%</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant pb-1 mb-1 whitespace-nowrap">
                Rp{closingValue.toLocaleString('id-ID')} / Rp{targetAmount.toLocaleString('id-ID')}
              </div>
            </div>
            {targetAmount === 0 && (
              <div className="text-xs text-on-surface-variant italic mt-1">Target belum diatur bulan ini</div>
            )}
            <div className="w-full bg-surface-container-highest rounded-full h-2 mt-3 overflow-hidden border border-white/5">
              <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full neon-glow" style={{ width: `${targetPercentage}%` }}></div>
            </div>
          </div>
        </div>
        <div className="glass-panel stat-card-border rounded-xl p-md flex flex-col justify-between hover:bg-surface-container-high transition-colors duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider group-hover:text-primary transition-colors">Closing Bulan</span>
            <div className="p-2 rounded-full bg-primary-container/20 text-primary">
              <span className="material-symbols-outlined text-sm" data-icon="handshake">handshake</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-on-surface">Rp{closingValue.toLocaleString('id-ID')}</div>
            <div className="font-body-sm text-body-sm text-tertiary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" data-icon="arrow_upward">arrow_upward</span>
              Total Deal Value
            </div>
          </div>
        </div>
      </section>

      {/* Performance Chart Section */}
      <section className="glass-panel rounded-xl p-md md:p-lg border border-white/10 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[150%] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="flex justify-between items-center mb-md flex-wrap gap-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-primary drop-shadow-[0_0_5px_rgba(189,194,255,0.3)]">Trend Penjualan</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Performa deal closing {periodFilter === 'month' ? '1 Bulan Penuh' : periodFilter === '6months' ? '6 Bulan Terakhir' : '1 Tahun Terakhir'}</p>
          </div>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-surface-container-high border-b border-white/20 pb-1 text-on-surface font-body-sm focus:border-secondary focus:outline-none cursor-pointer"
          >
            <option value="month" className="bg-surface-container text-on-surface">1 Bulan Penuh</option>
            <option value="6months" className="bg-surface-container text-on-surface">6 Bulan Terakhir</option>
            <option value="1year" className="bg-surface-container text-on-surface">1 Tahun Terakhir</option>
          </select>
        </div>

        <div className="flex justify-center gap-6 mb-4 text-xs font-label-md">
          <div 
            className={`flex items-center gap-2 cursor-pointer transition-opacity ${!showDeals ? 'opacity-50 grayscale' : 'opacity-100'}`}
            onClick={() => setShowDeals(!showDeals)}
          >
            <div className="w-3 h-3 rounded-full border-2 border-[#5de6ff]"></div> 
            <span className="text-on-surface-variant">Closed Deals</span>
          </div>
          <div 
            className={`flex items-center gap-2 cursor-pointer transition-opacity ${!showValue ? 'opacity-50 grayscale' : 'opacity-100'}`}
            onClick={() => setShowValue(!showValue)}
          >
            <div className="w-3 h-3 rounded-full border-2 border-[#818cf8]"></div> 
            <span className="text-on-surface-variant">Total Value</span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5de6ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#5de6ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} />
              
              <YAxis yAxisId="left" orientation="left" stroke="#818cf8" tick={{ fill: '#818cf8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={60} />
              <YAxis yAxisId="right" orientation="right" stroke="#5de6ff" tick={{ fill: '#5de6ff', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#fff', fontWeight: '500' }}
                labelStyle={{ color: '#d4e4fa', fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value, name) => [name === 'Total Value' || name === 'revenue' ? 'Rp ' + value.toLocaleString('id-ID') : value, name === 'revenue' ? 'Total Value' : name === 'deals' ? 'Closed Deals' : name]}
              />
              
              {showDeals && <Area yAxisId="right" type="monotone" name="Closed Deals" dataKey="deals" stroke="#5de6ff" strokeWidth={3} fillOpacity={1} fill="url(#colorDeals)" activeDot={{ r: 6, fill: '#5de6ff', stroke: '#fff', strokeWidth: 2 }} />}
              {showValue && chartData[0]?.revenue !== undefined && (
                <Area yAxisId="left" type="monotone" name="Total Value" dataKey="revenue" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        <div className="lg:col-span-4 glass-panel rounded-xl p-lg border-t-2 border-t-primary/30 flex flex-col h-full">
          <h3 className="font-headline-md text-headline-md text-primary mb-lg">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-sm md:gap-md flex-1">
            <button 
              onClick={() => navigate('/absensi', { state: { tab: 'checkin' } })}
              className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group relative overflow-hidden hover:neon-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-3xl text-primary group-hover:text-secondary transition-colors" data-icon="location_on">location_on</span>
              <span className="font-label-md text-label-md text-on-surface">Check-In</span>
            </button>
            <button 
              onClick={() => navigate('/aktivitas')}
              className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group relative overflow-hidden hover:neon-glow"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-3xl text-secondary group-hover:text-primary transition-colors" data-icon="edit_document">edit_document</span>
              <span className="font-label-md text-label-md text-on-surface">Input Visit</span>
            </button>
            <button 
              onClick={() => navigate('/penjualan')}
              className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-tertiary/50 hover:bg-tertiary/5 transition-all duration-300 group relative overflow-hidden hover:shadow-[0_0_15px_rgba(69,223,164,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-3xl text-tertiary group-hover:text-tertiary-fixed transition-colors" data-icon="monetization_on">monetization_on</span>
              <span className="font-label-md text-label-md text-on-surface">Input Deal</span>
            </button>
            <button 
              onClick={() => navigate('/absensi', { state: { tab: 'izin' } })}
              className="bg-surface-container-low border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-error/50 hover:bg-error/5 transition-all duration-300 group relative overflow-hidden hover:shadow-[0_0_15px_rgba(255,180,171,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-error/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-error transition-colors" data-icon="calendar_clock">calendar_clock</span>
              <span className="font-label-md text-label-md text-on-surface">Ajukan Izin</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 glass-panel rounded-xl overflow-hidden flex flex-col h-full border border-white/10 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
          <div className="p-lg pb-sm border-b border-white/5 bg-surface-container-low/50 backdrop-blur-sm sticky top-0 flex justify-between items-center z-10">
            <h3 className="font-headline-md text-headline-md text-primary">Today's Activity</h3>
            <button onClick={() => setShowAllModal(true)} className="text-secondary font-label-md text-label-md hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="text-on-surface-variant font-label-md bg-surface-container-high/50 border-b border-white/10">
                <tr>
                  <th className="px-md py-sm">Time</th>
                  <th className="px-md py-sm">Client/Location</th>
                  <th className="px-md py-sm">Activity</th>
                  <th className="px-md py-sm text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendanceToday?.checkOutTime ? (
                  <tr>
                    <td colSpan="4" className="p-0">
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-on-surface-variant w-full min-h-[200px]">
                        <span className="material-symbols-outlined text-4xl opacity-50">verified</span>
                        <span className="font-medium">Aktivitas disembunyikan (Anda sudah check-out hari ini)</span>
                      </div>
                    </td>
                  </tr>
                ) : activitiesToday.length > 0 ? (
                  activitiesToday.map((act) => (
                    <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-md py-3 text-on-surface whitespace-nowrap">
                        {new Date(act.activityDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-md py-3 break-words">{act.customer?.name || 'No Client'}</td>
                      <td className="px-md py-3 break-words line-clamp-2" title={act.summary}>{act.summary}</td>
                      <td className="px-md py-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-semibold border border-secondary/20 capitalize">
                          {act.type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-0">
                      <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant w-full min-h-[200px]">
                        <span>Tidak ada aktivitas hari ini.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <div className="h-xl"></div>

      {/* View All Modal */}
      {showAllModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container rounded-xl flex flex-col w-[800px] max-w-[95vw] max-h-[85vh] border border-white/10 shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Today's Activity</h3>
              <button onClick={() => setShowAllModal(false)} className="text-white/50 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="text-on-surface-variant font-label-md bg-surface-container-high/50 sticky top-0 border-b border-white/10">
                  <tr>
                    <th className="px-md py-4">Time</th>
                    <th className="px-md py-4">Client</th>
                    <th className="px-md py-4">Activity</th>
                    <th className="px-md py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendanceToday?.checkOutTime ? (
                    <tr>
                      <td colSpan="4" className="p-0">
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-on-surface-variant w-full min-h-[300px]">
                          <span className="material-symbols-outlined text-5xl opacity-50">verified</span>
                          <span className="font-medium text-lg">Aktivitas disembunyikan (Anda sudah check-out hari ini)</span>
                        </div>
                      </td>
                    </tr>
                  ) : activitiesToday.length > 0 ? (
                    activitiesToday.map((act) => (
                      <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-md py-4 text-on-surface whitespace-nowrap">
                          {new Date(act.activityDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-md py-4 break-words">{act.customer?.name || '-'}</td>
                        <td className="px-md py-4 break-words" title={act.summary}>{act.summary}</td>
                        <td className="px-md py-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-semibold border border-secondary/20 capitalize">
                            {act.type}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-0">
                        <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant w-full min-h-[300px]">
                          <span className="text-lg">Tidak ada aktivitas hari ini.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
