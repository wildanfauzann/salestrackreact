import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Absensi() {
  const location = useLocation();
  const initialTab = location.state?.tab || 'checkin';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentTime, setCurrentTime] = useState('');
  
  // States for APIs
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  
  // Location states
  const [userLocation, setUserLocation] = useState({ lat: '-6.200000', lng: '106.816666' });
  const [address, setAddress] = useState('Mencari lokasi Anda...');
  
  // Camera states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Leave form states
  const [leaveForm, setLeaveForm] = useState({
    type: 'sakit',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [leaveFile, setLeaveFile] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat: lat.toString(), lng: lng.toString() });
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
              // Simplify the address string a bit
              const parts = data.display_name.split(', ');
              const shortAddress = parts.slice(0, 3).join(', ');
              setAddress(shortAddress || data.display_name);
            } else {
              setAddress('Lokasi ditemukan (Alamat tidak tersedia)');
            }
          } catch (err) {
            console.error('Failed to reverse geocode', err);
            setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
        },
        (error) => {
          console.warn('Geolocation failed', error);
          setAddress('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setAddress('Perangkat tidak mendukung pelacakan lokasi.');
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const res = await api.get('/attendance/today');
      setTodayStatus(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching today status', err);
      }
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attendance/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching history', err);
    }
  };

  const startCamera = async () => {
    try {
      // Coba akses kamera depan (user) dulu
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      } catch (err) {
        // Jika gagal (misal di PC desktop tidak ada 'facingMode: user'), coba akses kamera apa saja
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Gagal mengakses kamera. Pastikan kamera tidak sedang digunakan oleh aplikasi lain dan Anda telah memberikan izin akses.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        setPhotoBlob(blob);
        setPhotoPreview(URL.createObjectURL(blob));
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const retakePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    startCamera();
  };

  const handleCheckIn = async () => {
    if (checkingIn) return;
    if (!photoBlob) {
      alert('Harap ambil foto terlebih dahulu sebelum check-in.');
      return;
    }
    setCheckingIn(true);
    
    // Use the already fetched location
    const lat = userLocation.lat;
    const lng = userLocation.lng;
    
    const formData = new FormData();
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    formData.append('photo', photoBlob, 'checkin.jpg');
    
    try {
      await api.post('/attendance/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Check-in berhasil!');
      fetchTodayStatus();
      fetchHistory();
      setPhotoBlob(null);
      setPhotoPreview(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal check-in. Silakan coba lagi.');
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-out');
      alert('Check-out berhasil!');
      fetchTodayStatus();
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal check-out. Silakan coba lagi.');
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  const isBefore5PM = new Date().getHours() < 17;

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('type', leaveForm.type);
    formData.append('startDate', leaveForm.startDate);
    formData.append('endDate', leaveForm.endDate);
    formData.append('reason', leaveForm.reason);
    if (leaveFile) {
      formData.append('attachment', leaveFile);
    }

    try {
      await api.post('/leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Izin berhasil diajukan!');
      setLeaveForm({ type: 'sakit', startDate: '', endDate: '', reason: '' });
      setLeaveFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Gagal mengajukan izin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      setCurrentTime(timeString);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const getIndicatorStyle = () => {
    const offsets = { checkin: 0, riwayat: 96, izin: 192 };
    const widths = { checkin: 72, riwayat: 70, izin: 48 };
    return {
      transform: `translateX(${offsets[activeTab]}px)`,
      width: `${widths[activeTab]}px`,
      boxShadow: '0 0 10px rgba(93, 230, 255, 0.8)'
    };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (inTime, outTime) => {
    if (!inTime || !outTime) return '-';
    const start = new Date(inTime);
    const end = new Date(outTime);
    if (isNaN(start) || isNaN(end)) return '-';
    
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}j ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="p-4 md:p-container-margin md:pt-xl max-w-6xl mx-auto w-full">
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Absensi Kehadiran</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">Catat kehadiran dan ajukan izin harian Anda.</p>
      </div>

      <div className="relative mb-lg border-b border-white/10 flex gap-lg font-label-md text-label-md overflow-x-auto whitespace-nowrap">
        <button 
          className={`py-sm px-xs transition-colors pb-md relative z-10 ${activeTab === 'checkin' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} 
          onClick={() => handleTabSwitch('checkin')}
        >
          [Check-in]
        </button>
        <button 
          className={`py-sm px-xs transition-colors pb-md relative z-10 ${activeTab === 'riwayat' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} 
          onClick={() => handleTabSwitch('riwayat')}
        >
          [Riwayat]
        </button>
        <button 
          className={`py-sm px-xs transition-colors pb-md relative z-10 ${activeTab === 'izin' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`} 
          onClick={() => handleTabSwitch('izin')}
        >
          [Izin]
        </button>
        
        <div className="absolute bottom-0 left-0 h-[2px] bg-secondary tab-indicator" style={getIndicatorStyle()}></div>
      </div>

      <div className="relative">
        {activeTab === 'checkin' && (
          <div className="block animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
              <div className="lg:col-span-8 glass-card rounded-xl p-lg flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                <div className="w-full max-w-[400px] aspect-[3/4] relative rounded-lg border border-white/10 overflow-hidden bg-surface-container-highest flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none z-0"></div>
                  
                  {photoPreview ? (
                    <img src={photoPreview} alt="Captured" className="w-full h-full object-cover z-10" />
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className={`absolute inset-0 w-full h-full object-cover z-10 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                  )}
                  
                  {!cameraActive && !photoPreview && (
                    <div className="flex flex-col items-center justify-center z-10">
                      <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50 mb-sm">photo_camera</span>
                      <p className="font-label-md text-label-md text-on-surface-variant/70">Kamera Nonaktif</p>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute inset-4 border border-secondary/30 rounded-lg pointer-events-none z-20">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-secondary"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-secondary"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-secondary"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-secondary"></div>
                  </div>
                </div>

                <div className="mt-md flex gap-sm z-10">
                  {!todayStatus && (
                    <>
                      {!cameraActive && !photoPreview && (
                        <button onClick={startCamera} className="bg-primary/20 text-primary px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-primary/30 transition-colors">
                          <span className="material-symbols-outlined text-sm">videocam</span> Buka Kamera
                        </button>
                      )}
                      {cameraActive && !photoPreview && (
                        <button onClick={capturePhoto} className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                          <span className="material-symbols-outlined text-sm">camera</span> Ambil Foto
                        </button>
                      )}
                      {photoPreview && (
                        <button onClick={retakePhoto} className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-white/10 transition-colors">
                          <span className="material-symbols-outlined text-sm">refresh</span> Ulangi Foto
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                <div className="mt-lg text-center w-full max-w-[400px]">
                  <div className="flex items-center justify-center gap-sm text-secondary font-headline-md text-headline-md">
                    <span className="material-symbols-outlined">schedule</span>
                    <span>{currentTime}</span>
                  </div>
                  <div className="flex items-center justify-center gap-sm text-on-surface-variant font-body-sm text-body-sm mt-xs text-center px-4">
                    <span className="material-symbols-outlined text-[16px] shrink-0">location_on</span>
                    <span className="truncate">{address}</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-4 flex flex-col gap-md">
                <div className="glass-card rounded-xl p-md flex-1 flex flex-col justify-center border-l-4 border-l-primary">
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Status Hari Ini</h3>
                  
                  <div className="flex justify-between items-center py-xs border-b border-white/5">
                    <span className="font-body-sm text-on-surface-variant">Check-in</span>
                    <span className="font-body-md text-on-surface">{formatTime(todayStatus?.checkInTime)}</span>
                  </div>
                  <div className="flex justify-between items-center py-xs border-b border-white/5">
                    <span className="font-body-sm text-on-surface-variant">Status</span>
                    {todayStatus ? (
                      <span className={`font-body-md ${todayStatus.status === 'late' ? 'text-error' : todayStatus.status === 'izin' ? 'text-secondary' : 'text-primary'}`}>
                        {todayStatus.status === 'late' ? 'Terlambat' : todayStatus.status === 'izin' ? 'Izin' : 'Hadir'}
                      </span>
                    ) : (
                      <span className="font-body-md text-on-surface-variant">Belum Absen</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-xs border-b border-white/5">
                    <span className="font-body-sm text-on-surface-variant">Check-out</span>
                    <span className="font-body-md text-on-surface">{todayStatus?.status === 'izin' ? '-' : formatTime(todayStatus?.checkOutTime)}</span>
                  </div>
                  
                  {!todayStatus ? (
                    <button 
                      onClick={handleCheckIn}
                      disabled={checkingIn || !photoPreview}
                      className="w-full py-md mt-lg rounded-lg bg-gradient-to-r from-primary-container to-secondary font-label-md text-label-md text-on-primary-container glow-btn flex items-center justify-center gap-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">how_to_reg</span>
                      {checkingIn ? 'MEMPROSES...' : 'CHECK-IN SEKARANG'}
                    </button>
                  ) : !todayStatus.checkOutTime ? (
                    <button 
                      onClick={handleCheckOut}
                      disabled={checkingIn || isBefore5PM}
                      className={`w-full py-md mt-lg rounded-lg font-label-md text-label-md text-white shadow-lg flex items-center justify-center gap-sm transition-colors ${
                        isBefore5PM 
                          ? 'bg-surface-variant text-on-surface-variant cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-error/80 to-error hover:bg-error shadow-error/20'
                      }`}
                    >
                      <span className="material-symbols-outlined">{isBefore5PM ? 'lock' : 'logout'}</span>
                      {checkingIn ? 'MEMPROSES...' : isBefore5PM ? 'CHECK-OUT DIBUKA 17:00' : 'CHECK-OUT SEKARANG'}
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-md mt-lg rounded-lg bg-surface-container-highest text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-sm cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined">done_all</span>
                      SELESAI HARI INI
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="block animate-fade-in">
            <div className="glass-card rounded-xl overflow-hidden border-t-2 border-t-tertiary">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left font-body-sm text-body-sm whitespace-nowrap min-w-[600px]">
                  <thead className="bg-surface-container-high/90 text-on-surface-variant font-label-md border-b border-white/10">
                    <tr>
                      <th className="p-md">Tanggal</th>
                      <th className="p-md">Check-in</th>
                      <th className="p-md">Check-out</th>
                      <th className="p-md">Durasi</th>
                      <th className="p-md text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.length > 0 ? history.map((record) => (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-md text-on-surface">{new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="p-md text-on-surface">{formatTime(record.checkInTime)}</td>
                        <td className="p-md text-on-surface">{formatTime(record.checkOutTime)}</td>
                        <td className="p-md text-on-surface">{calculateDuration(record.checkInTime, record.checkOutTime)}</td>
                        <td className="p-md text-right">
                          {record.status === 'present' || record.status === 'hadir' ? (
                            <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px] uppercase font-bold tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span> Success
                            </span>
                          ) : record.status === 'izin' ? (
                            <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-secondary/20 text-secondary border border-secondary/30 text-[10px] uppercase font-bold tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">beach_access</span> Izin
                            </span>
                          ) : record.status === 'absent' ? (
                            <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-error/20 text-error border border-error/30 text-[10px] uppercase font-bold tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">cancel</span> Tidak Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-xs px-2 py-1 rounded bg-error/20 text-error border border-error/30 text-[10px] uppercase font-bold tracking-wider">
                              <span className="material-symbols-outlined text-[12px]">warning</span> Terlambat
                            </span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="p-md text-center text-on-surface-variant">Belum ada riwayat absensi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'izin' && (
          <div className="block animate-fade-in">
            <div className="glass-card rounded-xl p-lg max-w-2xl">
              <form className="flex flex-col gap-lg" onSubmit={handleLeaveSubmit}>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Jenis Izin</label>
                  <select 
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                    className="w-full bg-surface-container-high border border-white/10 rounded-lg p-sm text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors"
                  >
                    <option value="sakit">Sakit</option>
                    <option value="cuti">Cuti Tahunan</option>
                    <option value="keperluan">Keperluan Pribadi</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Mulai Tanggal</label>
                    <input 
                      type="date" 
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                      required
                      className="w-full bg-surface-container-high border border-white/10 rounded-lg p-sm text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Sampai Tanggal</label>
                    <input 
                      type="date" 
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                      required
                      className="w-full bg-surface-container-high border border-white/10 rounded-lg p-sm text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Alasan (Opsional)</label>
                  <textarea 
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    className="w-full bg-surface-container-high border border-white/10 rounded-lg p-sm text-on-surface font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none transition-colors resize-none placeholder:text-on-surface-variant/50" 
                    placeholder="Tuliskan keterangan lebih lanjut..." 
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant block mb-sm">Lampiran / Surat Keterangan (Max 5MB)</label>
                  <div className="relative w-full border-2 border-dashed border-white/20 rounded-lg p-md flex flex-col items-center justify-center bg-surface-container-lowest/50 hover:bg-white/5 transition-colors group">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => setLeaveFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant group-hover:text-secondary transition-colors mb-sm">upload_file</span>
                    <span className="font-body-sm text-on-surface-variant text-center">
                      {leaveFile ? leaveFile.name : 'Klik atau seret file untuk mengunggah'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-md border-t border-white/10 flex justify-end gap-sm flex-wrap">
                  <button type="button" onClick={() => setActiveTab('checkin')} className="px-md py-sm rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors font-label-md">BATAL</button>
                  <button type="submit" disabled={loading} className="px-md py-sm rounded-lg bg-primary text-on-primary hover:bg-primary/90 glow-btn font-label-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'MENGAJUKAN...' : 'AJUKAN IZIN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
