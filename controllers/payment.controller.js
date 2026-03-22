import finswitz from "../config/finswitz.js";
import Order from "../models/Order.js";

const REQUIRED_SHIPPING_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "country",
];

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const validateShipping = (shipping) => {
  if (!shipping || typeof shipping !== "object") {
    return { error: "Shipping details are required" };
  }

  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (!shipping[field] || !String(shipping[field]).trim()) {
      return { error: `${field} is required` };
    }
  }

  if (!isValidEmail(shipping.email)) {
    return { error: "Valid email is required" };
  }

  return { shipping };
};

const createOrderFromPayload = async ({ items, total, shipping }) => {
  if (!Array.isArray(items) || items.length === 0 || typeof total !== "number") {
    return { error: "Items, total, and shipping details are required" };
  }

  const { shipping: normalizedShipping, error } = validateShipping(shipping);
  if (error) {
    return { error };
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const order = await Order.create({
    orderId,
    email: normalizedShipping.email,
    shipping: normalizedShipping,
    items,
    total,
    status: "pending",
  });

  return { order };
};

const createPaymentLink = async (order) => {
  const response = await finswitz.post("/payments/payment-links", {
    amount: order.total,
    currency: "NGN",
    title: `Order ${order.orderId}`,
    email: order.email,
    callback_url: `${process.env.FRONTEND_URL || "https://shop4me-7d6d.onrender.com"}/checkout/complete`,
    metadata: {
      orderId: order.orderId,
      customerEmail: order.email,
    },
  });

  return response;
};

// ============================
// Initialize Payment
// ============================
export const initializePayment = async (req, res) => {
  try {
    const { orderId, id, items, total, shipping } = req.body;

    let order = null;
    if (orderId || id) {
      order = await Order.findOne(orderId ? { orderId } : { _id: id });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
    } else {
      const { order: createdOrder, error } = await createOrderFromPayload({
        items,
        total,
        shipping,
      });
      if (error) {
        return res.status(400).json({ error });
      }
      order = createdOrder;
    }

    if (order.status === "paid") {
      return res.status(400).json({ error: "Order already paid" });
    }

    const response = await createPaymentLink(order);

    if (!response.data?.checkoutUrl || !response.data?.reference) {
      return res.status(502).json({
        error: "Checkout failed",
        details: response.data || "No checkout URL returned",
      });
    }

    order.paymentReference = response.data.reference;
    await order.save();

    res.status(200).json({
      message: "Payment initialized successfully",
      orderId: order.orderId,
      paymentUrl: response.data.checkoutUrl,
      reference: response.data.reference,
    });
  } catch (error) {
    console.error("Initialize Payment Error:", error.response?.data || error.message);

    res.status(500).json({
      error: "Checkout failed",
      details: error.response?.data || error.message,
    });
  }
};

// ============================
// Verify Payment (local lookup)
// ============================
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ message: "Reference is required" });
    }

    const order = await Order.findOne({
      $or: [{ paymentReference: reference }, { transactionId: reference }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Payment status retrieved",
      status: order.status,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Verify Payment Error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ============================
// Handle Webhook
// ============================
export const handleWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    if (!event || !data) {
      return res.status(400).json({
        message: "Invalid webhook payload",
      });
    }

    if (event === "payment.success") {
      const order = await Order.findOne({
        paymentReference: data.reference,
      });

      if (order) {
        order.status = "paid";
        order.transactionId = data.reference;
        order.paidAt = new Date();
        await order.save();

        console.log(`Order ${order.orderId} marked as paid`);
      }
    }

    if (event === "payment.failed") {
      const order = await Order.findOne({
        paymentReference: data.reference,
      });

      if (order) {
        order.status = "cancelled";
        await order.save();

        console.log(`Order ${order.orderId} marked as cancelled`);
      }
    }

    res.status(200).json({
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Webhook Error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Backwards compatibility (legacy name)
export const handleCheckout = initializePayment;
