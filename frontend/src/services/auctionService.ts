import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Auction {
  id: number;
  title: string;
  description: string;
  start_price: number;
  current_price: number;
  min_increment: number;
  end_time: string;
  status: 'ACTIVE' | 'CLOSED';
  creator_id: number;
  winner_id: number | null;
  created_at: string;
  closed_at: string | null;
}

// Error handler for auth issues
const handleAuthError = (error: any) => {
  if (error?.response?.status === 403 && error?.response?.data?.error?.includes('banned')) {
    window.dispatchEvent(new CustomEvent('auth-banned'));
  }
  throw error;
};

export const getAuctions = async (status?: string): Promise<Auction[]> => {
  const params = status ? { status } : {};
  const res = await axios.get(`${API_URL}/api/auctions`, { params });
  return res.data;
};

export const getAuctionById = async (id: number): Promise<Auction> => {
  const res = await axios.get(`${API_URL}/api/auctions/${id}`);
  return res.data;
};

export interface CreateAuctionData {
  title: string;
  description: string;
  start_price: number;
  min_increment: number;
  end_time: string; 
}

export const createAuction = async (
  data: CreateAuctionData,
  token: string,
): Promise<Auction> => {
  try {
    const res = await axios.post(`${API_URL}/api/auctions`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    handleAuthError(error);
  }
};
