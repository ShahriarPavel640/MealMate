import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "../../db.js";
import redisClient from "../../utils/redisClient.js";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

export const generateMenuDescription = async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Item name is required" });
  }

  try {
    const prompt = `Write a short, appetizing, 2-sentence description for a restaurant menu item called "${name}". Make it sound delicious and professional. Do not use emojis.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    res.status(200).json({ description: text });
  } catch (err) {
    console.error("Error generating menu description:", err.message);
    res.status(500).json({ message: "Failed to generate description" });
  }
};

export const summarizeReviews = async (req, res) => {
  const { restaurantId } = req.params;

  try {
    // 1. Check Redis Cache
    const cacheKey = `cache:review_summary:${restaurantId}`;
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json({ summary: cached });
      }
    }

    // 2. Fetch reviews from PostgreSQL
    const reviewsRes = await pool.query(
      `SELECT rating, comment FROM reviews WHERE restaurant_id = $1`,
      [restaurantId]
    );

    const reviews = reviewsRes.rows;
    if (reviews.length === 0) {
      return res.status(200).json({ summary: "No reviews available to summarize yet." });
    }

    // If there are only a few reviews without comments, we might skip
    const textReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0);
    if (textReviews.length === 0) {
      return res.status(200).json({ summary: "Customers have left ratings, but no written reviews to summarize." });
    }

    // 3. Prepare prompt
    const reviewTexts = textReviews.map(r => `Rating: ${r.rating}/5. Comment: ${r.comment}`).join("\n");
    const prompt = `
      You are an AI assistant for a food delivery app. Summarize the following customer reviews for a restaurant.
      Format your response as a clean, bulleted "Pros and Cons" list.
      Keep it very concise.
      
      Reviews:
      ${reviewTexts}
      
      Output format:
      **Pros:**
      - [Pro 1]
      - [Pro 2]
      
      **Cons:**
      - [Con 1]
      - [Con 2]
    `;

    // 4. Generate Summary
    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    // 5. Save to Cache (24 hours = 86400 seconds)
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 86400, summary);
    }

    res.status(200).json({ summary });
  } catch (err) {
    console.error("Error summarizing reviews:", err.message);
    res.status(500).json({ message: "Failed to summarize reviews" });
  }
};
