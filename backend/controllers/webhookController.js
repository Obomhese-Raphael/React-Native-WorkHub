import { Webhook } from 'svix';
import teamModel from '../models/Team.js';

export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Missing Webhook Secret" });
  }

  // Verify the headers from Clerk
  const payload = req.body;
  const headers = req.headers;
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(payload, headers);
  } catch (err) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle the event
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { email_addresses, public_metadata, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address;
    const { pendingTeamId, pendingRole } = public_metadata;

    if (pendingTeamId) {
      try {
        await teamModel.findByIdAndUpdate(pendingTeamId, {
          $push: {
            members: {
              userId: id, // This is the new Clerk User ID
              name: `${first_name || ''} ${last_name || ''}`.trim() || "New Member",
              email: email,
              role: pendingRole || "member",
              joinedAt: new Date()
            }
          }
        });
        console.log(`🟢 User ${id} automatically added to team ${pendingTeamId}`);
      } catch (err) {
        console.error("🔴 Failed to sync user to team:", err);
      }
    }
  }

  res.status(200).json({ success: true });
};