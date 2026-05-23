import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API constraints check
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && !ai) {
       res.status(500).json({ error: "Gemini API key is missing. Configure it in settings." });
       return;
    }
    next();
  });

  app.post("/api/translate-letter", async (req, res) => {
    try {
      const { instruction, style = 'official' } = req.body;
      const prompt = `
You are an expert translator and assistant to an Executive Director in Uzbekistan.
Translate the following Russian instructions into a highly polished, clean, official Uzbek Latin language letter.
Style: ${style} (Official, clean, without fluff).
If there is ambiguity, note it at the end. Check if the instruction sounds too harsh or weak. And provide a tone analysis.

Instructions:
${instruction}

Please return the response as JSON:
{
  "subject": "Proposed Letter Subject in Uzbek Latin",
  "bodyUzbek": "The full translated letter ready for sending",
  "toneAnalysis": "Analysis of the original instruction's tone (e.g., sharp, demanding, neutral, weak)",
  "warnings": "Any warnings about ambiguity or inappropriate tone in the original instructions"
}`;
      const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/process-meeting", async (req, res) => {
    try {
      const { notes } = req.body;
      const prompt = `
Analyze the following meeting notes and generate a structured protocol.
Identify key decisions and actionable tasks. Translate decisions into Uzbek Latin if they involve instructions.
Return as JSON:
{
  "agenda": "Summarized agenda",
  "decisions": ["Decision 1", "Decision 2"],
  "tasks": [
    { "title": "Task title", "assignee": "Department or Person if mentioned", "deadline": "Deadline if mentioned" }
  ]
}

Meeting notes:
${notes}`;
      const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/executive-summary", async (req, res) => {
    try {
      const { reportText } = req.body;
      const prompt = `
Create an executive summary for the General Director based on the following report.
Find risks, suggest next steps, and generate options for decisions.
Return as JSON:
{
  "summaryRu": "Brief summary in Russian",
  "summaryUz": "Brief summary translated to Uzbek Latin",
  "risks": ["Risk 1", "Risk 2"],
  "nextSteps": ["Step 1", "Step 2"],
  "proposedDecisions": ["Option A", "Option B"]
}

Report Text:
${reportText}`;
      const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
