const { v4: uuidv4 } = require('uuid');

// Generate a short 6-character alphanumeric code
function generateCode() {
  return uuidv4().slice(0, 6);
}

module.exports = generateCode;
