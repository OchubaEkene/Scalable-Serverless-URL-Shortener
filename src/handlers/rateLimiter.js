const dynamoDb = require('../utils/dbClient');
const { RATELIMIT_TABLE, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } = require('../config');

async function checkRateLimit(ip) {
  const now = Math.floor(Date.now() / 1000);

  try {
    const params = {
      TableName: RATELIMIT_TABLE,
      Key: { ip },
    };

    const data = await dynamoDb.get(params).promise();

    if (!data.Item) {
      await dynamoDb.put({
        TableName: RATELIMIT_TABLE,
        Item: { ip, count: 1, lastResetTime: now },
      }).promise();
      return true;
    }

    const { count, lastResetTime } = data.Item;

    if (now - lastResetTime > RATE_LIMIT_WINDOW) {
      await dynamoDb.update({
        TableName: RATELIMIT_TABLE,
        Key: { ip },
        UpdateExpression: 'SET count = :count, lastResetTime = :time',
        ExpressionAttributeValues: { ':count': 1, ':time': now },
      }).promise();
      return true;
    }

    if (count >= RATE_LIMIT_MAX) {
      return false;
    }

    await dynamoDb.update({
      TableName: RATELIMIT_TABLE,
      Key: { ip },
      UpdateExpression: 'SET count = count + :incr',
      ConditionExpression: 'count < :max',
      ExpressionAttributeValues: { ':incr': 1, ':max': RATE_LIMIT_MAX },
    }).promise();

    return true;
  } catch (err) {
    console.error('Rate limiter error:', err);
    return true; // fail open if error
  }
}

module.exports = { checkRateLimit };
