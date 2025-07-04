# Scalable Serverless URL Shortener

A scalable, serverless URL shortening service built with AWS Lambda, API Gateway, and DynamoDB, deployed via the Serverless Framework.

---

## Features

- Create short URLs with optional expiration time  
- Redirect short URLs to original URLs  
- URL expiration supported via DynamoDB TTL (automatic deletion)  
- Rate limiting per IP address (e.g., max 10 URL creations per hour) to prevent abuse  
- Analytics endpoint for click counts per short URL  
- Fully serverless architecture — no servers to manage  
- Infrastructure as code with Serverless Framework (`serverless.yml`)

---

## Architecture Overview

- **API Gateway**: exposes HTTP endpoints  
- **AWS Lambda**: handles backend logic (Node.js)  
- **DynamoDB**: two tables —  
  - `Urls`: stores code, original URL, expiration timestamp, and analytics data  
  - `RateLimits`: tracks IP addresses and their request counts for rate limiting  
- **Rate Limiting**: protects system from abuse by limiting URL creation per IP per hour  
- **TTL (Time to Live)**: DynamoDB automatically deletes expired URLs

---

## Getting Started

### Prerequisites

- Node.js v18.x or newer  
- Serverless Framework CLI (`npm install -g serverless`)  
- AWS account with appropriate IAM permissions configured in AWS CLI

### Installation & Deployment

1. Clone this repository:

    ```bash
    git clone https://github.com/yourusername/url-shortener.git
    cd url-shortener
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Deploy to AWS:

    ```bash
    npx serverless deploy
    ```

---

## Usage

### Create a Short URL

Send a POST request with the original URL and optional expiration time (in seconds):

```bash
curl -X POST https://YOUR_API_GATEWAY_URL/dev/shorten \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://openai.com", "expiresInSeconds": 3600}'

Response:
{
  "shortUrl": "https://YOUR_API_GATEWAY_URL/dev/abc123",
  "code": "abc123",
  "originalUrl": "https://openai.com",
  "expiresAt": 1751668416
}

Redirect
Visit the short URL in a browser:
https://YOUR_API_GATEWAY_URL/dev/abc123
It will redirect you to the original URL.

Analytics
Check how many times a short URL was accessed:
curl https://YOUR_API_GATEWAY_URL/dev/analytics/abc123
Returns JSON with click counts and other analytics data.

Configuration
RATE_LIMIT_MAX (default: 10) — max URL creations per IP per window
RATE_LIMIT_WINDOW (default: 3600 seconds) — window size for rate limiting
Tables Urls and RateLimits are automatically created during deployment
These values are configurable in serverless.yml under provider.environment.

Folder Structure
.
├── src/
│   ├── handlers/            # Lambda function handlers
│   │   ├── createShortUrl.js
│   │   ├── redirect.js
│   │   └── analytics.js
│   ├── utils/               # Helper modules (e.g., DynamoDB client, rate limiter)
│   └── config.js            # Configuration constants
├── serverless.yml           # Serverless Framework configuration & infra as code
├── package.json
└── README.md