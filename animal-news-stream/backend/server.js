/**
 * WebSocket Server with Express Integration
 *
 * This server provides real-time WebSocket connections for the Animal News Stream application.
 * It integrates with Supabase for real-time database updates and provides custom WebSocket endpoints.
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const supabase = require('./supabaseClient');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store connected clients with their subscriptions
const clients = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = Date.now() + Math.random();
  console.log(`[WebSocket] New client connected: ${clientId}`);

  // Store client info
  clients.set(clientId, {
    ws,
    subscriptions: new Set(),
    ip: req.socket.remoteAddress
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to Animal News Stream WebSocket',
    clientId,
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleClientMessage(clientId, data, ws);
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected: ${clientId}`);
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`[WebSocket] Error for client ${clientId}:`, error);
    clients.delete(clientId);
  });
});

/**
 * Handle incoming messages from clients
 */
async function handleClientMessage(clientId, data, ws) {
  const { type, payload } = data;

  switch (type) {
    case 'subscribe':
      handleSubscribe(clientId, payload, ws);
      break;

    case 'unsubscribe':
      handleUnsubscribe(clientId, payload, ws);
      break;

    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
      break;

    case 'fetch_articles':
      await handleFetchArticles(payload, ws);
      break;

    case 'search_articles':
      await handleSearchArticles(payload, ws);
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}`,
        timestamp: new Date().toISOString()
      }));
  }
}

/**
 * Subscribe to real-time updates
 */
function handleSubscribe(clientId, payload, ws) {
  const { channel } = payload;
  const client = clients.get(clientId);

  if (!client) return;

  client.subscriptions.add(channel);

  ws.send(JSON.stringify({
    type: 'subscribed',
    channel,
    message: `Subscribed to ${channel}`,
    timestamp: new Date().toISOString()
  }));

  console.log(`[WebSocket] Client ${clientId} subscribed to ${channel}`);
}

/**
 * Unsubscribe from updates
 */
function handleUnsubscribe(clientId, payload, ws) {
  const { channel } = payload;
  const client = clients.get(clientId);

  if (!client) return;

  client.subscriptions.delete(channel);

  ws.send(JSON.stringify({
    type: 'unsubscribed',
    channel,
    message: `Unsubscribed from ${channel}`,
    timestamp: new Date().toISOString()
  }));

  console.log(`[WebSocket] Client ${clientId} unsubscribed from ${channel}`);
}

/**
 * Fetch articles from Supabase
 */
async function handleFetchArticles(payload, ws) {
  try {
    const { limit = 10, offset = 0, category } = payload;

    let query = supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    ws.send(JSON.stringify({
      type: 'articles',
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('[WebSocket] Error fetching articles:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch articles',
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Search articles
 */
async function handleSearchArticles(payload, ws) {
  try {
    const { query, limit = 10 } = payload;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    ws.send(JSON.stringify({
      type: 'search_results',
      data,
      query,
      count: data.length,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('[WebSocket] Error searching articles:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to search articles',
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Broadcast message to all clients subscribed to a channel
 */
function broadcast(channel, message) {
  clients.forEach((client, clientId) => {
    if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        ...message,
        channel,
        timestamp: new Date().toISOString()
      }));
    }
  });
}

// Set up Supabase real-time subscription for new articles
const articlesChannel = supabase
  .channel('articles-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'articles' },
    (payload) => {
      console.log('[Supabase] New article inserted:', payload.new.title);
      broadcast('articles', {
        type: 'article_added',
        data: payload.new
      });
    }
  )
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'articles' },
    (payload) => {
      console.log('[Supabase] Article updated:', payload.new.title);
      broadcast('articles', {
        type: 'article_updated',
        data: payload.new
      });
    }
  )
  .on('postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'articles' },
    (payload) => {
      console.log('[Supabase] Article deleted:', payload.old.id);
      broadcast('articles', {
        type: 'article_deleted',
        data: { id: payload.old.id }
      });
    }
  )
  .subscribe();

// REST API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: clients.size,
    uptime: process.uptime()
  });
});

// Get all articles (REST endpoint)
app.get('/api/articles', async (req, res) => {
  try {
    const { limit = 10, offset = 0, category } = req.query;

    let query = supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      count: data.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('[API] Error fetching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single article
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    console.error('[API] Error fetching article:', error);
    res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
  }
});

// Create new article (requires authentication)
app.post('/api/articles', async (req, res) => {
  try {
    const articleData = req.body;

    const { data, error } = await supabase
      .from('articles')
      .insert([articleData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (error) {
    console.error('[API] Error creating article:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search articles
app.get('/api/articles/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({
      data,
      query,
      count: data.length
    });
  } catch (error) {
    console.error('[API] Error searching articles:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket status endpoint
app.get('/api/ws/status', (req, res) => {
  const clientsList = Array.from(clients.entries()).map(([id, client]) => ({
    id,
    subscriptions: Array.from(client.subscriptions),
    connected: client.ws.readyState === WebSocket.OPEN
  }));

  res.json({
    totalConnections: clients.size,
    clients: clientsList
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] HTTP + WebSocket server running on port ${PORT}`);
  console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`[Server] HTTP API endpoint: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing connections...');

  // Close all WebSocket connections
  clients.forEach((client) => {
    client.ws.close();
  });

  // Close Supabase channel
  articlesChannel.unsubscribe();

  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss, broadcast };
