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
      "subscriptions": ["articles"],
      "connected": true
    }
  ]
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

#### 5. Error

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
