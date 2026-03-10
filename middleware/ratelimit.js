import rateLimit from 'express-rate-limit';

export const rateLimiters = {
  api: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => !!req.headers.authorization,
    message: { error: 'Too many requests, please try again later.' },
  }),

  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many login attempts, please try again later.' },
  }),
};