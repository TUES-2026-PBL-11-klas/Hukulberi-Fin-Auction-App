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
  isBanned?: boolean;
}

export default function BidForm({ auctionId, currentPrice, minIncrement, endTime, token, onBidPlaced, disabled, isBanned }: BidFormProps) {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const minAllowed = Number(currentPrice) + Number(minIncrement);
  const expired = new Date(endTime) <= new Date();
  const isDisabled = disabled || expired || loading || !token || isBanned;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const val = Number(bidAmount);
    if (!Number.isFinite(val) || val <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    if (val > 99_999_999.99) {
      setError('Bid amount is too large (max $99,999,999.99)');
      return;
    }
    if (val < minAllowed) {
      setError(`Minimum allowed bid is $${minAllowed.toFixed(2)}`);
      return;
    }
    if (!token) {
      setError('You must be logged in to place a bid');
      return;
    }

    setLoading(true);
    try {
      await placeBid({ auction_id: auctionId, amount: val }, token);
      setSuccess('Bid placed successfully!');
      setBidAmount('');
      onBidPlaced && onBidPlaced();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = loading
    ? 'Placing…'
    : expired
      ? 'Auction Ended'
      : isBanned
        ? 'Account Banned'
        : !token
          ? 'Sign in to Bid'
          : 'Place Bid';

  return (
    <form onSubmit={submit} className="bid-form">
      <label className="bid-form-label">
        Your bid <span className="bid-form-hint">(min ${minAllowed.toFixed(2)})</span>
      </label>
      <div className="bid-form-row">
        <span className="bid-form-prefix">$</span>
        <input
          type="number"
          step="0.01"
          min={minAllowed}
          max={99999999.99}
          placeholder={minAllowed.toFixed(2)}
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          disabled={isDisabled}
          className="input bid-form-input"
        />
      </div>
      {error && <div className="bid-msg bid-msg-error">{error}</div>}
      {success && <div className="bid-msg bid-msg-success">{success}</div>}
      <button type="submit" disabled={isDisabled} className="btn-primary bid-form-btn">
        {buttonLabel}
      </button>
    </form>
  );
}
