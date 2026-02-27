import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev_jwt_secret';

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

interface DecodedToken {
  id: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as DecodedToken;
    
    // Check if user is banned
    const supabase = getSupabase();
    try {
      const userResponse = await supabase.get(`/users?id=eq.${decoded.id}&select=banned`);
      const user = (userResponse.data as any[])?.[0];
      
      if (user?.banned) {
        return res.status(403).json({ error: 'Your account has been banned' });
      }
    } catch (err) {
      console.error('Error checking user ban status:', err);
      // Continue anyway to not break service on DB error
    }
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No user authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};
