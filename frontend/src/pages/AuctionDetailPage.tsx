import { useEffect, useState } from 'react';
import BidForm from '../components/BidForm';
import BidHistory from '../components/BidHistory';
import { getAuctionById } from '../services/auctionService';

interface Props {
  auctionId: number;
  token: string | null;
  onBack?: () => void;
}

export default function AuctionDetailPage({ auctionId, token, onBack }: Props) {
  const [auction, setAuction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetchAuction();
  }, [auctionId]);

  const fetchAuction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuctionById(auctionId);
      setAuction(data);
    } catch (err) {
      setError('Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const onBidPlaced = () => {
    setRefresh((r) => r + 1);
    fetchAuction();
  };

  if (loading) return <div>Loading...</div>;
  if (error || !auction) return <div>{error || 'Auction not found'}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <button onClick={() => onBack && onBack()} style={{ marginBottom: 12 }}>← Back</button>
      <h1>{auction.title}</h1>
      <p style={{ color: '#666' }}>{auction.description}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div>
          <div style={{ padding: 16, background: '#f7f7f7', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Current Price</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#007bff' }}>${auction.current_price.toFixed(2)}</div>
            <div style={{ marginTop: 8, color: '#999' }}>Ends: {new Date(auction.end_time).toLocaleString()}</div>
          </div>

          <BidHistory auctionId={auctionId} refresh={refresh} />
        </div>

        <div>
          <div style={{ padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Place a bid</div>
            <BidForm auctionId={auctionId} currentPrice={auction.current_price} minIncrement={auction.min_increment} endTime={auction.end_time} token={token} onBidPlaced={onBidPlaced} />
          </div>
        </div>
      </div>
    </div>
  );
}
