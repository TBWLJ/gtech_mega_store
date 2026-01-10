import express from "express";
import {
    addReview,
    getProductReviews,
    deleteReview,
} from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create review
router.post("/", protect, addReview);

// Get reviews for product
router.get("/product/:productId", getProductReviews);

// Delete review (owner or admin)
router.delete("/:id", protect, deleteReview);

export default router;
