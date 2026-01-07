// backend/server.js
import dotenv from "dotenv";
dotenv.config();

import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { searchTasks } from "./controllers/taskController.js";
import { getUserInfo, requireAuth } from "./middleware/auth.js";
import projectRouter from "./routes/project.js";
import taskRouter from "./routes/task.js";
import teamsRouter from "./routes/team.js";

const app = express();
const PORT = process.env.PORT || 3000;

// === Prevent compression issues (helps with Clerk token parsing) ===
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("Content-Encoding", "identity");
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(clerkMiddleware());

// === Global MongoDB Connection with Reuse (Vercel-safe) ===
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && cachedConnection.readyState === 1) {
    console.log("🔵 Reusing existing MongoDB connection");
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is missing in env");
  }

  console.log("🟡 Connecting to MongoDB...");

  try {
    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Longer wait for cold starts
      socketTimeoutMS: 45000,
      maxPoolSize: 10,                 // Good for serverless
    });

    console.log("🟢 Connected to MongoDB successfully");
    return cachedConnection;
  } catch (err) {
    console.error("🔴 MongoDB connection failed:", err.message);
    throw err;
  }
}

// Start connection early so it's ready for requests
connectDB().catch(err => console.error("Initial DB connect failed:", err));

// Routes (must come after middleware)
app.use("/api/projects", projectRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/teams", teamsRouter);
app.get("/api/tasks/search", requireAuth, getUserInfo, searchTasks);

app.get("/api/debug-auth", (req, res) => {
  res.json({
    message: "Auth debug",
    userId: req.auth?.userId || null,
    auth: req.auth || null,
  });
});

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Export for Vercel
export default app;