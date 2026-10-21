/**
 * Model and application configuration for "Ask about Erik".
 * This is the single place to configure the Gemini model and system timeouts.
 */
export const CONFIG = {
  // Configured Gemini model.
  // gemini-3.1-flash-lite provides sub-second TTFT with verified free-tier access in this environment.
  // Note: Do not switch silently to paid models (e.g. gemini-4-argon).
  model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',

  // Request timeout in milliseconds (60 seconds with bounded retry to safely absorb upstream queue spikes)
  timeoutMs: 60000,
};
