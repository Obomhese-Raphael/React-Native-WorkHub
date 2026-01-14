import { createClerkClient } from "@clerk/backend";
// import { useUser } from "@clerk/clerk-expo";
import teamModel from "../models/Team.js";
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Create Team - Done ✅
const createTeam = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // 1. Validation: Ensure name exists before trimming
    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ success: false, error: "Team name is required" });
    }

    console.log("Checking req body in createTeam:", req.body);
    const userId = req.userId;
    const createdBy = req.userId;
    // Fallbacks if Clerk doesn't provide name/email
    const userName = req.userName || "Team Creator";
    const userEmail = req.userEmail || "no-email@workhub.app";
    const creatorEmail = req.userEmail || null;

    const newTeam = new teamModel({
      name: req.body.name.trim(),
      description: req.body.description?.trim() || "",
      color: req.body.color || "#3B82F6",
      createdBy: req.userId,
      members: [
        {
          userId: req.userId,
          name: req.userName || "Team Creator",
          email: creatorEmail, // ← Now 'obomheser@gmail.com' or null
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

// Get All Teams - Done ✅
const getAllTeams = async (req, res) => {
  console.log("🔥 DIRECT HIT: getAllTeams called");
  console.log("User ID:", req.userId);

  try {
    const userId = req.userId;

    // Fetch raw teams
    const rawTeams = await teamModel.findByUser(userId);

    // Enrich each team with computed fields
    const enrichedTeams = rawTeams.map((team) => {
      const teamObj = team.toObject(); // safe plain object

      return {
        ...teamObj,
        memberCount: team.memberCount || team.members?.length || 0,
        isAdmin: team.isUserAdmin(userId),
        role: team.isAdmin ? "admin" : "member", // fallback if method missing
      };
    });

    console.log(`Fetched ${enrichedTeams.length} teams for user ${userId}`);
    console.log("Enriched teams sample:", enrichedTeams[0]); // debug first one

    res.json({ success: true, data: enrichedTeams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
};

// Get Team by ID - Done ✅
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

// Update Team - Done ✅
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

// Add Member - Done ✅
const addMember = async (req, res) => {
  try {
    const teamId = req.params.id;
    const { userId, name, email, role = "member" } = req.body;

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

    // Prevent duplicate by email OR userId (if provided)
    const duplicate = team.members.some(
      (m) => m.email === email || (userId && m.userId === userId)
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: "This user (email or ID) is already a member of the team",
      });
    }

    team.members.push({
      userId: userId || null,
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

// Invite Team Member via Clerk
const inviteTeamMember = async (req, res) => {
  try {
    const teamId = req.params.id;
    const { email, role = "member" } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    // Check if already a member in the database
    if (team.members.some((m) => m.email === normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "User is already a member of this team",
      });
    }

    // 1. Check if the user already exists in Clerk
    const users = await clerkClient.users.getUserList({
      emailAddress: [normalizedEmail],
    });

    const existingUser = users.data[0];

    if (existingUser) {
      // CASE A: User exists! Add to team directly.
      // (Re-verifying by userId just in case email was changed)
      if (team.members.some((m) => m.userId === existingUser.id)) {
        return res
          .status(400)
          .json({ success: false, error: "User is already in this team" });
      }

      team.members.push({
        userId: existingUser.id,
        name:
          `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim() ||
          "New Member",
        email: normalizedEmail,
        role: role,
        joinedAt: new Date(),
      });

      await team.save();
      return res.json({
        success: true,
        message: "User found and added to team directly.",
        data: { type: "direct_add", userId: existingUser.id },
      });
    } else {
      // CASE B: User doesn't exist. Send Clerk Invite.
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: normalizedEmail,
        publicMetadata: {
          pendingTeamId: teamId,
          pendingRole: role,
          source: "workhub_invite",
        },
        ignoreExisting: true, // Clerk won't throw error if invite already exists
      });

      return res.json({
        success: true,
        message: "Invitation sent to new user.",
        data: { type: "invite_sent", invitationId: invitation.id },
      });
    }
  } catch (error) {
    console.error("Invite/Add Error:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || "Process failed" });
  }
};

// Delete Team (Soft Delete) - Done ✅
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await teamModel.findById(id);
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

// Delete Member by Email - THIS IS NOT DONE YET ❌
const deleteMember = async (req, res) => {
  try {
    const { id: teamId, email: memberEmail } = req.params;

    if (!memberEmail) {
      return res
        .status(400)
        .json({ success: false, error: "Member email is required" });
    }

    const team = await teamModel.findById(teamId);

    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    if (!team.isActive) {
      return res
        .status(400)
        .json({ success: false, error: "Cannot modify inactive team" });
    }

    // Check if current user is admin (important!)
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: "Unauthenticated",
      });
    }

    const isAdmin = team.members.some(
      (m) => m.userId === currentUserId && m.role === "admin"
    );

    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, error: "Only team admins can remove members" });
    }

    const initialLength = team.members.length;

    // Remove member by email
    team.members = team.members.filter((m) => m.email !== memberEmail);

    if (team.members.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: "Member with that email not found in team",
      });
    }

    await team.save();

    res.json({
      success: true,
      message: "Member removed successfully",
      data: {
        teamId: team._id,
        removedEmail: memberEmail,
        remainingMembers: team.members.length,
      },
    });
  } catch (error) {
    console.error("Error removing member from team:", error);
    res.status(500).json({ success: false, error: "Failed to remove member" });
  }
};

// Search Teams by Name - Done ✅
const searchTeams = async (req, res) => {
  console.log("Search query:", req.query);
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
  updateTeam,
  deleteTeam,
  deleteMember,
  getAllTeams,
  searchTeams,
  inviteTeamMember,
};
