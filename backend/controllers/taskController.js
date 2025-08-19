import taskModel from "../models/Task.js";
import projectModel from "../models/Project.js";
import teamModel from "../models/Team.js";

// ✅ Create a Task and add to Project
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, assignedTo, priority, status, dueDate } =
      req.body;

    // Find project
    const project = await projectModel.findById(projectId).populate("teamId");
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    // Find team
    const team = await teamModel.findById(project.teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    // Ensure assignedTo is always an array
    const assignedToArray = Array.isArray(assignedTo) ? assignedTo : [];

    // Validate assigned users belong to the team
    const invalidUsers = assignedToArray.filter(
      (email) => !team.members.some((m) => m.email === email)
    );
    if (invalidUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: `These users are not in the team: ${invalidUsers.join(", ")}`,
      });
    }

    // Convert assignedTo emails -> full member objects for schema
    const assignedMembers = team.members.filter((m) =>
      assignedToArray.includes(m.email)
    );

    // ✅ Create task
    const task = new taskModel({
      projectId, // correct field
      name, // correct field
      description,
      assignedMembers, // correct field
      priority,
      status,
      dueDate,
      createdBy: req.user?.id || "system", // if you have Clerk auth
    });

    await task.save();

    // ✅ Add task to Project
    project.tasks.push(task._id);
    await project.save();

    res.status(201).json({
      success: true,
      data: task,
      message: "Task created and added to project successfully",
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, error: "Failed to create task" });
  }
};

// Get tasks for a project
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await taskModel
      .find({ projectId, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tasks" });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await taskModel.findById(taskId);
    if (!task)
      return res.status(404).json({ success: false, error: "Task not found" });

    // Validate assigned members if being updated
    if (updates.assignedMembers && updates.assignedMembers.length > 0) {
      const project = await projectModel.findById(task.projectId);
      if (!project) {
        return res
          .status(404)
          .json({ success: false, error: "Project not found for this task" });
      }

      const team = await teamModel.findById(project.teamId);
      if (!team) {
        return res
          .status(404)
          .json({ success: false, error: "Team not found for this project" });
      }

      for (const member of updates.assignedMembers) {
        const existsInTeam = team.members.some((m) => m.email === member.email);
        if (!existsInTeam) {
          return res.status(400).json({
            success: false,
            error: `Assigned member ${member.name} with mail (${member.email}) is not part of the team`,
          });
        }
      }
    }

    Object.assign(task, updates);
    task.updatedAt = Date.now();
    await task.save();

    res.json({
      success: true,
      data: task,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, error: "Failed to update task" });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await taskModel.findById(taskId);
    if (!task)
      return res.status(404).json({ success: false, error: "Task not found" });

    await taskModel.findByIdAndDelete(taskId);
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, error: "Failed to delete task" });
  }
};

// GET /api/tasks/search?name=Bug
export const searchTasks = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const tasks = await taskModel
      .find({
        name: { $regex: name, $options: "i" },
      })
      .populate("project", "name")
      .populate("assignedTo", "name email"); // optional: show assigned members

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error searching tasks:", error);
    res.status(500).json({ message: "Error searching tasks" });
  }
};

export default { createTask, getTasksByProject, updateTask, deleteTask };
