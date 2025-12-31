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
teamsRouter.post("/create-team", teamController.createTeam);
teamsRouter.get("/all-teams", teamController.getAllTeams);
teamsRouter.get("/search", teamController.searchTeams);

teamsRouter.get("/:id", teamController.getTeamById);
teamsRouter.put("/:id", teamController.updateTeam);
teamsRouter.delete("/:id", teamController.deleteTeam);

// Add member
teamsRouter.put("/:id/add-member", teamController.addMember);

// Remove member by email (most user-friendly)
teamsRouter.delete("/:id/members/:email", teamController.deleteMember);

// Add project to team
teamsRouter.post("/:id/projects", teamController.addProject);  // ← NEW: Proper RESTful route

// Danger zone (keep behind dev check if needed)
if (process.env.NODE_ENV === "development") {
  teamsRouter.delete("/delete-all", teamController.deleteAllTeams);
}

export default teamsRouter;