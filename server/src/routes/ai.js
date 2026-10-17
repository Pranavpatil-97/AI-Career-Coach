import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import requireAuth from '../../middleware/auth.js';

const router = Router();
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const coachLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
let ai;

router.use(requireAuth);

router.post('/coach', coachLimiter, async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > 8000) return res.status(400).json({ error: 'message must be 8000 characters or fewer' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI coaching is not configured.' });

  try {
    ai ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      contents: message,
      config: {
        systemInstruction: 'You are a helpful career coach. Give concise, practical advice.',
      },
    });
    if (typeof response.text !== 'string' || !response.text.trim()) {
      console.error('Gemini returned an empty response.');
      return res.status(502).json({ error: 'AI request failed' });
    }
    res.json({ reply: response.text });
  } catch (error) {
    console.error('Gemini request failed:', error.message);
    res.status(502).json({ error: 'AI request failed' });
  }
});

export default router;
