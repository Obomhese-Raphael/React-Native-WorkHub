TEAM MODEL
// models/Team.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Team name is required"],
    trim: true,
    minlength: [2, "Team name must be at least 2 characters"],
    maxlength: [50, "Team name cannot exceed 50 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
  },
  createdBy: {
    type: String, // user ID
    required: [true, "Team creator is required"],
  },
  members: [
    {
      name: {
        type: String,
        required: [true, "Member name is required"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Member email is required"],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      },
      role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  color: {
    type: String,
    default: "#3B82F6",
    match: [/^#[0-9A-F]{6}$/i, "Please provide a valid hex color"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

teamSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

teamSchema.virtual("memberCount").get(function () {
  return this.members.length;
});

teamSchema.methods.isUserAdmin = function (userId) {
  const member = this.members.find((m) => m.userId === userId);
  return member && member.role === "admin";
};

teamSchema.methods.isUserMember = function (userId) {
  return this.members.some((m) => m.userId === userId);
};

teamSchema.statics.findByUser = function (userId) {
  return this.find({ "members.userId": userId, isActive: true }).sort({
    createdAt: -1,
  });
};

const teamModel = mongoose.models.team || mongoose.model("team", teamSchema);
export default teamModel;

















TEAM CONTROLLER
import teamModel from "../models/Team.js";

const getAllTeams = async (req, res) => {
  try {
    const userId = req.userId;
    const teams = await teamModel.findByUser(userId);
    // Add member count to each team
    const teamsWithCount = teams.map((team) => ({
      ...team.toObject(),
      memberCount: team.memberCount,
    }));

    res.json({
      success: true,
      data: teamsWithCount,
      count: teamsWithCount.length,
    });
  } catch (error) {
    console.error("Error fetching teams: ", error);
    res.status(500).json({
      success: false,
      error: "Faile dto fetch teams",
    });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, description, color, adminName, adminEmail } = req.body;
    const userId = req.userId; // from middleware

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Team name must be at least 2 characters long",
      });
    }

    if (!adminName || !adminEmail) {
      return res.status(400).json({
        success: false,
        error: "Admin name and email are required",
      });
    }

    const existingTeam = await teamModel.findOne({
      name: name.trim(),
      "members.userId": userId,
      isActive: true,
      adminEmail: adminEmail.trim()
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        error: "You already have a team with this name",
      });
    }

    const team = new teamModel({
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: userId,
      color: color || "#3B82F6",
      members: [
        {
          userId: userId,
          name: adminName,
          email: adminEmail,
          role: "admin",
          joinedAt: new Date(),
        },
      ],
    });

    await team.save();

    res.status(201).json({
      success: true,
      data: {
        ...team.toObject(),
        memberCount: team.memberCount,
      },
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Error creating Team: ", error);
    res.status(500).json({
      success: false,
      error: "Failed to create Team",
    });
  }
};

const getTeamById = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId;

    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Check if user is a member
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
    res.status(500).json({
      success: false,
      error: "Failed to get Team",
    });
  }
};

const updateTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId;
    const { name, description, color } = req.body;
    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Check if user is admin
    if (!team.isUserAdmin(userId)) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only team admins can update team details.",
      });
    }
    // Validation
    if (name && name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Team name must be at least 2 characters long",
      });
    }

    // Check for duplicate name (excluding current team)
    if (name && name.trim() !== team.name) {
      const existingTeam = await teamModel.findOne({
        _id: { $ne: teamId },
        name: name.trim(),
        "members.userId": userId,
        isActive: true,
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          error: "You already have a team with this name",
        });
      }
    }
    // Update team
    if (name) team.name = name.trim();
    if (description !== undefined) team.description = description?.trim() || "";

    if (color) team.color = color;

    await team.save();

    res.json({
      success: true,
      data: {
        ...team.toObject(),
        memberCount: team.memberCount,
        isAdmin: team.isUserAdmin(userId),
      },
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating teams: ", error);
    res.status(500).json({
      success: false,
      error: "Failed to update team",
    });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.userId;

    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Only creator can delete team
    if (team.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only team creator can delete the team.",
      });
    }

    // Soft delete - mark as inactive
    team.isActive = false;
    await team.save();

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team: ", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete team",
    });
  }
};

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

    const normalizedEmail = email.trim().toLowerCase();

    // Prevent duplicate emails in the same team
    if (team.members.some((m) => m.email.toLowerCase() === normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "User with this email is already a member of this team",
      });
    }

    team.members.push({
      name,
      email: normalizedEmail,
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

const deleteMember = async (req, res) => {
  try {
    const teamId = req.params.id;
    const memberUserId = req.params.memberId;
    const userId = req.userId;

    const team = await teamModel.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        error: "Team not found",
      });
    }

    // Check if requester is admin or removing themselves
    if (!team.isUserAdmin(userId) && userId !== memberUserId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Only team admins can remove members.",
      });
    }

    // Prevent creator from being removed
    if (memberUserId === team.createdBy) {
      return res.status(400).json({
        success: false,
        error: "Team creator cannot be removed",
      });
    }

    // Remove member
    const initialLength = team.members.length;
    team.members = team.members.filter(
      (member) => member.userId !== memberUserId
    );

    if (team.members.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: "Member not found in this team",
      });
    }

    await team.save();

    res.json({
      success: true,
      data: {
        ...team.toObject(),
        memberCount: team.memberCount,
      },
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error deleting member from team: ", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete member",
    });
  }
};

export default {
  getAllTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  deleteMember,
};
