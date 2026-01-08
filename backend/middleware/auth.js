// Remove your custom requireAuth and getUserInfo
// Keep devBypassAuth if needed

import clerkClient from "@clerk/clerk-sdk-node"; // if you still want to fetch extra user data
import { getAuth } from "@clerk/express";

// Strict auth: returns 401 JSON for API routes (perfect for your use case)
export const requireAuth = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }
  // Optionally attach userId for convenience
  req.userId = auth.userId;
  next();
};

export const getUserInfo = async (req, res, next) => {

  try { 
    if (req.auth && req.auth.userId) {
      req.userId = req.auth.userId;

      const clerkUser = await clerkClient.users.getUser(req.auth.userId);

      // Properly extract name
      req.userName = 
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        clerkUser.username ||
        "User";

      // Properly extract email — use primaryEmailAddress.emailAddress
      req.userEmail = 
        clerkUser.primaryEmailAddress?.emailAddress || 
        clerkUser.emailAddresses[0]?.emailAddress || 
        null; // ← Use null, not "<no-email>"

      req.userImage = clerkUser.imageUrl;

      next();
    } else {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }
  } catch (error) {
    console.error("🔴 Failed to fetch Clerk user info:", error.message);
    return res.status(401).json({
      success: false,
      error: "Invalid authentication",
    });
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

