import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Check if API key exists
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing in .env file");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ✅ MODEL LIST ENDPOINT (working now)
app.get("/api/models", async (req, res) => {
  try {
    const models = await groq.models.list();
    const modelIds = models.data.map(m => m.id);
    console.log("📋 Available models:", modelIds);
    res.json({ models: modelIds });
  } catch (error) {
    console.error("❌ Error fetching models:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ CHAT ENDPOINT
app.post("/api/chat", async (req, res) => {
  try {
    const { message, profileData } = req.body;
    
    console.log("📩 Received message:", message);

    const prompt = `
You are ${profileData.name} AI assistant.

IMPORTANT:
- Answer ONLY based on profileData
- Keep answers modern and clean
- Use lists and spacing
- Be concise
- Show links clearly
- Use emojis where appropriate

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

USER QUESTION:
${message}
`;

    console.log("🤖 Sending to Groq...");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // ✅ USE ONE OF THESE WORKING MODELS:
      model: "qwen/qwen3.8-27b",  // Recommended - best performance
      // model: "openai/gpt-oss-20b",  // Alternative
      // model: "openai/gpt-oss-120b", // More powerful but slower
      // model: "allam-2-7b",          // Fastest option
    });

    const response = chatCompletion.choices[0]?.message?.content || "No response";
    console.log("✅ Response sent");
    res.json({ response });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Check models: http://localhost:${PORT}/api/models`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🤖 Using model: qwen/qwen3.8-27b`);
});