import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer",
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
