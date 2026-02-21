import { Request, Response } from 'express';
import { query } from '../db';

export const deleteAuction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Auction ID is required' });
    }

    const text = 'DELETE FROM auctions WHERE id = $1 RETURNING id';
    const result = await query(text, [parseInt(id)]);
    const success = result.rows.length > 0;
    if (!success) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    res.json({ message: 'Auction deleted successfully' });
  } catch (err) {
    console.error('Error deleting auction:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { banStatus } = req.body;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const text = 'UPDATE users SET is_banned = $1 WHERE id = $2 RETURNING id, username, email, is_banned';
    const result = await query(text, [banStatus, parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${banStatus ? 'banned' : 'unbanned'} successfully`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error banning user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const text = 'SELECT id, username, email, role, is_banned, created_at FROM users ORDER BY created_at DESC';
    const result = await query(text);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllAuctionsAdmin = async (req: Request, res: Response) => {
  try {
    const text = `
      SELECT a.*, u.username as seller_name
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      ORDER BY a.created_at DESC
    `;
    const result = await query(text);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching auctions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const volumeResult = await query('SELECT * FROM total_auction_volume');
    const topUsersResult = await query('SELECT * FROM top_users LIMIT 10');

    res.json({
      volume: volumeResult.rows[0],
      topUsers: topUsersResult.rows
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
