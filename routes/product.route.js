import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin
router.post(
  "/",
  protect,
  admin,
  upload.array("images", 5), // 👈 REQUIRED
  createProduct
);

router.put(
  "/:id",
  protect,
  admin,
  upload.array("images", 5),
  updateProduct
);

router.delete("/:id", protect, admin, deleteProduct);

export default router;
