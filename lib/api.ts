const API_BASE_URL = "https://react-native-work-hub-backend.vercel.app/api";

/**
 * Utility to wait for a specific amount of time
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Universal API client for WorkHub
 * @param endpoint - The API path (e.g., '/tasks/123')
 * @param token - The Clerk JWT token (required)
 * @param options - Standard fetch options
 * @param retries - Internal tracker for 429 retries
 */
export const api = async (
  endpoint: string,
  token: string | null,
  options: RequestInit = {},
  retries = 2
): Promise<any> => {
  // 1. Validate Token
  if (!token) {
    console.error("API Call blocked: No token provided for", endpoint);
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    // 2. Handle Rate Limiting (429)
    if (response.status === 429 && retries > 0) {
      const waitTime = (3 - retries) * 1500; // Wait 1.5s, then 3s
      console.warn(`Rate limited (429). Retrying in ${waitTime}ms...`);
      await delay(waitTime);
      return api(endpoint, token, options, retries - 1);
    }

    // 3. Handle Other Errors
    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP Error ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // 4. Return Data
    return await response.json();
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};