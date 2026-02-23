import { Request, Response } from 'express';
import { createBid, getHighestBid, getBidsForAuctionWithUserInfo } from '../models/bidModel';
import axios from 'axios';

// Lazy getter — reads env vars at call time
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

/**
 * POST /bids - Place a bid on an auction
 * Validates:
 * - Auction exists and is active
 * - Bid amount is greater than current price
 * - Deadline not passed
 * - User is not the auction creator
 */
export const placeBid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { auction_id, amount } = req.body;
    const userId = req.user?.id;

    // Validate input
    if (!auction_id || !amount) {
      res.status(400).json({ error: 'auction_id and amount are required' });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'amount must be a positive number' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const supabase = getSupabase();

    // Get auction details
    const auctionResponse = await supabase.get(`/auctions?id=eq.${auction_id}`);
    const auctions = auctionResponse.data as any[];

    if (!auctions || auctions.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    const auction = auctions[0];

    // Check if auction is active
    if (auction.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Auction is not active' });
      return;
    }

    // Check deadline
    const endTime = new Date(auction.end_time);
    const now = new Date();

    if (endTime <= now) {
      res.status(400).json({ error: 'Auction has ended' });
      return;
    }

    // Check bid amount is greater than current price
    if (amount <= auction.current_price) {
      res.status(400).json({
        error: `Bid amount must be greater than current price (${auction.current_price})`,
        currentPrice: auction.current_price,
      });
      return;
    }

    // Check user is not the creator
    if (auction.creator_id === userId) {
      res.status(400).json({ error: 'Cannot bid on your own auction' });
      return;
    }

    // Create the bid
    const newBid = await createBid(auction_id, userId, amount);

    // Update auction current_price
    try {
      await supabase.patch(`/auctions?id=eq.${auction_id}`, {
        current_price: amount,
      });
    } catch (err) {
      console.error('Error updating auction price:', err);
      // Continue even if update fails
    }

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        id: newBid.id,
        auction_id: newBid.auction_id,
        user_id: newBid.user_id,
        amount: newBid.amount,
        created_at: newBid.created_at,
      },
    });
  } catch (err: any) {
    console.error('placeBid error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while placing bid' });
  }
};

/**
 * GET /bids/auction/:id/history - Get all bids for an auction
 */
export const getBidHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params;

    if (!auctionId || Array.isArray(auctionId)) {
      res.status(400).json({ error: 'auction_id is required' });
      return;
    }

    // Verify auction exists
    const supabase = getSupabase();
    const auctionResponse = await supabase.get(`/auctions?id=eq.${auctionId}`);
    const auctions = auctionResponse.data as any[];

    if (!auctions || auctions.length === 0) {
      res.status(404).json({ error: 'Auction not found' });
      return;
    }

    // Get all bids with user info
    const bids: any[] = await getBidsForAuctionWithUserInfo(parseInt(auctionId));

    res.json({
      auction_id: parseInt(auctionId),
      bids_count: bids.length,
      bids: bids.map((bid: any) => ({
        id: bid.id,
        user_id: bid.user_id,
        username: bid.users?.username || 'Unknown',
        amount: bid.amount,
        created_at: bid.created_at,
      })),
    });
  } catch (err: any) {
    console.error('getBidHistory error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching bid history' });
  }
};

/**
 * GET /bids/auction/:id/highest - Get the highest bid for an auction
 */
export const getHighestBidHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: auctionId } = req.params;

    if (!auctionId || Array.isArray(auctionId)) {
      res.status(400).json({ error: 'auction_id is required' });
      return;
    }

    // Verify auction exists
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
        user_id: highestBid.user_id,
        amount: highestBid.amount,
        created_at: highestBid.created_at,
      },
    });
  } catch (err: any) {
    console.error('getHighestBidHandler error:', err.message, err.response?.data);
    res.status(500).json({ error: 'Server error while fetching highest bid' });
  }
};
