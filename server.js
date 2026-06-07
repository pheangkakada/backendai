import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, profileData } = req.body;

    const prompt = `
You are ${profileData.name} AI assistant.

IMPORTANT:
- Answer ONLY based on profileData
- Keep answers modern and clean
- Use lists and spacing
- Be concise
- Show links clearly
- use emojis where appropriate 

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

USER QUESTION:
${message}
`;

    const chatCompletion =
      await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        model: "llama-3.3-70b-versatile",
      });

    const response =
      chatCompletion.choices[0]?.message?.content ||
      "No response";

    res.json({
      response,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});