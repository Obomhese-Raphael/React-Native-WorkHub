// lib/api.ts
const API_BASE_URL = "https://react-native-work-hub-backend.vercel.app/api";

// Pure API client — no hooks here
export const api = async (
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
) => {
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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