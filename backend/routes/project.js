// routes/project.js
import express from "express";
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
import { devBypassAuth, getUserInfo, requireAuth } from "../middleware/auth.js";
import { requireProjectAccess } from "../middleware/projectAccess.js";

const projectRouter = express.Router();

// 1. Auth middleware for the entire router
if (
  process.env.NODE_ENV === "development" &&
  process.env.BYPASS_AUTH === "true"
) {
  projectRouter.use(devBypassAuth);
  console.log("🔓 Development auth bypass ENABLED");
} else {
  projectRouter.use(requireAuth);
  projectRouter.use(getUserInfo);
  console.log("🔒 Real Clerk auth ENABLED");
}

// 2. Routes that do NOT need project access check
projectRouter.post("/teams/:teamId", createProject);
projectRouter.get("/teams/:teamId", getProjectsByTeam);
projectRouter.get("/search", searchProjects);

// 3. Roues that operate on SPECIFIC projects and need access check -> use requireProjectAccess
projectRouter.get("/:projectId", requireProjectAccess, getProjectById);
projectRouter.put(
  "/teams/:teamId/:projectId",
  requireProjectAccess,
  updateProject
);
projectRouter.delete(
  "/teams/:teamId/:projectId",
  requireProjectAccess,
  deleteProject
);

// 4. Project Member Management Routes (all need specific project access)
projectRouter.post(
  "/teams/:teamId/projects/:projectId/members",
  requireProjectAccess,
  addMemberToProject
);
projectRouter.delete(
  "/teams/:teamId/projects/:projectId/members",
  requireProjectAccess,
  removeMemberFromProject
);
// Update project member role
projectRouter.patch(
  "/teams/:teamId/projects/:projectId/members/role",
  requireProjectAccess,
  updateProjectMemberRole
);
projectRouter.get(
  "/teams/:teamId/projects/:projectId/members",
  requireProjectAccess,
  listProjectMembers
);
export default projectRouter;
