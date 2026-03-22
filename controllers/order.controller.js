import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

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

const normalizeShipping = (shipping, fallbackUser) => {
  if (!shipping || typeof shipping !== "object") {
    return { error: "Shipping details are required" };
  }

  const normalized = {
    ...shipping,
  };

  if (!normalized.email && fallbackUser?.email) {
    normalized.email = fallbackUser.email;
  }

  if (!normalized.name && fallbackUser?.name) {
    normalized.name = fallbackUser.name;
  }

  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (!normalized[field] || !String(normalized[field]).trim()) {
      return { error: `${field} is required` };
    }
  }

  if (!isValidEmail(normalized.email)) {
    return { error: "Valid email is required" };
  }

  return { shipping: normalized };
};

const buildItemsFromProducts = async (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return { error: "No products in order" };
  }

  const items = await Promise.all(
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

      const unitPrice =
        typeof dbProduct.discount_price === "number"
          ? dbProduct.discount_price
          : dbProduct.price;

      return {
        id: dbProduct._id.toString(),
        name: dbProduct.name,
        price: unitPrice,
        quantity: item.quantity,
        imageUrl: dbProduct.images?.[0]?.url,
      };
    })
  );

  return { items };
};

const buildItemsFromPayload = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: "No items in order" };
  }

  const normalized = items.map((item, index) => {
    if (!item.id || !item.name) {
      return {
        error: `Item id and name are required at index ${index}`,
      };
    }

    if (!item.quantity || item.quantity <= 0) {
      return {
        error: `Invalid quantity at index ${index}`,
      };
    }

    if (typeof item.price !== "number" || item.price < 0) {
      return {
        error: `Invalid price at index ${index}`,
      };
    }

    return {
      id: String(item.id),
      name: String(item.name),
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    };
  });

  const errorItem = normalized.find((entry) => entry.error);
  if (errorItem) {
    return { error: errorItem.error };
  }

  return { items: normalized };
};

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { products, items, shipping, shippingAddress } = req.body;

    let fallbackUser = null;
    if (req.user?._id) {
      fallbackUser = await User.findById(req.user._id).select("name email");
    }

    let shippingPayload = shipping;
    if (!shippingPayload && shippingAddress && typeof shippingAddress === "object") {
      shippingPayload = shippingAddress;
    }

    if (!shippingPayload && typeof shippingAddress === "string") {
      shippingPayload = { address: shippingAddress };
    }

    const { shipping: normalizedShipping, error: shippingError } =
      normalizeShipping(shippingPayload, fallbackUser);

    if (shippingError) {
      return res.status(400).json({ message: shippingError });
    }

    let builtItems;
    if (items) {
      const { items: normalizedItems, error } = buildItemsFromPayload(items);
      if (error) {
        return res.status(400).json({ message: error });
      }
      builtItems = normalizedItems;
    } else {
      const { items: productItems, error } = await buildItemsFromProducts(products);
      if (error) {
        return res.status(400).json({ message: error });
      }
      builtItems = productItems;
    }

    const total = builtItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const order = await Order.create({
      orderId,
      email: normalizedShipping.email,
      shipping: normalizedShipping,
      items: builtItems,
      total,
      status: "pending",
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
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");
    if (!user?.email) {
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await Order.find({ email: user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get User Orders Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update order status (admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, deliveryStatus, paymentStatus } = req.body;

    const nextStatus = status || deliveryStatus || paymentStatus;
    if (!nextStatus) {
      return res.status(400).json({ message: "Status is required" });
    }

    const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = nextStatus;
    await order.save();

    return res.status(200).json({ message: "Order updated", order });
  } catch (error) {
    console.error("Update Order Status Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
