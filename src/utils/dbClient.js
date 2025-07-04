const AWS = require('aws-sdk');

// Create DynamoDB Document Client (high-level abstraction)
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports = dynamoDb;
