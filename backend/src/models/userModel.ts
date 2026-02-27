import axios from 'axios';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  banned?: boolean;
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

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const supabase = getSupabase();
    const encodedEmail = encodeURIComponent(email);
    const response = await supabase.get(`/users?email=eq.${encodedEmail}`);
    const data = response.data as any[];
    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (err: any) {
    console.error('getUserByEmail error:', err.message, err.response?.data);
    return null;
  }
};

export const createUser = async (username: string, email: string, passwordHash: string): Promise<User> => {
  try {
    const supabase = getSupabase();
    const response = await supabase.post('/users', {
      username,
      email,
      password_hash: passwordHash,
      role: 'user',
    }, {
      headers: { Prefer: 'return=representation' },
    });
    const data = response.data as any;
    return Array.isArray(data) ? data[0] : data;
  } catch (err: any) {
    console.error('createUser error:', err.message, err.response?.data);
    throw err;
  }
};
