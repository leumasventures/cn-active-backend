import rateLimit from 'express-rate-limit';

export const rateLimiters = {
  api: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,                    // ← was 100, too low for your sync pattern
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !!req.headers.authorization, // ← skip authenticated requests entirely
    message: { error: 'Too many requests, please try again later.' },
  }),

  auth: rateLimit({              // ← separate strict limiter for login only
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
  }),
};