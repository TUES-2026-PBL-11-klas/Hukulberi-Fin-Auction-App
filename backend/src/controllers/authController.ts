import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../models/userModel';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'dev_jwt_secret';

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
      { id: newUser.id, email: newUser.email, role: newUser.role },
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
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err: any) {
    console.error('Login error:', err.message, err.response?.data || err);
    res.status(500).json({ error: 'Server error during login' });
  }
};
