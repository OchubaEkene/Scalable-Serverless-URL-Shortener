const dynamoDb = require('../utils/dbClient');
const generateCode = require('../utils/generateCode');
const { URLS_TABLE } = require('../config');
const { checkRateLimit } = require('./rateLimiter');

/**
 * Lambda handler to create a short URL.
 * Body JSON: { originalUrl: string, expiresInSeconds: number (optional) }
 * Rate limit enforced per IP.
 */
exports.handler = async (event) => {
  try {
    const ip = event.requestContext.identity.sourceIp || 'unknown';

    // Check rate limit
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return {
        statusCode: 429,
        body: JSON.stringify({ message: 'Rate limit exceeded. Please try again later.' }),
      };
    }

    const body = JSON.parse(event.body);
    const { originalUrl, expiresInSeconds } = body;

    if (!originalUrl || !/^https?:\/\//i.test(originalUrl)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid or missing originalUrl. Must start with http:// or https://' }),
      };
    }

    // Generate unique short code
    let code = generateCode();

    // Check uniqueness in DB, regenerate if collision (very rare)
    const getParams = {
      TableName: URLS_TABLE,
      Key: { code },
    };

    let exists = await dynamoDb.get(getParams).promise();
    while (exists.Item) {
      code = generateCode();
      getParams.Key.code = code;
      exists = await dynamoDb.get(getParams).promise();
    }

    // Calculate expiration timestamp if provided
    let expiresAt = null;
    if (expiresInSeconds && Number.isInteger(expiresInSeconds) && expiresInSeconds > 0) {
      expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    }

    const putParams = {
      TableName: URLS_TABLE,
      Item: {
        code,
        originalUrl,
        createdAt: Math.floor(Date.now() / 1000),
        expiresAt,       // DynamoDB TTL attribute
        clickCount: 0,
      },
    };

    await dynamoDb.put(putParams).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({
        shortUrl: `${event.headers['X-Forwarded-Proto'] || 'https'}://${event.headers.Host}/${code}`,
        code,
        originalUrl,
        expiresAt,
      }),
    };
  } catch (error) {
    console.error('Error creating short URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
