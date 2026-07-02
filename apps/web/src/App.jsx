import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/sales/Dashboard';
import Absensi from './pages/sales/Absensi';
import Aktivitas from './pages/sales/Aktivitas';
import Penjualan from './pages/sales/Penjualan';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerAbsensi from './pages/manager/ManagerAbsensi';
import ManagerAktivitas from './pages/manager/ManagerAktivitas';
import ManagerPenjualan from './pages/manager/ManagerPenjualan';
import ManagerTarget from './pages/manager/ManagerTarget';
import ManagerAkun from './pages/manager/ManagerAkun';
import Akun from './pages/sales/Akun'; 
import Login from './pages/Login';
import ShaderBackground from './components/ShaderBackground';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ShaderBackground />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Sales Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['sales', 'manager', 'admin']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="absensi" element={<Absensi />} />
            <Route path="aktivitas" element={<Aktivitas />} />
            <Route path="penjualan" element={<Penjualan />} />
            <Route path="akun" element={<Akun />} />
          </Route>
            
          {/* Manager Routes */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="absensi" element={<ManagerAbsensi />} />
            <Route path="aktivitas" element={<ManagerAktivitas />} />
            <Route path="penjualan" element={<ManagerPenjualan />} />
            <Route path="target" element={<ManagerTarget />} />
            <Route path="akun" element={<ManagerAkun />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
