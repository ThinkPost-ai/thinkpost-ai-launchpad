import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role !== 'admin') {
      navigate('/user-dashboard', { replace: true });
    }
    if (!loading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading || !user || role !== 'admin') {
    return null; // or a loader if you want
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/home', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <button
        onClick={handleSignOut}
        style={{
          marginBottom: '2rem',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        Sign Out
      </button>
      <h1 style={{ fontSize: '2rem', color: '#333' }}>Hello</h1>
    </div>
  );
};

export default AdminDashboard; 