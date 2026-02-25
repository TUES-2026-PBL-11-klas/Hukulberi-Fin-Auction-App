import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  created_at: string;
}

const AdminDashboard: React.FC<{ token: string }> = ({ token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ banStatus: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user ban status');
      }

      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard - User Management</h1>

      {error && <div className="error-message">{error}</div>}

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className={user.is_banned ? 'banned-user' : ''}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
              <td>
                <span className={`status-badge ${user.is_banned ? 'banned' : 'active'}`}>
                  {user.is_banned ? 'Banned' : 'Active'}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className={`ban-btn ${user.is_banned ? 'unban' : 'ban'}`}
                  onClick={() => handleBanUser(user.id, user.is_banned)}
                >
                  {user.is_banned ? 'Unban' : 'Ban'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
