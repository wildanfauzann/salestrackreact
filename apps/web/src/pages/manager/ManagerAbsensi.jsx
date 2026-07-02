import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

export default function ManagerAbsensi() {
  const [activeTab, setActiveTab] = useState('rekap');
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttDetail, setSelectedAttDetail] = useState(null);

  const toLocalISOString = (dateInput) => {
    const d = dateInput ? new Date(dateInput) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(toLocalISOString());
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [selectedLeaveDate, setSelectedLeaveDate] = useState('');
  const [selectedLeaveUserId, setSelectedLeaveUserId] = useState('');
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, leavesRes, usersRes] = await Promise.all([
        api.get('/attendance/team'),
        api.get('/leaves/all'),
        api.get('/users')
      ]);
      setAttendances(attRes.data);
      setLeaves(leavesRes.data);
      
      const map = {};
      usersRes.data.forEach(u => {
        map[u.id] = u;
      });
      setUsersMap(map);
    } catch (err) {
      console.error('Error fetching manager absensi data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await api.patch(`/leaves/${id}/approve`);
      fetchData();
    } catch (err) {
      alert('Gagal menyetujui izin');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await api.patch(`/leaves/${id}/reject`);
      fetchData();
    } catch (err) {
      alert('Gagal menolak izin');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-container-margin md:pt-lg flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  const filteredAttendances = attendances.filter(att => {
    if (selectedUserId && att.userId !== selectedUserId) return false;
    
    if (selectedDate) {
      const attDate = toLocalISOString(att.date);
      if (attDate !== selectedDate) return false;
    }

    if (selectedStatus) {
      const checkInTime = att.checkInTime ? new Date(att.checkInTime) : null;
      const isLate = checkInTime ? (checkInTime.getHours() >= 9) : false; 
      let computedStatus = '';
      if (att.status === 'absent') computedStatus = 'tidak_hadir';
      else if (att.status === 'izin') computedStatus = 'izin';
      else if (att.status === 'pending') computedStatus = 'pending';
      else if (isLate) computedStatus = 'terlambat';
      else computedStatus = 'hadir';
      
      if (computedStatus !== selectedStatus) return false;
    }
    
    return true;
  });

  const filteredLeaves = leaves.filter(leave => {
    if (selectedLeaveUserId && leave.userId !== selectedLeaveUserId) return false;
    
    if (selectedLeaveDate) {
      const start = new Date(leave.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(leave.endDate);
      end.setHours(23,59,59,999);
      const filterDate = new Date(selectedLeaveDate);
      if (filterDate < start || filterDate > end) return false;
    }

    if (selectedLeaveStatus && leave.status !== selectedLeaveStatus) return false;
    
    return true;
  });

  const formatDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start; // milliseconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${mins}m`;
  };

  const handleExport = () => {
    if (activeTab === 'rekap') {
      const dataToExport = filteredAttendances.map(att => {
        const user = usersMap[att.userId];
        const checkInTime = att.checkInTime ? new Date(att.checkInTime) : null;
        const isLate = checkInTime ? (checkInTime.getHours() >= 9) : false; 
        let statusStr = '';
        if (att.status === 'absent') statusStr = 'Tidak Hadir';
        else if (att.status === 'izin') statusStr = 'Izin';
        else if (att.status === 'pending') statusStr = 'Belum Absen';
        else if (isLate) statusStr = 'Terlambat';
        else statusStr = 'Hadir';

        return {
          'Nama Sales': user?.name || 'Unknown',
          'Tanggal': new Date(att.date).toLocaleDateString('id-ID'),
          'Status': statusStr,
          'Check-in': checkInTime ? checkInTime.toLocaleTimeString('id-ID') : '-',
          'Check-out': att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('id-ID') : '-',
          'Durasi': formatDuration(att.checkInTime, att.checkOutTime),
          'Link Foto': att.checkInPhoto ? (att.checkInPhoto.startsWith('http') ? att.checkInPhoto : `http://localhost:3000${att.checkInPhoto}`) : '-',
          'Lokasi Maps': (att.latitude && att.longitude) ? `https://www.google.com/maps?q=${att.latitude},${att.longitude}` : '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Absensi');
      XLSX.writeFile(workbook, `Rekap_Absensi_Tim_Sales.xlsx`);
    } else if (activeTab === 'izin') {
      const dataToExport = filteredLeaves.map(leave => {
        const user = usersMap[leave.userId];
        return {
          'Nama Sales': user?.name || 'Unknown',
          'Tipe Izin': leave.type,
          'Tanggal Mulai': new Date(leave.startDate).toLocaleDateString('id-ID'),
          'Tanggal Selesai': new Date(leave.endDate).toLocaleDateString('id-ID'),
          'Alasan': leave.reason,
          'Status': leave.status === 'pending' ? 'Menunggu' : leave.status === 'approved' ? 'Disetujui' : 'Ditolak'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Izin');
      XLSX.writeFile(workbook, `Riwayat_Izin_Tim_Sales.xlsx`);
    }
  };

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full">
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Absensi Tim</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Monitor kehadiran dan pengajuan izin tim sales.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 overflow-x-auto whitespace-nowrap gap-4">
          <button
            className={`py-md px-2 font-label-md transition-colors border-b-2 ${
              activeTab === 'rekap'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('rekap')}
          >
            Rekap Harian
          </button>
          <button
            className={`py-md px-2 font-label-md transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'izin'
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('izin')}
          >
            Pengajuan Izin & Riwayat
            <span className="bg-error/20 text-error text-[10px] px-1.5 py-0.5 rounded-full border border-error/30 font-bold">
              {leaves.filter(l => l.status === 'pending').length}
            </span>
          </button>
          <button 
            onClick={handleExport}
            className="py-md px-2 font-label-md transition-colors border-b-2 border-transparent text-on-surface-variant hover:text-on-surface hover:bg-white/5 cursor-pointer"
          >
            Export
          </button>
        </div>
      </div>

      {activeTab === 'rekap' && (
        <div className="flex flex-col gap-lg">
          
          {/* Filter Section */}
          <div className="glass-card rounded-xl p-md flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="font-label-sm text-[10px] uppercase tracking-wider text-secondary block mb-1">Tanggal</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 pb-2 pt-1 text-on-surface font-body-md focus:border-secondary focus:outline-none transition-colors [color-scheme:dark] cursor-pointer" 
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <label className="font-label-sm text-[10px] uppercase tracking-wider text-secondary block mb-1">Nama Sales</label>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full appearance-none bg-transparent border-b border-white/20 pb-2 pt-1 text-on-surface font-body-md focus:border-secondary focus:outline-none transition-colors cursor-pointer" 
              >
                <option value="" className="bg-surface-container text-on-surface">Semua Sales</option>
                {Object.values(usersMap).filter(u => u.role === 'sales').map(u => (
                  <option key={u.id} value={u.id} className="bg-surface-container text-on-surface">{u.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-0 bottom-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <label className="font-label-sm text-[10px] uppercase tracking-wider text-secondary block mb-1">Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none bg-transparent border-b border-white/20 pb-2 pt-1 text-on-surface font-body-md focus:border-secondary focus:outline-none transition-colors cursor-pointer" 
              >
                <option value="" className="bg-surface-container text-on-surface">Semua Status</option>
                <option value="hadir" className="bg-surface-container text-on-surface">Hadir (Tepat Waktu)</option>
                <option value="terlambat" className="bg-surface-container text-on-surface">Terlambat</option>
                <option value="tidak_hadir" className="bg-surface-container text-on-surface">Tidak Hadir</option>
                <option value="izin" className="bg-surface-container text-on-surface">Izin</option>
                <option value="pending" className="bg-surface-container text-on-surface">Belum Absen</option>
              </select>
              <span className="material-symbols-outlined absolute right-0 bottom-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Table Section */}
          <div className="glass-card rounded-xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-body-sm text-body-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-surface-container-high/30 text-on-surface font-label-md border-b border-white/10">
                  <tr>
                    <th className="px-lg py-md">Nama Sales</th>
                    <th className="px-lg py-md">Tanggal</th>
                    <th className="px-lg py-md">Status</th>
                    <th className="px-lg py-md">Check-in</th>
                    <th className="px-lg py-md">Check-out</th>
                    <th className="px-lg py-md">Durasi</th>
                    <th className="px-lg py-md text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAttendances.length > 0 ? filteredAttendances.map(att => {
                    const user = usersMap[att.userId];
                    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                    const checkInTime = att.checkInTime ? new Date(att.checkInTime) : null;
                    const isLate = checkInTime ? (checkInTime.getHours() >= 9) : false; 

                    return (
                      <tr key={att.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-lg py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#818cf8] text-white flex items-center justify-center font-bold text-xs">
                              {initials}
                            </div>
                            <span className="text-on-surface font-medium">{user?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-lg py-4 text-on-surface-variant">{new Date(att.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-lg py-4">
                          {att.status === 'absent' ? (
                            <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold tracking-wider rounded-md border border-error/20 uppercase">Tidak Hadir</span>
                          ) : att.status === 'izin' ? (
                            <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold tracking-wider rounded-md border border-secondary/20 uppercase">Izin</span>
                          ) : att.status === 'pending' ? (
                            <span className="px-3 py-1 bg-surface-variant/30 text-on-surface-variant text-[10px] font-bold tracking-wider rounded-md border border-white/10 uppercase">Belum Absen</span>
                          ) : isLate ? (
                            <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold tracking-wider rounded-md border border-error/20 uppercase">Terlambat</span>
                          ) : (
                            <span className="px-3 py-1 bg-tertiary/10 text-tertiary text-[10px] font-bold tracking-wider rounded-md border border-tertiary/20 uppercase">Hadir</span>
                          )}
                        </td>
                        <td className={`px-lg py-4 font-mono ${isLate ? 'text-error' : 'text-secondary'}`}>{checkInTime ? checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}</td>
                        <td className="px-lg py-4 font-mono text-on-surface-variant">{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}</td>
                        <td className="px-lg py-4 text-on-surface-variant">{formatDuration(att.checkInTime, att.checkOutTime)}</td>
                        <td className="px-lg py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAttDetail({ ...att, user });
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors font-label-sm flex items-center justify-center gap-1 w-full md:w-auto"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="px-lg py-8 text-center text-on-surface-variant">Belum ada data absensi hari ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {activeTab === 'izin' && (
        <div className="flex flex-col gap-lg">
          
          {/* Filter Section for Leaves */}
          <div className="glass-card rounded-xl p-md flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="font-label-sm text-[10px] uppercase tracking-wider text-secondary block mb-1">Tanggal Mulai/Akhir</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={selectedLeaveDate}
                  onChange={(e) => setSelectedLeaveDate(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 pb-2 pt-1 text-on-surface font-body-md focus:border-secondary focus:outline-none transition-colors [color-scheme:dark] cursor-pointer" 
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <label className="font-label-sm text-[10px] uppercase tracking-wider text-secondary block mb-1">Nama Sales</label>
              <select 
                value={selectedLeaveUserId}
                onChange={(e) => setSelectedLeaveUserId(e.target.value)}
                className="w-full appearance-none bg-transparent border-b border-white/20 pb-2 pt-1 text-on-surface font-body-md focus:border-secondary focus:outline-none transition-colors cursor-pointer" 
              >
                <option value="" className="bg-surface-container text-on-surface">Semua Sales</option>
                {Object.values(usersMap).filter(u => u.role === 'sales').map(u => (
                  <option key={u.id} value={u.id} className="bg-surface-container text-on-surface">{u.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-0 bottom-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
            </div>
            <div className="flex-1 min-w-[200px] relative">
              <label className="font-label-sm text-[10px] uppercase tracking-wider text-secondary block mb-1">Status Izin</label>
              <select 
                value={selectedLeaveStatus}
                onChange={(e) => setSelectedLeaveStatus(e.target.value)}
                className="w-full appearance-none bg-transparent border-b border-white/20 pb-2 pt-1 text-on-surface font-body-md focus:border-secondary focus:outline-none transition-colors cursor-pointer" 
              >
                <option value="" className="bg-surface-container text-on-surface">Semua Status</option>
                <option value="pending" className="bg-surface-container text-on-surface">Menunggu (Pending)</option>
                <option value="approved" className="bg-surface-container text-on-surface">Disetujui</option>
                <option value="rejected" className="bg-surface-container text-on-surface">Ditolak</option>
              </select>
              <span className="material-symbols-outlined absolute right-0 bottom-2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden border border-white/10 w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-body-sm text-body-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-surface-container-high/30 text-on-surface font-label-md border-b border-white/10">
                  <tr>
                    <th className="px-lg py-md">Nama Sales</th>
                    <th className="px-lg py-md">Tipe</th>
                    <th className="px-lg py-md">Tanggal</th>
                    <th className="px-lg py-md">Alasan</th>
                    <th className="px-lg py-md text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeaves.length > 0 ? filteredLeaves.map(leave => {
                  const user = usersMap[leave.userId];
                  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
                  return (
                    <tr key={leave.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-lg py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest text-white flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <span className="text-on-surface font-medium">{user?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-lg py-4 capitalize">{leave.type}</td>
                      <td className="px-lg py-4 text-on-surface-variant">
                        {new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-lg py-4 text-on-surface-variant max-w-[200px] truncate" title={leave.reason}>{leave.reason}</td>
                      <td className="px-lg py-4 text-right">
                        {leave.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleRejectLeave(leave.id)}
                              className="w-8 h-8 rounded-full border border-error/30 text-error hover:bg-error/10 flex items-center justify-center transition-colors"
                              title="Tolak"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                            <button 
                              onClick={() => handleApproveLeave(leave.id)}
                              className="w-8 h-8 rounded-full border border-primary/30 text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                              title="Setujui"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            </button>
                          </div>
                        ) : leave.status === 'approved' ? (
                          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold tracking-wider rounded-md border border-primary/20 uppercase">Disetujui</span>
                        ) : (
                          <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold tracking-wider rounded-md border border-error/20 uppercase">Ditolak</span>
                        )}
                      </td>
                    </tr>
                  );
                  }) : (
                    <tr>
                      <td colSpan="5" className="px-lg py-8 text-center text-on-surface-variant">Belum ada pengajuan izin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Absensi */}
      {showDetailModal && selectedAttDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container rounded-xl w-[400px] max-w-full overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-surface-container-high/50">
              <h3 className="font-headline-sm font-bold text-on-surface text-sm">Detail Absensi</h3>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAttDetail(null);
                }}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest text-white flex items-center justify-center font-bold text-sm">
                  {selectedAttDetail.user?.name ? selectedAttDetail.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="font-label-md font-bold text-on-surface">{selectedAttDetail.user?.name || 'Unknown'}</h4>
                  <p className="text-on-surface-variant text-[11px]">{new Date(selectedAttDetail.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="ml-auto">
                  {selectedAttDetail.status === 'absent' ? (
                    <span className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold tracking-wider rounded border border-error/20 uppercase">Tidak Hadir</span>
                  ) : selectedAttDetail.status === 'izin' ? (
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-bold tracking-wider rounded border border-secondary/20 uppercase">Izin</span>
                  ) : selectedAttDetail.status === 'pending' ? (
                    <span className="px-2 py-0.5 bg-surface-variant/30 text-on-surface-variant text-[10px] font-bold tracking-wider rounded border border-white/10 uppercase">Belum Absen</span>
                  ) : selectedAttDetail.checkInTime && new Date(selectedAttDetail.checkInTime).getHours() >= 9 ? (
                    <span className="px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold tracking-wider rounded border border-error/20 uppercase">Terlambat</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-tertiary/10 text-tertiary text-[10px] font-bold tracking-wider rounded border border-tertiary/20 uppercase">Hadir</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-label-sm text-on-surface-variant mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span> Foto Check-in
                  </h5>
                  {selectedAttDetail.checkInPhoto ? (
                    <div className="rounded-lg overflow-hidden border border-white/10 bg-surface-container-lowest flex justify-center h-[160px]">
                      <img 
                        src={selectedAttDetail.checkInPhoto.startsWith('http') ? selectedAttDetail.checkInPhoto : `http://localhost:3000${selectedAttDetail.checkInPhoto}`} 
                        alt="Foto Absensi" 
                        className="h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/20 p-4 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-lowest/50 h-[120px]">
                      <span className="material-symbols-outlined text-2xl mb-1 opacity-50">no_photography</span>
                      <p className="text-xs">Tidak ada foto</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-0.5">Check-in</p>
                    <p className="font-label-md font-bold text-on-surface">
                      {selectedAttDetail.checkInTime ? new Date(selectedAttDetail.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                    </p>
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-0.5">Check-out</p>
                    <p className="font-label-md font-bold text-on-surface">
                      {selectedAttDetail.checkOutTime ? new Date(selectedAttDetail.checkOutTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-label-sm text-on-surface-variant mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">location_on</span> Lokasi
                  </h5>
                  {selectedAttDetail.latitude && selectedAttDetail.longitude ? (
                    <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5 flex items-center justify-between">
                      <div className="text-[11px] font-mono text-on-surface">
                        {selectedAttDetail.latitude.toString().substring(0, 9)}, {selectedAttDetail.longitude.toString().substring(0, 10)}
                      </div>
                      <a 
                        href={`https://www.google.com/maps?q=${selectedAttDetail.latitude},${selectedAttDetail.longitude}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-secondary hover:text-secondary/80 font-label-sm bg-secondary/10 px-2 py-1 rounded transition-colors text-[11px]"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span> Buka Maps
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-white/5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">location_off</span> Data lokasi tidak tersedia
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-3 border-t border-white/10 flex justify-end bg-surface-container-high/30">
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAttDetail(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-surface-variant hover:bg-surface-variant/80 text-on-surface font-label-sm transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
