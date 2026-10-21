import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from './server/config.ts';
import { getSystemPrompt } from './server/erikProfile.ts';

dotenv.config();


const app = express();

app.use(express.json());

// Initialize server-side Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
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

// Health and status endpoint
app.get('/api/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    configuredModel: CONFIG.model,
    hasApiKey: hasValidApiKey,
  });
});

// Helper to categorize errors cleanly for visitor messages & diagnostics
function categorizeGeminiError(err: unknown): {
  category: 'authentication_error' | 'quota_exceeded' | 'model_unavailable' | 'upstream_error' | 'timeout';
  userMessage: string;
  statusCode: number;
  technicalDetails: string;
} {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errStack = err instanceof Error ? err.stack : '';

  // Log safe diagnostic server-side
  console.error('[Gemini API Diagnostics]', {
    message: errMsg,
    stack: errStack,
    configuredModel: CONFIG.model,
    timestamp: new Date().toISOString(),
  });

  const lower = errMsg.toLowerCase();

  if (
    lower.includes('api_key') ||
    lower.includes('api key') ||
    lower.includes('unauthenticated') ||
    lower.includes('permission_denied') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return {
      category: 'authentication_error',
      userMessage: 'Authentication with Gemini failed. Please check your GEMINI_API_KEY secret in Settings > Secrets.',
      statusCode: 401,
      technicalDetails: errMsg,
    };
  }

  if (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('429') ||
    lower.includes('rate limit')
  ) {
    return {
      category: 'quota_exceeded',
      userMessage: 'The Gemini free tier request limit or quota has been reached. Please wait a moment before trying again.',
      statusCode: 429,
      technicalDetails: errMsg,
    };
  }

  if (
    lower.includes('not found') ||
    lower.includes('404') ||
    lower.includes('model not found') ||
    lower.includes('is not supported')
  ) {
    return {
      category: 'model_unavailable',
      userMessage: `The configured model (${CONFIG.model}) is currently unavailable or unsupported in this region.`,
      statusCode: 404,
      technicalDetails: errMsg,
    };
  }

  if (lower.includes('timeout') || lower.includes('aborted') || lower.includes('timed out')) {
    return {
      category: 'timeout',
      userMessage: 'The response took longer than 30 seconds to arrive. You can retry your question.',
      statusCode: 504,
      technicalDetails: errMsg,
    };
  }

  return {
    category: 'upstream_error',
    userMessage: 'A temporary service interruption occurred while connecting to Gemini. You can retry your question.',
    statusCode: 502,
    technicalDetails: errMsg,
  };
}

// Single chat endpoint supporting both Server-Sent Events (SSE) streaming and direct JSON
app.post('/api/chat', async (req, res) => {
  const { message, history = [], stream = true, language = 'en' } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'invalid_request',
      message: 'Please provide a non-empty message.',
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    console.error('[Gemini API Diagnostics] GEMINI_API_KEY is not set or placeholder.');
    return res.status(401).json({
      error: 'authentication_error',
      message: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
      category: 'authentication_error',
    });
  }

  // Format conversational contents for @google/genai (keep context compact: last 6 messages)
  const contents = [];

  if (Array.isArray(history)) {
    const compactHistory = history.slice(-6);
    for (const h of compactHistory) {
      if (h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'model')) {
        contents.push({
          role: h.role,
          parts: [{ text: h.text }],
        });
      }
    }
  }

  // Add the current user query
  contents.push({
    role: 'user',
    parts: [{ text: message.trim() }],
  });

  const activeLang: 'en' | 'et' = language === 'et' ? 'et' : 'en';
  const systemInstruction = getSystemPrompt(activeLang);

  // Setup 30-second timeout
  let timeoutTriggered = false;
  const timeoutId = setTimeout(() => {
    timeoutTriggered = true;
  }, CONFIG.timeoutMs);

  try {
    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const responseStream = await ai.models.generateContentStream({
        model: CONFIG.model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      for await (const chunk of responseStream) {
        if (timeoutTriggered) {
          throw new Error('Request timed out.');
        }
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text, model: CONFIG.model })}\n\n`);
        }
      }

      clearTimeout(timeoutId);
      res.write(`data: ${JSON.stringify({ done: true, model: CONFIG.model })}\n\n`);
      res.end();
    } else {
      // Non-streaming fallback option
      const response = await ai.models.generateContent({
        model: CONFIG.model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.6,
        },
      });

      clearTimeout(timeoutId);

      if (timeoutTriggered) {
        throw new Error('Request timed out.');
      }

      const text = response.text || '';
      return res.json({
        text,
        model: CONFIG.model,
      });
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const classified = categorizeGeminiError(err);

    if (res.headersSent) {
      // If streaming headers were already sent, propagate the error through SSE
      res.write(
        `data: ${JSON.stringify({
          error: classified.category,
          message: classified.userMessage,
          category: classified.category,
          model: CONFIG.model,
          isError: true,
        })}\n\n`
      );
      res.end();
    } else {
      return res.status(classified.statusCode).json({
        error: classified.category,
        message: classified.userMessage,
        category: classified.category,
        model: CONFIG.model,
      });
    }
  }
});


export default app;
