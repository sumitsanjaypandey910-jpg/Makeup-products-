import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
    return {
      status: 403,
      message: 'Gemini API authentication failed. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (lower.includes('429') || lower.includes('resource_exhausted')) {
    return {
      status: 429,
      message: 'Gemini API rate or quota limit reached. Please wait briefly or check your billing quota in Settings > Secrets.',
    };
  }
  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 404,
      message: 'Requested Gemini model was not found. Please check model configuration.',
    };
  }
  return { status: 500, message: raw || 'Failed to generate AI response.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    const aiConfigured = Boolean(getAiClient());
    res.json({ ok: true, aiConfigured });
  });

  // 1. AI Facial Skin Analysis (Cosmetic observations only)
  app.post('/api/ai/skin-analysis', async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured. Configure GEMINI_API_KEY in Settings > Secrets to enable AI skin analysis.',
        });
      }

      const { imageBase64, mimeType, customerName, lightingNote, availableCategories } = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return res.status(400).json({ error: 'A facial photograph (base64) is required for analysis.' });
      }

      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const safeMime = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

      const prompt = [
        `You are a cosmetic beauty-salon skin observation assistant helping an aesthetician review a client photograph.`,
        customerName ? `Client Name: ${customerName}` : '',
        lightingNote ? `Capture / Lighting Conditions: ${lightingNote}` : '',
        Array.isArray(availableCategories) && availableCategories.length > 0
          ? `Available Salon Service Categories: ${availableCategories.join(', ')}`
          : '',
        `SAFETY RULES (MANDATORY):`,
        `- Never diagnose skin diseases, infections, skin cancer, rosacea, melasma, dermatitis, or any medical condition.`,
        `- Never prescribe medication or claim medical-grade accuracy.`,
        `- Clearly state that visual observations are approximate cosmetic assessments based solely on the provided image and lighting.`,
        `- Advise referring any concerning, changing, or persistent skin lesions to a qualified dermatologist.`,
        `- Describe visible cosmetic skin characteristics across all 7 areas: visible acne-like blemishes, pigmentation and dark spots, skin texture, visible pores, fine lines, visible redness, and general appearance of skin.`,
        `- Provide facial zone observations for Forehead, T-Zone & Nose, Left Cheek, Right Cheek, Eye Contour, and Chin & Jawline.`,
        `- Provide gentle everyday cosmetic skincare suggestions, suitable salon treatment categories, and a suggested cosmetic follow-up interval in days (e.g. 21-35).`,
      ]
        .filter(Boolean)
        .join('\n');

      const skinSchema = {
        type: Type.OBJECT,
        properties: {
          disclaimer: { type: Type.STRING, description: 'Clear non-medical cosmetic disclaimer.' },
          faceDetectedNote: { type: Type.STRING, description: 'Note on face visibility, framing, and lighting.' },
          summary: { type: Type.STRING, description: 'Warm 2-3 sentence overall cosmetic skin appearance summary.' },
          skinAppearanceType: { type: Type.STRING, description: 'Cosmetic appearance type, e.g. Combination / Sensitive Cheeks.' },
          characteristics: {
            type: Type.ARRAY,
            description: 'Exactly 7 cosmetic observation cards covering blemishes, dark spots, texture, pores, fine lines, redness, and general appearance.',
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                label: { type: Type.STRING },
                level: { type: Type.STRING },
                confidence: { type: Type.STRING },
                observation: { type: Type.STRING },
              },
              required: ['key', 'label', 'level', 'confidence', 'observation'],
            },
          },
          zones: {
            type: Type.ARRAY,
            description: 'Exactly 6 facial zones: Forehead, T-Zone & Nose, Left Cheek, Right Cheek, Eye Contour, Chin & Jawline.',
            items: {
              type: Type.OBJECT,
              properties: {
                zone: { type: Type.STRING },
                focus: { type: Type.STRING },
                observation: { type: Type.STRING },
                intensity: { type: Type.STRING },
              },
              required: ['zone', 'focus', 'observation', 'intensity'],
            },
          },
          skincareSuggestions: {
            type: Type.ARRAY,
            description: '3 to 5 gentle everyday cosmetic skincare suggestions.',
            items: { type: Type.STRING },
          },
          recommendedSalonCategories: {
            type: Type.ARRAY,
            description: 'Suitable salon treatment categories from the provided list.',
            items: { type: Type.STRING },
          },
          suggestedFollowUpDays: { type: Type.INTEGER, description: 'Suggested follow-up interval in days (21-35).' },
        },
        required: [
          'disclaimer',
          'faceDetectedNote',
          'summary',
          'skinAppearanceType',
          'characteristics',
          'zones',
          'skincareSuggestions',
          'recommendedSalonCategories',
          'suggestedFollowUpDays',
        ],
      };

      let parsed: Record<string, unknown> = {};
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: safeMime,
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            systemInstruction:
              'You provide non-medical, cosmetic-only skin appearance observations for licensed beauty parlour consultations. Keep tone warm, clear, honest about photo limitations, and strictly non-diagnostic. Always populate all 7 characteristics and all 6 facial zones with real observations.',
            responseMimeType: 'application/json',
            responseSchema: skinSchema,
          },
        });

        parsed = JSON.parse((response.text ?? '{}').trim());
        const chars = Array.isArray(parsed.characteristics) ? parsed.characteristics : [];
        const zones = Array.isArray(parsed.zones) ? parsed.zones : [];
        if (chars.length > 0 && zones.length > 0 && typeof parsed.summary === 'string' && parsed.summary.length > 10) {
          break;
        }
      }

      const finalChars = Array.isArray(parsed.characteristics) ? parsed.characteristics : [];
      if (finalChars.length === 0) {
        return res.status(502).json({
          error: 'Skin observation response was incomplete. Please try analyzing the photograph again.',
        });
      }

      return res.json({ analysis: parsed, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. AI Beauty Assistant (with optional Google Search Grounding)
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured. Configure GEMINI_API_KEY in Settings > Secrets to use the AI Beauty Assistant.',
        });
      }

      const { question, customerContext, scanSummary, useSearchGrounding } = req.body ?? {};
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'A question or prompt is required.' });
      }

      const contextBlock = [
        customerContext ? `Customer Profile Context: ${customerContext}` : '',
        scanSummary ? `Latest Cosmetic Skin Observation Summary: ${scanSummary}` : '',
        `Staff Question: ${question}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const config: Record<string, unknown> = {
        systemInstruction:
          'You are BeautyOS AI Beauty Assistant, helping salon aestheticians and front-desk staff explain cosmetic skin observations in plain, warm language, suggest gentle AM/PM skincare routines, recommend salon service categories, suggest follow-up intervals, and answer general beauty care questions. CRITICAL SAFETY RULE: Never diagnose medical skin diseases, never prescribe medication, and always remind users to consult a dermatologist for persistent or concerning skin changes.',
      };

      if (useSearchGrounding !== false) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: contextBlock,
        config,
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c: { web?: { uri?: string; title?: string } }) => c.web)
        .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
        .map((w) => ({ uri: w.uri, title: w.title || w.uri }));

      return res.json({
        reply: response.text ?? '',
        sources,
        model: 'gemini-4-hydrogen',
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Personalized WhatsApp Message Drafter
  app.post('/api/ai/whatsapp-draft', async (req, res) => {
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY is not configured.',
        });
      }

      const { customerName, campaignType, contextNote, parlourName } = req.body ?? {};
      if (!customerName || !campaignType) {
        return res.status(400).json({ error: 'Customer name and campaign type are required.' });
      }

      const prompt = `Draft a warm, refined, concise WhatsApp message (max 65 words, no emojis overload, luxury salon tone) from "${parlourName || 'our beauty studio'}" to client "${customerName}".
Campaign Type: ${campaignType}
Additional Context: ${contextNote || 'Routine beauty care and appreciation'}
Include a polite opt-out note at the end if promotional. Output only the message text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
      });

      return res.json({ message: (response.text ?? '').trim() });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Serve Vite in dev, or built static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BeautyOS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BeautyOS server:', err);
  process.exit(1);
});
