// backend/server.js
import dotenv from "dotenv";
dotenv.config(); // ← Move this RIGHT AFTER the dotenv import

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
const PORT = process.env.PORT;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(clerkMiddleware());

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is missing. Check your .env file.");
}


// Routes
app.use("/api/projects", projectRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/teams", teamsRouter);
app.get("/api/tasks/search", requireAuth, getUserInfo, searchTasks);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Debug route to check if Clerk auth is working
app.get("/api/debug-auth", (req, res) => {
  res.json({
    message: "Auth debug endpoint",
    auth: req.auth || null,
    userId: req.auth?.userId || null,
    sessionClaims: req.auth?.sessionClaims || null,
    headersReceived: {
      authorization: req.headers.authorization ? "Present (Bearer token sent)" : "Missing",
    },
    rawHeaders: req.headers.authorization,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error(err));

// ✅ Export for Vercel
export default app;
