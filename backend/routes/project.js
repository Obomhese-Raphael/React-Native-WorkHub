import express from "express";
import mongoose from "mongoose";
import {
  addMemberToProject,
  createProject,
  deleteProject,
  getProjectById,
  getProjectsByTeam,
  listProjectMembers,
  removeMemberFromProject,
  searchProjects,
  updateProject,
  updateProjectMemberRole,
} from "../controllers/projectController.js";

import { getUserInfo, requireAuth } from "../middleware/auth.js";
import projectModel from "../models/Project.js";

const projectRouter = express.Router();

// ====================
// Projects Routes
// ====================

// Create a new project under a team
projectRouter.post(
  "/team/:teamId",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { teamId } = req.params;
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, error: "Invalid team ID" });
    }
    next();
  },
  createProject
);

// Search projects
projectRouter.get("/search", requireAuth, getUserInfo, searchProjects);

projectRouter.get("/", requireAuth, getUserInfo, async (req, res) => {
  try {
    const userId = req.userId;

    // Step 1: Find all teams the user has access to
    const userTeams = await teamModel.find({
      $or: [
        { createdBy: userId },                    // User is owner
        { "members.userId": userId },             // User is a member
      ],
      isActive: true,
    }).select("_id");

    if (userTeams.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const teamIds = userTeams.map(t => t._id);

    // Step 2: Find all active projects in those teams
    const projects = await projectModel.find({
      teamId: { $in: teamIds },
      isActive: true,
    }).select("_id name").sort({ createdAt: -1 }); // Optional: newest first

    res.json({ success: true, data: projects });
  } catch (err) {
    console.error("Error fetching user projects:", err);
    res.status(500).json({ success: false, error: "Failed to fetch projects" });
  }
});

// Get all projects by team
projectRouter.get(
  "/team/:teamId",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { teamId } = req.params;
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, error: "Invalid team ID" });
    }
    next();
  },
  getProjectsByTeam
);

// Get project by ID
projectRouter.get(
  "/:projectId",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  getProjectById
);

// Update project
projectRouter.put(
  "/:projectId",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  updateProject
);

// Delete project
projectRouter.delete(
  "/:projectId",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  deleteProject
);

// Add project member
projectRouter.post(
  "/:projectId/members",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  addMemberToProject
);

// Remove project member
projectRouter.delete(
  "/:projectId/members",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  removeMemberFromProject
);

// Update member role
projectRouter.patch(
  "/:projectId/members/role",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  updateProjectMemberRole
);

// List project members
projectRouter.get(
  "/:projectId/members",
  requireAuth,
  getUserInfo,
  async (req, res, next) => {
    const { projectId } = req.params;
    if (!mongoose.isValidObjectId(projectId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid project ID" });
    }
    next();
  },
  listProjectMembers
);


export default projectRouter;
