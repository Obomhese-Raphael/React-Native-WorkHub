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

// Search projects
projectRouter.get("/search", requireAuth, getUserInfo, searchProjects);

export default projectRouter;
