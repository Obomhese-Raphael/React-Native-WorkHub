import express from "express";
import teamController from "../controllers/teamController.js"; // Import the entire object
import { requireAuth, devBypassAuth, getUserInfo } from "../middleware/auth.js";

const teamsRouter = express.Router();

// Apply auth middleware to all routes
// For development, we'll bypass auth
if (
  process.env.NODE_ENV === "development" &&
  process.env.BYPASS_AUTH === "true"
) {
  teamsRouter.use(devBypassAuth);
} else {
  teamsRouter.use(requireAuth);
  teamsRouter.use(getUserInfo);
}

teamsRouter.post("/create-team", teamController.createTeam); // Notice the change here
teamsRouter.get("/all-teams", teamController.getAllTeams);
teamsRouter.get("/search", teamController.searchTeams);
teamsRouter.get("/:id", teamController.getTeamById);
teamsRouter.put("/:id", teamController.updateTeam);
teamsRouter.delete("/:id", teamController.deleteTeam); // Fix the route path
teamsRouter.put("/:id/add-member", teamController.addMember);
teamsRouter.put("/:id/:memberId", teamController.deleteMember); // Fix the route path

export default teamsRouter;
