import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Auction {
  id: number;
  title: string;
  description: string;
  start_price: number;
  current_price: number;
  min_increment: number;
  end_time: string;
  status: string;
}

export const getAuctions = async (): Promise<Auction[]> => {
  const res = await axios.get(`${API}/api/auctions`);
  return res.data?.auctions || [];
};

export const getAuctionById = async (id: number): Promise<Auction> => {
  const res = await axios.get(`${API}/api/auctions/${id}`);
  return res.data?.auction || res.data;
};
