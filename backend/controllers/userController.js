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