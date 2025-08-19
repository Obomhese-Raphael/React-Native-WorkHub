// PAST ONE THAT WAS WORKING - AUTH.JS

// middleware/auth.js

import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Middleware to require authentication.
// This uses Clerk's built-in middleware to validate the incoming request's
// authentication token.
const requireAuth = ClerkExpressRequireAuth({
  // Clerk will automatically validate the token and set req.auth
  // based on its contents.
});

// Middleware to extract specific user information from the Clerk token's claims.
// This should be run after `requireAuth`.
const getUserInfo = (req, res, next) => {
  try {
    // After ClerkExpressRequireAuth runs, user information is available in req.auth.
    if (req.auth && req.auth.userId) {
      req.userId = req.auth.userId;
      // Use optional chaining to safely access nested properties.
      req.userEmail = req.auth.claims?.email || null;
      req.userName = req.auth.claims?.name || req.auth.claims?.firstName || null;
      
      // Proceed to the next middleware or route handler.
      next();
    } else {
      // If req.auth or userId is missing, it indicates a failure in authentication.
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }
  } catch (error) {
    // Handle any errors that occur during the user info extraction process.
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid authentication token",
    });
  }
};

// Development middleware to bypass authentication (FOR TESTING ONLY).
// This middleware is used to simulate authentication during local development.
const devBypassAuth = (req, res, next) => {
  // Check if the environment is 'development' and if the BYPASS_AUTH flag is true.
  if (
    process.env.NODE_ENV === "development" &&
    process.env.BYPASS_AUTH === "true"
  ) {
    // Set dummy user data for testing.
    req.userId = process.env.DEV_USER_ID || "dev-user-123";
    req.userEmail = "dev@example.com";
    req.userName = "Dev User";

    console.log("🔓 Development: Bypassing authentication for user:", req.userId);
    
    // Proceed to the next middleware or route handler.
    next();
  } else {
    // In a production or non-bypassed environment, use the real authentication flow.
    requireAuth(req, res, (err) => {
      // If authentication fails, pass the error to the Express error handler.
      if (err) {
        return next(err);
      }
      // If authentication succeeds, get additional user information.
      getUserInfo(req, res, next);
    });
  }
};

// Export all middleware functions as a single object for easy import.
export { requireAuth, devBypassAuth, getUserInfo } 