import express from "express";
import { createOrder, getOrders, getUserOrders } from "../controllers/order.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createOrder); // Just create order, no payment yet
router.get("/my-orders", protect, getUserOrders);
router.get("/", protect, admin, getOrders);

export default router;
