import prisma from '@/prismaClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '@/config/env.js';

const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

export const generateMenuDescriptionService = async (name: string) => {
  const prompt = `Write a short, appetizing, 2-sentence description for a restaurant menu item called "${name}". Make it sound delicious and professional. Do not use emojis.`;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

export const summarizeReviewsService = async (restaurantId: number) => {
  const reviews = await prisma.reviews.findMany({
    where: { restaurant_id: restaurantId },
    select: { rating: true, comment: true },
  });

  if (reviews.length === 0) {
    return 'No reviews available to summarize yet.';
  }

  const textReviews = reviews.filter((r) => r.comment && r.comment.trim().length > 0);
  if (textReviews.length === 0) {
    return 'Customers have left ratings, but no written reviews to summarize.';
  }

  const reviewTexts = textReviews
    .map((r) => `Rating: ${r.rating}/5. Comment: ${r.comment}`)
    .join('\n');
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

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};
