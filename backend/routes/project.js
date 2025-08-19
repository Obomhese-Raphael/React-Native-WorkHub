// routes/project.js
import express from "express";
import {
  createProject,
  getProjectsByTeam,
  updateProject,
  deleteProject,
  searchProjects,
} from "../controllers/projectController.js";

const projectRouter = express.Router();

// Create a project under a team
projectRouter.post("/:teamId/create", createProject);

// Search for a project by name
projectRouter.get("/search", searchProjects);

// Get all projects for a team
projectRouter.get("/:teamId", getProjectsByTeam);

// Update a project
projectRouter.put("/:projectId", updateProject);

// Delete a project
projectRouter.delete("/:projectId", deleteProject);


export default projectRouter;
