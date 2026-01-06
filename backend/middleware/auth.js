// Remove your custom requireAuth and getUserInfo
// Keep devBypassAuth if needed

import clerkClient from "@clerk/clerk-sdk-node"; // if you still want to fetch extra user data
import { requireAuth as clerkRequireAuth, getAuth } from "@clerk/express";

// Use Clerk's strict auth (returns 401 if not authenticated)
export const requireAuth = clerkRequireAuth();

// Optional: Middleware to fetch extra user info (if you need name/email/image beyond req.auth)
export const getUserInfo = async (req, res, next) => {
  const { userId } = getAuth(req); // or req.auth.userId
  if (!userId) return next(); // should not reach here if requireAuth is before

  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    req.userName =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      clerkUser.username ||
      "User";
    req.userEmail = clerkUser.primaryEmailAddress?.emailAddress || "<no-email>";
    req.userImage = clerkUser.imageUrl;
    next();
  } catch (error) {
    console.error("Failed to fetch Clerk user:", error);
    next();
  }
};

// Development bypass (only applied when condition met in router)
const devBypassAuth = (req, res, next) => {
  req.userId = process.env.DEV_USER_ID || "dev-user-123";
  req.userEmail = "dev@example.com";
  req.userName = "Dev User";

  console.log("🔓 DEV BYPASS ACTIVE: Fake user injected ->", req.userId);

  next();
};

export { devBypassAuth };

