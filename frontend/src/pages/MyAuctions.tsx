import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMyAuctions, Auction } from '../services/auctionService';
import './MyAuctions.css';

/* ── helpers ───────────────────────────────────── */

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

type Filter = 'all' | 'active' | 'closed';

/* ── component ─────────────────────────────────── */

const MyAuctions: React.FC = () => {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [allAuctions, setAllAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [, setTick] = useState(0);

  /* fetch all of the user's auctions once */
  const fetchMyAuctions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMyAuctions(token);
      setAllAuctions(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load your auctions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyAuctions();
  }, [fetchMyAuctions]);

  /* tick every second for live countdown */
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* redirect unauthenticated users */
  useEffect(() => {
    if (!authLoading && !token && !user) {
      navigate('/login');
    }
  }, [authLoading, token, user, navigate]);

  /* derived data */
  const filtered = allAuctions.filter((a) => {
    if (filter === 'active') return a.status === 'ACTIVE';
    if (filter === 'closed') return a.status === 'CLOSED';
    return true;
  });

  const activeCount = allAuctions.filter((a) => a.status === 'ACTIVE').length;
  const closedCount = allAuctions.filter((a) => a.status === 'CLOSED').length;
  const totalRevenue = allAuctions.reduce((sum, a) => sum + Number(a.current_price), 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="my-auctions-page">
      {/* ── Navbar (reuse same structure as Home) ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            BidMaster
          </span>
          <div className="navbar-right">
            {user && (
              <>
                <span className="navbar-user">{user.username || user.email}</span>
                <button className="btn-nav" onClick={() => navigate('/create-auction')}>
                  Create Auction
                </button>
                <button className="btn-nav" onClick={() => navigate('/my-auctions')}>
                  My Auctions
                </button>
                <button className="btn-nav" onClick={() => navigate('/my-bids')}>
                  My Bids
                </button>
                <button className="btn-nav" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Header ── */}
      <div className="my-auctions-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Home
        </button>
        <h1>My Auctions</h1>
      </div>
      <p className="my-auctions-subtitle">
        Manage all the auctions you've created — track active bids, review closed results, and create new listings.
      </p>

      {/* ── Stats strip ── */}
      {!loading && !error && (
        <div className="my-auctions-stats">
          <div className="stat-card">
            <div className="stat-value primary">{allAuctions.length}</div>
            <div className="stat-label">Total Auctions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value success">{activeCount}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value warning">{closedCount}</div>
            <div className="stat-label">Closed</div>
          </div>
        </div>
      )}

      {/* ── Filter pills ── */}
      {!loading && !error && allAuctions.length > 0 && (
        <div className="my-auctions-filters">
          <button
            className={`my-filter-pill${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({allAuctions.length})
          </button>
          <button
            className={`my-filter-pill${filter === 'active' ? ' active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`my-filter-pill${filter === 'closed' ? ' active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed ({closedCount})
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && <div className="my-error-banner">{error}</div>}

      {/* ── Loading ── */}
      {loading && (
        <div className="my-auctions-state">
          <div className="my-loading-spinner" />
          <p>Loading your auctions…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && allAuctions.length === 0 && (
        <div className="my-auctions-state">
          <h2>You haven't created any auctions yet</h2>
          <p>Get started by listing your first item — it only takes a minute.</p>
          <button className="btn-create-cta" onClick={() => navigate('/create-auction')}>
            + Create Your First Auction
          </button>
        </div>
      )}

      {/* ── Filtered-empty state ── */}
      {!loading && !error && allAuctions.length > 0 && filtered.length === 0 && (
        <div className="my-auctions-state">
          <h2>No {filter} auctions</h2>
          <p>
            {filter === 'active'
              ? 'All your auctions have ended. Create a new one to get back in the game!'
              : "None of your auctions have closed yet — they're still live!"}
          </p>
        </div>
      )}

      {/* ── Auction grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="my-auctions-grid">
          {filtered.map((auction) => {
            const timer = formatTimeLeft(auction.end_time);
            const isClosed = auction.status === 'CLOSED' || timer.ended;

            return (
              <article key={auction.id} className="my-auction-card">
                {/* Status badge */}
                <span className={`my-auction-badge ${isClosed ? 'closed' : 'active'}`}>
                  {isClosed ? 'Closed' : 'Active'}
                </span>

                <div className="my-auction-card-image">{iconFor(auction.id)}</div>

                <div className="my-auction-card-body">
                  <h3 className="my-auction-card-title">{auction.title}</h3>
                  <p className="my-auction-card-desc">{auction.description}</p>

                  {/* Prices */}
                  <div className="my-auction-prices">
                    <div className="my-price-block">
                      <div className="my-price-label">Start Price</div>
                      <div className="my-price-value start">
                        {formatCurrency(auction.start_price)}
                      </div>
                    </div>
                    <div className="my-price-block">
                      <div className="my-price-label">Current Bid</div>
                      <div className="my-price-value">
                        {formatCurrency(auction.current_price)}
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="my-auction-timer-row">
                    <span className="my-timer-label">
                      {isClosed ? 'Status' : 'Ends in'}
                    </span>
                    <span
                      className={`my-timer-value${timer.urgent ? ' urgent' : ''}${timer.ended ? ' ended' : ''}`}
                    >
                      {timer.text}
                    </span>
                  </div>

                  {/* Winner (closed auctions) */}
                  {isClosed && auction.winner_id && (
                    <div className="my-auction-winner">
                      <span className="winner-icon">🏆</span>
                      Winner: {auction.winner_username || `User #${auction.winner_id}`}
                    </div>
                  )}
                  {isClosed && !auction.winner_id && (
                    <div className="my-auction-winner" style={{ color: 'var(--text-muted)' }}>
                      No bids received
                    </div>
                  )}
                </div>

                <div className="my-auction-card-footer">
                  <button
                    className={`btn-view${isClosed ? ' closed-view' : ''}`}
                    onClick={() => navigate(`/auction/${auction.id}`)}
                  >
                    {isClosed ? 'View Results' : 'View Auction'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAuctions;
