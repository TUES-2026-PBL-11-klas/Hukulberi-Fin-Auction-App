import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { createUser, getUserByEmail } from '../models/userModel';

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

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

const isValidUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 50;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (!isValidUsername(username)) {
      res.status(400).json({ error: 'Username must be 3-50 characters' });
      return;
    }
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await createUser(username, email, hashedPassword);

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role, banned: newUser.banned || false },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (err: any) {
    console.error('Register error:', err.message, err.response?.data || err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, banned: user.banned || false },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err: any) {
    console.error('Login error:', err.message, err.response?.data || err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const supabase = getSupabase();
    const response = await supabase.get(`/users?id=eq.${userId}&select=id,username,email,role,banned`);
    const user = (response.data as any[])?.[0];

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate a fresh token with current user data
    const freshToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role, banned: user.banned || false },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        banned: user.banned || false,
      },
      token: freshToken,
    });
  } catch (err: any) {
    console.error('getCurrentUser error:', err.message, err.response?.data || err);
    res.status(500).json({ error: 'Server error fetching user info' });
  }
};
