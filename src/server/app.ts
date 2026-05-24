import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const generateAICompletion = async ({
  prompt,
  systemPrompt,
  req,
  jsonMode = true
}: {
  prompt: string;
  systemPrompt?: string;
  req: express.Request;
  jsonMode?: boolean;
}): Promise<any> => {
  const activeProvider = (req.headers['x-active-provider'] as string) || 'gemini';
  const customKey = req.headers[`x-${activeProvider}-key`] as string;
  
  let apiKey = customKey;
  if (!apiKey) {
    if (activeProvider === 'gemini') apiKey = process.env.GEMINI_API_KEY;
    else if (activeProvider === 'openai') apiKey = process.env.OPENAI_API_KEY;
    else if (activeProvider === 'anthropic') apiKey = process.env.ANTHROPIC_API_KEY;
    else if (activeProvider === 'deepseek') apiKey = process.env.DEEPSEEK_API_KEY;
  }

  if (!apiKey) {
    throw new Error(`API key for ${activeProvider} is missing. Please check Settings.`);
  }

  switch (activeProvider) {
    case 'gemini': {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt ? systemPrompt + "\n\n" : ""}Request:\n${prompt}` }]
          }
        ],
        generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return jsonMode ? JSON.parse(cleanJsonText(text)) : text;
    }
    
    case 'openai': {
      const url = 'https://api.openai.com/v1/chat/completions';
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });
      
      const payload = {
        model: 'gpt-4o-mini',
        messages,
        response_format: jsonMode ? { type: "json_object" } : undefined
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return jsonMode ? JSON.parse(cleanJsonText(text)) : text;
    }

    case 'anthropic': {
      const url = 'https://api.anthropic.com/v1/messages';
      const userPrompt = jsonMode 
        ? `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. Do not include markdown code block wrapping (like \`\`\`json). Just return the JSON object directly.`
        : prompt;

      const payload = {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: userPrompt }]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      return jsonMode ? JSON.parse(cleanJsonText(text)) : text;
    }

    case 'deepseek': {
      const url = 'https://api.deepseek.com/chat/completions';
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });
      
      const payload = {
        model: 'deepseek-chat',
        messages,
        response_format: jsonMode ? { type: "json_object" } : undefined
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return jsonMode ? JSON.parse(cleanJsonText(text)) : text;
    }

    default:
      throw new Error(`Unsupported AI provider: ${activeProvider}`);
  }
};

function cleanJsonText(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

// API constraints check middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') && req.path !== '/api/health') {
     const activeProvider = (req.headers['x-active-provider'] as string) || 'gemini';
     const customKey = req.headers[`x-${activeProvider}-key`] as string;
     
     let apiKey = customKey;
     if (!apiKey) {
       if (activeProvider === 'gemini') apiKey = process.env.GEMINI_API_KEY;
       else if (activeProvider === 'openai') apiKey = process.env.OPENAI_API_KEY;
       else if (activeProvider === 'anthropic') apiKey = process.env.ANTHROPIC_API_KEY;
       else if (activeProvider === 'deepseek') apiKey = process.env.DEEPSEEK_API_KEY;
     }
     
     if (!apiKey) {
        res.status(400).json({ error: `API key for active provider (${activeProvider}) is missing. Configure it in settings or environment variables.` });
        return;
     }
  }
  next();
});

app.post("/api/translate-letter", async (req, res) => {
  try {
    const { instruction, style = 'official' } = req.body;
    const systemPrompt = `You are an expert translator and assistant to an Executive Director in Uzbekistan.
Translate the following Russian instructions into a highly polished, clean, official Uzbek Latin language letter.
Style: ${style} (Official, clean, without fluff).
If there is ambiguity, note it at the end. Check if the instruction sounds too harsh or weak. And provide a tone analysis.

Please return the response as JSON:
{
  "subject": "Proposed Letter Subject in Uzbek Latin",
  "bodyUzbek": "The full translated letter ready for sending",
  "toneAnalysis": "Analysis of the original instruction's tone (e.g., sharp, demanding, neutral, weak)",
  "warnings": "Any warnings about ambiguity or inappropriate tone in the original instructions"
}`;
    const data = await generateAICompletion({
      prompt: `Translate instructions:\n${instruction}`,
      systemPrompt,
      req,
      jsonMode: true
    });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/process-meeting", async (req, res) => {
  try {
    const { notes } = req.body;
    const systemPrompt = `Analyze the following meeting notes and generate a structured protocol.
Identify key decisions and actionable tasks. Translate decisions into Uzbek Latin if they involve instructions.
Return as JSON:
{
  "agenda": "Summarized agenda",
  "decisions": ["Decision 1", "Decision 2"],
  "tasks": [
    { "title": "Task title", "assignee": "Department or Person if mentioned", "deadline": "Deadline if mentioned" }
  ]
}`;
    const data = await generateAICompletion({
      prompt: `Meeting notes:\n${notes}`,
      systemPrompt,
      req,
      jsonMode: true
    });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/executive-summary", async (req, res) => {
  try {
    const { reportText } = req.body;
    const systemPrompt = `Create an executive summary for the General Director based on the following report.
Find risks, suggest next steps, and generate options for decisions.
Return as JSON:
{
  "summaryRu": "Brief summary in Russian",
  "summaryUz": "Brief summary translated to Uzbek Latin",
  "risks": ["Risk 1", "Risk 2"],
  "nextSteps": ["Step 1", "Step 2"],
  "proposedDecisions": ["Option A", "Option B"]
}`;
    const data = await generateAICompletion({
      prompt: `Report Text:\n${reportText}`,
      systemPrompt,
      req,
      jsonMode: true
    });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/analyze-context", async (req, res) => {
  try {
    const { prompt, systemPrompt } = req.body;
    const data = await generateAICompletion({
      prompt,
      systemPrompt,
      req,
      jsonMode: true
    });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export { app };
