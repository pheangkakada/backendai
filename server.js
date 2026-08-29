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

// ===== MODEL LIST ENDPOINT =====
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

// ===== TEST ENDPOINT =====
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "Server is running!", 
    time: new Date().toISOString(),
    message: "AI Portfolio Assistant is ready 🚀"
  });
});

// ===== MAIN CHAT ENDPOINT =====
app.post("/api/chat", async (req, res) => {
  try {
    const { message, profileData } = req.body;
    
    console.log("📩 Received message:", message);

    // Clean system prompt - NO ASTERISKS AT ALL
    const systemPrompt = `You are a helpful AI assistant for ${profileData.name}'s portfolio.

CRITICAL RULES:
- NEVER use asterisks (*) for any reason
- NEVER use bold or italic formatting
- NEVER use markdown
- Use emojis for headers
- Use colons (:) to separate labels from content
- Use bullet points (•) for lists
- Show links as plain URLs
- Keep responses clean and scannable

FORMAT EXAMPLES:

Projects:
🚀 Project Name
• Description: Brief description
• Tech Stack: React, Node.js, MongoDB
• Key Features: Feature 1, Feature 2
• Links: GitHub: https://github.com/... | Live: https://...

Skills:
💻 Frontend: React, Next.js, TypeScript, Tailwind CSS
⚙️ Backend: Node.js, Express, MongoDB, PostgreSQL
🛠️ Tools: Git, Docker, Figma, Vercel, AWS

Contact:
📧 Email: email@example.com
💬 Telegram: https://t.me/username
🐙 GitHub: https://github.com/username
🔗 LinkedIn: https://linkedin.com/in/username

About:
👋 About ${profileData.name}
[2-3 sentence professional summary]

🎓 Education: Degree at Institution (Year)
💼 Experience: Role at Company (Period)

Remember: ABSOLUTELY NO ASTERISKS anywhere in your response.`;

    // Build the user prompt
    let userPrompt = `Here is the portfolio data:\n\`\`\`json\n${JSON.stringify(profileData, null, 2)}\n\`\`\`\n\n`;
    userPrompt += `User Question: ${message}\n\n`;
    userPrompt += `Provide a clean response with NO ASTERISKS. Use emojis, colons, and bullet points only.`;

    console.log("🤖 Generating clean response...");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        },
      ],
      model: "qwen/qwen3.8-27b",
      temperature: 0.2,
      max_tokens: 700,
      top_p: 0.8,
    });

    let response = chatCompletion.choices[0]?.message?.content || "No response";
    
    // Aggressively remove ALL asterisks
    response = response
      .replace(/\*\*/g, '')  // Remove bold
      .replace(/\*/g, '')    // Remove ALL asterisks
      // Convert markdown links to plain text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        url = url.replace(/[)]+$/, '');
        return `${text}: ${url}`;
      })
      // Remove parentheses around URLs
      .replace(/\(https?:\/\/[^\s)]+\)/g, (match) => {
        return match.replace(/[()]/g, '');
      })
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove any remaining brackets
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      // Clean up extra spaces and lines
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Final check - remove any remaining asterisks
    response = response.replace(/\*/g, '');

    console.log("✅ Clean response sent");
    res.json({ response });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    model: "qwen/qwen3.8-27b"
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🤖 Using model: qwen/qwen3.8-27b`);
  console.log(`📋 Zero asterisk formatting enabled`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   • GET  /api/test     - Test server`);
  console.log(`   • GET  /api/models   - List available models`);
  console.log(`   • GET  /api/health   - Health check`);
  console.log(`   • POST /api/chat     - Chat with AI`);
  console.log(`\n✅ Server is ready to accept requests!\n`);
});