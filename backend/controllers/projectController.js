// controllers/projectController.js
import mongoose from "mongoose";
import projectModel from "../models/Project.js";
import teamModel from "../models/Team.js";

// Create a new project under a team - Done ✅
export const createProject = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId; // From your Clerk auth middleware (getUserInfo)
    const { name, description, status, color, startDate, dueDate } = req.body;

    // === Validation ===
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Project name is required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    // === Check if team exists and is active ===
    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found or inactive",
      });
    }

    // === Permission Check: User must be a member of the team ===
    if (!team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: You are not a member of this team",
      });
    }

    // === Create the project ===
    const newProject = new projectModel({
      teamId: team._id,
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: userId, // ← Secured: comes from auth, NOT from body
      status: status || "active",
      color: color || "#10B981",
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
    });

    await newProject.save();

    // === Link project to team (add ObjectId to team's projects array) ===
    team.projects.push(newProject._id);
    await team.save();

    // === Respond with the created project ===
    res.status(201).json({
      success: true,
      data: newProject,
      message: "Project created successfully and linked to team",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
};
// Get projects by team - Done ✅
export const getProjectsByTeam = async (req, res) => {
  try {console.log("🔵 getProjectsByTeam - userId:", req.userId);
    console.log("🔵 Team ID:", req.params.teamId);
    const { teamId } = req.params;
    const userId = req.userId;

    // ✅ Add this at the very top
    if (!mongoose.isValidObjectId(teamId)) {
      return res.status(400).json({ success: false, error: "Invalid team ID" });
    }

    // === Auth Check ===
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    // === Find team and check membership ===
    const team = await teamModel.findById(teamId).lean();
    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found or inactive",
      });
    }

    if (!team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: You are not a member of this team",
      });
    }
    // === Fetch active projects for the team ===
    const projects = await projectModel
      .find({ teamId: team._id, isActive: true })
      .populate({
        path: "tasks",
        match: { isActive: true },
        select: "status dueDate isActive",
      })
      .sort({ createdAt: -1 }) // Newest first
      .select("-__v") // Optional: exclude version key
      .lean(); // Faster, plain JS objects

    res.json({
      success: true,
      data: projects,
      count: projects.length,
      message: projects.length
        ? "Projects retrieved successfully"
        : "No projects found in this team",
    });
  } catch (error) {
    console.error("Error fetching projects by team:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
};
// Update project - Done ✅
export const updateProject = async (req, res) => {
  try {
    const { projectId, teamId } = req.params;

    const userId = req.userId; // From Clerk auth middleware
    const { name, description, status, color, startDate, dueDate } = req.body;

    // === Basic auth check ===
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    // === Find the project ===
    const project = await projectModel.findOne({
      _id: projectId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or inactive",
      });
    }

    // === Permission Check: User must be a member of the project's team ===
    const team = await teamModel.findById(project.teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Associated team not found or inactive",
      });
    }

    if (!team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: You are not a member of this project's team",
      });
    }

    // === Apply only allowed updates (prevent malicious fields like createdBy, teamId) ===
    if (name !== undefined) project.name = name.trim();
    if (description !== undefined)
      project.description = description.trim() || "";
    if (status !== undefined) project.status = status;
    if (color !== undefined) project.color = color;
    if (startDate !== undefined) project.startDate = startDate || null;
    if (dueDate !== undefined) project.dueDate = dueDate || null;

    project.updatedAt = Date.now();

    await project.save();

    // === Return updated project ===
    res.json({
      success: true,
      data: project,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
    });
  }
};
// Delete project  - Done ✅
export const deleteProject = async (req, res) => {
  try {
    const { teamId, projectId } = req.params;
    const userId = req.userId; // From Clerk auth middleware

    // === Basic auth check ===
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    // === Find the project ===
    const project = await projectModel.findOne({
      _id: projectId,
      teamId, // Extra safety: ensure it belongs to the specified team
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found, inactive, or does not belong to this team",
      });
    }

    // === Permission Check: User must be a member of the team ===
    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found or inactive",
      });
    }

    if (!team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: You are not a member of this team",
      });
    }

    // === Soft delete the project ===
    project.isActive = false;
    project.updatedAt = Date.now();
    await project.save();

    // === Remove project reference from team's projects array ===
    await teamModel.findByIdAndUpdate(
      teamId,
      { $pull: { projects: project._id } },
      { new: true }
    );

    res.json({
      success: true,
      message: "Project deleted successfully (soft delete)",
      data: {
        deletedProjectId: project._id,
        teamId: team._id,
      },
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
};
// GET /api/projects/search?name=Website - Search projects - Done ✅
export const searchProjects = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, teamId } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query 'name' is required",
      });
    }

    // Build base query
    const query = {
      name: { $regex: name.trim(), $options: "i" },
      isActive: true,
    };

    // Optional: restrict to one team
    if (teamId) {
      query.teamId = teamId;
    }

    // Fetch matching projects
    let projects = await projectModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean();

    // If searching globally, filter by team membership
    if (!teamId) {
      const userTeams = await teamModel
        .find({ "members.userId": userId, isActive: true })
        .select("_id");

      const userTeamIds = userTeams.map((t) => t._id.toString());

      projects = projects.filter((p) =>
        userTeamIds.includes(p.teamId.toString())
      );
    } else {
      // If teamId provided, verify user is member
      const team = await teamModel.findById(teamId);
      if (!team || !team.isActive || !team.isUserMember(userId)) {
        return res.status(403).json({
          success: false,
          error: "Access denied: Not a member of the specified team",
        });
      }
    }

    res.json({
      success: true,
      data: projects,
      count: projects.length,
      message: projects.length
        ? "Projects found"
        : "No projects match your search",
    });
  } catch (error) {
    console.error("Error searching projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search projects",
    });
  }
};
// Get project by ID - Done ✅
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }
    const project = await projectModel.findOne({
      _id: projectId,
      isActive: true,
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found or inactive" });
    }

    // Check if user is member of the team
    const team = await teamModel.findById(project.teamId);
    if (!team || !team.isActive || !team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: Not a member of this project's team",
      });
    }

    res.json({
      success: true,
      data: project,
      message: "Project retrieved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch project",
    });
  }
};
// Add user to project - Optional but Done ✅
export const addMemberToProject = async (req, res) => {
  try {
    const { teamId, projectId } = req.params;
    const { userId: memberUserId, role = "viewer" } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    if (!memberUserId) {
      return res.status(400).json({
        success: false,
        error: "Member userId is required",
      });
    }

    // Find project
    const project = await projectModel.findOne({
      _id: projectId,
      teamId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or does not belong to this team",
      });
    }

    // Check current user is team member
    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive || !team.isUserMember(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied: You are not a member of this team",
      });
    }

    // Check member to add is also a team member
    if (!team.isUserMember(memberUserId)) {
      return res.status(400).json({
        success: false,
        error: "User must be a team member before being added to a project",
      });
    }

    // Prevent duplicates
    const alreadyMember = project.projectMembers.some(
      (m) => m.userId === memberUserId
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        error: "User is already a member of this project",
      });
    }

    // Add member (creator is owner by default)
    project.projectMembers.push({
      userId: memberUserId,
      role,
      addedBy: currentUserId,
    });

    project.updatedAt = Date.now();
    await project.save();

    res.status(201).json({
      success: true,
      data: project.projectMembers,
      message: "Member added to project successfully",
    });
  } catch (error) {
    console.error("Error adding member to project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add member to project",
    });
  }
};
// Remove member from project - Optional not tested
export const removeMemberFromProject = async (req, res) => {
  try {
    const { teamId, projectId } = req.params;
    const { userId: providedUserId, email: providedEmail } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication",
      });
    }

    if (!providedUserId && !providedEmail) {
      return res.status(400).json({
        success: false,
        error: "Either userId or email is required",
      });
    }

    const project = await projectModel.findOne({
      _id: projectId,
      teamId,
      isActive: true,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or does not belong to this team",
      });
    }

    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive || !team.isUserMember(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Find target member to remove (for validation)
    let targetMember = null;
    if (providedUserId) {
      targetMember = project.projectMembers.find(
        (m) => m.userId === providedUserId
      );
    } else {
      targetMember = project.projectMembers.find(
        (m) => m.email === providedEmail.toLowerCase().trim()
      );
    }

    if (!targetMember || !targetMember.userId) {
      return res.status(404).json({
        success: false,
        error: "Member not found or linked in team",
      });
    }

    // Remove from projectMembers
    const initialCount = project.projectMembers.length;
    project.projectMembers = project.projectMembers.filter(
      (m) => m.userId !== targetMember.userId
    );

    if (project.projectMembers.length === initialCount) {
      return res
        .status(404)
        .json({ success: false, error: "User not a member of this project" });
    }

    project.updatedAt = Date.now();
    await project.save();

    res.json({
      success: true,
      message: "Member removed from project successfully",
      data: { removedUserId: targetMember.userId },
    });
  } catch (error) {
    console.log("Error removing member from project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove member from project",
    });
  }
};
// Update project member role - Optional not tested
export const updateProjectMemberRole = async (req, res) => {
  try {
    const { teamId, projectId } = req.params;
    const { userId: providedUserId, email: providedEmail, role } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    if (!["owner", "editor", "viewer"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    if (!providedUserId && !providedEmail) {
      return res
        .status(400)
        .json({ success: false, error: "userId or email required" });
    }

    const project = await projectModel.findOne({
      _id: projectId,
      teamId,
      isActive: true,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });

    const team = await teamModel.findById(teamId);
    if (!team?.isUserMember(currentUserId)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    let targetUserId = null;
    if (providedUserId) {
      targetUserId = providedUserId;
    } else {
      const member = team.members.find(
        (m) => m.email.toLowerCase() === providedEmail.toLowerCase().trim()
      );
      if (!member || !member.userId)
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      targetUserId = member.userId;
    }

    const member = project.projectMembers.find(
      (m) => m.userId === targetUserId
    );
    if (!member) {
      return res
        .status(404)
        .json({ success: false, error: "User not a project member" });
    }

    member.role = role;
    project.updatedAt = Date.now();
    await project.save();

    res.json({
      success: true,
      message: "Member role updated successfully",
      data: { userId: targetUserId, role },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ success: false, error: "Failed to update role" });
  }
};
// List Project Members - Optional not tested
export const listProjectMembers = async (req, res) => {
  try {
    const { teamId, projectId } = req.params;
    const userId = req.userId;

    if (!userId)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const project = await projectModel.findOne({
      _id: projectId,
      teamId,
      isActive: true,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });

    const team = await teamModel.findById(teamId);
    if (!team?.isUserMember(userId)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.json({
      success: true,
      data: project.projectMembers,
      count: project.projectMembers.length,
    });
  } catch (error) {
    console.error("Error listing members:", error);
    res.status(500).json({ success: false, error: "Failed to list members" });
  }
};
