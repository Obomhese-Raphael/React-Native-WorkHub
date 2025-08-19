// backend/server.js
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import teamsRouter from "./routes/team.js";
import projectRouter from "./routes/project.js";
import taskRouter from "./routes/task.js";

const app = express();
const PORT = 3000

app.use(cors());
app.use(express.json());

// Routes
app.use("/projects", projectRouter);
app.use("/tasks", taskRouter);
app.use("/teams", teamsRouter);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

// ✅ Export for Vercel
export default app;
