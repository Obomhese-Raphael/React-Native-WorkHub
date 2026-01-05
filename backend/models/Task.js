// backend/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "project",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Task title is required"],
    trim: true,
    minlength: [1, "Title must not be empty"],
    maxlength: [200, "Title too long"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, "Description too long"],
  },
  status: {
    type: String,
    enum: ["todo", "in-progress", "done"],
    default: "todo",
  },
  assignees: [
    {
      userId: {
        type: String, // Clerk userId
        required: false,
        default: null,
      },
      email: {
        type: String,
        lowercase: true,
        required: false,
      },
      name: {
        type: String,
        default: "Unknown User",
      },
      assignedBy: {
        type: String, // Who assigned them
        required: true,
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  dueDate: {
    type: Date,
    default: null,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  order: {
    type: Number,
    default: 0, // For drag-and-drop sorting
  },
  createdBy: {
    type: String, // Clerk userId
    required: true,
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

taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for fast queries
taskSchema.index({ projectId: 1, isActive: 1 });
taskSchema.index({ projectId: 1, status: 1 });

const taskModel = mongoose.models.task || mongoose.model("task", taskSchema);

export default taskModel;
