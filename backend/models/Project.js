// models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "team", // references your Team model
    required: true,
  },
  name: {
    type: String,
    required: [true, "Project name is required"],
    trim: true,
    minlength: [2, "Project name must be at least 2 characters"],
    maxlength: [100, "Project name cannot exceed 100 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  createdBy: {
    type: String, // userId of creator
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "archived", "completed"],
    default: "active",
  },
  color: {
    type: String,
    default: "#10B981", // Tailwind emerald as default
    match: [/^#[0-9A-F]{6}$/i, "Please provide a valid hex color"],
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "task",
    },
  ],
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

projectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const projectModel =
  mongoose.models.project || mongoose.model("project", projectSchema);

export default projectModel;
