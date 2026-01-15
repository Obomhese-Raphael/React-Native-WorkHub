import { clerkClient } from "@clerk/clerk-sdk-node";
import FormData from "form-data";
import multer from "multer";
import fetch from "node-fetch";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    console.log("Avatar upload request received");

    await runMiddleware(req, res, upload.single("avatar"));

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.replace("Bearer ", "");
    
    let userId;
    try {
      const sessionClaims = await clerkClient.verifyToken(token);
      userId = sessionClaims.sub;
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log("File received:", req.file.originalname, req.file.size);

    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: "avatar.jpg",
      contentType: req.file.mimetype,
    });

    const clerkResponse = await fetch(
      `https://api.clerk.com/v1/users/${userId}/profile_image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    if (!clerkResponse.ok) {
      const errorText = await clerkResponse.text();
      console.error("Clerk API error:", errorText);
      return res.status(500).json({ 
        success: false, 
        error: `Clerk upload failed: ${clerkResponse.statusText}` 
      });
    }

    const updatedUser = await clerkClient.users.getUser(userId);

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        imageUrl: updatedUser.imageUrl,
      },
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to update avatar" 
    });
  }
}