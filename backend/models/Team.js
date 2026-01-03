import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  userId: {
    type: String, // store Clerk ID or your user ID
  },
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
});

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
  members: [memberSchema],
  projects: [
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String, // Clerk userId
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // You can add more later: status, dueDate, tasks[], etc.
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
