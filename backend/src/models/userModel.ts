import { query } from '../db';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
}

export const createUserTable = async () => {
    const text = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    try {
        await query(text);
        console.log('Users table created/verified');
    } catch (err) {
        console.error('Error creating users table:', err);
    }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length > 0) {
        return result.rows[0];
    }
    return null;
};

export const createUser = async (username: string, email: string, passwordHash: string): Promise<User> => {
    const text = 'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING *';
    const result = await query(text, [username, email, passwordHash]);
    return result.rows[0];
};
