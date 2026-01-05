import projectModel from "../models/Project.js";
import teamModel from "../models/Team.js";

export const requireProjectAccess = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const { projectId } = req.params;

    const project = await projectModel.findOne({ _id: projectId, isActive: true });
    if (!project) return res.status(404).json({ success: false, error: "Project not found" });

    const team = await teamModel.findById(project.teamId);
    if (!team || !team.isUserMember(userId)) {
      return res.status(403).json({ success: false, error: "Access denied to project" });
    }

    // ← THIS IS THE KEY ADDITION
    // Attach an enriched project object with populated members for controllers
    req.project = {
      ...project.toObject(), // Convert Mongoose doc to plain object
      projectMembers: team.members.map(member => ({
        userId: member.userId || null,        // Keep real userId when exists
        name: member.name || "Unknown User",
        email: member.email || "no-email@workhub.app",
        role: member.role || "member",
        joinedAt: member.joinedAt,
      })),
    };

    // Optional: also attach the full team if needed elsewhere
    req.projectTeam = team;
    next();
  } catch (error) {
    console.error("Project access middleware error:", error);
    res.status(500).json({ success: false, error: "Access check failed" });
  }
};