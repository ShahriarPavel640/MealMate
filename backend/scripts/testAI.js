import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables manually for script
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const testAI = async () => {
  console.log("Testing Gemini API Integration...");
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[ERROR] GEMINI_API_KEY or GOOGLE_API_KEY is missing in .env file!");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  try {
    console.log("1. Testing Menu Description Generation...");
    const prompt1 = `Write a short, appetizing, 2-sentence description for a restaurant menu item called "Spicy Chicken Tacos". Make it sound delicious and professional. Do not use emojis.`;
    const result1 = await model.generateContent(prompt1);
    console.log("[SUCCESS] Description:", result1.response.text().trim());

    console.log("\n2. Testing Review Summarization...");
    const prompt2 = `
      You are an AI assistant for a food delivery app. Summarize the following customer reviews for a restaurant.
      Format your response as a clean, bulleted "Pros and Cons" list.
      Keep it very concise.
      
      Reviews:
      Rating: 5/5. Comment: Best tacos in town, fast delivery!
      Rating: 2/5. Comment: Tacos were a bit cold when they arrived.
      Rating: 4/5. Comment: Great flavor but a little pricey.
      
      Output format:
      **Pros:**
      - [Pro 1]
      
      **Cons:**
      - [Con 1]
    `;
    const result2 = await model.generateContent(prompt2);
    console.log("[SUCCESS] Summary:\n", result2.response.text().trim());
    
  } catch (err) {
    console.error("[ERROR] API Call failed:", err.message);
  }
};

testAI();
