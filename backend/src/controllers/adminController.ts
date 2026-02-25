import { Request, Response } from 'express';
import axios from 'axios';

const getSupabase = () => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || '';
  return axios.create({
    baseURL: `${url}/rest/v1`,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  });
};

export const deleteAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const auctionId = Number(req.params.id);
    if (Number.isNaN(auctionId)) {
      res.status(400).json({ error: 'Invalid auction id' });
      return;
    }

    const supabase = getSupabase();

    const existing = await supabase.get(`/auctions?id=eq.${auctionId}&select=id`);
    const rows = existing.data as Array<{ id: number }>;
    if (!rows || rows.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    await supabase.delete(`/auctions?id=eq.${auctionId}`);
    res.json({ message: 'Auction deleted successfully', id: auctionId });
  } catch (err: any) {
    console.error('deleteAuction error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while deleting auction' });
  }
};

export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    if (req.user?.id === userId) {
      res.status(400).json({ error: 'Admin cannot ban themselves' });
      return;
    }

    const banStatusRaw = req.body?.banStatus;
    const banStatus = typeof banStatusRaw === 'boolean' ? banStatusRaw : true;

    const supabase = getSupabase();
    const response = await supabase.patch(
      `/users?id=eq.${userId}`,
      { banned: banStatus },
      { headers: { Prefer: 'return=representation' } },
    );

    const updated = response.data as Array<{ id: number; banned: boolean }>;
    if (!updated || updated.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: banStatus ? 'User banned successfully' : 'User unbanned successfully',
      user: {
        id: updated[0].id,
        is_banned: updated[0].banned,
      },
    });
  } catch (err: any) {
    console.error('banUser error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while updating user ban status' });
  }
};

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const response = await supabase.get('/users?select=id,username,email,role,banned,created_at&order=created_at.desc');

    const users = (response.data as any[]).map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      banned: !!user.banned,
      is_banned: !!user.banned,
      created_at: user.created_at,
    }));

    res.json(users);
  } catch (err: any) {
    console.error('getAllUsers error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
};

export const getAllAuctionsAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();
    const auctionsResponse = await supabase.get('/auctions?select=*&order=created_at.desc');
    const auctions = auctionsResponse.data as any[];

    const sellerIds = [...new Set(auctions.map((auction) => auction.creator_id).filter(Boolean))];
    let sellerNameById = new Map<number, string>();

    if (sellerIds.length > 0) {
      const usersResponse = await supabase.get(`/users?id=in.(${sellerIds.join(',')})&select=id,username`);
      const users = usersResponse.data as Array<{ id: number; username: string }>;
      sellerNameById = new Map(users.map((user) => [user.id, user.username]));
    }

    const enriched = auctions.map((auction) => ({
      ...auction,
      seller_id: auction.creator_id,
      seller_name: sellerNameById.get(auction.creator_id) || 'Unknown',
      end_date: auction.end_time,
    }));

    res.json(enriched);
  } catch (err: any) {
    console.error('getAllAuctionsAdmin error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching auctions' });
  }
};

export const getAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getSupabase();

    const [usersRes, auctionsRes, bidsRes] = await Promise.all([
      supabase.get('/users?select=id,role,banned'),
      supabase.get('/auctions?select=id,status,current_price'),
      supabase.get('/bids?select=id,auction_id,bidder_id,amount'),
    ]);

    const users = usersRes.data as any[];
    const auctions = auctionsRes.data as any[];
    const bids = bidsRes.data as any[];

    const activeAuctions = auctions.filter((auction) => auction.status === 'ACTIVE').length;
    const totalVolume = bids.reduce((sum, bid) => sum + Number(bid.amount || 0), 0);

    const bidsPerUser = new Map<number, number>();
    for (const bid of bids) {
      const bidderId = Number(bid.bidder_id);
      bidsPerUser.set(bidderId, (bidsPerUser.get(bidderId) || 0) + 1);
    }

    const topUsers = Array.from(bidsPerUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, bidsCount]) => ({ user_id: userId, bids_count: bidsCount }));

    res.json({
      total_users: users.length,
      banned_users: users.filter((user) => !!user.banned).length,
      total_auctions: auctions.length,
      active_auctions: activeAuctions,
      total_bids: bids.length,
      total_volume: totalVolume,
      top_users: topUsers,
    });
  } catch (err: any) {
    console.error('getAnalytics error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching analytics' });
  }
};
