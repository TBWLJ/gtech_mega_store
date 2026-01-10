import express from "express";
import {
    registerUser,
    getProfile,
    getAllUsers,
    updateUser,
} from "../controllers/user.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);

// Authenticated
router.get("/profile", protect, getProfile);

// Admin only
router.get("/", protect, admin, getAllUsers);
router.put("/:id", protect, admin, updateUser);

export default router;
