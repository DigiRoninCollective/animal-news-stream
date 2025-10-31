# Animal News Stream

A real-time news aggregation platform for animal-related news stories with WebSocket API, REST endpoints, and Supabase integration for instant updates.

## Project Structure

```
animal-news-stream/
├── backend/
│   ├── server.js                      # WebSocket + REST API server
│   ├── supabaseClient.js              # Supabase client configuration
│   ├── schema.sql                     # Database schema
│   ├── websocket-client-example.js    # Example WebSocket client
│   ├── API.md                         # Complete API documentation
│   └── .env.example                   # Environment variables template
└── clients/
    └── web-dashboard/                 # Frontend React application (coming soon)
```

## Prerequisites

- Node.js (v14 or higher)
- Supabase account (sign up at https://supabase.com/)
- News API key (get one at https://newsapi.org/)

## Setup

### 1. Set up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the schema from `animal-news-stream/backend/schema.sql`

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cd animal-news-stream/backend
cp .env.example .env
```

Edit `.env` and add your actual credentials:
- `PORT`: Server port (default: 3001)
- `NEWS_API_KEY`: Your News API key from newsapi.org
- `SUPABASE_URL`: Your Supabase project URL (from Project Settings > API)
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key (from Project Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional, for admin operations)

### 3. Install Dependencies

```bash
# Install all dependencies (from project root)
npm install
```

### 4. Run the Server

Start the WebSocket + REST API server:

```bash
npm start
```

The server will start on port 3001 (or your configured PORT) and provide:
- **REST API:** `http://localhost:3001/api`
- **WebSocket:** `ws://localhost:3001`
- **Health Check:** `http://localhost:3001/health`

### 5. Test the WebSocket Connection

In a separate terminal, run the example WebSocket client:

```bash
npm run ws:example
```

## Features

### Real-time Capabilities
- **WebSocket API** for instant updates
- **Real-time subscriptions** - Get notified when articles are added, updated, or deleted
- **Live data streaming** from Supabase PostgreSQL
- **Bi-directional communication** - Subscribe to channels and receive push notifications

### API Endpoints
- **REST API** for standard CRUD operations
- **Search functionality** with full-text search
- **Pagination support** for large datasets
- **Article filtering** by category

### Database
- **Supabase (PostgreSQL)** backend with Row Level Security
- **Automatic timestamps** for created/updated records
- **User bookmarks** support (saved_articles table)
- **Optimized indexes** for fast queries

### Developer Features
- **Complete API documentation** (see `API.md`)
- **Example WebSocket client** for quick integration
- **Environment-based configuration**
- **CORS enabled** for cross-origin requests

## API Documentation

Complete API documentation with examples is available in [`animal-news-stream/backend/API.md`](animal-news-stream/backend/API.md).

### Quick Examples

#### REST API
```bash
# Get articles
curl http://localhost:3001/api/articles?limit=5

# Search articles
curl http://localhost:3001/api/articles/search/dolphin

# Create article
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","url":"https://example.com/test"}'
```

#### WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  // Subscribe to article updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: { channel: 'articles' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'article_added') {
    console.log('New article:', message.data.title);
  }
};
```

## Available Scripts

- `npm start` - Start the WebSocket + REST API server
- `npm run dev` - Start the server in development mode
- `npm run ws:example` - Run the example WebSocket client

## Security Notes

- Never commit `.env` files to version control
- Keep your API keys secure
- Use environment-specific configuration files
- In production, implement rate limiting and authentication
- Use HTTPS/WSS for secure connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC