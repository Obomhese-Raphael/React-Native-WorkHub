import projectModel from "../models/Project.js";
import taskModel from "../models/Task.js";
import teamModel from "../models/Team.js";
import { getClerkUserDetails } from "../utils/clerkUser.js";

// Create a new task - Done ✅
export const createTask = async (req, res) => {
  try {
    let {
      title,
      description,
      status,
      dueDate,
      priority,
      assignees = [],
    } = req.body;
    const userId = req.userId;
    const project = req.project; // Enriched with projectMembers from middleware

    // --- ADD THIS LOGIC ---
    // If no assignees are provided, default to assigning the creator
    if (assignees.length === 0) {
      assignees = [{ userId: userId }];
    }
    // ----------------------

    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "Task title is required" });
    }

    // Build fast lookup maps from project members
    const memberByUserId = new Map();
    const memberByEmail = new Map();

    project.projectMembers.forEach((member) => {
      if (member.userId) {
        memberByUserId.set(member.userId, member);
      }
      if (member.email && member.email !== "no-email@workhub.app") {
        memberByEmail.set(member.email.toLowerCase(), member);
      }
    });

    // Validate each assignee (supports userId OR email)
    for (const assignee of assignees) {
      let found = false;

      if (assignee.userId) {
        found = memberByUserId.has(assignee.userId);
      } else if (assignee.email) {
        found = memberByEmail.has(assignee.email.toLowerCase());
      } else {
        return res.status(400).json({
          success: false,
          error: "Each assignee must provide either 'userId' or 'email'",
        });
      }

      if (!found) {
        const identifier = assignee.userId || assignee.email;
        return res.status(400).json({
          success: false,
          error: `User with ${assignee.userId ? "ID" : "email"} '${identifier}' is not a member of this project`,
        });
      }
    }

    // Get next order value
    const highestOrderTask = await taskModel
      .findOne({ projectId: project._id, isActive: true })
      .sort({ order: -1 })
      .select("order");

    const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

    // Resolve and save assignee details
    const resolvedAssignees = await Promise.all(
      assignees.map(async (a) => {
        let member = null;

        if (a.userId && memberByUserId.has(a.userId)) {
          member = memberByUserId.get(a.userId);
        } else if (a.email && memberByEmail.has(a.email.toLowerCase())) {
          member = memberByEmail.get(a.email.toLowerCase());
        }

        let name = "Unknown User";
        let email = "no-email@workhub.app";

        // If we have a real userId → fetch fresh data from Clerk (highest priority)
        if (member?.userId) {
          const clerkData = await getClerkUserDetails(member.userId);
          name = clerkData.name;
          email = clerkData.email;
        }
        // Otherwise, fall back to team member data (for placeholders)
        else if (member) {
          name = member.name || "Unknown User";
          email = member.email || "no-email@workhub.app";
        }
        // Final fallback for email-only assignees
        else if (a.email) {
          email = a.email.toLowerCase();
        }

        return {
          userId: member?.userId || null,
          email,
          name,
          assignedBy: userId,
          assignedAt: new Date(),
        };
      })
    );
    const newTask = await taskModel.create({
      projectId: project._id,
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      dueDate: dueDate || null,
      priority: priority || "medium",
      assignees: resolvedAssignees,
      order: newOrder,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: newTask,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, error: "Failed to create task" });
  }
};

// Get all tasks
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.userId;

    const tasks = await taskModel
      .find({
        isActive: true,
        $or: [{ "assignees.userId": userId }, { createdBy: userId }],
      })
      .populate("projectId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (err) {
    console.error("Get my tasks error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch tasks" });
  }
};

// Get tasks for a project - Done ✅
export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await taskModel
      .find({ projectId, isActive: true })
      .sort({ order: 1 }) // ← Better: sort by order for correct column positioning
      .lean(); // ← Important: use .lean() for easier manipulation

    // Collect all unique userIds that appear in any task's assignees
    const userIds = new Set();
    tasks.forEach((task) => {
      task.assignees.forEach((assignee) => {
        if (assignee.userId) {
          userIds.add(assignee.userId);
        }
      });
    });

    // Fetch fresh Clerk data for all real users in one batch (efficient!)
    const clerkUsers = {};
    if (userIds.size > 0) {
      const promises = Array.from(userIds).map(async (userId) => {
        const details = await getClerkUserDetails(userId);
        clerkUsers[userId] = details;
      });
      await Promise.all(promises);
    }

    // Enrich each task's assignees with latest Clerk data (if available)
    const enrichedTasks = tasks.map((task) => {
      const enrichedAssignees = task.assignees.map((assignee) => {
        if (assignee.userId && clerkUsers[assignee.userId]) {
          const clerkData = clerkUsers[assignee.userId];
          return {
            ...assignee,
            name: clerkData.name,
            email: clerkData.email,
          };
        }
        // For placeholder members (no userId), keep whatever is stored
        return assignee;
      });

      return {
        ...task,
        assignees: enrichedAssignees,
      };
    });

    res.json({
      success: true,
      data: enrichedTasks,
      message: "Tasks fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ success: false, error: "Failed to fetch tasks" });
  }
};

// Reusable helper to avoid code duplication - Working ✅
const enrichTaskWithClerkData = async (task) => {
  if (!task.assignees || task.assignees.length === 0) return task;

  const userIds = task.assignees.filter((a) => a.userId).map((a) => a.userId);

  const uniqueUserIds = [...new Set(userIds)];
  const clerkUsers = {};

  if (uniqueUserIds.length > 0) {
    const promises = uniqueUserIds.map(async (userId) => {
      clerkUsers[userId] = await getClerkUserDetails(userId);
    });
    await Promise.all(promises);
  }

  const enrichedAssignees = task.assignees.map((assignee) => {
    if (assignee.userId && clerkUsers[assignee.userId]) {
      const { name, email } = clerkUsers[assignee.userId];
      return { ...assignee, name, email };
    }
    return assignee; // placeholder members unchanged
  });

  return { ...task, assignees: enrichedAssignees };
};

// Get a single task by ID - Done ✅
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await taskModel
      .findOne({
        _id: taskId,
        projectId: req.project._id,
        isActive: true,
      })
      .lean();

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found",
      });
    }

    const enrichedTask = await enrichTaskWithClerkData(task);

    res.json({
      success: true,
      data: enrichedTask,
      message: "Task fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching task by ID:", error);
    res.status(500).json({ success: false, error: "Failed to fetch task" });
  }
};

// Update a task - Done ✅
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    const currentUserId = req.userId;

    const task = await taskModel.findById(taskId);
    if (!task || !task.isActive) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    // If assignees are being updated
    if (updates.assignees !== undefined) {
      const project =
        req.project || (await projectModel.findById(task.projectId).lean());
      if (!project) {
        return res
          .status(404)
          .json({ success: false, error: "Project not found" });
      }

      // Build lookup maps from enriched projectMembers (from middleware or manual fetch)
      const projectMembers = project.projectMembers || [];
      const memberByUserId = new Map();
      const memberByEmail = new Map();

      projectMembers.forEach((member) => {
        if (member.userId) memberByUserId.set(member.userId, member);
        if (member.email && member.email !== "no-email@workhub.app") {
          memberByEmail.set(member.email.toLowerCase(), member);
        }
      });

      // Validate all new assignees
      for (const assignee of updates.assignees) {
        let found = false;

        if (assignee.userId) {
          found = memberByUserId.has(assignee.userId);
        } else if (assignee.email) {
          found = memberByEmail.has(assignee.email.toLowerCase());
        } else {
          return res.status(400).json({
            success: false,
            error: "Each assignee must have either 'userId' or 'email'",
          });
        }

        if (!found) {
          const id = assignee.userId || assignee.email;
          return res.status(400).json({
            success: false,
            error: `User with ${assignee.userId ? "ID" : "email"} '${id}' is not a member of this project`,
          });
        }
      }

      // Collect all userIds from the new assignee list for Clerk enrichment
      const userIdsToFetch = updates.assignees
        .filter((a) => a.userId && memberByUserId.has(a.userId))
        .map((a) => a.userId);

      const clerkUsers = {};
      if (userIdsToFetch.length > 0) {
        const uniqueUserIds = [...new Set(userIdsToFetch)];
        const promises = uniqueUserIds.map(async (userId) => {
          const details = await getClerkUserDetails(userId);
          clerkUsers[userId] = details;
        });
        await Promise.all(promises);
      }

      // Resolve enriched assignee objects
      const enrichedAssignees = updates.assignees.map((a) => {
        let member = null;
        if (a.userId && memberByUserId.has(a.userId)) {
          member = memberByUserId.get(a.userId);
        } else if (a.email && memberByEmail.has(a.email.toLowerCase())) {
          member = memberByEmail.get(a.email.toLowerCase());
        }

        let name = "Unknown User";
        let email = "no-email@workhub.app";

        // Priority 1: Real Clerk data
        if (member?.userId && clerkUsers[member.userId]) {
          name = clerkUsers[member.userId].name;
          email = clerkUsers[member.userId].email;
        }
        // Priority 2: Team member data (placeholders)
        else if (member) {
          name = member.name || "Unknown User";
          email = member.email || "no-email@workhub.app";
        }
        // Priority 3: From incoming email only
        else if (a.email) {
          email = a.email.toLowerCase();
        }

        return {
          userId: member?.userId || null,
          email,
          name,
          assignedBy: currentUserId,
          assignedAt: new Date(),
        };
      });

      // Replace the assignees array
      task.assignees = enrichedAssignees;
    }

    // Apply other updates (title, status, dueDate, priority, etc.)
    const allowedFields = [
      "title",
      "description",
      "status",
      "dueDate",
      "priority",
      "order",
    ];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    });

    task.updatedAt = Date.now();
    await task.save();

    // Final enrichment for response (in case other assignees were not touched)
    const finalTask = task.toObject();
    if (finalTask.assignees?.length > 0) {
      const finalUserIds = finalTask.assignees
        .filter((a) => a.userId)
        .map((a) => a.userId);

      const finalClerkUsers = {};
      if (finalUserIds.length > 0) {
        const uniqueIds = [...new Set(finalUserIds)];
        const promises = uniqueIds.map(async (id) => {
          finalClerkUsers[id] = await getClerkUserDetails(id);
        });
        await Promise.all(promises);
      }

      finalTask.assignees = finalTask.assignees.map((a) => {
        if (a.userId && finalClerkUsers[a.userId]) {
          return {
            ...a,
            name: finalClerkUsers[a.userId].name,
            email: finalClerkUsers[a.userId].email,
          };
        }
        return a;
      });
    }

    res.json({
      success: true,
      data: finalTask,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, error: "Failed to update task" });
  }
};

// Delete a task - Done ✅
// export const deleteTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;

//     // Find the task and ensure it belongs to the authenticated user's project
//     // (req.project is already attached and validated by requireProjectAccess middleware)
//     const task = await taskModel.findOne({
//       _id: taskId,
//       projectId: req.project._id,
//       isActive: true,
//     });

//     if (!task) {
//       return res.status(404).json({
//         success: false,
//         error: "Task not found or already deleted",
//       });
//     }

//     // Soft delete: mark as inactive
//     task.isActive = false;
//     task.deletedAt = new Date(); // Optional: for future trash/recovery features
//     task.deletedBy = req.userId; // Optional: track who deleted it

//     await task.save();

//     // Optional: Reorder remaining tasks to fill the gap (if you want continuous order)
//     // You can add this later if drag-and-drop feels off after deletions

//     res.json({
//       success: true,
//       message: "Task moved to trash successfully",
//       data: { taskId: task._id },
//     });
//   } catch (error) {
//     console.error("Error deleting task:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to delete task",
//     });
//   }
// };

// backend/controllers/taskController.js
// export const deleteTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;

//     // Use findOneAndUpdate to mark as inactive (Soft Delete)
//     const task = await taskModel.findOneAndUpdate(
//       { _id: taskId, projectId: req.project._id },
//       { 
//         isActive: false, 
//         deletedAt: new Date(),
//         deletedBy: req.userId 
//       },
//       { new: true }
//     );

//     if (!task) {
//       return res.status(404).json({ success: false, error: "Task not found" });
//     }

//     res.json({ success: true, message: "Task moved to trash" });
//   } catch (error) {
//     res.status(500).json({ success: false, error: "Server error" });
//   }
// };

// Archive a task (soft-delete by setting isActive to false)
export const archiveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find the task and ensure the user is the creator or assignee
    const task = await taskModel.findOne({
      _id: id,
      isActive: true,
      $or: [{ createdBy: userId }, { "assignees.userId": userId }],
    });

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found or access denied" });
    }

    // Archive the task
    await taskModel.updateOne({ _id: id }, { isActive: false });

    res.status(200).json({ success: true, message: "Task archived successfully" });
  } catch (error) {
    console.error("Error archiving task:", error);
    res.status(500).json({ success: false, error: "Failed to archive task" });
  }
};

// Delete a task (hard-delete, optional - use with caution)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Find and delete the task (ensure user has access)
    const task = await taskModel.findOneAndDelete({
      _id: id,
      $or: [{ createdBy: userId }, { "assignees.userId": userId }],
    });

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found or access denied" });
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, error: "Failed to delete task" });
  }
};

// Reorder tasks within a project - Done ✅
export const reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body; // Expected: array of { taskId, newOrder }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid request: 'tasks' array with taskId and newOrder is required",
      });
    }

    // Build bulk operations for efficiency
    const bulkOps = tasks.map(({ taskId, newOrder }) => ({
      updateOne: {
        filter: {
          _id: taskId,
          projectId: req.project._id,
          isActive: true,
        },
        update: { $set: { order: newOrder } },
      },
    }));

    const result = await taskModel.bulkWrite(bulkOps);

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: "No tasks were reordered — check task IDs or project access",
      });
    }

    res.json({
      success: true,
      message: `Successfully reordered ${result.modifiedCount} task(s)`,
    });
  } catch (error) {
    console.error("Error reordering tasks:", error);
    res.status(500).json({ success: false, error: "Failed to reorder tasks" });
  }
};

// Archive a task - Done ✅
// Archive a task
// export const archiveTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const task = await taskModel.findById(taskId);

//     if (!task)
//       return res.status(404).json({ success: false, error: "Task not found" });

//     task.isArchived = true; // Use a specific flag
//     task.isActive = false; // Remove from main view
//     task.archivedAt = new Date();

//     await task.save();
//     res.json({ success: true, message: "Task archived" });
//   } catch (error) {
//     console.error("Error archiving task:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to archive task",
//     });
//   }
// };

// GET /api/tasks/search?name=Bug - Done ✅
export const searchTasks = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query; // Use ?q=design instead of ?name=
    const userId = req.userId;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Step 1: Find ALL teams the user is part of OR created
    const userTeams = await teamModel
      .find({
        $or: [
          { "members.userId": userId }, // User is a member
          { createdBy: userId }, // User created the team (admin)
        ],
        isActive: true,
      })
      .select("_id")
      .lean();

    if (userTeams.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No teams found — you don't have access to any tasks",
      });
    }

    const teamIds = userTeams.map((t) => t._id);

    // Step 2: Find all active projects in those teams
    const userProjects = await projectModel
      .find({
        teamId: { $in: teamIds },
        isActive: true,
      })
      .select("_id name")
      .lean();

    const projectIds = userProjects.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No projects found",
      });
    }

    // Step 3: Search tasks
    const tasks = await taskModel
      .find({
        projectId: { $in: projectIds },
        isActive: true,
        $or: [{ title: searchRegex }, { description: searchRegex }],
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Step 4: Enrich with real Clerk data
    const enrichedTasks = await Promise.all(
      tasks.map((task) => enrichTaskWithClerkData(task))
    );

    res.json({
      success: true,
      data: enrichedTasks,
      message: `Found ${enrichedTasks.length} task(s) matching "${q}"`,
    });
  } catch (error) {
    console.error("Error searching tasks:", error);
    res.status(500).json({ success: false, error: "Failed to search tasks" });
  }
};

export default { createTask, getTasksByProject, updateTask, deleteTask };

