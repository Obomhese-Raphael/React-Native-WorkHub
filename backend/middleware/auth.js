import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Require authentication with error logging
const requireAuth = ClerkExpressRequireAuth({
  onError: (error) => {
    console.error("🔴 Clerk auth error:", error);
  },
});

// Extract user info from authenticated request
const getUserInfo = (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      req.userId = req.auth.userId;
      req.userEmail = req.auth.claims?.email || null;
      req.userName =
        req.auth.claims?.name || req.auth.claims?.firstName || null;
      next();
    } else {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid authentication token",
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

export { devBypassAuth, getUserInfo, requireAuth };

