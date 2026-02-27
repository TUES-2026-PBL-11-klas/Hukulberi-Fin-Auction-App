import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BidForm from '../components/BidForm';
import BidHistory from '../components/BidHistory';
import { getAuctionById } from '../services/auctionService';
import './AuctionDetailPage.css';

interface Props {
  auctionId: number;
  token: string | null;
  onBack?: () => void;
}

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

export default function AuctionDetailPage({ auctionId, token, onBack }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => { fetchAuction(); }, [auctionId]);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchAuction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuctionById(auctionId);
      setAuction(data);
    } catch {
      setError('Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const onBidPlaced = () => {
    setRefresh((r) => r + 1);
    fetchAuction();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) {
    return (
      <div className="detail-page">
        <nav className="navbar"><div className="navbar-inner"><span className="navbar-brand">BidMaster</span></div></nav>
        <div className="detail-state"><div className="loading-spinner" /><p>Loading auction…</p></div>
      </div>
    );
  }
  if (error || !auction) {
    return (
      <div className="detail-page">
        <nav className="navbar"><div className="navbar-inner"><span className="navbar-brand">BidMaster</span></div></nav>
        <div className="detail-state"><p>{error || 'Auction not found'}</p></div>
      </div>
    );
  }

  const timer = formatTimeLeft(auction.end_time);
  const isClosed = auction.status === 'CLOSED' || timer.ended;

  return (
    <div className="detail-page">

      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>BidMaster</span>
          <div className="navbar-right">
            {user ? (
              <>
                <span className="navbar-user">{user.username || user.email}</span>
                <button className="btn-nav" onClick={handleLogout}>Sign Out</button>
              </>
            ) : (
              <button className="btn-nav" onClick={() => navigate('/login')}>Sign In</button>
            )}
          </div>
        </div>
      </nav>

      <div className="detail-wrap">

        <button className="detail-back" onClick={() => onBack && onBack()}>← Back to Auctions</button>

        <div className="detail-top">
          <div className="detail-info glass">
            <h1 className="detail-title">{auction.title}</h1>
            <p className="detail-desc">{auction.description}</p>
          </div>

          <div className="detail-stats">
            <div className="stat-card glass">
              <span className="stat-label">Current Price</span>
              <span className="stat-value stat-price">${auction.current_price.toFixed(2)}</span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">{isClosed ? 'Status' : 'Time Left'}</span>
              <span className={`stat-value${timer.urgent ? ' stat-urgent' : ''}${timer.ended ? ' stat-ended' : ''}`}>
                {timer.text}
              </span>
            </div>
            <div className="stat-card glass">
              <span className="stat-label">Ends At</span>
              <span className="stat-value stat-date">{new Date(auction.end_time).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="detail-bottom">
          <BidHistory auctionId={auctionId} refresh={refresh} />

          <div className="detail-bid-panel glass">
            <h3 className="bid-panel-title">Place a Bid</h3>
            {isClosed ? (
              <div className="bid-panel-closed">This auction has ended.</div>
            ) : user?.banned ? (
              <div className="bid-panel-closed">Your account has been banned and cannot place bids.</div>
            ) : (
              <BidForm
                auctionId={auctionId}
                currentPrice={auction.current_price}
                minIncrement={auction.min_increment}
                endTime={auction.end_time}
                token={token}
                onBidPlaced={onBidPlaced}
                isBanned={user?.banned}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
