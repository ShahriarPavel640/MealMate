import pool from '../../db.js';
import redisClient from '../../utils/redisClient.js';

export const submitRestaurantReview = async (req, res) => {
  const { rating, comment, order_id, restaurant_id } = req.body;
  const userId = req.user.id; // Customer's user_id

  try {
    // 1. Insert the new review
    await pool.query(
      'INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
      [userId, restaurant_id, order_id, rating, comment]
    );

    // 2. Update the average rating for the restaurant
    const result = await pool.query(
      'SELECT AVG(rating) as average_rating FROM reviews WHERE restaurant_id = $1',
      [restaurant_id]
    );
    const newAverageRating = parseFloat(result.rows[0].average_rating).toFixed(2);

    await pool.query(
      'UPDATE restaurants SET average_rating = $1 WHERE restaurant_id = $2',
      [newAverageRating, restaurant_id]
    );

    if (redisClient.isOpen) {
      await redisClient.del(`cache:restaurant:${restaurant_id}`);
      await redisClient.del(`cache:reviews:${restaurant_id}`);
    }

    res.status(201).json({ message: 'Restaurant review submitted successfully' });
  } catch (error) {
    console.error('Error submitting restaurant review:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You have already submitted a review for this restaurant on this order.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const submitRiderReview = async (req, res) => {
  const { rating, comment, order_id, rider_id } = req.body;
  const userId = req.user.id; // Customer's user_id

  try {
    // 1. Insert the new review
    // Note: The rider_profiles table does not have an average_rating column.
    // We are only storing the review for the rider for now.
    await pool.query(
      'INSERT INTO reviews (user_id, rider_id, order_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
      [userId, rider_id, order_id, rating, comment]
    );

    res.status(201).json({ message: 'Rider review submitted successfully' });
  } catch (error) {
    console.error('Error submitting rider review:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'You have already submitted a review for this rider on this order.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRestaurantReviews = async (req, res) => {
  const { restaurantId } = req.params;

  try {
    const reviews = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.restaurant_id = $1
       ORDER BY r.created_at DESC`,
      [restaurantId]
    );
    res.status(200).json(reviews.rows);
  } catch (error) {
    console.error('Error fetching restaurant reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRiderReviews = async (req, res) => {
  const riderId = req.user.id;

  try {
    const reviewsResult = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.rider_id = $1
       ORDER BY r.created_at DESC`,
      [riderId]
    );

    const ratingResult = await pool.query(
      'SELECT AVG(rating) as average_rating FROM reviews WHERE rider_id = $1',
      [riderId]
    );

    const averageRating = ratingResult.rows[0].average_rating ? parseFloat(ratingResult.rows[0].average_rating).toFixed(2) : null;

    res.status(200).json({
      reviews: reviewsResult.rows,
      averageRating: averageRating
    });
  } catch (error) {
    console.error('Error fetching rider reviews and rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
