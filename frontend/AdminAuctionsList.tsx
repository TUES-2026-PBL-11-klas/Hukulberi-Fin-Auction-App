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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/auctions`, {
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
      const response = await fetch(`${API_URL}/api/admin/auctions/${auctionId}`, {
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

  const shortText = (value: string | undefined, max: number) => {
    if (!value) return '';
    return value.length > max ? `${value.slice(0, max)}...` : value;
  };

  if (loading) return <div className="admin-auctions"><div className="admin-loader">Loading auctions…</div></div>;

  return (
    <div className="admin-auctions">
      <div className="admin-section-head">
        <h1>Auctions Management</h1>
        <span>{auctions.length} total auctions</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-shell glass">
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
            {auctions.map(auction => {
              const status = String(auction.status || '').toLowerCase();
              return (
                <tr key={auction.id} className={`status-${status}`}>
                  <td>{auction.id}</td>
                  <td>
                    <div className="auction-title">{shortText(auction.title, 30)}</div>
                    <div className="auction-description">{shortText(auction.description, 56)}</div>
                  </td>
                  <td>{auction.seller_name}</td>
                  <td>${auction.start_price.toFixed(2)}</td>
                  <td className="current-price">${auction.current_price?.toFixed(2) || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${status}`}>
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
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
              );
            })}
          </tbody>
        </table>
      </div>

      {auctions.length === 0 && !loading && (
        <div className="empty-state">
          <p>No auctions found</p>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionsList;
