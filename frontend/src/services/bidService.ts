import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Bid {
  id: number;
  auction_id: number;
  user_id: number;
  username: string;
  amount: number;
  created_at: string;
}

export const placeBid = async (data: { auction_id: number; amount: number }, token: string) => {
  const res = await axios.post(`${API}/api/bids`, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getBidHistory = async (auctionId: number): Promise<Bid[]> => {
  const res = await axios.get(`${API}/api/bids/auction/${auctionId}/history`);
  return res.data?.bids || [];
};

export const getHighestBid = async (auctionId: number) => {
  const res = await axios.get(`${API}/api/bids/auction/${auctionId}/highest`);
  return res.data?.highest_bid || null;
};
