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
- MongoDB (v4.4 or higher)
- News API key (get one at https://newsapi.org/)

## Setup

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cd animal-news-stream/backend
cp .env.example .env
```

Edit `.env` and add your actual credentials:
- `NEWS_API_KEY`: Your News API key from newsapi.org
- `MONGODB_URI`: Your MongoDB connection string

### 2. Install Dependencies

```bash
# Install backend dependencies
cd animal-news-stream/backend/animal-news-dashboard
npm install

# Install frontend dependencies
cd ../../clients/web-dashboard
npm install
```

### 3. Run the Application

```bash
# Start backend (from backend/animal-news-dashboard)
npm start

# Start frontend (from clients/web-dashboard)
npm start
```

## Features

- Browse animal-related news articles
- Real-time news updates from News API
- MongoDB integration for data persistence
- Modern React-based dashboard interface

## Security Notes

- Never commit `.env` files to version control
- Keep your API keys secure
- Use environment-specific configuration files

## License

ISC