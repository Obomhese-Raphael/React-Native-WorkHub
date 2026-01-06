// middleware/teamAccess.js
import teamModel from "../models/Team.js";

// export const requireTeamAccess = async (req, res, next) => {
//   try {
//     const { teamId } = req.params;
//     console.log("Checking access for teamId:", teamId);
//     const userId = req.userId;
//     console.log("Current userId:", userId);

//     if (!teamId) {
//       console.log("No teamId provided in request params");
//       return res
//         .status(400)
//         .json({ success: false, error: "Team ID is required" });
//     }

//     const team = await teamModel.findById(teamId);
//     if (!team || !team.isActive) {
//       return res.status(404).json({ success: false, error: "Team not found" });
//     }

//     const isMember = team.members.some((m) => m.userId === userId);
//     const isCreator = team.createdBy === userId;

//     if (!isMember && !isCreator) {
//       return res
//         .status(403)
//         .json({ success: false, error: "Access check failed from check" });
//     }

//     // Attach team for controller use
//     req.team = team;
//     next();
//   } catch (error) {
//     console.error("Team access middleware error:", error);
//     res.status(500).json({ success: false, error: "Access check failed from teamAccess" });
//   }
// };

export const requireTeamAccess = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format",
      });
    }

    if (!teamId) {
      return res
        .status(400)
        .json({ success: false, error: "Team ID is required" });
    }

    const team = await teamModel.findById(teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }

    const isMember = team.members.some((m) => m.userId === userId);
    const isCreator = team.createdBy === userId;

    // ✅ IMPROVED: Creator always gets access, even if not in members list
    if (isMember || isCreator) {
      req.team = team;
      return next();
    }

    // Only block if truly neither
    return res.status(403).json({
      success: false,
      error: "Access denied: You're not a member or creator of this team",
    });
  } catch (error) {
    console.error("Team access middleware error:", error);
    res
      .status(500)
      .json({ success: false, error: "Server error during access check" });
  }
};
