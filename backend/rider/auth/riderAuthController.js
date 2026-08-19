import * as riderAuthService from "./riderAuthService.js";
import { generateToken } from "../../utils/jwtGenerator.js";

export const signup = async (req, res, next) => {
  try {
    const result = await riderAuthService.signup(req.body);

    generateToken(result.user.user_id, "rider", res);

    res.status(201).json({
      message: "Rider registered successfully",
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      vehicle_type: result.profile.vehicle_type,
      current_location: result.profile.current_location,
      is_available: result.profile.is_available,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await riderAuthService.login(email, password);

    generateToken(result.user.user_id, "rider", res);

    res.status(200).json({
      message: "Login successful",
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      vehicle_type: result.profile.vehicle_type,
      current_location: result.profile.current_location,
      is_available: result.profile.is_available,
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const verify = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await riderAuthService.verifyUser(userId);

    res.status(200).json({
      user_id: result.user.user_id,
      name: result.user.name,
      email: result.user.email,
      phone_number: result.user.phone_number,
      vehicle_type: result.profile.vehicle_type,
      current_location: result.profile.current_location,
      is_available: result.profile.is_available,
    });
  } catch (err) {
    next(err);
  }
};
