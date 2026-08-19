import {
  getRiderProfile as fetchRiderProfile,
  updateRiderProfile as editRiderProfile,
  updateRiderAvailability as changeAvailability,
  getDashboardData as fetchDashboardData,
  acceptOrder as acceptRiderOrder,
  updateOrderStatus as updateRiderOrderStatus,
  getOrderDetails as fetchOrderDetails,
  getDeliveryHistory as fetchDeliveryHistory,
  getEarnings as fetchEarnings,
  getRiderReviews as fetchRiderReviews,
} from "./riderService.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const data = await fetchDashboardData(riderId, { ...req.query, lat: req.query.lat, lon: req.query.lon });
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

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

export const getDeliveryHistory = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const result = await fetchDeliveryHistory(riderId, req.query);
    res.status(200).json(result);
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

export const acceptOrder = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const order = await acceptRiderOrder(riderId, orderId);
    res.status(200).json({
      message: "Order accepted successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await updateRiderOrderStatus(riderId, orderId, status);
    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;
    const order = await fetchOrderDetails(riderId, orderId);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
};
