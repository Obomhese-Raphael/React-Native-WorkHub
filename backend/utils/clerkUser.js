// utils/clerkUser.js
import { clerkClient } from "@clerk/clerk-sdk-node";

export const getClerkUserDetails = async (userId) => {
  try {
    const user = await clerkClient.users.getUser(userId);

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const name = fullName || user.username || "Unknown User";
    const email =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress || "no-email@workhub.app";

    return { name, email };
  } catch (error) {
    console.error("Failed to fetch Clerk user:", error);
    return { name: "Unknown User", email: "no-email@workhub.app" };
  }
};
