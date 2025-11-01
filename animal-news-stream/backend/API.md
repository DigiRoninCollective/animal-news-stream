# Animal News Stream API Documentation

## Overview

The Animal News Stream API provides both REST and WebSocket endpoints for accessing and subscribing to animal news articles in real-time.

**Base URL (REST):** `http://localhost:3001/api`
**WebSocket URL:** `ws://localhost:3001`

---

## REST API Endpoints

### 1. Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-31T22:00:00.000Z",
  "connections": 5,
  "uptime": 3600.5
}
```

---

### 2. Get Articles

Retrieve a paginated list of articles.

**Endpoint:** `GET /api/articles`

**Query Parameters:**
- `limit` (optional): Number of articles to return (default: 10)
- `offset` (optional): Number of articles to skip (default: 0)
- `category` (optional): Filter by category

**Example:**
```bash
curl "http://localhost:3001/api/articles?limit=5&offset=0"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Amazing Animal Discovery",
      "description": "Scientists discover...",
      "content": "Full article content...",
      "url": "https://example.com/article",
      "image_url": "https://example.com/image.jpg",
      "source_name": "News Source",
      "author": "John Doe",
      "published_at": "2025-10-31T12:00:00Z",
      "category": "wildlife",
      "created_at": "2025-10-31T12:05:00Z",
      "updated_at": "2025-10-31T12:05:00Z"
    }
  ],
  "count": 5,
  "offset": 0,
  "limit": 5
}
```

---

### 3. Get Single Article

Retrieve a specific article by ID.

**Endpoint:** `GET /api/articles/:id`

**Example:**
```bash
curl "http://localhost:3001/api/articles/123e4567-e89b-12d3-a456-426614174000"
```

**Response:**
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Amazing Animal Discovery",
    "description": "Scientists discover...",
    ...
  }
}
```

**Error Response (404):**
```json
{
  "error": "Article not found"
}
```

---

### 4. Create Article

Create a new article (requires authentication in production).

**Endpoint:** `POST /api/articles`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "title": "New Animal Discovery",
  "description": "Short description",
  "content": "Full article content",
  "url": "https://example.com/unique-url",
  "image_url": "https://example.com/image.jpg",
  "source_name": "News Source",
  "author": "Jane Smith",
  "published_at": "2025-10-31T12:00:00Z",
  "category": "wildlife"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "url": "https://example.com/test",
    "category": "wildlife"
  }'
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Test Article",
    ...
  }
}
```

---

### 5. Search Articles

Search articles by title or description.

**Endpoint:** `GET /api/articles/search/:query`

**Query Parameters:**
- `limit` (optional): Maximum results (default: 10)

**Example:**
```bash
curl "http://localhost:3001/api/articles/search/dolphin?limit=5"
```

**Response:**
```json
{
  "data": [...],
  "query": "dolphin",
  "count": 3
}
```

---

### 6. WebSocket Status

Get information about active WebSocket connections.

**Endpoint:** `GET /api/ws/status`

**Response:**
```json
{
  "totalConnections": 3,
  "clients": [
    {
      "id": 1698765432123,
      "subscriptions": ["articles", "trending"],
      "connected": true
    }
  ]
}
```

---

## Trending Analytics Endpoints

### 7. Get Top Trending Articles

Get the top trending articles based on real-time analytics.

**Endpoint:** `GET /api/trending`

**Query Parameters:**
- `limit` (optional): Number of results (default: 10)

**Example:**
```bash
curl "http://localhost:3001/api/trending?limit=5"
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Amazing Animal Discovery",
      "category": "wildlife",
      "score": 245,
      "velocity": "12.50",
      "views": 150,
      "isHot": true,
      "age": 180
    }
  ],
  "count": 5
}
```

---

### 8. Get Word Cloud Data

Get trending word frequencies for visualization.

**Endpoint:** `GET /api/trending/word-cloud`

**Query Parameters:**
- `limit` (optional): Number of words (default: 50)

**Example:**
```bash
curl "http://localhost:3001/api/trending/word-cloud?limit=20"
```

**Response:**
```json
{
  "data": [
    {
      "word": "dolphin",
      "frequency": 45,
      "size": 9
    },
    {
      "word": "rescue",
      "frequency": 32,
      "size": 7
    }
  ],
  "count": 20
}
```

---

### 9. Get Category Trends

Get trending statistics by category.

**Endpoint:** `GET /api/trending/categories`

**Example:**
```bash
curl http://localhost:3001/api/trending/categories
```

**Response:**
```json
{
  "data": [
    {
      "category": "wildlife",
      "count": 45,
      "velocity": "2.50",
      "isHot": true,
      "lastUpdate": 1698765432000
    }
  ],
  "count": 5
}
```

---

### 10. Get Viral Velocity

Get the current viral velocity (articles per minute).

**Endpoint:** `GET /api/trending/velocity`

**Example:**
```bash
curl http://localhost:3001/api/trending/velocity
```

**Response:**
```json
{
  "data": {
    "articlesPerMinute": 5.25,
    "recentCount": 315,
    "windowMinutes": 60,
    "isViral": false,
    "timestamp": 1698765432000
  }
}
```

---

### 11. Get Complete Dashboard Data

Get all trending data in one request.

**Endpoint:** `GET /api/trending/dashboard`

**Example:**
```bash
curl http://localhost:3001/api/trending/dashboard
```

**Response:**
```json
{
  "data": {
    "topTrending": [...],
    "wordCloud": [...],
    "categoryTrends": [...],
    "viralVelocity": {...},
    "totalArticles": 1250,
    "timestamp": 1698765432000
  }
}
```

---

### 12. Get Trending Stats

Get analytics engine statistics.

**Endpoint:** `GET /api/trending/stats`

**Example:**
```bash
curl http://localhost:3001/api/trending/stats
```

**Response:**
```json
{
  "data": {
    "trackedArticles": 1250,
    "categories": 8,
    "uniqueWords": 5432,
    "recentActivity": 315
  }
}
```

---

### 13. Record Article View

Record a view for trending analytics.

**Endpoint:** `POST /api/articles/:id/view`

**Example:**
```bash
curl -X POST http://localhost:3001/api/articles/123e4567-e89b-12d3-a456-426614174000/view
```

**Response:**
```json
{
  "message": "View recorded",
  "articleId": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## WebSocket API

### Connection

Connect to the WebSocket server:

```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Message Format

All messages are JSON objects with the following structure:

```json
{
  "type": "message_type",
  "payload": { /* message-specific data */ }
}
```

---

### Client → Server Messages

#### 1. Subscribe to Channel

Subscribe to real-time updates for a specific channel.

```json
{
  "type": "subscribe",
  "payload": {
    "channel": "articles"
  }
}
```

**Response:**
```json
{
  "type": "subscribed",
  "channel": "articles",
  "message": "Subscribed to articles",
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 2. Unsubscribe from Channel

```json
{
  "type": "unsubscribe",
  "payload": {
    "channel": "articles"
  }
}
```

---

#### 3. Fetch Articles

Request articles through WebSocket.

```json
{
  "type": "fetch_articles",
  "payload": {
    "limit": 10,
    "offset": 0,
    "category": "wildlife"
  }
}
```

**Response:**
```json
{
  "type": "articles",
  "data": [...],
  "count": 10,
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 4. Search Articles

Search for articles via WebSocket.

```json
{
  "type": "search_articles",
  "payload": {
    "query": "dolphin",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "type": "search_results",
  "data": [...],
  "query": "dolphin",
  "count": 3,
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 5. Ping

Keep the connection alive.

```json
{
  "type": "ping"
}
```

**Response:**
```json
{
  "type": "pong",
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 6. Get Trending Articles

Request top trending articles via WebSocket.

```json
{
  "type": "get_trending",
  "payload": {
    "limit": 10
  }
}
```

**Response:**
```json
{
  "type": "trending",
  "data": [...],
  "count": 10,
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 7. Get Word Cloud

Request word cloud data.

```json
{
  "type": "get_word_cloud",
  "payload": {
    "limit": 50
  }
}
```

**Response:**
```json
{
  "type": "word_cloud",
  "data": [...],
  "count": 50,
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 8. Get Category Trends

Request category trends.

```json
{
  "type": "get_category_trends"
}
```

**Response:**
```json
{
  "type": "category_trends",
  "data": [...],
  "count": 5,
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 9. Get Complete Dashboard

Request all trending data.

```json
{
  "type": "get_dashboard"
}
```

**Response:**
```json
{
  "type": "dashboard",
  "data": {
    "topTrending": [...],
    "wordCloud": [...],
    "categoryTrends": [...],
    "viralVelocity": {...},
    "totalArticles": 1250,
    "timestamp": 1698765432000
  },
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 10. Record View

Record an article view.

```json
{
  "type": "record_view",
  "payload": {
    "articleId": "uuid"
  }
}
```

**Response:**
```json
{
  "type": "view_recorded",
  "articleId": "uuid",
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

### Server → Client Messages

#### 1. Connection Established

Sent immediately after connecting.

```json
{
  "type": "connected",
  "message": "Connected to Animal News Stream WebSocket",
  "clientId": 1698765432123,
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 2. Article Added (Real-time)

Broadcast to subscribed clients when a new article is added.

```json
{
  "type": "article_added",
  "channel": "articles",
  "data": {
    "id": "uuid",
    "title": "New Article",
    ...
  },
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 3. Article Updated (Real-time)

Broadcast when an article is updated.

```json
{
  "type": "article_updated",
  "channel": "articles",
  "data": {
    "id": "uuid",
    "title": "Updated Article",
    ...
  },
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 4. Article Deleted (Real-time)

Broadcast when an article is deleted.

```json
{
  "type": "article_deleted",
  "channel": "articles",
  "data": {
    "id": "uuid"
  },
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 5. Trending Updated (Real-time)

Broadcast to subscribers when trending data changes.

```json
{
  "type": "trending_updated",
  "channel": "trending",
  "data": [...],
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

#### 6. Error

Sent when an error occurs.

```json
{
  "type": "error",
  "message": "Error description",
  "error": "Detailed error message",
  "timestamp": "2025-10-31T22:00:00.000Z"
}
```

---

## Example Usage

### JavaScript (Browser)

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  // Subscribe to articles
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: { channel: 'articles' }
  }));

  // Fetch articles
  ws.send(JSON.stringify({
    type: 'fetch_articles',
    payload: { limit: 10 }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'article_added') {
    console.log('New article:', message.data.title);
  }
};
```

---

### Node.js

See `websocket-client-example.js` for a complete Node.js example.

---

## Available Channels

- `articles` - Receive real-time updates for article changes (INSERT, UPDATE, DELETE)
- `trending` - Receive real-time trending updates when articles gain traction

---

## Live Trending Dashboard

Access the interactive trending dashboard at:

**http://localhost:3001/trending-dashboard.html**

Features:
- 🔥 Top Trending Articles - Real-time top 10 with scores and velocity
- ⚡ Viral Velocity - Articles per minute with "going viral" indicator
- ☁️ Word Cloud - Trending words from article titles/descriptions
- 📊 Category Trends - Which topics are hot right now
- 📈 Real-time Stats - Total articles, words, categories, activity

The dashboard updates automatically via WebSocket and refreshes every 30 seconds.

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid message format |
| 404 | Not Found - Article doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider implementing rate limiting to prevent abuse.

---

## Authentication

The current implementation doesn't require authentication for read operations. In production:

- Use JWT tokens for authentication
- Implement Supabase Auth for user management
- Restrict write operations to authenticated users
- Use the service role key for server-side operations

---

## Environment Variables

Required environment variables (set in `.env`):

```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional)
NEWS_API_KEY=your_news_api_key
```
