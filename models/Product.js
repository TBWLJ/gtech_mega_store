import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discount_price: {
        type: Number,
        validate: {
            validator: function (value) {
                return value < this.price;
            },
            message: "Discount price must be less than price",
        },
    },
    specifications: {
        type: mongoose.Schema.Types.Mixed,
    },
    images: [
        {
            url: { type: String, required: true },
            public_id: { type: String, required: true },
            resource_type: {
            type: String,
            enum: ["image", "video"],
            default: "image",
            },
        },
    ],
    inStock: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
