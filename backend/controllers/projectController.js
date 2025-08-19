// controllers/projectController.js
import projectModel from "../models/Project.js";
import teamModel from "../models/Team.js";

export const createProject = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, createdBy, status, color, startDate, dueDate } =
      req.body;

    if (!name || !createdBy) {
      return res.status(400).json({
        success: false,
        error: "Project name and createdBy are required",
      });
    }

    // Check team exists
    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive) {
      return res
        .status(404)
        .json({ success: false, error: "Team not found or inactive" });
    }

    // Create project
    const project = new projectModel({
      teamId: team._id,
      name,
      description,
      createdBy,
      status,
      color,
      startDate,
      dueDate,
    });

    await project.save();

    // Link project to team
    team.projects.push(project._id);
    await team.save();

    res.status(201).json({
      success: true,
      data: project,
      message: "Project created and linked to team",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ success: false, error: "Failed to create project" });
  }
};

export const getProjectsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const projects = await projectModel
      .find({ teamId, isActive: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ success: false, error: "Failed to fetch projects" });
  }
};

// ✅ Update project
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;

    const project = await projectModel.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    // Apply updates
    Object.assign(project, updates);
    project.updatedAt = Date.now();
    await project.save();

    res.json({
      success: true,
      data: project,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ success: false, error: "Failed to update project" });
  }
};

// ✅ Delete project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await projectModel.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }

    // Remove project reference from its team
    await teamModel.findByIdAndUpdate(project.teamId, {
      $pull: { projects: project._id },
    });

    // Delete the project itself
    await projectModel.findByIdAndDelete(projectId);

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ success: false, error: "Failed to delete project" });
  }
};

// GET /api/projects/search?name=Website
export const searchProjects = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const projects = await projectModel
      .find({ name: new RegExp(name, "i") })
      .populate("teamId"); // ✅ matches your schema

    res.status(200).json(projects);
  } catch (error) {
    console.error("Error searching projects:", error);
    res.status(500).json({ message: "Error searching projects" });
  }
};