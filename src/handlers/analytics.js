const dynamoDb = require('../utils/dbClient');
const { URLS_TABLE } = require('../config');

/**
 * Lambda handler to get analytics for a short URL.
 * URL path parameter: code
 * Returns total clicks and metadata.
 */
exports.handler = async (event) => {
  const code = event.pathParameters.code;

  try {
    const getParams = {
      TableName: URLS_TABLE,
      Key: { code },
    };

    const data = await dynamoDb.get(getParams).promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'URL not found' }),
      };
    }

    const { originalUrl, createdAt, expiresAt, clickCount } = data.Item;

    return {
      statusCode: 200,
      body: JSON.stringify({
        code,
        originalUrl,
        createdAt,
        expiresAt,
        clickCount,
      }),
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
