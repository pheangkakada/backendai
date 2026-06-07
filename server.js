import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import profileData from "../src/AIagent/profileData.js";

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

app.post("/api/chat", async (req, res) => {
  try {
    const { message, profileData } = req.body;

    // AI reads directly from profileData
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

    const ollamaResponse = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "phi3",

          prompt,

          stream: false,
        }),
      }
    );

    const data = await ollamaResponse.json();

    res.json({
      response: data.response,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "AI failed",
    });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
