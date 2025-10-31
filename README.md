# Animal News Stream

A news aggregation platform for animal-related news stories, featuring a dashboard for browsing and managing animal news content.

## Project Structure

```
animal-news-stream/
├── backend/
│   └── animal-news-dashboard/    # Backend API service
└── clients/
    └── web-dashboard/             # Frontend React application
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
- `NEWS_API_KEY`: Your News API key from newsapi.org
- `SUPABASE_URL`: Your Supabase project URL (from Project Settings > API)
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key (from Project Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional, for admin operations)

### 3. Install Dependencies

```bash
# Install backend dependencies
cd animal-news-stream/backend/animal-news-dashboard
npm install

# Install frontend dependencies
cd ../../clients/web-dashboard
npm install
```

### 4. Run the Application

```bash
# Start backend (from backend/animal-news-dashboard)
npm start

# Start frontend (from clients/web-dashboard)
npm start
```

## Features

- Browse animal-related news articles
- Real-time news updates from News API
- Supabase (PostgreSQL) integration for data persistence
- Modern React-based dashboard interface
- Real-time subscriptions via Supabase

## Security Notes

- Never commit `.env` files to version control
- Keep your API keys secure
- Use environment-specific configuration files

## License

ISC