import { Request, Response, NextFunction } from 'express';
import {
  getRiderProfile as fetchRiderProfile,
  updateRiderProfile as editRiderProfile,
  updateRiderAvailability as changeAvailability,
} from './profileService.js';

export const getRiderProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const profile = await fetchRiderProfile(riderId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
};

export const updateRiderProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const result = await editRiderProfile(riderId, req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateRiderAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const { is_available } = req.body;
    const result = await changeAvailability(riderId, is_available);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
