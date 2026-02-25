import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuctions, Auction } from '../services/auctionService';
import './Home.css';

function formatTimeLeft(endTime: string): { text: string; urgent: boolean; ended: boolean } {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { text: 'Ended', urgent: false, ended: true };

  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const urgent = diff < 3600_000;

  if (d > 0) return { text: `${d}d ${h}h ${m}m`, urgent, ended: false };
  if (h > 0) return { text: `${h}h ${m}m ${sec}s`, urgent, ended: false };
  return { text: `${m}m ${sec}s`, urgent, ended: false };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

const ICONS = ['🏆', '💎', '🎨', '⌚', '🏎️', '🎸', '📸', '🖼️', '🪙', '🎯'];
function iconFor(id: number): string {
  return ICONS[id % ICONS.length];
}

type Filter = 'active' | 'closed';


const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [, setTick] = useState(0);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuctions(filter);
      setAuctions(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand">BidMaster</span>
          <div className="navbar-right">
            {user ? (
              <>
                <span className="navbar-user">{user.email}</span>
                <button className="btn-nav" onClick={() => navigate('/create-auction')}>
                  + Create Auction
                </button>
                <button className="btn-nav" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <button className="btn-nav" onClick={() => navigate('/login')}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <h1>Discover &amp; Bid on Unique Items</h1>
        <p>Browse live auctions, place your bids, and win exclusive pieces — all in real time.</p>
      </section>

      <div className="filter-bar">
        <button
          className={`filter-pill${filter === 'active' ? ' active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active Auctions
        </button>
        <button
          className={`filter-pill${filter === 'closed' ? ' active' : ''}`}
          onClick={() => setFilter('closed')}
        >
          Closed
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="state-container">
          <div className="loading-spinner" />
          <p>Loading auctions…</p>
        </div>
      )}

      {!loading && !error && auctions.length === 0 && (
        <div className="state-container">
          <h2>No auctions found</h2>
          <p>{filter === 'active' ? 'Check back soon for new listings!' : 'No closed auctions yet.'}</p>
        </div>
      )}

      {!loading && auctions.length > 0 && (
        <div className="auction-grid">
          {auctions.map((auction) => {
            const timer = formatTimeLeft(auction.end_time);
            const isClosed = auction.status === 'CLOSED' || timer.ended;

            return (
              <article key={auction.id} className="auction-card">
                <div className="auction-card-image">{iconFor(auction.id)}</div>

                <div className="auction-card-body">
                  <h3 className="auction-card-title">{auction.title}</h3>
                  <p className="auction-card-desc">{auction.description}</p>

                  <div className="auction-card-meta">
                    <div>
                      <div className="auction-price-label">Current Bid</div>
                      <div className="auction-price">{formatCurrency(auction.current_price)}</div>
                    </div>
                    <div className="auction-timer">
                      <div className="timer-label">{isClosed ? 'Status' : 'Ends in'}</div>
                      <div
                        className={`timer-value${timer.urgent ? ' urgent' : ''}${timer.ended ? ' ended' : ''}`}
                      >
                        {timer.text}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="auction-card-footer">
                  {isClosed ? (
                    <button className="btn-bid closed" disabled>
                      Auction Closed
                    </button>
                  ) : (
                    <button className="btn-bid" onClick={() => navigate(`/auction/${auction.id}`)}>
                      Place Bid
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
