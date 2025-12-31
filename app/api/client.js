// app/api/client.js
import { useAuth } from '@clerk/clerk-expo';

// UPDATED: Use your computer's actual IP address
// Your backend is running on port 3000 (or change if it's different, e.g., 5000)
const BASE_URL = 'http://10.217.212.18:3000';  // ← This is the correct one now!

// Reusable fetch function that always gets a fresh Clerk token
export const apiFetch = async (endpoint, options = {}) => {
  const { getToken } = useAuth();

  // Gets a fresh, valid token every time — no more expiration problems
  const token = await getToken();

  if (!token) {
    throw new Error('Not authenticated — please sign in again');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};