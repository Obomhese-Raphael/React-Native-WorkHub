// backend/scripts/migrate-embedded-projects.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import projectModel from "../models/Project.js"; // ← same
import teamModel from "../models/Team.js"; // ← ../ because we're in backend/scripts

dotenv.config();

async function migrateProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const teams = await teamModel.find({
      "projects.name": { $exists: true },
    });

    if (teams.length === 0) {
      console.log("No embedded projects found — nothing to migrate!");
      return;
    }

    let totalMigrated = 0;

    for (const team of teams) {
      const newProjectIds = [];

      for (const oldProject of team.projects) {
        if (oldProject && oldProject.name) {
          const newProject = await projectModel.create({
            teamId: team._id,
            name: oldProject.name,
            description: oldProject.description || "",
            createdBy: oldProject.createdBy,
            createdAt: oldProject.createdAt || new Date(),
            updatedAt: new Date(),
            status: "active",
            color: oldProject.color || "#10B981",
            isActive: true,
          });

          newProjectIds.push(newProject._id);
          totalMigrated++;
        }
      }

      team.projects = newProjectIds;
      await team.save();

      console.log(`Migrated ${newProjectIds.length} projects for team: "${team.name}"`);
    }

    console.log(`\n🎉 Migration complete! ${totalMigrated} projects moved to separate collection.`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

migrateProjects();