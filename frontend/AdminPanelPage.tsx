import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminAuctionsList from './AdminAuctionsList';
import './AdminPanelPage.css';

interface AdminPanelPageProps {
  token: string;
}

const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'auctions'>('users');

  if (!token) {
    return <div className="admin-auth-warning">Please login as admin first</div>;
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-shell">
        <header className="admin-nav glass">
          <div className="admin-nav-top">
            <h2>Admin Control Center</h2>
            <p>Manage users, auctions, and platform moderation</p>
          </div>

          <div className="tabs">
            <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
              User Management
            </button>
            <button
            className={`tab-btn ${activeTab === 'auctions' ? 'active' : ''}`}
            onClick={() => setActiveTab('auctions')}
          >
              Auctions Management
            </button>
          </div>
        </header>

        <main className="admin-content">
          {activeTab === 'users' && <AdminDashboard token={token} />}
          {activeTab === 'auctions' && <AdminAuctionsList token={token} />}
        </main>
      </div>
    </div>
  );
};

export default AdminPanelPage;
