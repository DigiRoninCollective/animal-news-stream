/**
 * Telegram Bot Service for Animal News Stream
 *
 * Provides real-time alerts and notifications to Telegram users about:
 * - Viral articles and trending news
 * - Keyword-based alerts
 * - Category-specific updates
 * - Custom threshold alerts
 */

const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
require('dotenv').config();

class AnimalNewsBot {
  constructor() {
    // Initialize bot
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error('[TelegramBot] ❌ TELEGRAM_BOT_TOKEN not found in .env');
      console.error('[TelegramBot] Please set your bot token to enable Telegram alerts');
      this.enabled = false;
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.enabled = true;

    // User subscriptions storage
    // In production, use a database like Supabase
    this.subscriptions = new Map(); // chatId -> subscription data

    // WebSocket connection to server
    this.ws = null;
    this.reconnectInterval = null;

    // Alert thresholds
    this.VIRAL_THRESHOLD = 10; // articles per minute
    this.TRENDING_SCORE_THRESHOLD = 100;

    // Setup
    this.setupCommands();
    this.connectToWebSocket();
    this.startPeriodicUpdates();

    console.log('[TelegramBot] ✅ Telegram bot initialized successfully');
  }

  /**
   * Setup bot commands
   */
  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));

    // Help command
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));

    // Subscribe to alerts
    this.bot.onText(/\/subscribe/, (msg) => this.handleSubscribe(msg));

    // Unsubscribe from alerts
    this.bot.onText(/\/unsubscribe/, (msg) => this.handleUnsubscribe(msg));

    // Get current trending
    this.bot.onText(/\/trending/, (msg) => this.handleTrending(msg));

    // Get viral velocity
    this.bot.onText(/\/velocity/, (msg) => this.handleVelocity(msg));

    // Get word cloud
    this.bot.onText(/\/words/, (msg) => this.handleWords(msg));

    // Set keyword alerts
    this.bot.onText(/\/keywords (.+)/, (msg, match) => this.handleKeywords(msg, match));

    // Set category alerts
    this.bot.onText(/\/category (.+)/, (msg, match) => this.handleCategory(msg, match));

    // View my settings
    this.bot.onText(/\/settings/, (msg) => this.handleSettings(msg));

    // Set custom threshold
    this.bot.onText(/\/threshold (\d+)/, (msg, match) => this.handleThreshold(msg, match));

    console.log('[TelegramBot] Commands registered');
  }

  /**
   * Connect to WebSocket server for real-time updates
   */
  connectToWebSocket() {
    const wsUrl = process.env.WS_URL || 'ws://localhost:3001';

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('[TelegramBot] ✅ Connected to WebSocket server');

        // Subscribe to trending updates
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          payload: { channel: 'trending' }
        }));

        // Subscribe to articles
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          payload: { channel: 'articles' }
        }));
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('[TelegramBot] Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('[TelegramBot] ❌ WebSocket disconnected, reconnecting...');
        this.reconnectInterval = setTimeout(() => this.connectToWebSocket(), 5000);
      });

      this.ws.on('error', (error) => {
        console.error('[TelegramBot] WebSocket error:', error.message);
      });

    } catch (error) {
      console.error('[TelegramBot] Failed to connect to WebSocket:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'article_added':
        this.checkArticleAlerts(message.data);
        break;

      case 'trending_updated':
        this.checkTrendingAlerts(message.data);
        break;

      default:
        // Ignore other messages
        break;
    }
  }

  /**
   * Check if new article matches any user alerts
   */
  checkArticleAlerts(article) {
    this.subscriptions.forEach((sub, chatId) => {
      if (!sub.alertsEnabled) return;

      let shouldAlert = false;
      let reason = '';

      // Check keyword alerts
      if (sub.keywords && sub.keywords.length > 0) {
        const text = `${article.title} ${article.description || ''}`.toLowerCase();
        const matchedKeywords = sub.keywords.filter(keyword =>
          text.includes(keyword.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
          shouldAlert = true;
          reason = `🎯 Keyword match: ${matchedKeywords.join(', ')}`;
        }
      }

      // Check category alerts
      if (sub.categories && sub.categories.length > 0) {
        if (sub.categories.includes(article.category)) {
          shouldAlert = true;
          reason = `📊 Category: ${article.category}`;
        }
      }

      if (shouldAlert) {
        this.sendArticleAlert(chatId, article, reason);
      }
    });
  }

  /**
   * Check trending updates for viral alerts
   */
  checkTrendingAlerts(trendingArticles) {
    if (!trendingArticles || trendingArticles.length === 0) return;

    this.subscriptions.forEach((sub, chatId) => {
      if (!sub.alertsEnabled || !sub.viralAlerts) return;

      // Check for hot articles above user's threshold
      const hotArticles = trendingArticles.filter(article =>
        article.isHot && article.score >= (sub.threshold || this.TRENDING_SCORE_THRESHOLD)
      );

      if (hotArticles.length > 0) {
        this.sendViralAlert(chatId, hotArticles[0]); // Send alert for top viral article
      }
    });
  }

  /**
   * Send article alert to user
   */
  sendArticleAlert(chatId, article, reason) {
    const message = `
🔔 *New Article Alert!*

${reason}

📰 *${this.escapeMarkdown(article.title)}*

${article.description ? this.escapeMarkdown(article.description.substring(0, 200)) + '...' : ''}

🏷️ Category: ${article.category || 'general'}
🔗 [Read more](${article.url})
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
      .catch(err => console.error('[TelegramBot] Error sending alert:', err.message));
  }

  /**
   * Send viral alert to user
   */
  sendViralAlert(chatId, article) {
    const message = `
🔥 *VIRAL ALERT!* 🔥

This article is going viral RIGHT NOW!

📰 *${this.escapeMarkdown(article.title)}*

📊 *Stats:*
• Trending Score: ${article.score}
• Velocity: ${article.velocity} views/min
• Category: ${article.category}

🔗 Don't miss out - read it now!
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
      .catch(err => console.error('[TelegramBot] Error sending viral alert:', err.message));
  }

  /**
   * Command Handlers
   */

  handleStart(msg) {
    const chatId = msg.chat.id;
    const message = `
🐾 *Welcome to Animal News Stream!*

Get real-time alerts about trending animal news stories!

*Quick Start:*
• /subscribe - Start receiving alerts
• /trending - See what's hot now
• /keywords dog cat - Get alerts for specific words
• /help - See all commands

Ready to stay updated on the latest animal news? 🦁🐼🐕
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  handleHelp(msg) {
    const chatId = msg.chat.id;
    const message = `
📚 *Available Commands:*

*Alerts & Subscriptions:*
• /subscribe - Enable all alerts
• /unsubscribe - Disable all alerts
• /keywords [words] - Alert on specific keywords
  Example: /keywords dolphin rescue
• /category [name] - Alert on category
  Example: /category wildlife
• /threshold [score] - Set viral threshold
  Example: /threshold 150

*Get Info:*
• /trending - Top 5 trending articles
• /velocity - Current viral velocity
• /words - Trending word cloud
• /settings - View your preferences

*Other:*
• /help - Show this help message
• /start - Welcome message

💡 Tip: Combine filters for precise alerts!
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  handleSubscribe(msg) {
    const chatId = msg.chat.id;

    // Initialize or update subscription
    const sub = this.subscriptions.get(chatId) || {};
    sub.alertsEnabled = true;
    sub.viralAlerts = true;
    sub.keywords = sub.keywords || [];
    sub.categories = sub.categories || [];
    sub.threshold = sub.threshold || this.TRENDING_SCORE_THRESHOLD;

    this.subscriptions.set(chatId, sub);

    const message = `
✅ *Subscribed Successfully!*

You'll now receive alerts for:
• 🔥 Viral articles (score > ${sub.threshold})
• 🎯 Your keywords: ${sub.keywords.length > 0 ? sub.keywords.join(', ') : 'none set'}
• 📊 Your categories: ${sub.categories.length > 0 ? sub.categories.join(', ') : 'none set'}

Use /keywords and /category to customize!
Use /settings to view your preferences.
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`[TelegramBot] User ${chatId} subscribed`);
  }

  handleUnsubscribe(msg) {
    const chatId = msg.chat.id;

    const sub = this.subscriptions.get(chatId);
    if (sub) {
      sub.alertsEnabled = false;
      this.subscriptions.set(chatId, sub);
    }

    const message = `
🔕 *Unsubscribed*

You won't receive any more alerts.

To re-subscribe, use /subscribe anytime!
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`[TelegramBot] User ${chatId} unsubscribed`);
  }

  async handleTrending(msg) {
    const chatId = msg.chat.id;

    // Request trending data from server
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.bot.sendMessage(chatId, '❌ Cannot connect to server. Please try again later.');
      return;
    }

    // Send request
    this.ws.send(JSON.stringify({
      type: 'get_trending',
      payload: { limit: 5 }
    }));

    // Listen for response (with timeout)
    const timeout = setTimeout(() => {
      this.bot.sendMessage(chatId, '⏱️ Request timed out. Please try again.');
    }, 5000);

    const messageHandler = (data) => {
      try {
        const response = JSON.parse(data);
        if (response.type === 'trending') {
          clearTimeout(timeout);
          this.ws.removeListener('message', messageHandler);
          this.sendTrendingList(chatId, response.data);
        }
      } catch (error) {
        // Ignore parse errors
      }
    };

    this.ws.on('message', messageHandler);
  }

  sendTrendingList(chatId, trending) {
    if (!trending || trending.length === 0) {
      this.bot.sendMessage(chatId, '📊 No trending articles yet. Check back soon!');
      return;
    }

    let message = '🔥 *Top Trending Now:*\n\n';

    trending.forEach((article, index) => {
      const hotBadge = article.isHot ? '🔥 ' : '';
      message += `${index + 1}. ${hotBadge}*${this.escapeMarkdown(article.title)}*\n`;
      message += `   📊 Score: ${article.score} | ⚡ ${article.velocity}/min\n`;
      message += `   🏷️ ${article.category}\n\n`;
    });

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async handleVelocity(msg) {
    const chatId = msg.chat.id;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.bot.sendMessage(chatId, '❌ Cannot connect to server. Please try again later.');
      return;
    }

    // Use REST API instead for velocity
    const fetch = require('node-fetch');
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/api/trending/velocity`);
      const data = await response.json();
      const velocity = data.data;

      const viralBadge = velocity.isViral ? '🔥 GOING VIRAL! 🔥' : '✅ Normal';

      const message = `
⚡ *Viral Velocity*

${viralBadge}

📊 *${velocity.articlesPerMinute}* articles/minute
📰 ${velocity.recentCount} articles in last hour

${velocity.isViral ? '🚨 The site is on FIRE right now!' : '😌 Steady flow of news'}
      `.trim();

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, '❌ Error fetching velocity data.');
    }
  }

  async handleWords(msg) {
    const chatId = msg.chat.id;

    const fetch = require('node-fetch');
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/api/trending/word-cloud?limit=15`);
      const data = await response.json();
      const words = data.data;

      if (!words || words.length === 0) {
        this.bot.sendMessage(chatId, '☁️ No trending words yet.');
        return;
      }

      let message = '☁️ *Trending Words:*\n\n';
      words.forEach(item => {
        const size = '▪️'.repeat(Math.ceil(item.size / 2));
        message += `${size} ${item.word} (${item.frequency})\n`;
      });

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      this.bot.sendMessage(chatId, '❌ Error fetching word cloud.');
    }
  }

  handleKeywords(msg, match) {
    const chatId = msg.chat.id;
    const keywords = match[1].split(' ').filter(k => k.length > 0);

    const sub = this.subscriptions.get(chatId) || { alertsEnabled: false };
    sub.keywords = keywords;
    this.subscriptions.set(chatId, sub);

    const message = `
🎯 *Keywords Updated!*

You'll receive alerts for: ${keywords.join(', ')}

${!sub.alertsEnabled ? '\n⚠️ Don\'t forget to /subscribe to enable alerts!' : ''}
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  handleCategory(msg, match) {
    const chatId = msg.chat.id;
    const category = match[1].toLowerCase();

    const sub = this.subscriptions.get(chatId) || { alertsEnabled: false };
    sub.categories = sub.categories || [];

    if (!sub.categories.includes(category)) {
      sub.categories.push(category);
    }

    this.subscriptions.set(chatId, sub);

    const message = `
📊 *Category Added!*

Watching categories: ${sub.categories.join(', ')}

${!sub.alertsEnabled ? '\n⚠️ Don\'t forget to /subscribe to enable alerts!' : ''}
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  handleSettings(msg) {
    const chatId = msg.chat.id;
    const sub = this.subscriptions.get(chatId);

    if (!sub) {
      this.bot.sendMessage(chatId, '❌ No settings found. Use /subscribe to get started!');
      return;
    }

    const message = `
⚙️ *Your Settings:*

*Alerts:* ${sub.alertsEnabled ? '✅ Enabled' : '🔕 Disabled'}
*Viral Alerts:* ${sub.viralAlerts ? '✅ Yes' : '❌ No'}
*Trending Threshold:* ${sub.threshold || this.TRENDING_SCORE_THRESHOLD}

*Keywords:* ${sub.keywords && sub.keywords.length > 0 ? sub.keywords.join(', ') : 'None'}
*Categories:* ${sub.categories && sub.categories.length > 0 ? sub.categories.join(', ') : 'None'}

Use commands to update your preferences!
    `.trim();

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  handleThreshold(msg, match) {
    const chatId = msg.chat.id;
    const threshold = parseInt(match[1]);

    if (threshold < 50 || threshold > 1000) {
      this.bot.sendMessage(chatId, '❌ Threshold must be between 50 and 1000');
      return;
    }

    const sub = this.subscriptions.get(chatId) || {};
    sub.threshold = threshold;
    this.subscriptions.set(chatId, sub);

    this.bot.sendMessage(chatId, `✅ Viral threshold set to ${threshold}!`);
  }

  /**
   * Periodic trending updates for subscribed users
   */
  startPeriodicUpdates() {
    // Send daily trending summary at 9 AM
    setInterval(() => {
      const hour = new Date().getHours();
      if (hour === 9) {
        this.sendDailySummary();
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  async sendDailySummary() {
    const fetch = require('node-fetch');
    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${apiUrl}/api/trending?limit=3`);
      const data = await response.json();
      const trending = data.data;

      this.subscriptions.forEach((sub, chatId) => {
        if (!sub.alertsEnabled) return;

        let message = '🌅 *Daily Trending Summary*\n\n';
        message += 'Top stories from the last 24 hours:\n\n';

        trending.forEach((article, index) => {
          message += `${index + 1}. ${this.escapeMarkdown(article.title)}\n`;
          message += `   📊 Score: ${article.score}\n\n`;
        });

        this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
          .catch(err => console.log(`Failed to send summary to ${chatId}`));
      });
    } catch (error) {
      console.error('[TelegramBot] Error sending daily summary:', error);
    }
  }

  /**
   * Utility: Escape markdown special characters
   */
  escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      enabled: this.enabled,
      totalSubscribers: this.subscriptions.size,
      activeSubscribers: Array.from(this.subscriptions.values()).filter(s => s.alertsEnabled).length,
      wsConnected: this.ws && this.ws.readyState === WebSocket.OPEN
    };
  }
}

// Create singleton instance
let botInstance = null;

function initTelegramBot() {
  if (!botInstance) {
    botInstance = new AnimalNewsBot();
  }
  return botInstance;
}

module.exports = { initTelegramBot };
