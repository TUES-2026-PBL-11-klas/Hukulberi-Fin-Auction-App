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

export const getAuctions = async (req: Request, res: Response): Promise<void> => {
  try {
    const statusParam = (req.query.status as string | undefined)?.toUpperCase();
    const supabase = getSupabase();

    let url: string;

    if (statusParam === 'CLOSED') {
      url = '/auctions?status=eq.CLOSED&order=end_time.asc';
    } else {
      const now = new Date().toISOString();
      url = `/auctions?status=eq.ACTIVE&end_time=gt.${now}&order=end_time.asc`;
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
