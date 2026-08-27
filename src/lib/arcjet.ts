import arcjet, { shield, detectBot, slidingWindow, validateEmail } from "@arcjet/next";

const arcjetKey = process.env.ARCJET_KEY || "ajkey_development_key";

/**
 * Global Edge Security Shield
 * Protects application against malicious bots, automated scraping, and common web attacks.
 */
export const aj = arcjet({
  key: arcjetKey,
  rules: [
    shield({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
    }),
    detectBot({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
    slidingWindow({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      interval: "1m",
      max: 120, // 120 requests per minute per IP
    }),
  ],
});

/**
 * Dedicated Email OTP Protection Guard
 * Rate-limits OTP generation and blocks disposable/temporary email addresses.
 */
export const emailOtpAj = arcjet({
  key: arcjetKey,
  rules: [
    validateEmail({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
    }),
    slidingWindow({
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
      interval: "10m",
      max: 5, // Max 5 OTP requests per 10 minutes per IP
    }),
  ],
});

export default aj;
