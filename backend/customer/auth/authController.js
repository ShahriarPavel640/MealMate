import { generateToken } from "../../utils/jwtGenerator.js";
import * as authService from "./authService.js";

export const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    
    // Set JWT token
    await generateToken(result.user.user_id, "customer", res);

    res.status(201).json({
      message: "created successfully",
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      role_id: result.user.role_id,
      location: result.location,
      address: result.address,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Set JWT token
    await generateToken(result.user.user_id, "customer", res);

    res.status(200).json({
      message: "Login successful",
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      role_id: result.user.role_id,
      location: result.location,
      address: result.address,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const jwt = (await import("jsonwebtoken")).default;
      const decoded = jwt.decode(refreshToken);
      if (decoded && decoded.id) {
        const redisClient = (await import("../../utils/redisClient.js")).default;
        await redisClient.del(`refresh_token:${decoded.id}`);
      }
    }
    res.cookie("accessToken", "", { maxAge: 0 });
    res.cookie("refreshToken", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { prevPassword, newPassword } = req.body;
    
    const result = await authService.changePassword(id, prevPassword, newPassword);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const id = req.user.id;
    const result = await authService.verifyUser(id);

    res.status(200).json({
      message: "verified user",
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      role_id: result.user.role_id,
      location: result.location,
      address: result.address,
    });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const id = req.user.id;
    const result = await authService.getProfile(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const id = req.user.id;
    const result = await authService.updateProfile(id, req.body);

    res.status(200).json({
      message: "Profile updated successfully",
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      role_id: result.user.role_id,
      address: result.address,
      location: result.location,
    });
  } catch (err) {
    next(err);
  }
};

