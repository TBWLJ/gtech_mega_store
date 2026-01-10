import Order from "../models/Order.js";
import crypto from "crypto";
import axios from "axios";

// Initialize payment for an existing order

export const initializePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    const reference = `order_${order._id}_${Date.now()}`;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: order.totalAmount * 100,
        currency: "NGN",
        reference,
        metadata: {
          orderId: order._id.toString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    order.paymentReference = reference;
    order.paymentStatus = "pending";
    await order.save();

    res.json({
      message: "Payment initialized",
      paystackAuthorizationUrl: response.data.data.authorization_url,
      order,
    });
  } catch (error) {
    console.error("Initialize Payment Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};


// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ message: "Reference missing" });

    const verification = await paystackClient.transaction.verify({ reference });
    const order = await Order.findOne({ paymentReference: reference });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res.json({ message: "Payment already verified", order });
    }

    if (verification.data.status === "success") {
      order.paymentStatus = "paid";
      order.transactionId = verification.data.id;
      order.paidAt = new Date();
      await order.save();
      return res.json({ message: "Payment successful", order });
    } else {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ message: "Payment failed", order });
    }
  } catch (error) {
    console.error("Verify Payment Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Handle Paystack webhook
export const handleWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const event = req.body.event;
    const data = req.body.data;

    // console.log(`🔔 Paystack Event: ${event} | Reference: ${data.reference}`);

    const order = await Order.findOne({ paymentReference: data.reference });
    if (!order) {
    //   console.warn(`Order not found for reference ${data.reference}`);
      return res.status(200).json({ message: "No order to update" });
    }

    switch (event) {
      case "charge.success":
        if (order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.transactionId = data.id;
          order.paidAt = new Date();
          await order.save();
        //   console.log(`✅ Order ${order._id} marked as paid`);
        }
        break;

      case "charge.failed":
        if (order.paymentStatus !== "paid") {
          order.paymentStatus = "failed";
          await order.save();
          console.log(`⚠️ Order ${order._id} marked as failed`);
        }
        break;

      default:
        // console.log(`ℹ️ Event ${event} ignored`);
    }

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
