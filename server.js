import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

app.post("/api/chat", async (req, res) => {
  try {
    const { message, profileData } = req.body;

    const prompt = `
You are ${profileData.name} AI assistant.

IMPORTANT:
- Answer ONLY based on profileData
- If information is not in profileData, say:
  "I don't have information about that yet."
- Follow all aiBehavior and rules from profileData
- Keep answers modern and clean
- Use lists and spacing for readability
- Do not write long paragraphs
- use simple english and be concise
- Always show links clearly
- When user asks about projects, show project details in clean list/card format with links
- When user asks about skills, group them by frontend, backend, and tools
- When user asks about contact, show all contact links in clean readable format
- When user asks about you, answer professionally and clearly based on profileData
- Always act like a helpful, modern, and professional AI assistant
- Use emojis naturally to make answers friendly and engaging

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

USER QUESTION:
${message}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    res.json({
      response,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "AI failed",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});