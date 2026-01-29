import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No products in order" });
    }

    const detailedProducts = await Promise.all(
      products.map(async (item, index) => {
        const productId = item.product || item._id || item.id;

        if (!productId) {
          throw {
            status: 400,
            message: `Product ID missing at index ${index}`,
          };
        }

        if (!item.quantity || item.quantity <= 0) {
          throw {
            status: 400,
            message: `Invalid quantity at index ${index}`,
          };
        }

        const dbProduct = await Product.findById(productId);
        if (!dbProduct) {
          throw {
            status: 404,
            message: `Product not found: ${productId}`,
          };
        }

        return {
          product: dbProduct._id,
          quantity: item.quantity,
          price: dbProduct.price,
        };
      })
    );

    const totalAmount = detailedProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      products: detailedProducts,
      totalAmount,
      shippingAddress,
      paymentStatus: "pending",
    });

    return res.status(201).json({ message: "Order created", order });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
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
