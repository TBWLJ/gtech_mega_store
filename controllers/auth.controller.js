import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";


const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// -------------------- REGISTER --------------------
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      hashedPassword,     // ✅ correct field name
      role: "customer",
    });

    await newUser.save();

    res.status(201).json({
      message: "Customer registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};


// -------------------- LOGIN --------------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // explicitly select the hashed password (because select: false in schema)
    const user = await User.findOne({ email }).select("+hashedPassword");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // compare password with hashedPassword
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, { ...cookieConfig, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        token,
        refreshToken,
        message: "Login successful",
        user: {
            id: user._id,
            name: user.name,
            role: user.role,
        },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie("token", cookieConfig);
  res.clearCookie("refreshToken", cookieConfig);
  res.status(200).json({ message: "Logged out successfully" });
};

// -------------------- REFRESH TOKEN --------------------
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!payload) return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { userId: payload.userId, role: payload.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", newAccessToken, { ...cookieConfig, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};



/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.user._id).select("-hashedPassword");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

