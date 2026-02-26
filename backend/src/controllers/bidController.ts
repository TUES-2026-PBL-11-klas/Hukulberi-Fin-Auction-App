import { Request, Response } from 'express';
import { createBid, getHighestBid, getBidsForAuctionWithUserInfo } from '../models/bidModel';
import axios from 'axios';

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

export const placeBid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auction_id, amount } = req.body;
    const userId = req.user?.id;
    const bidAmount = Number(amount);

    if (!auction_id || !amount) {
      res.status(400).json({ error: 'auction_id and amount are required' });
      return;
    }

    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      res.status(400).json({ error: 'amount must be a positive number' });
      return;
    }

    if (bidAmount > 99_999_999.99) {
      res.status(400).json({ error: 'Bid amount is too large (max $99,999,999.99)' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const supabase = getSupabase();

    const auctionResponse = await supabase.get(`/auctions?id=eq.${auction_id}`);
    const auctions = auctionResponse.data as any[];

    if (!auctions || auctions.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    const auction = auctions[0];

    if (auction.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Auction is not active' });
      return;
    }

    const endTime = new Date(auction.end_time);
    const now = new Date();

    if (endTime <= now) {
      res.status(400).json({ error: 'Auction has ended' });
      return;
    }

    const minAllowedBid = Number(auction.current_price) + Number(auction.min_increment || 0);
    if (bidAmount < minAllowedBid) {
      res.status(400).json({
        error: `Bid amount must be at least ${minAllowedBid}`,
        currentPrice: auction.current_price,
        minIncrement: auction.min_increment || 0,
      });
      return;
    }

    if (auction.creator_id === userId) {
      res.status(400).json({ error: 'Cannot bid on your own auction' });
      return;
    }

    const newBid = await createBid(auction_id, userId, bidAmount);

    try {
      await supabase.patch(`/auctions?id=eq.${auction_id}`, {
        current_price: bidAmount,
      });
    } catch (err) {
      console.error('Error updating auction price:', err);
    }

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        id: newBid.id,
        auction_id: newBid.auction_id,
        user_id: (newBid as any).bidder_id,
        amount: newBid.amount,
        created_at: newBid.created_at,
      },
    });
  } catch (err: any) {
    console.error('placeBid error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while placing bid' });
  }
};

export const getBidHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params;

    if (!auctionId || Array.isArray(auctionId)) {
      res.status(400).json({ error: 'auction_id is required' });
      return;
    }

    const supabase = getSupabase();
    const auctionResponse = await supabase.get(`/auctions?id=eq.${auctionId}`);
    const auctions = auctionResponse.data as any[];

    if (!auctions || auctions.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    const bids: any[] = await getBidsForAuctionWithUserInfo(parseInt(auctionId));

    res.json({
      auction_id: parseInt(auctionId),
      bids_count: bids.length,
      bids: bids.map((bid: any) => ({
        id: bid.id,
        user_id: bid.bidder_id ?? bid.user_id,
        username: bid.username || 'Unknown',
        amount: bid.amount,
        created_at: bid.created_at,
      })),
    });
  } catch (err: any) {
    console.error('getBidHistory error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching bid history' });
  }
};

export const getHighestBidHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params;

    if (!auctionId || Array.isArray(auctionId)) {
      res.status(400).json({ error: 'auction_id is required' });
      return;
    }

    const supabase = getSupabase();
    const auctionResponse = await supabase.get(`/auctions?id=eq.${auctionId}`);
    const auctions = auctionResponse.data as any[];

    if (!auctions || auctions.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    const highestBid = await getHighestBid(parseInt(auctionId));

    if (!highestBid) {
      res.json({
        auction_id: parseInt(auctionId),
        highest_bid: null,
        message: 'No bids yet',
      });
      return;
    }

    res.json({
      auction_id: parseInt(auctionId),
      highest_bid: {
        id: highestBid.id,
        user_id: (highestBid as any).bidder_id,
        amount: highestBid.amount,
        created_at: highestBid.created_at,
      },
    });
  } catch (err: any) {
    console.error('getHighestBidHandler error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching highest bid' });
  }
};
