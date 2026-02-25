import { useState } from 'react';
import { placeBid } from '../services/bidService';

interface BidFormProps {
  auctionId: number;
  currentPrice: number;
  minIncrement: number;
  endTime: string;
  token: string | null;
  onBidPlaced?: () => void;
  disabled?: boolean;
}

export default function BidForm({ auctionId, currentPrice, minIncrement, endTime, token, onBidPlaced, disabled }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const minAllowed = Number(currentPrice) + Number(minIncrement);
  const expired = new Date(endTime) <= new Date();
  const isDisabled = disabled || expired || loading || !token;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const val = Number(bidAmount);
    if (!Number.isFinite(val) || val <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    if (val < minAllowed) {
      setError(`Minimum allowed bid is ${minAllowed.toFixed(2)}`);
      return;
    }
    if (!token) {
      setError('You must be logged in to place a bid');
      return;
    }

    setLoading(true);
    try {
      await placeBid({ auction_id: auctionId, amount: val }, token);
      setSuccess('Bid placed');
      setBidAmount('');
      onBidPlaced && onBidPlaced();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', marginBottom: 4 }}>Your bid (min {minAllowed.toFixed(2)})</label>
        <input type="number" step="0.01" min={minAllowed} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} disabled={isDisabled} style={{ width: '100%', padding: 8 }} />
      </div>
      {error && <div style={{ color: '#c33', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: '#080', marginBottom: 8 }}>{success}</div>}
      <button type="submit" disabled={isDisabled} style={{ padding: '8px 12px' }}>{loading ? 'Placing...' : expired ? 'Auction ended' : token ? 'Place Bid' : 'Login to bid'}</button>
    </form>
  );
}
