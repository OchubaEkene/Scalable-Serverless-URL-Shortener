const dynamoDb = require('../utils/dbClient');
const { URLS_TABLE } = require('../config');

/**
 * Lambda handler to redirect from short code to original URL.
 * URL path parameter: code
 * Checks expiration and increments click count.
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
        body: 'URL not found',
      };
    }

    const { originalUrl, expiresAt } = data.Item;
    const now = Math.floor(Date.now() / 1000);

    if (expiresAt && expiresAt < now) {
      return {
        statusCode: 410, // Gone
        body: 'URL has expired',
      };
    }

    // Increment click count atomically
    const updateParams = {
      TableName: URLS_TABLE,
      Key: { code },
      UpdateExpression: 'SET clickCount = if_not_exists(clickCount, :start) + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':start': 0,
      },
    };

    await dynamoDb.update(updateParams).promise();

    // Redirect with 301 permanent redirect
    return {
      statusCode: 301,
      headers: {
        Location: originalUrl,
      },
      body: null,
    };
  } catch (error) {
    console.error('Redirect error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};
