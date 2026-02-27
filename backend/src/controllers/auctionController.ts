import { Request, Response } from 'express';
import axios from 'axios';

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

interface ValidationError {
  field: string;
  message: string;
}

const collectErrors = (body: Record<string, unknown>): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { title, description, start_price, min_increment, end_time } = body;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Title is required and must be at least 3 characters' });
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  const sp = Number(start_price);
  if (!start_price || isNaN(sp) || sp <= 0) {
    errors.push({ field: 'start_price', message: 'start_price must be a number greater than 0' });
  }

  const mi = Number(min_increment);
  if (!min_increment || isNaN(mi) || mi <= 0) {
    errors.push({ field: 'min_increment', message: 'min_increment must be a number greater than 0' });
  }

  if (!end_time) {
    errors.push({ field: 'end_time', message: 'end_time is required' });
  } else {
    const parsed = new Date(end_time as string);
    if (isNaN(parsed.getTime())) {
      errors.push({ field: 'end_time', message: 'end_time must be a valid ISO date string' });
    } else if (parsed <= new Date()) {
      errors.push({ field: 'end_time', message: 'end_time must be in the future' });
    }
  }

  return errors;
};

export const createAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const creatorId = req.user!.id;

    // Check if user is banned
    const supabase = getSupabase();
    const userResponse = await supabase.get(`/users?id=eq.${creatorId}&select=banned`);
    const userBanned = (userResponse.data as any[])?.[0]?.banned;
    
    if (userBanned) {
      res.status(403).json({ error: 'Your account has been banned and cannot create auctions' });
      return;
    }

    const errors = collectErrors(req.body);
    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    const { title, description, start_price, min_increment, end_time } = req.body;
    const startPrice = Number(start_price);

    const response = await supabase.post(
      '/auctions',
      {
        title: title.trim(),
        description: description.trim(),
        start_price: startPrice,
        current_price: startPrice,
        min_increment: Number(min_increment),
        end_time,
        status: 'ACTIVE',
        creator_id: creatorId,
      },
      { headers: { Prefer: 'return=representation' } },
    );

    const data = Array.isArray(response.data) ? response.data[0] : response.data;
    res.status(201).json(data);
  } catch (err: any) {
    console.error('createAuction error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while creating auction' });
  }
};

/**
 * Close all auctions whose end_time has passed but status is still ACTIVE.
 * Sets status → CLOSED, closed_at → now, and winner_id → highest bidder.
 */
const closeExpiredAuctions = async (): Promise<void> => {
  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();

    // Find active auctions whose end_time has passed
    const { data: expired } = await supabase.get(
      `/auctions?status=eq.ACTIVE&end_time=lte.${now}&select=id`,
    );

    const expiredAuctions = expired as Array<{ id: number }>;
    if (!expiredAuctions || expiredAuctions.length === 0) return;

    for (const auction of expiredAuctions) {
      // Find the highest bid for this auction to determine the winner
      let winnerId: number | null = null;
      try {
        const { data: bids } = await supabase.get(
          `/bids?auction_id=eq.${auction.id}&order=amount.desc&limit=1`,
        );
        const topBid = (bids as any[])?.[0];
        if (topBid) {
          winnerId = topBid.bidder_id;
        }
      } catch {
        // If we can't determine the winner, still close the auction
      }

      try {
        await supabase.patch(`/auctions?id=eq.${auction.id}`, {
          status: 'CLOSED',
          closed_at: now,
          ...(winnerId !== null ? { winner_id: winnerId } : {}),
        });
      } catch (err: any) {
        console.error(`Failed to close auction ${auction.id}:`, err.message);
      }
    }

    console.log(`Closed ${expiredAuctions.length} expired auction(s)`);
  } catch (err: any) {
    console.error('closeExpiredAuctions error:', err.message);
  }
};

export const getAuctions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Close any expired auctions before returning results
    await closeExpiredAuctions();

    const statusParam = (req.query.status as string | undefined)?.toUpperCase();
    const supabase = getSupabase();

    let url: string;

    if (statusParam === 'CLOSED') {
      url = '/auctions?status=eq.CLOSED&order=end_time.desc';
    } else {
      url = '/auctions?status=eq.ACTIVE&order=end_time.asc';
    }

    const response = await supabase.get(url);
    res.json(response.data);
  } catch (err: any) {
    console.error('getAuctions error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching auctions' });
  }
};

export const getAuctionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const auctionId = Number(id);

    if (isNaN(auctionId)) {
      res.status(400).json({ error: 'Invalid auction id' });
      return;
    }

    // Close expired auctions so the returned status is accurate
    await closeExpiredAuctions();

    const supabase = getSupabase();
    const response = await supabase.get(`/auctions?id=eq.${auctionId}`);
    const data = response.data as Auction[];

    if (!data || data.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    res.json(data[0]);
  } catch (err: any) {
    console.error('getAuctionById error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching auction' });
  }
};

export const getMyAuctions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Close expired auctions first so statuses are accurate
    await closeExpiredAuctions();

    const supabase = getSupabase();
    const response = await supabase.get(
      `/auctions?creator_id=eq.${userId}&order=created_at.desc`,
    );

    const auctions = response.data as Auction[];

    const winnerIds = [...new Set(
      auctions.filter((a) => a.winner_id !== null).map((a) => a.winner_id!),
    )];

    let winnerMap: Record<number, string> = {};
    if (winnerIds.length > 0) {
      try {
        const ids = winnerIds.map((id) => `id.eq.${id}`).join(',');
        const usersRes = await supabase.get(
          `/users?or=(${ids})&select=id,username,email`,
        );
        const users = usersRes.data as Array<{ id: number; username?: string; email: string }>;
        for (const u of users) {
          winnerMap[u.id] = u.username || u.email;
        }
      } catch {
      }
    }

    const enriched = auctions.map((a) => ({
      ...a,
      winner_username: a.winner_id ? winnerMap[a.winner_id] || null : null,
    }));

    res.json(enriched);
  } catch (err: any) {
    console.error('getMyAuctions error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching your auctions' });
  }
};
