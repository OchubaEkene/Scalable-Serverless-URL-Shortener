module.exports = {
    URLS_TABLE: process.env.URLS_TABLE,
    RATELIMIT_TABLE: process.env.RATELIMIT_TABLE,
    RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 10,
    RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW) || 3600,
  };
  