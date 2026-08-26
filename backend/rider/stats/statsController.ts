import { Request, Response, NextFunction } from 'express';
import {
  getDashboardData as fetchDashboardData,
  getEarnings as fetchEarnings,
  getRiderReviews as fetchRiderReviews,
} from './statsService.js';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const data = await fetchDashboardData(riderId, {
      ...req.query,
      lat: req.query.lat as string,
      lon: req.query.lon as string,
    });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const getEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const data = await fetchEarnings(riderId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const getRiderReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const riderIdRaw = req.user!.id;
    const riderId = Number(riderIdRaw);
    if (isNaN(riderId)) return res.status(400).json({ message: "Invalid rider ID" });
    const data = await fetchRiderReviews(riderId, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
