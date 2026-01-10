import Review from "../models/Review.js";

/**
 * Add review
 */
export const addReview = async (req, res) => {
    try {
        const review = await Review.create({
            product: req.body.product,
            rating: req.body.rating,
            comment: req.body.comment,
            user: req.user.id,
        });

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You already reviewed this product",
            });
        }
        res.status(400).json({ message: error.message });
    }
};

/**
 * Get reviews for a product
 */
export const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate("user", "name");

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete review (owner or admin)
 */
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (
            review.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await review.deleteOne();
        res.json({ message: "Review deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
