/**
 * WebSocket Client Example
 *
 * This file demonstrates how to connect to and use the Animal News Stream WebSocket API.
 * You can use this as a reference for implementing the client in your frontend application.
 */

const WebSocket = require('ws');

// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');

  // Subscribe to article updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: { channel: 'articles' }
  }));

  // Fetch initial articles
  setTimeout(() => {
    console.log('\n📰 Fetching articles...');
    ws.send(JSON.stringify({
      type: 'fetch_articles',
      payload: {
        limit: 5,
        offset: 0
      }
    }));
  }, 1000);

  // Search for articles
  setTimeout(() => {
    console.log('\n🔍 Searching articles...');
    ws.send(JSON.stringify({
      type: 'search_articles',
      payload: {
        query: 'cat',
        limit: 3
      }
    }));
  }, 2000);

  // Send ping every 30 seconds to keep connection alive
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    handleMessage(message);
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

ws.on('close', () => {
  console.log('🔌 Disconnected from WebSocket server');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

/**
 * Handle incoming messages from server
 */
function handleMessage(message) {
  const { type, data, channel } = message;

  switch (type) {
    case 'connected':
      console.log('🎉 Connection established:', message.message);
      console.log('   Client ID:', message.clientId);
      break;

    case 'subscribed':
      console.log(`✅ Subscribed to channel: ${message.channel}`);
      break;

    case 'unsubscribed':
      console.log(`❌ Unsubscribed from channel: ${message.channel}`);
      break;

    case 'articles':
      console.log(`\n📰 Received ${message.count} articles:`);
      data.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
      });
      break;

    case 'search_results':
      console.log(`\n🔍 Search results for "${message.query}" (${message.count} found):`);
      data.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
      });
      break;

    case 'article_added':
      console.log('\n🆕 New article added:');
      console.log(`   Title: ${data.title}`);
      console.log(`   Source: ${data.source_name}`);
      break;

    case 'article_updated':
      console.log('\n📝 Article updated:');
      console.log(`   Title: ${data.title}`);
      break;

    case 'article_deleted':
      console.log('\n🗑️  Article deleted:');
      console.log(`   ID: ${data.id}`);
      break;

    case 'pong':
      console.log('🏓 Pong received');
      break;

    case 'error':
      console.error('❌ Error:', message.message);
      if (message.error) {
        console.error('   Details:', message.error);
      }
      break;

    default:
      console.log('📨 Unknown message type:', type, message);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  ws.close();
  process.exit(0);
});
