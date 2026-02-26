import { useEffect, useState } from 'react';
import { getBidHistory } from '../services/bidService';

interface Bid {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  created_at: string;
}

interface Props {
  auctionId: number;
  refresh?: number;
}

export default function BidHistory({ auctionId, refresh }: Props) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBids();
  }, [auctionId, refresh]);

  const loadBids = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBidHistory(auctionId);
      setBids(data || []);
    } catch {
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bid-history glass">
      <h3 className="bid-history-heading">Bid History</h3>

      {loading && (
        <div className="bid-history-empty">
          <div className="loading-spinner" style={{ width: 28, height: 28 }} />
        </div>
      )}

      {error && <div className="bid-msg bid-msg-error">{error}</div>}

      {!loading && bids.length === 0 && (
        <div className="bid-history-empty">No bids yet — be the first!</div>
      )}

      {!loading && bids.length > 0 && (
        <div className="bid-history-list">
          {bids.map((b, i) => (
            <div key={b.id} className={`bid-row${i === 0 ? ' bid-row-latest' : ''}`}>
              <div className="bid-row-left">
                <span className="bid-row-avatar">{(b.username || 'U')[0].toUpperCase()}</span>
                <div>
                  <div className="bid-row-name">{b.username || `User ${b.user_id}`}</div>
                  <div className="bid-row-time">{new Date(b.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="bid-row-amount">${b.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
