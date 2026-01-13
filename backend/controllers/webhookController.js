import { Webhook } from "svix";
import teamModel from "../models/Team.js";

export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Missing Webhook Secret" });
  }

  // Verify the headers from Clerk
  const payload = req.body;
  const headers = req.headers;
  const wh = new Webhook(WEBHOOK_SECRET);

  // Verify the webhook signature
  console.log("Verifying Clerk webhook...");
  console.log("Payload:", payload.toString());
  console.log("Headers:", headers);

  // Verify the webhook secret
  console.log("Verifying Clerk webhook...");
  console.log("Webhook Secret:", WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    return res.status(400).json({
      error: "Invalid signature",
    });
  }

  // Handle the event
  const { id } = evt.data;
  const eventType = evt.type;

  // Inside handleClerkWebhook function
  if (eventType === "user.created") {
    const { email_addresses, public_metadata, first_name, last_name, id } =
      evt.data;
    const email = email_addresses[0]?.email_address;
    const { pendingTeamId, pendingRole } = public_metadata;

    if (pendingTeamId && email) {
      try {
        // Use $addToSet instead of $push → makes it idempotent (no duplicates)
        const updatedTeam = await teamModel.findByIdAndUpdate(
          pendingTeamId,
          {
            $addToSet: {
              members: {
                userId: id,
                name:
                  `${first_name || ""} ${last_name || ""}`.trim() ||
                  "New Member",
                email: email,
                role: pendingRole || "member",
                joinedAt: new Date(),
              },
            },
          },
          { new: true } // optional: returns updated doc
        );

        if (updatedTeam) {
          console.log(
            `🟢 User ${id} added (or already present) to team ${pendingTeamId}`
          );
        } else {
          console.log(`Team ${pendingTeamId} not found during webhook sync`);
        }
      } catch (err) {
        console.error("🔴 Failed to sync user to team via webhook:", err);
      }
    }
  }

  res.status(200).json({ success: true });
};
