import Product from "../models/Product.js";
import cloudinary from "cloudinary";

// Cloudinary config

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log({
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
    const { 
      search, 
      categories, 
      minPrice, 
      maxPrice, 
      sort 
    } = req.query;

    // Build the query object
    let query = {};

    // 1. Search by name / title (case-insensitive)
    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
      // Alternative: search in multiple fields
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // 2. Categories filter (expects comma-separated string)
    if (categories) {
      const categoryArray = categories.split(',').map(cat => cat.trim());
      query.category = { $in: categoryArray }; // assuming field is called "category"
      // If your field is called "categories" and is an array:
      // query.categories = { $in: categoryArray };
    }

    // 3. Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};

      if (minPrice !== undefined && !isNaN(minPrice)) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // 4. Create the base query
    let productsQuery = Product.find(query);

    // 5. Sorting
    if (sort) {
      const sortOptions = {};

      switch (sort) {
        case 'price-asc':
          sortOptions.price = 1;
          break;
        case 'price-desc':
          sortOptions.price = -1;
          break;
        case 'newest':
          sortOptions.createdAt = -1;
          break;
        case 'name-asc':
          sortOptions.name = 1;
          break;
        case 'name-desc':
          sortOptions.name = -1;
          break;
        case 'popular':
          // if you have a views/popularity field
          sortOptions.views = -1;
          break;
        default:
          // default sort (newest first is common)
          sortOptions.createdAt = -1;
      }

      productsQuery = productsQuery.sort(sortOptions);
    }

    // Execute query
    const products = await productsQuery;

    res.json({
      success: true,
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching products',
      error: error.message 
    });
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

    // 🔥 Delete Cloudinary images (array of objects)
    if (product.images && Array.isArray(product.images)) {
      const deletePromises = product.images
        .filter(img => img && img.public_id)
        .map(img => cloudinary.v2.uploader.destroy(img.public_id));

      await Promise.all(deletePromises);
    }

    await product.deleteOne();

    res.json({ message: "Product and images deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


