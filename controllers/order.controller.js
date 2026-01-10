import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;

    if (!products || products.length === 0)
      return res.status(400).json({ message: "No products in order" });

    // Fetch product details from DB and validate
    const detailedProducts = await Promise.all(
      products.map(async (item) => {
        if (item.quantity <= 0) throw new Error("Quantity must be at least 1");
        const dbProduct = await Product.findById(item.product);
        if (!dbProduct) throw new Error(`Product not found: ${item.product}`);
        return {
          product: dbProduct._id,
          quantity: item.quantity,
          price: dbProduct.price,
        };
      })
    );

    // Calculate total amount
    const totalAmount = detailedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Save order with pending payment
    const order = await Order.create({
      user: req.user._id,
      products: detailedProducts,
      totalAmount,
      shippingAddress,
      paymentStatus: "pending",
    });

    res.status(201).json({ message: "Order created", order });
  } catch (error) {
    console.error("Create Order Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (admin)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "name price");
    res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate(
      "products.product",
      "name price"
    );
    res.json(orders);
  } catch (error) {
    console.error("Get User Orders Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
