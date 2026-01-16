import { clerkClient } from '@clerk/express';

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Fetch fresh user data
    const updatedUser = await clerkClient.users.getUser(userId);

    res.json({
      success: true,
      message: "Avatar fetched successfully",
      data: {
        imageUrl: updatedUser.imageUrl,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    });
  } catch (error) {
    console.error("Avatar fetch error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch avatar" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // This creates and sends the password reset token/email via Clerk
    await clerkClient.users.createPasswordResetToken(userId);

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent. Check your inbox (including spam/junk folder).'
    });
  } catch (error) {
    console.error('Password reset error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email. Please try again later.'
    });
  }
};