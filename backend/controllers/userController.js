// Update or upload user avatar (Clerk handles storage)
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Clerk already processed the upload via the frontend fetch to api.clerk.dev
    // Here we can do any post-processing (e.g. update metadata, log, refresh cache)

    // Optional: Fetch fresh user data to return updated info
    const updatedUser = await clerkClient.users.getUser(userId);

    res.json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        imageUrl: updatedUser.imageUrl,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    res.status(500).json({ success: false, error: "Failed to update avatar" });
  }
};