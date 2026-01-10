import express from "express";
import { initializePayment, verifyPayment, handleWebhook } from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/initialize", protect, initializePayment);
router.get("/verify", verifyPayment); // ?reference=
router.post("/webhook", handleWebhook); // Paystack webhook

export default router;
