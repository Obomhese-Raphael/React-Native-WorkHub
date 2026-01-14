import express from "express";
import { updateAvatar } from "../controllers/userController.js";
import { getUserInfo, requireAuth } from "../middleware/auth.js";

const userRouter = express.Router();

// Protected user routes
userRouter.patch(
  "/avatar",
  requireAuth,
  getUserInfo,
  updateAvatar
);

export default userRouter;