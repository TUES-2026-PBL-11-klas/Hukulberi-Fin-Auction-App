import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>BidMaster</h1>
      {user ? (
        <>
          <p style={{ color: 'var(--text-muted)' }}>Welcome, {user.email}</p>
          <button className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }} onClick={handleLogout}>
            Sign Out
          </button>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>
          <a href="/login">Sign in</a> to start bidding
        </p>
      )}
    </div>
  );
};

export default Home;
