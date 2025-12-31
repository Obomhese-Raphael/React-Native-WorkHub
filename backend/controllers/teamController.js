// import { useUser } from "@clerk/clerk-expo";
import teamModel from "../models/Team.js";

// Create Team
const createTeam = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.userId;
    // Fallbacks if Clerk doesn't provide name/email
    const userName = req.userName || "Unknown User";
    const userEmail = req.userEmail || "no-email@workhub.app";

    const newTeam = new teamModel({
      name,
      description,
      createdBy: userId,
      color,
      members: [
        {
          userId,
          name: userName,
          email: userEmail,
          role: "admin",
        },
      ],
    });

    await newTeam.save();

    res.status(201).json({
      success: true,
      data: newTeam,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ success: false, error: "Failed to create team" });
  }
};

// Get All Teams
const getAllTeams = async (req, res) => {
  try {
    const teams = await teamModel
      .find({ isActive: true })
      .populate("projects", "name status dueDate") // only return selected project fields
      .populate("members", "name email role"); // if members are stored as subdocs, adjust accordingly

    res.json({ success: true, data: teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
};

// Get Team by ID
const getTeamById = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId;

    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (!team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You are not a member of this team.",
      });
    }

    res.json({
      success: true,
      data: {
        ...team.toObject(),
        memberCount: team.memberCount,
        isAdmin: team.isUserAdmin(userId),
      },
    });
  } catch (error) {
    console.error("Error getting team: ", error);
    res.status(500).json({ success: false, error: "Failed to get Team" });
  }
};

// Update Team
const updateTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const updates = req.body;

    const team = await teamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    Object.assign(team, updates);
    team.updatedAt = Date.now();
    await team.save();

    res.json({
      success: true,
      data: team,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ success: false, error: "Failed to update team" });
  }
};

// Add Member
const addMember = async (req, res) => {
  try {
    const teamId = req.params.id;
    const { name, email, role = "member" } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Member name and email are required",
      });
    }

    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Prevent duplicate emails in the same team
    if (team.members.some((m) => m.email === email)) {
      return res.status(400).json({
        success: false,
        error: "This email is already a member of the team",
      });
    }

    team.members.push({
      name,
      email,
      role,
      joinedAt: new Date(),
    });

    await team.save();

    res.json({
      success: true,
      data: {
        ...team.toObject(),
        memberCount: team.members.length,
      },
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add member",
    });
  }
};

// Add Project
const addProject = async (req, res) => {
  try {
    const teamId = req.params.id;
    const { name, description } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Project name is required",
      });
    }

    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (!team.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You are not a member of this team.",
      });
    }

    const project = {
      name,
      description,
      createdBy: userId,
      createdAt: new Date(),
    };

    team.projects.push(project);
    await team.save();

    res.json({
      success: true,
      data: team.projects,
      message: "Project added successfully",
    });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ success: false, error: "Failed to add project" });
  }
};

// Delete Team (Soft Delete)
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await teamModel.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    // Instead of removing permanently, we mark inactive
    team.isActive = false;
    await team.save();

    res.json({
      success: true,
      message: "Team deleted (soft delete) successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ success: false, error: "Failed to delete team" });
  }
};

// Delete all Teams (TEST)
const deleteAllTeams = async (req, res) => {
  try {
    await teamModel.deleteMany({});
    res.json({ success: true, message: "All teams deleted successfully" });
  } catch (error) {
    console.error("Error deleting all teams:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete all teams" });
  }
};


const deleteMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.params; // Keep email from params
    const memberId = req.params.memberId || req.params.id; // Fallback if needed

    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    const initialLength = team.members.length;

    // Remove by email OR by subdocument _id
    team.members = team.members.filter(
      (m) => m.email !== email && (!memberId || m._id.toString() !== memberId)
    );

    if (team.members.length === initialLength) {
      return res
        .status(404)
        .json({ success: false, error: "Member not found in team" });
    }

    await team.save();

    res.json({
      success: true,
      data: team,
      message: `Member removed successfully`,
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ success: false, error: "Failed to remove member" });
  }
};

// Search Teams by Name
const searchTeams = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Case-insensitive regex search
    const teams = await teamModel.find({
      name: { $regex: name, $options: "i" },
    });

    res.status(200).json(teams);
  } catch (error) {
    console.error("Error searching teams:", error);
    res.status(500).json({ message: "Error searching teams" });
  }
};
export default {
  createTeam,
  getTeamById,
  addMember,
  addProject,
  updateTeam,
  deleteTeam,
  deleteAllTeams,
  deleteMember,
  getAllTeams,
  searchTeams,
};
