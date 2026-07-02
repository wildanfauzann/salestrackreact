import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

export default function ManagerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingDeals, setPendingDeals] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending' | 'history'
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [periodFilter, setPeriodFilter] = useState('6months');
  const [salesFilter, setSalesFilter] = useState('all');
  const [salesList, setSalesList] = useState([]);
  const [showDeals, setShowDeals] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [showTopSalesModal, setShowTopSalesModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterMonth, filterYear, periodFilter, salesFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sales list if not loaded yet
      if (salesList.length === 0) {
        const usersRes = await api.get('/users');
        const salesUsers = usersRes.data.filter(u => u.role === 'sales');
        setSalesList(salesUsers);
      }

      const queryParams = new URLSearchParams();
      if (filterMonth) queryParams.append('month', filterMonth.toString());
      if (filterYear) queryParams.append('year', filterYear.toString());
      if (periodFilter) queryParams.append('period', periodFilter);
      if (salesFilter !== 'all') queryParams.append('salesId', salesFilter);
      
      const [dashRes, pendingRes, historyRes] = await Promise.all([
        api.get(`/dashboard/manager?${queryParams.toString()}`),
        api.get('/deals/pending-approval'),
        api.get('/deals/approval-history')
      ]);
      setDashboardData(dashRes.data);
      setPendingDeals(pendingRes.data);
      setApprovalHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching manager dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/deals/${id}/approve`);
      fetchData();
    } catch (err) {
      alert('Gagal menyetujui deal');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/deals/${id}/reject`);
      fetchData();
    } catch (err) {
      alert('Gagal menolak deal');
    }
  };

  const funnelChartData = dashboardData?.funnelData ? [
    { name: 'Prospek', value: dashboardData.funnelData.prospek, fill: '#64748b' },
    { name: 'Negosiasi', value: dashboardData.funnelData.negosiasi, fill: '#f59e0b' },
    { name: 'Closing', value: dashboardData.funnelData.closing, fill: '#10b981' },
    { name: 'Lose', value: dashboardData.funnelData.lose, fill: '#ef4444' },
  ] : [];

  const activityChartData = dashboardData?.activityData || [];
  const ACTIVITY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const targetValue = dashboardData?.totalTargetValue || 0;
  const currentClosing = dashboardData?.totalClosingValue || 0;
  
  // Calculate percentage for gauge, cap at 100%
  const targetPercentage = targetValue > 0 ? Math.min((currentClosing / targetValue) * 100, 100) : 0;
  const targetRemainder = 100 - targetPercentage;
  const gaugeData = [
    { name: 'Pencapaian', value: targetPercentage, fill: '#10b981' },
    { name: 'Kekurangan', value: targetRemainder, fill: '#1f2937' } // Dark gray for remainder
  ];

  const trendData = dashboardData?.trendData || [];
  
  const rawTopSales = dashboardData?.topSales || [];
  const maxClosings = Math.max(1, ...rawTopSales.map(s => s.closings));
  
  const topSalesList = rawTopSales.map((sales, index) => {
    let medal = `${index + 1}`;
    let color = 'from-surface-variant to-surface-container-highest';
    let isGray = true;
    
    if (index === 0) { medal = '🥇'; color = 'from-primary to-primary-container'; isGray = false; }
    else if (index === 1) { medal = '🥈'; color = 'from-secondary to-secondary-container'; isGray = false; }
    else if (index === 2) { medal = '🥉'; color = 'from-tertiary to-tertiary-container'; isGray = false; }
    
    return {
      ...sales,
      max: maxClosings,
      medal,
      color,
      isGray
    };
  });

  const barData = trendData;

  const formatCurrency = (value) => {
    if (value >= 1000000000) return `Rp${(value / 1000000000).toFixed(1).replace('.0', '')}M`;
    if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1).replace('.0', '')}Jt`;
    if (value >= 1000) return `Rp${(value / 1000).toFixed(1).replace('.0', '')}Rb`;
    return `Rp${value}`;
  };

  const handleExportTrend = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Trend Performance
    if (trendData && trendData.length > 0) {
      const trendExport = trendData.map(item => ({
        Bulan: item.name,
        'Total Deals': item.deals,
        'Total Value': 'Rp ' + (item.revenue || 0).toLocaleString('id-ID')
      }));
      const wsTrend = XLSX.utils.json_to_sheet(trendExport);
      XLSX.utils.book_append_sheet(workbook, wsTrend, 'Trend Performance');
    }

    // 2. Sales Funnel
    if (funnelChartData && funnelChartData.length > 0) {
      const funnelExport = funnelChartData.map(item => ({
        Tahap: item.name,
        'Jumlah Deals': item.value
      }));
      const wsFunnel = XLSX.utils.json_to_sheet(funnelExport);
      XLSX.utils.book_append_sheet(workbook, wsFunnel, 'Sales Funnel');
    }

    // 3. Aktivitas Tim
    if (activityChartData && activityChartData.length > 0) {
      const activityExport = activityChartData.map(item => ({
        Aktivitas: item.name,
        Jumlah: item.value
      }));
      const wsActivity = XLSX.utils.json_to_sheet(activityExport);
      XLSX.utils.book_append_sheet(workbook, wsActivity, 'Aktivitas Tim');
    }

    // 4. Pencapaian Target
    const targetExport = [{
      Indikator: 'Target Bulan Ini',
      Nilai: 'Rp ' + (targetValue || 0).toLocaleString('id-ID')
    }, {
      Indikator: salesFilter !== 'all' ? 'Kontribusi Value' : 'Total Closing Value',
      Nilai: 'Rp ' + (currentClosing || 0).toLocaleString('id-ID')
    }, {
      Indikator: 'Persentase',
      Nilai: targetPercentage.toFixed(1) + '%'
    }];
    const wsTarget = XLSX.utils.json_to_sheet(targetExport);
    XLSX.utils.book_append_sheet(workbook, wsTarget, 'Pencapaian Target');

    XLSX.writeFile(workbook, `Laporan_Performa_${filterMonth}_${filterYear}.xlsx`);
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full">
      <div className="mb-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Dashboard Manager</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Overview performa tim sales dan metrik kunci hari ini.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-xl border border-white/10">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-transparent text-on-surface font-body-sm focus:outline-none cursor-pointer"
          >
            {[...Array(12).keys()].map(i => (
              <option key={i+1} value={i+1} className="bg-surface-container text-on-surface">
                {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
              </option>
            ))}
          </select>
          <div className="w-[1px] h-4 bg-white/20"></div>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-transparent text-on-surface font-body-sm focus:outline-none cursor-pointer"
          >
            {[...Array(5).keys()].map(i => {
              const y = new Date().getFullYear() - 2 + i;
              return <option key={y} value={y} className="bg-surface-container text-on-surface">{y}</option>;
            })}
          </select>
          <div className="w-[1px] h-4 bg-white/20 hidden md:block"></div>
          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            className="bg-transparent text-on-surface font-body-sm focus:outline-none cursor-pointer border-l md:border-none border-white/20 pl-4 md:pl-0"
          >
            <option value="all" className="bg-surface-container text-on-surface">Semua Sales</option>
            {salesList.map(s => (
              <option key={s.id} value={s.id} className="bg-surface-container text-on-surface">{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        {/* Sales Aktif */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-primary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-on-surface-variant">group</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-tertiary/20 text-tertiary text-[10px] font-bold border border-tertiary/30">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
              +2 bulan ini
            </span>
          </div>
          <div>
            <div className="font-label-md text-on-surface-variant">Sales Aktif</div>
            <div className="font-headline-xl text-on-surface">{dashboardData?.activeSales || 0}</div>
          </div>
        </div>

        {/* Closing Bulan Ini (Using total closing value instead for now) */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-secondary">verified</span>
            </div>
          </div>
          <div>
            <div className="font-label-md text-on-surface-variant">Total Closing (Value)</div>
            <div className="font-headline-xl text-on-surface text-2xl truncate" title={`Rp ${(dashboardData?.totalClosingValue || 0).toLocaleString('id-ID')}`}>
              Rp {(dashboardData?.totalClosingValue || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Pending Deals */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-tertiary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-tertiary">pending_actions</span>
            </div>
          </div>
          <div>
            <div className="font-label-md text-on-surface-variant">Pending Approval</div>
            <div className="font-headline-xl text-on-surface">{dashboardData?.pendingDealsCount || 0}</div>
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="glass-card rounded-xl p-md border-l-4 border-l-primary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
              <span className="material-symbols-outlined text-primary">badge</span>
            </div>
          </div>
          <div>
            <div className="font-label-md text-on-surface-variant">Hadir Hari Ini</div>
            <div className="font-headline-xl text-on-surface">{dashboardData?.attendanceToday || 0} <span className="text-body-md text-on-surface-variant font-normal">/ {dashboardData?.activeSales || 0}</span></div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="glass-card rounded-xl p-lg mb-lg">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h3 className="font-headline-md text-on-surface">Trend Performance ({periodFilter === 'month' ? '1 Bulan' : periodFilter === '6months' ? '6 Bulan' : '1 Tahun'})</h3>
          <div className="flex items-center gap-4">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-surface-container-high border-b border-white/20 pb-1 text-on-surface font-body-sm focus:border-secondary focus:outline-none cursor-pointer"
            >
              <option value="month" className="bg-surface-container text-on-surface">1 Bulan Penuh</option>
              <option value="6months" className="bg-surface-container text-on-surface">6 Bulan Terakhir</option>
              <option value="1year" className="bg-surface-container text-on-surface">1 Tahun Terakhir</option>
            </select>
            <button onClick={handleExportTrend} className="flex items-center gap-1 text-on-surface-variant text-label-sm hover:text-on-surface transition-colors cursor-pointer ml-4">
              Export Data <span className="material-symbols-outlined text-[16px]">download</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-center gap-6 mb-4 text-xs font-label-md">
          <div 
            className={`flex items-center gap-2 cursor-pointer transition-opacity ${!showDeals ? 'opacity-50 grayscale' : 'opacity-100'}`}
            onClick={() => setShowDeals(!showDeals)}
          >
            <div className="w-3 h-3 rounded-full border-2 border-secondary"></div> 
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
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
              
              <YAxis yAxisId="left" orientation="left" stroke="#818cf8" tick={{ fill: '#818cf8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={60} />
              <YAxis yAxisId="right" orientation="right" stroke="#5de6ff" tick={{ fill: '#5de6ff', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#fff', fontWeight: '500' }}
                labelStyle={{ color: '#d4e4fa', fontWeight: 'bold', marginBottom: '8px' }}
                formatter={(value, name) => [name === 'Total Value' ? 'Rp ' + value.toLocaleString('id-ID') : value, name]}
              />
              
              {showDeals && <Area yAxisId="right" type="monotone" name="Closed Deals" dataKey="deals" stroke="#5de6ff" strokeWidth={3} fillOpacity={1} fill="url(#colorDeals)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#5de6ff' }} />}
              {showValue && <Area yAxisId="left" type="monotone" name="Total Value" dataKey="revenue" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#818cf8' }} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Three New Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
        {/* Sales Funnel */}
        <div className="glass-card rounded-xl p-lg h-[320px] flex flex-col">
          <h3 className="font-headline-md text-on-surface mb-2">Sales Funnel</h3>
          <p className="font-body-sm text-on-surface-variant mb-4">Konversi deals bulan ini</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelChartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ fill: '#ffffff', position: 'right' }}>
                  {funnelChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proporsi Aktivitas */}
        <div className="glass-card rounded-xl p-lg h-[320px] flex flex-col">
          <h3 className="font-headline-md text-on-surface mb-2">Aktivitas Tim</h3>
          <p className="font-body-sm text-on-surface-variant mb-4">Sebaran tipe aktivitas bulan ini</p>
          <div className="flex-1 w-full relative">
            {activityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-sm">
                Belum ada aktivitas
              </div>
            )}
            {/* Custom Legend for Activity */}
            <div className="flex justify-center gap-4 flex-wrap mt-2">
              {activityChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACTIVITY_COLORS[index % ACTIVITY_COLORS.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pencapaian Target */}
        <div className="glass-card rounded-xl p-lg h-[320px] flex flex-col items-center relative">
          <h3 className="font-headline-md text-on-surface mb-2 w-full text-left">Pencapaian Target</h3>
          <p className="font-body-sm text-on-surface-variant mb-6 w-full text-left">
            {salesFilter === 'all' ? 'Total Value vs Target Keseluruhan' : 'Kontribusi vs Target Tim'}
          </p>
          
          <div className="w-full flex-1 flex flex-col items-center justify-center relative mt-[-20px]">
            {targetValue > 0 ? (
              <>
                <div className="h-[140px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="100%" // cy 100% makes it a half circle from the bottom
                        startAngle={180}
                        endAngle={0}
                        innerRadius={80}
                        outerRadius={110}
                        dataKey="value"
                        stroke="none"
                      >
                        {gaugeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="absolute bottom-[40px] flex flex-col items-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {targetPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-secondary font-bold">
                    Rp {currentClosing.toLocaleString('id-ID')}
                  </div>
                </div>
                
                <div className="w-full flex justify-between px-4 mt-8 text-xs text-on-surface-variant font-medium">
                  <span>Rp 0</span>
                  <span>Target: Rp {targetValue.toLocaleString('id-ID')}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 opacity-50">track_changes</span>
                <span className="text-on-surface-variant text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  Target belum diatur bulan ini
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Sales & Approval Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-lg">

        {/* Top 5 Sales */}
        <div className="glass-card rounded-xl p-lg h-[450px] flex flex-col lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-on-surface">Top Sales</h3>
            <button onClick={() => setShowTopSalesModal(true)} className="text-secondary font-label-md text-label-md hover:underline">View All</button>
          </div>
          
          <div className="flex flex-col gap-4 flex-1 justify-start overflow-y-auto custom-scrollbar pr-2">
            {topSalesList.length > 0 ? topSalesList.slice(0, 5).map((sales) => (
              <div key={sales.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${sales.isGray ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-surface-container-high'}`}>
                  {sales.medal}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-label-md text-on-surface">{sales.name}</span>
                    <span className="font-body-sm text-on-surface-variant">{sales.closings} Closing</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden" title={`Total Value: Rp ${(sales.revenue || 0).toLocaleString('id-ID')}`}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${sales.color}`} style={{ width: `${(sales.closings / sales.max) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-on-surface-variant text-sm mt-8">
                Belum ada closing bulan ini.
              </div>
            )}
          </div>
        </div>

        {/* Menunggu Approval Table */}
        <div className="glass-card rounded-xl border border-white/10 overflow-hidden lg:col-span-2 h-[450px] flex flex-col">
          <div className="p-lg border-b border-white/5 flex justify-between items-center bg-surface-container-low/50 shrink-0">
            <h3 className="font-headline-md text-on-surface">Approval Deal</h3>
            <div className="flex gap-2 p-1 bg-surface-container-high rounded-lg border border-white/5">
              <button 
                onClick={() => setApprovalTab('pending')}
                className={`px-3 py-1 text-xs font-label-md rounded-md transition-colors ${approvalTab === 'pending' ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Pending ({pendingDeals.length})
              </button>
              <button 
                onClick={() => setApprovalTab('history')}
                className={`px-3 py-1 text-xs font-label-md rounded-md transition-colors ${approvalTab === 'history' ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Riwayat
              </button>
            </div>
          </div>
          <div className="overflow-x-auto w-full flex-1 custom-scrollbar">
          <table className="w-full text-left font-body-sm text-body-sm whitespace-nowrap min-w-[800px]">
            <thead className="bg-surface-container-high/30 text-on-surface-variant font-label-md border-b border-white/5">
              <tr>
                <th className="px-lg py-md">Tanggal</th>
                <th className="px-lg py-md">Info Deal</th>
                <th className="px-lg py-md">Sales</th>
                <th className="px-lg py-md">Nilai</th>
                <th className="px-lg py-md text-center">Dokumen</th>
                <th className="px-lg py-md text-right">{approvalTab === 'pending' ? 'Aksi' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {approvalTab === 'pending' ? (
                pendingDeals.length > 0 ? pendingDeals.map(deal => (
                  <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-lg py-4 text-on-surface-variant text-xs whitespace-nowrap">
                      {new Date(deal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-lg py-4">
                      <div className="font-bold text-on-surface text-sm mb-0.5">{deal.title || `Deal #${deal.id.substring(0, 5)}`}</div>
                      <div className="text-on-surface-variant text-xs">{deal.customer?.name || '-'}</div>
                    </td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/10 overflow-hidden">
                          <img src={`https://ui-avatars.com/api/?name=${deal.user?.name || 'U'}&background=2d3748&color=fff`} alt="Sales" className="w-full h-full object-cover"/>
                        </div>
                        <span className="text-sm">{deal.user?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-lg py-4 font-bold text-secondary text-sm">Rp {parseFloat(deal.value).toLocaleString('id-ID')}</td>
                    <td className="px-lg py-4 text-center">
                      {deal.attachmentUrl ? (
                        <a href={deal.attachmentUrl.startsWith('http') ? deal.attachmentUrl : `http://localhost:3000${deal.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 bg-surface-variant hover:bg-surface-variant/80 text-on-surface rounded-full text-[10px] font-bold transition-colors">
                          <span className="material-symbols-outlined text-[12px]">description</span> Lihat
                        </a>
                      ) : (
                        <span className="text-on-surface-variant text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-col sm:flex-row">
                        <button onClick={() => handleReject(deal.id)} className="px-3 py-1.5 rounded bg-transparent border border-error/50 text-error hover:bg-error/10 transition-colors font-label-sm w-full sm:w-auto">Reject</button>
                        <button onClick={() => handleApprove(deal.id)} className="px-3 py-1.5 rounded bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-sm w-full sm:w-auto">Approve</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-lg py-8 text-center text-on-surface-variant">Tidak ada deal yang menunggu approval.</td>
                  </tr>
                )
              ) : (
                approvalHistory.length > 0 ? approvalHistory.map(deal => (
                  <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-lg py-4 text-on-surface-variant text-xs whitespace-nowrap">
                      {new Date(deal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-lg py-4">
                      <div className="font-bold text-on-surface text-sm mb-0.5">{deal.title || `Deal #${deal.id.substring(0, 5)}`}</div>
                      <div className="text-on-surface-variant text-xs">{deal.customer?.name || '-'}</div>
                    </td>
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center border border-white/10 overflow-hidden">
                          <img src={`https://ui-avatars.com/api/?name=${deal.user?.name || 'U'}&background=2d3748&color=fff`} alt="Sales" className="w-full h-full object-cover"/>
                        </div>
                        <span className="text-sm">{deal.user?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-lg py-4 font-bold text-secondary text-sm">Rp {parseFloat(deal.value).toLocaleString('id-ID')}</td>
                    <td className="px-lg py-4 text-center">
                      {deal.attachmentUrl ? (
                        <a href={deal.attachmentUrl.startsWith('http') ? deal.attachmentUrl : `http://localhost:3000${deal.attachmentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 bg-surface-variant hover:bg-surface-variant/80 text-on-surface rounded-full text-[10px] font-bold transition-colors">
                          <span className="material-symbols-outlined text-[12px]">description</span> Lihat
                        </a>
                      ) : (
                        <span className="text-on-surface-variant text-xs italic">-</span>
                      )}
                    </td>
                    <td className="px-lg py-4 text-right">
                      {deal.approvalStatus === 'approved' ? (
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-bold border border-primary/20 uppercase tracking-wider">Approved</span>
                      ) : (
                        <span className="px-3 py-1 bg-error/20 text-error rounded-full text-[10px] font-bold border border-error/20 uppercase tracking-wider">Rejected</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-lg py-8 text-center text-on-surface-variant">Belum ada riwayat approval.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      {/* Top Sales Modal */}
      {showTopSalesModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container rounded-xl flex flex-col w-[600px] max-w-[95vw] max-h-[85vh] border border-white/10 shadow-2xl relative">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Semua Performa Sales ({new Date(filterYear, filterMonth - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })})</h3>
              <button onClick={() => setShowTopSalesModal(false)} className="text-white/50 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-4">
              {topSalesList.length > 0 ? topSalesList.map((sales) => (
                <div key={sales.id} className="flex items-center gap-4 bg-surface-container-high/30 p-4 rounded-xl border border-white/5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-md shrink-0 ${sales.isGray ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-surface-container-high'}`}>
                    {sales.medal}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="font-label-lg text-on-surface block mb-1">{sales.name}</span>
                        <span className="font-label-sm text-secondary">Rp {(sales.revenue || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <span className="font-body-md text-on-surface-variant">{sales.closings} Closing</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden" title={`Total Value: Rp ${(sales.revenue || 0).toLocaleString('id-ID')}`}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${sales.color}`} style={{ width: `${(sales.closings / sales.max) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-on-surface-variant text-sm mt-8">
                  Belum ada closing bulan ini.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
