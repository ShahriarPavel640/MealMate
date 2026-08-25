import {
  getDashboardData as fetchDashboardData,
  getEarnings as fetchEarnings,
  getRiderReviews as fetchRiderReviews,
} from "./statsService.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const data = await fetchDashboardData(riderId, { ...req.query, lat: req.query.lat, lon: req.query.lon });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const getEarnings = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const data = await fetchEarnings(riderId);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

export const getRiderReviews = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const data = await fetchRiderReviews(riderId, req.query);
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
