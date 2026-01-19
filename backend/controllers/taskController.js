import clerkClient from "@clerk/clerk-sdk-node";
import projectModel from "../models/Project.js";
import taskModel from "../models/Task.js";
import teamModel from "../models/Team.js";
import { getClerkUserDetails } from "../utils/clerkUser.js";

// Create a new task - Done ✅
// export const createTask = async (req, res) => {
//   try {
//     let {
//       title,
//       description,
//       status,
//       dueDate,
//       priority,
//       assignees = [],
//     } = req.body;

//     const userId = req.userId;
//     const project = req.project; // From requireProjectAccess middleware (populated with projectMembers)

//     // Auto-assign creator if no assignees provided
//     if (assignees.length === 0) {
//       assignees = [{ userId }];
//     }

//     if (!title?.trim()) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Task title is required" });
//     }

//     // Build lookup maps for fast validation/resolution
//     const memberByUserId = new Map();
//     const memberByEmail = new Map();

//     project.projectMembers.forEach((m) => {
//       if (m.userId) memberByUserId.set(m.userId, m);
//       if (m.email && m.email !== "no-email@workhub.app") {
//         memberByEmail.set(m.email.toLowerCase(), m);
//       }
//     });

//     // Validate assignees (support userId OR email)
//     for (const assignee of assignees) {
//       let found = false;

//       if (assignee.userId) {
//         found = memberByUserId.has(assignee.userId);
//       } else if (assignee.email) {
//         found = memberByEmail.has(assignee.email.toLowerCase());
//       } else {
//         return res.status(400).json({
//           success: false,
//           error: "Each assignee must provide either 'userId' or 'email'",
//         });
//       }

//       if (!found) {
//         const id = assignee.userId || assignee.email;
//         return res.status(400).json({
//           success: false,
//           error: `User '${id}' is not a member of this project`,
//         });
//       }
//     }

//     // Calculate next order
//     const highestOrderTask = await taskModel
//       .findOne({ projectId: project._id, isActive: true })
//       .sort({ order: -1 })
//       .select("order");

//     const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

//     // Resolve assignee details (Clerk > stored member data > fallback)
//     const resolvedAssignees = await Promise.all(
//       assignees.map(async (a) => {
//         let member = null;
//         let clerkData = null;

//         // Try userId first (most reliable)
//         if (a.userId && memberByUserId.has(a.userId)) {
//           member = memberByUserId.get(a.userId);
//           clerkData = await getClerkUserDetails(a.userId); // your Clerk helper
//         }
//         // Then email
//         else if (a.email && memberByEmail.has(a.email.toLowerCase())) {
//           member = memberByEmail.get(a.email.toLowerCase());
//           if (member.userId) {
//             clerkData = await getClerkUserDetails(member.userId);
//           }
//         }

//         const name = clerkData?.name || member?.name || "Unknown User";
//         const email =
//           clerkData?.email ||
//           member?.email ||
//           a.email?.toLowerCase() ||
//           "no-email@workhub.app";

//         return {
//           userId: member?.userId || null,
//           email,
//           name,
//           assignedBy: userId,
//           assignedAt: new Date(),
//         };
//       })
//     );

//     const newTask = await taskModel.create({
//       projectId: project._id,
//       title: title.trim(),
//       description: description?.trim() || "",
//       status: status || "todo",
//       dueDate: dueDate || null,
//       priority: priority || "medium",
//       assignees: resolvedAssignees,
//       order: newOrder,
//       createdBy: userId,
//       isActive: true,
//     });

//     // Optional: Push to project.tasks array
//     project.tasks.push(newTask._id);
//     await project.save();

//     res.status(201).json({
//       success: true,
//       data: newTask,
//       message: "Task created and assigned successfully",
//     });
//   } catch (error) {
//     console.error("Error creating task:", error);
//     res.status(500).json({ success: false, error: "Failed to create task" });
//   }
// };

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
    const project = req.project; // From requireProjectAccess middleware (populated with projectMembers)

    // Auto-assign creator if no assignees provided
    if (assignees.length === 0) {
      assignees = [{ userId }];
    }

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Task title is required" });
    }

    // Build lookup maps for fast validation/resolution
    const memberByUserId = new Map();
    const memberByEmail = new Map();

    project.projectMembers.forEach((m) => {
      if (m.userId) memberByUserId.set(m.userId, m);
      if (m.email && m.email !== "no-email@workhub.app") {
        memberByEmail.set(m.email.toLowerCase(), m);
      }
    });

    // Validate assignees (support userId OR email)
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
        const id = assignee.userId || assignee.email;
        return res.status(400).json({
          success: false,
          error: `User '${id}' is not a member of this project`,
        });
      }
    }

    // Calculate next order
    const highestOrderTask = await taskModel
      .findOne({ projectId: project._id, isActive: true })
      .sort({ order: -1 })
      .select("order");

    const newOrder = highestOrderTask ? highestOrderTask.order + 1 : 0;

    // Resolve assignee details (Clerk > stored member data > fallback)
    const resolvedAssignees = await Promise.all(
      assignees.map(async (a) => {
        let member = null;
        let clerkData = null;

        // Try userId first (most reliable)
        if (a.userId && memberByUserId.has(a.userId)) {
          member = memberByUserId.get(a.userId);
          clerkData = await getClerkUserDetails(a.userId); // your Clerk helper
        }
        // Then email
        else if (a.email && memberByEmail.has(a.email.toLowerCase())) {
          member = memberByEmail.get(a.email.toLowerCase());
          if (member.userId) {
            clerkData = await getClerkUserDetails(member.userId);
          }
        }

        const name = clerkData?.name || member?.name || "Unknown User";
        const email =
          clerkData?.email ||
          member?.email ||
          a.email?.toLowerCase() ||
          "no-email@workhub.app";

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
      isActive: true,
    });

    // Removed: project.tasks.push(newTask._id); await project.save();
    // Not needed if tasks are linked via projectId

    res.status(201).json({
      success: true,
      data: newTask,
      message: "Task created and assigned successfully",
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

  // Extract user IDs as strings from populated objects
  const userIds = task.assignees
    .filter((a) => a.userId) // Filter out null/undefined
    .map((a) => a.userId._id || a.userId.id || a.userId.toString()); // Get the ID string

  const uniqueUserIds = [...new Set(userIds)];
  const clerkUsers = {};

  if (uniqueUserIds.length > 0) {
    try {
      for (const userId of uniqueUserIds) {
        const user = await clerkClient.users.getUser(userId);
        clerkUsers[userId] = {
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.username ||
            "Unknown",
          email: user.emailAddresses?.[0]?.emailAddress || "No email",
        };
      }
    } catch (error) {
      console.error("Error fetching Clerk users:", error);
      // Fallback to populated data if Clerk fails
    }
  }

  // Enrich assignees with Clerk data or fallback to populated data
  const enrichedAssignees = task.assignees.map((assignee) => {
    const userId =
      assignee.userId?._id ||
      assignee.userId?.id ||
      assignee.userId?.toString();
    if (userId && clerkUsers[userId]) {
      return {
        ...assignee,
        name: clerkUsers[userId].name,
        email: clerkUsers[userId].email,
      };
    } else {
      // Fallback to populated data
      return {
        ...assignee,
        name: assignee.userId?.name || assignee.name || "Unknown",
        email: assignee.userId?.email || assignee.email || "No email",
      };
    }
  });

  return { ...task, assignees: enrichedAssignees };
};

// Add a single member/assignee to an existing task
export const addMemberToTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { userId: assigneeUserId, role = "assignee" } = req.body;
    const currentUserId = req.userId;

    console.log("addMemberToTask called with:", {
      projectId,
      taskId,
      assigneeUserId,
      currentUserId,
    });

    // Fetch the task manually
    const task = await taskModel.findOne({
      _id: taskId,
      projectId,
      isActive: true,
    });
    if (!task) {
      console.log("Task not found:", { taskId, projectId });
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const project = req.project; // Set by requireProjectAccess
    console.log("Project permissions check for user:", currentUserId);

    // Manual permission check: Find user in projectMembers and check role
    const currentUserMember = project.projectMembers.find(
      (m) => m.userId === currentUserId
    );
    const allowedRoles = ["admin", "editor"]; // Adjust if your roles differ
    if (!currentUserMember || !allowedRoles.includes(currentUserMember.role)) {
      console.log(
        "Permission denied: user role is",
        currentUserMember?.role || "not found"
      );
      return res.status(403).json({
        success: false,
        error: "Only project owners or editors can assign members",
      });
    }

    console.log("Checking if assignee is a project member...");
    const isProjectMember = project.projectMembers.some(
      (m) => m.userId === assigneeUserId
    );
    if (!isProjectMember) {
      console.log("Assignee not a project member:", assigneeUserId);
      return res.status(400).json({
        success: false,
        error: "User must be a member of this project first",
      });
    }

    console.log("Checking for duplicate assignment...");
    if (task.assignees.some((a) => a.userId === assigneeUserId)) {
      console.log("Duplicate assignee:", assigneeUserId);
      return res.status(400).json({
        success: false,
        error: "User is already assigned to this task",
      });
    }

    let name = "Unknown";
    let email = "no-email@workhub.app";
    try {
      const clerkUser = await getClerkUserDetails(assigneeUserId);
      name = clerkUser.name || name;
      email = clerkUser.email || email;
      console.log("Fetched Clerk data:", { name, email });
    } catch (e) {
      console.log("Clerk fetch failed, using fallback");
    }

    console.log("Adding assignee to task...");
    task.assignees.push({
      userId: assigneeUserId,
      name,
      email,
      assignedBy: currentUserId,
      assignedAt: new Date(),
    });

    await task.save();
    console.log("Task saved. Assignees after save:", task.assignees);

    res.status(200).json({
      success: true,
      message: "Member assigned to task successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error adding member to task:", error);
    res.status(500).json({ success: false, error: "Failed to assign member" });
  }
};

// Optional: Remove assignee from task
export const removeMemberFromTask = async (req, res) => {
  try {
    const { projectId, taskId, userId: assigneeUserId } = req.params;
    const currentUserId = req.userId;

    console.log("removeMemberFromTask called with:", {
      projectId,
      taskId,
      assigneeUserId,
      currentUserId,
    });

    // Fetch the task manually
    const task = await taskModel.findOne({
      _id: taskId,
      projectId,
      isActive: true,
    });
    if (!task) {
      console.log("Task not found:", { taskId, projectId });
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const project = req.project; // Set by requireProjectAccess
    console.log("Project permissions check for user:", currentUserId);

    // Manual permission check
    const currentUserMember = project.projectMembers.find(
      (m) => m.userId === currentUserId
    );
    const allowedRoles = ["admin", "editor"]; // Adjust if needed
    if (!currentUserMember || !allowedRoles.includes(currentUserMember.role)) {
      console.log(
        "Permission denied: user role is",
        currentUserMember?.role || "not found"
      );
      return res.status(403).json({
        success: false,
        error: "Only project owners or editors can remove assignees",
      });
    }

    console.log("Checking if assignee is on the task...");
    const initialLength = task.assignees.length;
    task.assignees = task.assignees.filter((a) => a.userId !== assigneeUserId);

    if (task.assignees.length === initialLength) {
      console.log("Assignee not found on task:", assigneeUserId);
      return res.status(404).json({
        success: false,
        error: "Assignee not found on this task",
      });
    }

    await task.save();
    console.log("Task saved. Assignees after removal:", task.assignees);

    res.json({
      success: true,
      message: "Assignee removed from task",
      data: task, // Return full task for frontend refetch
    });
  } catch (error) {
    console.error("Error removing member from task:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to remove assignee" });
  }
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
      .populate("projectId", "name title") // Support both name and title fields
      .populate("assignees.userId", "name email") // Populate assignee user details
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

// Archive a task (soft-delete by setting isActive to false) - Done ✅
export const archiveTask = async (req, res) => {
  try {
    const { taskId } = req.params; // Fix: Use taskId from params
    const userId = req.userId;

    console.log("Archive attempt - userId from middleware:", req.userId);
    console.log("Task ID:", taskId);
    console.log("Project ID from params:", req.params.projectId);

    // Find the task and ensure the user is the creator or assignee
    const task = await taskModel.findOne({
      _id: taskId, // Fix: Use taskId
      isActive: true,
      $or: [{ createdBy: userId }, { "assignees.userId": userId }],
    });

    console.log("Task found for archiving:", task);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, error: "Task not found or access denied" });
    }

    // Archive the task
    await taskModel.updateOne({ _id: taskId }, { isActive: false }); // Fix: Use taskId

    res
      .status(200)
      .json({ success: true, message: "Task archived successfully" });
  } catch (error) {
    console.error("Error archiving task:", error);
    res.status(500).json({ success: false, error: "Failed to archive task" });
  }
};

// Unarchive a task (restore by setting isActive to true)
export const unarchiveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    console.log("Unarchive attempt - userId from middleware:", req.userId);
    console.log("Task ID:", taskId);
    console.log("Project ID from params:", req.params.projectId);

    // Find the archived task and ensure the user is the creator or assignee
    const task = await taskModel.findOne({
      _id: taskId,
      isActive: false, // Only restore if archived/deleted
      $or: [{ createdBy: userId }, { "assignees.userId": userId }],
    });

    console.log("Task found for unarchiving:", task);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, error: "Task not found or access denied" });
    }

    // Restore the task
    await taskModel.updateOne(
      { _id: taskId },
      {
        isActive: true,
        // Optionally clear deletion metadata if it was soft-deleted
        $unset: { deletedAt: 1, deletedBy: 1 },
        updatedAt: new Date(),
      }
    );

    res
      .status(200)
      .json({ success: true, message: "Task unarchived successfully" });
  } catch (error) {
    console.error("Error unarchiving task:", error);
    res.status(500).json({ success: false, error: "Failed to unarchive task" });
  }
};

// Delete a task (soft-delete by setting isActive to false, matching frontend expectation) - Done ✅
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params; // Fix: Use taskId from params
    const userId = req.userId;

    console.log("Delete attempt - userId from middleware:", req.userId);
    console.log("Task ID:", taskId);
    console.log("Project ID from params:", req.params.projectId);

    // Find the task and ensure the user is the creator or assignee (soft delete)
    const task = await taskModel.findOne({
      _id: taskId, // Fix: Use taskId
      isActive: true,
      $or: [{ createdBy: userId }, { "assignees.userId": userId }],
    });

    console.log("Task found for deletion:", task);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, error: "Task not found or access denied" });
    }

    // Soft delete: mark as inactive
    await taskModel.updateOne(
      { _id: taskId },
      {
        // Fix: Use taskId
        isActive: false,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    );

    res
      .status(200)
      .json({ success: true, message: "Task moved to trash successfully" });
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
