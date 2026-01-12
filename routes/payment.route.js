import express from "express";
import {
  initializePayment,
  verifyPayment,
  handleWebhook,
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Paystack payment processing
 */

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize payment for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentInitializeRequest'
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Invalid order or already paid
 *       401:
 *         description: Unauthorized
 */
router.post("/initialize", protect, initializePayment);

/**
 * @swagger
 * /payments/verify:
 *   get:
 *     summary: Verify payment by reference
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack transaction reference
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment failed
 *       404:
 *         description: Order not found
 */
router.get("/verify", verifyPayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Payments]
 *     description: >
 *       Receives Paystack events.  
 *       **Must not be protected by auth middleware.**
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaystackWebhookPayload'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid Paystack signature
 */
router.post("/webhook", handleWebhook);

export default router;
