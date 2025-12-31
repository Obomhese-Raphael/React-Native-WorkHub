import dotenv from "dotenv";
import express from "express";
import teamController from "../controllers/teamController.js"; // Import the entire object
import { devBypassAuth, getUserInfo, requireAuth } from "../middleware/auth.js";
dotenv.config(); // ← Move this RIGHT AFTER the dotenv import

const teamsRouter = express.Router(); 

if (process.env.NODE_ENV === "development" && process.env.BYPASS_AUTH === "true") {
  teamsRouter.use(devBypassAuth);
  console.log("🔓 Development auth bypass ENABLED");
} else if (process.env.BYPASS_AUTH === "false") { 
  teamsRouter.use(requireAuth); 
  teamsRouter.use(getUserInfo);
  console.log("🔒 Real Clerk auth ENABLED (production mode or bypass off)");
} else {
  throw new Error("BYPASS_AUTH environment variable must be set to 'true' or 'false'"); 
}
 
teamsRouter.post("/create-team", teamController.createTeam); // Notice the change here
teamsRouter.get("/all-teams", teamController.getAllTeams);
teamsRouter.get("/search", teamController.searchTeams);
teamsRouter.get("/:id", teamController.getTeamById);
teamsRouter.put("/:id", teamController.updateTeam);
teamsRouter.delete("/:id", teamController.deleteTeam); // Fix the route path
teamsRouter.delete("/delete-all", teamController.deleteAllTeams);
teamsRouter.put("/:id/add-member", teamController.addMember);
teamsRouter.put("/:id/:memberId", teamController.deleteMember); // Fix the route path

export default teamsRouter;
