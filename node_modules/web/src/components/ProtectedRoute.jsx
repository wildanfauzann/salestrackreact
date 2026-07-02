import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isPending } = useAuth();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user is sales trying to access manager page, redirect to sales dashboard
    if (user.role === 'sales') {
      return <Navigate to="/" replace />;
    }
    // If user is manager trying to access sales page? Manager can access sales page based on auth middleware, but let's just allow or redirect to manager dashboard
    return <Navigate to="/manager/dashboard" replace />;
  }

  return children;
}
