import React, { useState, useEffect } from 'react';
import './AdminAuctionsList.css';

interface Auction {
  id: number;
  title: string;
  description: string;
  start_price: number;
  current_price: number;
  end_date: string;
  status: string;
  seller_id: number;
  seller_name: string;
  created_at: string;
}

const AdminAuctionsList: React.FC<{ token: string }> = ({ token }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/auctions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }

      const data = await response.json();
      setAuctions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = async (auctionId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete auction');
      }

      setAuctions(auctions.filter(a => a.id !== auctionId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return <div className="admin-auctions"><p>Loading...</p></div>;

  return (
    <div className="admin-auctions">
      <h1>Admin Auctions Management</h1>

      {error && <div className="error-message">{error}</div>}

      <table className="auctions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Seller</th>
            <th>Start Price</th>
            <th>Current Price</th>
            <th>Status</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map(auction => (
            <tr key={auction.id} className={`status-${auction.status}`}>
              <td>{auction.id}</td>
              <td>
                <div className="auction-title">{auction.title.substring(0, 30)}...</div>
                <div className="auction-description">{auction.description?.substring(0, 50)}...</div>
              </td>
              <td>{auction.seller_name}</td>
              <td>${auction.start_price.toFixed(2)}</td>
              <td className="current-price">${auction.current_price?.toFixed(2) || 'N/A'}</td>
              <td>
                <span className={`status-badge ${auction.status}`}>
                  {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                </span>
              </td>
              <td>{new Date(auction.end_date).toLocaleDateString()}</td>
              <td>
                {deleteConfirm === auction.id ? (
                  <div className="confirm-delete">
                    <button
                      className="confirm-btn"
                      onClick={() => handleDeleteAuction(auction.id)}
                    >
                      Confirm
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="delete-btn"
                    onClick={() => setDeleteConfirm(auction.id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {auctions.length === 0 && !loading && (
        <div className="empty-state">
          <p>No auctions found</p>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionsList;
