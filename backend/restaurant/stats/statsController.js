import {
  fetchLastWeekRevenueByDay,
  fetchLastMonthRevenueByWeek,
  fetchTopSellingItems,
  fetchCategoryWiseSales,
  fetchLastTwoWeekRevenue,
  fetchLastTwoWeekOrderCount,
  fetchLastTwoWeekNewCustomer
} from "./statsService.js";

export const getLastWeekRevenueByDay = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchLastWeekRevenueByDay(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getLastMonthRevenueByWeek = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchLastMonthRevenueByWeek(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getTopSellingItems = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchTopSellingItems(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getCategoryWiseSales = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchCategoryWiseSales(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getLastTwoWeekRevenue = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchLastTwoWeekRevenue(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getLastTwoWeekOrderCount = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchLastTwoWeekOrderCount(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getLastTwoWeekNewCustomer = async (req, res, next) => {
  try {
    const restaurantId = req.user.id;
    const data = await fetchLastTwoWeekNewCustomer(restaurantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
