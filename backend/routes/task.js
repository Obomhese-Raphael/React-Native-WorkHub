import express from "express";
import {
  archiveTask,
  createTask,
  deleteTask,
  getTaskById,
  getTasksByProject,
  reorderTasks,
  updateTask
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

// Mount all task routes under /teams/:teamId/projects/:projectId
taskRouter
  .route("/teams/:teamId/projects/:projectId/tasks")
  .post(requireProjectAccess, createTask)
  .get(requireProjectAccess, getTasksByProject);

taskRouter
  .route("/teams/:teamId/projects/:projectId/tasks/:taskId")
  .get(requireProjectAccess, getTaskById);

taskRouter
  .route("/teams/:teamId/projects/:projectId/reorder")
  .patch(requireProjectAccess, reorderTasks);

taskRouter
  .route("/teams/:teamId/projects/:projectId/tasks/:taskId/archive")
  .patch(requireProjectAccess, archiveTask);

taskRouter
  .route("/teams/:teamId/projects/:projectId/tasks/:taskId")
  .put(requireProjectAccess, updateTask)
  .delete(requireProjectAccess, deleteTask);

export default taskRouter;

// ISSUE - CREATING TASKS IS FAILING DUE TO URL MISMATCH
