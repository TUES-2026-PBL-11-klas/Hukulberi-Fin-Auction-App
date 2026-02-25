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
    fetch();
  }, [auctionId, refresh]);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBidHistory(auctionId);
      setBids(data || []);
    } catch (err) {
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Bid history</h3>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: '#c33' }}>{error}</div>}
      {!loading && bids.length === 0 && <div>No bids yet</div>}
      {!loading && bids.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Bidder</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Amount</th>
              <th style={{ textAlign: 'right', padding: 8 }}>When</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b, i) => (
              <tr key={b.id} style={{ background: i === 0 ? '#fff8e1' : undefined }}>
                <td style={{ padding: 8 }}>{b.username || `User ${b.user_id}`}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>${b.amount.toFixed(2)}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{new Date(b.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
