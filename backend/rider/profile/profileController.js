import {
  getRiderProfile as fetchRiderProfile,
  updateRiderProfile as editRiderProfile,
  updateRiderAvailability as changeAvailability,
} from "./profileService.js";

export const getRiderProfile = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const profile = await fetchRiderProfile(riderId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateRiderProfile = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const result = await editRiderProfile(riderId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateRiderAvailability = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { is_available } = req.body;
    const result = await changeAvailability(riderId, is_available);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
