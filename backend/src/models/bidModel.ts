import axios from 'axios';

export interface Bid {
  id: number;
  auction_id: number;
  user_id: number;
  amount: number;
  created_at: string;
}

// Lazy getter — reads env vars at call time (after dotenv loaded in index.ts)
const getSupabase = () => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || '';
  return axios.create({
    baseURL: `${url}/rest/v1`,
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
  });
};

export const createBid = async (auctionId: number, userId: number, amount: number): Promise<Bid> => {
  try {
    const supabase = getSupabase();
    const response = await supabase.post('/bids', {
      auction_id: auctionId,
      user_id: userId,
      amount,
    }, {
      headers: { Prefer: 'return=representation' },
    });
    const data = response.data as any;
    return Array.isArray(data) ? data[0] : data;
  } catch (err: any) {
    console.error('createBid error:', err.message, err.response?.data);
    throw err;
  }
};

export const getHighestBid = async (auctionId: number): Promise<Bid | null> => {
  try {
    const supabase = getSupabase();
    const response = await supabase.get(`/bids?auction_id=eq.${auctionId}&order=amount.desc&limit=1`);
    const data = response.data as Bid[];
    return data && data.length > 0 ? data[0] : null;
  } catch (err: any) {
    console.error('getHighestBid error:', err.message, err.response?.data);
    return null;
  }
};

export const getBidsByAuction = async (auctionId: number): Promise<Bid[]> => {
  try {
    const supabase = getSupabase();
    const response = await supabase.get(`/bids?auction_id=eq.${auctionId}&order=created_at.desc`);
    return response.data as Bid[];
  } catch (err: any) {
    console.error('getBidsByAuction error:', err.message, err.response?.data);
    return [];
  }
};

export const getBidsForAuctionWithUserInfo = async (auctionId: number) => {
  try {
    const supabase = getSupabase();
    const response = await supabase.get(
      `/bids?auction_id=eq.${auctionId}&select=*,users(id,username)&order=created_at.desc`
    );
    return response.data;
  } catch (err: any) {
    console.error('getBidsForAuctionWithUserInfo error:', err.message, err.response?.data);
    return [];
  }
};
