import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  const res = await axios.post(`${API_URL}/api/auth/login`, data);
  return res.data;
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  const res = await axios.post(`${API_URL}/api/auth/register`, data);
  return res.data;
};
