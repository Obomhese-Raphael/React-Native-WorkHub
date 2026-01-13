import express from "express";
import {
  archiveTask,
  createTask,
  deleteTask,
  getMyTasks,
  getTaskById,
  getTasksByProject,
  reorderTasks,
  unarchiveTask,
  updateTask,
} from "../controllers/taskController.js";
import { devBypassAuth, getUserInfo, requireAuth } from "../middleware/auth.js";
import { requireProjectAccess } from "../middleware/projectAccess.js";

const taskRouter = express.Router();

// Global auth
if (
  process.env.NODE_ENV === "development" &&
  process.env.BYPASS_AUTH === "true"
) {
  taskRouter.use(devBypassAuth);
} else {
  taskRouter.use(requireAuth);
  taskRouter.use(getUserInfo);
}

taskRouter.route("/my-tasks").get(getMyTasks);

taskRouter
  .route("/:projectId/tasks")
  .post(requireProjectAccess, createTask)
  .get(requireProjectAccess, getTasksByProject);

taskRouter
  .route("/:projectId/tasks/:taskId")
  .get(requireProjectAccess, getTaskById)
  .put(requireProjectAccess, updateTask)
  .delete(requireProjectAccess, deleteTask);

taskRouter.patch(
  "/:projectId/tasks/:taskId/archive",
  requireProjectAccess,
  archiveTask
);

// Add assignee to task
taskRouter.post(
  "/:projectId/tasks/:taskId/assignees",
  requireAuth,
  getUserInfo,
  requireProjectAccess,
  // Optional: add requireTaskAccess middleware if you create one
  addMemberToTask
);

// Remove assignee from task
taskRouter.delete(
  "/:projectId/tasks/:taskId/assignees/:userId",
  requireAuth,
  getUserInfo,
  requireProjectAccess,
  removeMemberFromTask
);

// ...existing code...

taskRouter.patch(
  "/:projectId/tasks/:taskId/unarchive",
  requireAuth,
  requireProjectAccess,
  unarchiveTask
);

// ...existing code...

taskRouter.patch("/:projectId/reorder", requireProjectAccess, reorderTasks);

export default taskRouter;

// ISSUE - CREATING TASKS IS FAILING DUE TO URL MISMATCH
