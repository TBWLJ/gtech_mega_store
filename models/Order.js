import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      index: true,
    },

    shipping: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },

    items: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        imageUrl: { type: String },
      },
    ],

    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    transactionId: {
      type: String,
      index: true,
    },
    paidAt: { type: Date },

    paymentReference: {
      type: String,
      index: true,
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Frequently used queries: order history sorted by date
orderSchema.index({ email: 1, createdAt: -1 });

// Admin views: filter by status + date
orderSchema.index({ status: 1, createdAt: -1 });

// Search for specific payment references fast
orderSchema.index({ paymentReference: 1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
