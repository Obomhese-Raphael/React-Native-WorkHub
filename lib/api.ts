import { useAuth } from '@clerk/clerk-expo';

const API_BASE_URL = "https://react-native-work-hub-backend.vercel.app/api";

/**
 * Universal API client
 * - Auto fetches Clerk token if inside a React component
 * - Accepts optional token if you already have it
 */
export const api = async (
  endpoint: string,
  token?: string | null,
  options: RequestInit = {}
) => {
  let authToken = token || null;

  // Try to auto-get token if we're in a React/Expo environment
  try {
    const { getToken } = useAuth();
    if (!authToken) {
      authToken = await getToken();
    }
  } catch {
    // useAuth() only works inside React component/hooks
    // If called outside, token must be passed manually
    if (!authToken) {
      throw new Error(
        "Authentication required: pass a token or call inside a component"
      );
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = `HTTP ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
