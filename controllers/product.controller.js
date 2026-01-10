import Product from "../models/Product.js";
import cloudinary from "cloudinary";


// Cloudinary config

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// 🔹 Upload helper
const uploadToCloudinary = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith("video") ? "video" : "image";

    cloudinary.v2.uploader.upload_stream(
      {
        folder: "properties",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: resourceType,
        });
      }
    ).end(fileBuffer);
  });
};




/**
 * Create product (admin)
 */
export const createProduct = async (req, res) => {
  try {
    let images = [];

    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map(file =>
          uploadToCloudinary(file.buffer, file.mimetype)
        )
      );
    }

    const product = await Product.create({
      ...req.body,
      images, // 👈 now contains { url, public_id, resource_type }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};



/**
 * Get all products
 */
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get single product
 */
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update product (admin)
 */
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


/**
 * Delete product (admin) + Cloudinary cleanup
*/
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🔥 Delete images/videos from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map((url) => {
        // Extract public_id from Cloudinary URL
        const publicId = url
          .split("/")
          .slice(-2)
          .join("/")
          .split(".")[0];

        return cloudinary.v2.uploader.destroy(publicId);
      });

      await Promise.all(deletePromises);
    }

    await product.deleteOne();

    res.json({ message: "Product and images deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

