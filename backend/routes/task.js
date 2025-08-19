import express from "express";
import {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  searchTasks,
} from "../controllers/taskController.js";

const taskRouter = express.Router();

// Create a task under a project
taskRouter.post("/:projectId/create", createTask);

// Search for a task with its name
taskRouter.get("/search", searchTasks);

// Get all tasks for a project
taskRouter.get("/:projectId", getTasksByProject);

// Update a task
taskRouter.put("/:taskId", updateTask);

// Delete a task
taskRouter.delete("/:taskId", deleteTask);



export default taskRouter;
