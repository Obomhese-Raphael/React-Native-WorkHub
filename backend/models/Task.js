import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "project",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Task name is required"],
    trim: true,
    minlength: [2, "Task name must be at least 2 characters"],
    maxlength: [200, "Task name cannot exceed 200 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  createdBy: {
    type: String, // userId
    required: true,
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "review", "blocked", "completed", "archived", "on-hold"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium",
  },
  dueDate: {
    type: Date,
  },
  assignedMembers: [
    {
      userId: { type: String },
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      role: { type: String, default: "assignee" },
    },
  ],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const taskModel = mongoose.models.task || mongoose.model("task", taskSchema);
export default taskModel;
