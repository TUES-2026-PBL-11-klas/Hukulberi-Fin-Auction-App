import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMyBids, MyBidAuction } from '../services/bidService';
import './MyBids.css';

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

const MyBids: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [allBids, setAllBids] = useState<MyBidAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [, setTick] = useState(0);

  const fetchMyBids = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBids(token);
      setAllBids(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load your bids');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyBids();
  }, [fetchMyBids]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token && !user) {
      navigate('/login');
    }
  }, [token, user, navigate]);

  const filtered = allBids.filter((a) => {
    if (filter === 'active') return a.status === 'ACTIVE';
    if (filter === 'closed') return a.status === 'CLOSED';
    return true;
  });

  const activeCount = allBids.filter((a) => a.status === 'ACTIVE').length;
  const closedCount = allBids.filter((a) => a.status === 'CLOSED').length;
  const winningCount = allBids.filter(
    (a) => a.my_highest_bid >= a.current_price
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="my-bids-page">
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

      <div className="my-bids-header">
        <button className="mb-btn-back" onClick={() => navigate('/')}>
          ← Home
        </button>
        <h1>My Bids</h1>
      </div>
      <p className="my-bids-subtitle">
        Track all the auctions you've bid on — see which ones you're winning, review closed results, and stay on top of your bids.
      </p>

      {!loading && !error && (
        <div className="my-bids-stats">
          <div className="mb-stat-card">
            <div className="mb-stat-value primary">{allBids.length}</div>
            <div className="mb-stat-label">Total Bids</div>
          </div>
          <div className="mb-stat-card">
            <div className="mb-stat-value success">{winningCount}</div>
            <div className="mb-stat-label">Winning</div>
          </div>
          <div className="mb-stat-card">
            <div className="mb-stat-value warning">{allBids.length - winningCount}</div>
            <div className="mb-stat-label">Outbid</div>
          </div>
        </div>
      )}

      {!loading && !error && allBids.length > 0 && (
        <div className="my-bids-filters">
          <button
            className={`mb-filter-pill${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({allBids.length})
          </button>
          <button
            className={`mb-filter-pill${filter === 'active' ? ' active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`mb-filter-pill${filter === 'closed' ? ' active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed ({closedCount})
          </button>
        </div>
      )}

      {error && <div className="mb-error-banner">{error}</div>}

      {loading && (
        <div className="my-bids-state">
          <div className="mb-loading-spinner" />
          <p>Loading your bids…</p>
        </div>
      )}

      {!loading && !error && allBids.length === 0 && (
        <div className="my-bids-state">
          <h2>You haven't placed any bids yet</h2>
          <p>Browse active auctions and start bidding to see them here.</p>
          <button className="mb-btn-browse" onClick={() => navigate('/')}>
            Browse Auctions
          </button>
        </div>
      )}

      {!loading && !error && allBids.length > 0 && filtered.length === 0 && (
        <div className="my-bids-state">
          <h2>No {filter} bids</h2>
          <p>
            {filter === 'active'
              ? 'All auctions you bid on have ended.'
              : "The auctions you bid on are still live — check back later!"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="my-bids-grid">
          {filtered.map((auction) => {
            const timer = formatTimeLeft(auction.end_time);
            const isClosed = auction.status === 'CLOSED' || timer.ended;
            const isWinning = auction.my_highest_bid >= auction.current_price;

            let badgeText: string;
            let badgeClass: string;
            if (isClosed) {
              badgeText = isWinning ? 'Won' : 'Lost';
              badgeClass = isWinning ? 'won' : 'lost';
            } else {
              badgeText = isWinning ? 'Winning' : 'Outbid';
              badgeClass = isWinning ? 'winning' : 'outbid';
            }

            return (
              <article key={auction.id} className="mb-card">
                <span className={`mb-badge ${badgeClass}`}>
                  {badgeText}
                </span>

                <div className="mb-card-image">{iconFor(auction.id)}</div>

                <div className="mb-card-body">
                  <h3 className="mb-card-title">{auction.title}</h3>
                  <p className="mb-card-desc">{auction.description}</p>

                  <div className="mb-prices">
                    <div className="mb-price-block">
                      <div className="mb-price-label">Your Highest Bid</div>
                      <div className="mb-price-value highlight">
                        {formatCurrency(auction.my_highest_bid)}
                      </div>
                    </div>
                    <div className="mb-price-block">
                      <div className="mb-price-label">Current Price</div>
                      <div className="mb-price-value">
                        {formatCurrency(auction.current_price)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-info-row">
                    <span className="mb-bid-count">
                      Your Bids: {auction.my_bid_count}
                    </span>
                  </div>

                  <div className="mb-timer-row">
                    <span className="mb-timer-label">
                      {isClosed ? 'Status' : 'Ends in'}
                    </span>
                    <span
                      className={`mb-timer-value${timer.urgent ? ' urgent' : ''}${timer.ended ? ' ended' : ''}`}
                    >
                      {timer.text}
                    </span>
                  </div>
                </div>

                <div className="mb-card-footer">
                  <button
                    className={`mb-btn-view${isClosed ? ' closed-view' : ''}`}
                    onClick={() => navigate(`/auction/${auction.id}`)}
                  >
                    {isClosed
                      ? 'View Results'
                      : isWinning
                        ? 'View Auction'
                        : 'Bid Higher'}
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

export default MyBids;
