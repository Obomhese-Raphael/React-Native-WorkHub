import dotenv from "dotenv";
import express from "express";
import teamController from "../controllers/teamController.js";
import { devBypassAuth, getUserInfo, requireAuth } from "../middleware/auth.js";

dotenv.config();

const teamsRouter = express.Router();

// Auth middleware
if (process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
  teamsRouter.use(devBypassAuth);
  console.log("🔓 Development auth bypass ENABLED");
} else {
  teamsRouter.use(requireAuth);
  teamsRouter.use(getUserInfo);
  console.log("🔒 Real Clerk auth ENABLED");
}

// Routes
// Create team
teamsRouter.post("/", teamController.createTeam);
// Get all teams
teamsRouter.get("/", teamController.getAllTeams);
// Search teams
teamsRouter.get("/search", teamController.searchTeams);
// Get team by ID
teamsRouter.get("/:id", teamController.getTeamById);
// Update team
teamsRouter.put("/:id", teamController.updateTeam);
// Delete team
teamsRouter.delete("/:id", teamController.deleteTeam);
// Add member
teamsRouter.put("/:id/add-member", teamController.addMember);
// Remove member by email (most user-friendly)
teamsRouter.delete("/:id/members/:email", teamController.deleteMember);

export default teamsRouter;