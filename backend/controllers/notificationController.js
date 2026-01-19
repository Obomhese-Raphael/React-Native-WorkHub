import { clerkClient } from '@clerk/clerk-sdk-node'; // Assuming you have this imported
import { Expo } from 'expo-server-sdk';
import cron from 'node-cron';
import taskModel from '../models/taskModel.js'; // Your task model

const expo = new Expo();

// Function to send push notification
const sendPushNotification = async (pushToken, title, body) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid push token: ${pushToken}`);
    return;
  }

  const message = {
    to: pushToken,
    title,
    body,
    data: { type: 'deadline_reminder' },
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification sent:', ticket);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Scheduled job: Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily deadline reminder check...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
  const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

  // Find tasks due tomorrow
  const tasksDueSoon = await taskModel.find({
    dueDate: { $gte: startOfTomorrow, $lte: endOfTomorrow },
    isActive: true,
  }).populate('assignees');  // Assignees have userId

  for (const task of tasksDueSoon) {
    for (const assignee of task.assignees) {
      try {
        // Fetch user from Clerk and get push token from private metadata
        const clerkUser = await clerkClient.users.getUser(assignee.userId);
        const pushToken = clerkUser.privateMetadata?.pushToken;

        if (pushToken) {
          await sendPushNotification(
            pushToken,
            'Deadline Reminder',
            `Task "${task.title}" is due tomorrow!`
          );
        }
      } catch (error) {
        console.error(`Error fetching Clerk user ${assignee.userId}:`, error);
      }
    }
  }
});

// API to register/update push token in Clerk metadata
export const registerPushToken = async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    // Update Clerk user's private metadata
    await clerkClient.users.updateUser(userId, {
      privateMetadata: { pushToken },  // Overwrites existing metadata; merge if needed
    });

    res.json({ success: true, message: 'Push token registered in Clerk' });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ success: false, error: 'Failed to register token' });
  }
};