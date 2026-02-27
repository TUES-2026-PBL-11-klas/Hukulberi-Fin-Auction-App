import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MyAuctions from './pages/MyAuctions';
import MyBids from './pages/MyBids';
import CreateAuction from './pages/CreateAuction';
import AuctionDetailPage from './pages/AuctionDetailPage';
import AdminPanelPage from '../AdminPanelPage';
import './index.css';

const AuctionDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const auctionId = Number(id);
  if (!id || Number.isNaN(auctionId)) {
    return <Navigate to="/" replace />;
  }

  return <AuctionDetailPage auctionId={auctionId} token={token} onBack={() => navigate('/')} />;
};

const AdminRoute: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <AdminPanelPage token={token} />;
};

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-auction" element={<CreateAuction />} />
        <Route path="/my-auctions" element={<MyAuctions />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/auction/:id" element={<AuctionDetailRoute />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
