import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
