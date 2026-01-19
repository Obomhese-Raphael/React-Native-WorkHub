import { clerkClient } from "@clerk/express";
import express from "express";
import { requestPasswordReset, updateAvatar } from "../controllers/userController.js";
import { getUserInfo, requireAuth } from "../middleware/auth.js";

const userRouter = express.Router();

// Protected user routes
userRouter.patch(
  "/avatar",
  requireAuth,
  getUserInfo,
  updateAvatar
);

// Get current notification preferences
userRouter.get("/notifications", requireAuth, getUserInfo, async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.userId);
    const prefs = user.privateMetadata?.notifications || {
      taskAssigned: true,
      dueReminders: true,
      mentions: true,
    };

    res.json({ success: true, notifications: prefs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch preferences" });
  }
});

// Update notification preferences
userRouter.patch('/notifications', requireAuth, getUserInfo, async (req, res) => {
  try {
    const { notifications } = req.body;

    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid notifications object' });
    }

    // Validate allowed keys (security)
    const allowedKeys = ['taskAssigned', 'dueReminders', 'mentions'];
    const validPrefs = {};
    allowedKeys.forEach(key => {
      if (key in notifications && typeof notifications[key] === 'boolean') {
        validPrefs[key] = notifications[key];
      }
    });

    // Update private metadata
    await clerkClient.users.updateUserMetadata(req.userId, {
      privateMetadata: {
        notifications: validPrefs
      }
    });

    res.json({
      success: true,
      message: 'Notification preferences updated',
      notifications: validPrefs
    });
  } catch (error) {
    console.error('Failed to update notifications:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Optional: GET endpoint to fetch current prefs
userRouter.get('/notifications', requireAuth, getUserInfo, async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.userId);
    const prefs = user.privateMetadata?.notifications || {
      taskAssigned: true,
      dueReminders: true,
      mentions: true
    };

    res.json({
      success: true,
      notifications: prefs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch preferences' });
  }
});

userRouter.post("/password-reset", requireAuth, getUserInfo, requestPasswordReset);

export default userRouter;