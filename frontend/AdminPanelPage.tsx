import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminAuctionsList from './AdminAuctionsList';

// Пример App.tsx интеграция
const AdminPanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'auctions'>('users');
  
  // Трябва да получиш токена от Auth Context или localStorage
  const token = localStorage.getItem('authToken') || '';

  if (!token) {
    return <div>Please login as admin first</div>;
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-nav">
        <h2>Admin Panel</h2>
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
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <AdminDashboard token={token} />}
        {activeTab === 'auctions' && <AdminAuctionsList token={token} />}
      </div>
    </div>
  );
};

export default AdminPanelPage;


/* Example CSS for container */
const adminPanelStyles = `
.admin-panel-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.admin-nav {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.admin-nav h2 {
  margin: 0 0 15px 0;
  color: #333;
}

.tabs {
  display: flex;
  gap: 10px;
}

.tab-btn {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #1976d2;
  color: #1976d2;
}

.tab-btn.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

.admin-content {
  background-color: white;
  margin: 0 20px 20px 20px;
  border-radius: 8px;
  overflow: hidden;
}
`;
