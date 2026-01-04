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

    // Attach for use in controllers
    req.project = project;
    req.projectTeam = team;

    next();
  } catch (error) {
    console.error("Project access middleware error:", error);
    res.status(500).json({ success: false, error: "Access check failed" });
  }
};