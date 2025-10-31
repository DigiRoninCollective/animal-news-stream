/**
 * Trending Analytics Engine
 *
 * Tracks and calculates real-time trending scores, viral velocity,
 * word frequencies, and category trends for the Animal News Stream.
 */

const supabase = require('./supabaseClient');

class TrendingAnalytics {
  constructor() {
    // In-memory storage for real-time metrics
    this.articleMetrics = new Map(); // articleId -> metrics
    this.categoryTrends = new Map(); // category -> trend data
    this.wordFrequencies = new Map(); // word -> frequency
    this.recentActivity = []; // Recent article IDs for velocity calculation

    // Configuration
    this.TRENDING_WINDOW = 3600000; // 1 hour in milliseconds
    this.VIRAL_THRESHOLD = 10; // Articles per minute to be "viral"
    this.TOP_TRENDING_LIMIT = 10;

    // Common words to exclude from word cloud
    this.STOP_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
      'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
      'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'new'
    ]);

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Track a new article
   */
  trackArticle(article) {
    const now = Date.now();

    // Initialize metrics for this article
    this.articleMetrics.set(article.id, {
      id: article.id,
      title: article.title,
      category: article.category || 'general',
      publishedAt: new Date(article.published_at || article.created_at).getTime(),
      firstSeen: now,
      views: 0,
      velocity: 0,
      trendingScore: 0,
      isHot: false
    });

    // Track recent activity for velocity
    this.recentActivity.push({
      articleId: article.id,
      timestamp: now
    });

    // Update word frequencies
    this.updateWordFrequencies(article.title, 1);
    if (article.description) {
      this.updateWordFrequencies(article.description, 0.5);
    }

    // Update category trends
    this.updateCategoryTrend(article.category || 'general', 1);

    // Calculate trending score
    this.calculateTrendingScore(article.id);
  }

  /**
   * Record a view for an article
   */
  recordView(articleId) {
    const metrics = this.articleMetrics.get(articleId);
    if (metrics) {
      metrics.views++;
      this.calculateTrendingScore(articleId);
    }
  }

  /**
   * Update word frequencies from text
   */
  updateWordFrequencies(text, weight = 1) {
    if (!text) return;

    // Extract words (letters only, 3+ characters)
    const words = text
      .toLowerCase()
      .match(/\b[a-z]{3,}\b/g) || [];

    words.forEach(word => {
      if (!this.STOP_WORDS.has(word)) {
        const current = this.wordFrequencies.get(word) || 0;
        this.wordFrequencies.set(word, current + weight);
      }
    });
  }

  /**
   * Update category trend
   */
  updateCategoryTrend(category, increment = 1) {
    const current = this.categoryTrends.get(category) || {
      category,
      count: 0,
      lastUpdate: Date.now(),
      velocity: 0
    };

    current.count += increment;
    current.lastUpdate = Date.now();

    this.categoryTrends.set(category, current);
  }

  /**
   * Calculate trending score for an article
   * Based on: recency, velocity, and views
   */
  calculateTrendingScore(articleId) {
    const metrics = this.articleMetrics.get(articleId);
    if (!metrics) return 0;

    const now = Date.now();
    const age = (now - metrics.firstSeen) / 1000; // Age in seconds
    const publishAge = (now - metrics.publishedAt) / 1000;

    // Recency factor (newer = higher score, decays over time)
    const recencyFactor = Math.exp(-age / 3600); // Decay over 1 hour

    // Velocity (views per minute since first seen)
    const velocity = age > 0 ? (metrics.views / age) * 60 : 0;
    metrics.velocity = velocity;

    // Is it going viral?
    metrics.isHot = velocity > this.VIRAL_THRESHOLD;

    // Combined trending score
    // Higher weight on recent articles with high velocity
    metrics.trendingScore =
      (recencyFactor * 100) +
      (velocity * 10) +
      (metrics.views * 0.5);

    this.articleMetrics.set(articleId, metrics);
    return metrics.trendingScore;
  }

  /**
   * Calculate viral velocity (articles per minute in recent window)
   */
  calculateViralVelocity() {
    const now = Date.now();
    const windowStart = now - this.TRENDING_WINDOW;

    // Count articles in the window
    const recentCount = this.recentActivity.filter(
      activity => activity.timestamp >= windowStart
    ).length;

    // Articles per minute
    const velocity = (recentCount / (this.TRENDING_WINDOW / 60000)).toFixed(2);

    return {
      articlesPerMinute: parseFloat(velocity),
      recentCount,
      windowMinutes: this.TRENDING_WINDOW / 60000,
      isViral: velocity > this.VIRAL_THRESHOLD,
      timestamp: now
    };
  }

  /**
   * Get top trending articles
   */
  getTopTrending(limit = this.TOP_TRENDING_LIMIT) {
    // Recalculate all scores
    this.articleMetrics.forEach((metrics, id) => {
      this.calculateTrendingScore(id);
    });

    // Sort by trending score
    const trending = Array.from(this.articleMetrics.values())
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map(metrics => ({
        id: metrics.id,
        title: metrics.title,
        category: metrics.category,
        score: Math.round(metrics.trendingScore),
        velocity: metrics.velocity.toFixed(2),
        views: metrics.views,
        isHot: metrics.isHot,
        age: Math.round((Date.now() - metrics.firstSeen) / 1000)
      }));

    return trending;
  }

  /**
   * Get word cloud data
   */
  getWordCloud(limit = 50) {
    const words = Array.from(this.wordFrequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, frequency]) => ({
        word,
        frequency: Math.round(frequency),
        size: this.calculateWordSize(frequency)
      }));

    return words;
  }

  /**
   * Calculate word size for visualization (1-10 scale)
   */
  calculateWordSize(frequency) {
    const maxFreq = Math.max(...Array.from(this.wordFrequencies.values()));
    const minFreq = Math.min(...Array.from(this.wordFrequencies.values()));

    if (maxFreq === minFreq) return 5;

    // Normalize to 1-10 scale
    const normalized = ((frequency - minFreq) / (maxFreq - minFreq)) * 9 + 1;
    return Math.round(normalized);
  }

  /**
   * Get category trends
   */
  getCategoryTrends() {
    const now = Date.now();

    const trends = Array.from(this.categoryTrends.values())
      .map(trend => {
        // Calculate velocity for this category
        const ageMinutes = (now - trend.lastUpdate) / 60000;
        const velocity = ageMinutes > 0 ? trend.count / ageMinutes : 0;

        return {
          category: trend.category,
          count: trend.count,
          velocity: velocity.toFixed(2),
          isHot: velocity > 1, // More than 1 article per minute
          lastUpdate: trend.lastUpdate
        };
      })
      .sort((a, b) => b.count - a.count);

    return trends;
  }

  /**
   * Get complete trending dashboard data
   */
  getDashboardData() {
    return {
      topTrending: this.getTopTrending(10),
      wordCloud: this.getWordCloud(50),
      categoryTrends: this.getCategoryTrends(),
      viralVelocity: this.calculateViralVelocity(),
      totalArticles: this.articleMetrics.size,
      timestamp: Date.now()
    };
  }

  /**
   * Initialize from database
   */
  async initializeFromDatabase() {
    try {
      console.log('[Trending] Initializing from database...');

      // Fetch recent articles (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Trending] Error fetching articles:', error);
        return;
      }

      // Track each article
      articles.forEach(article => {
        this.trackArticle(article);
      });

      console.log(`[Trending] Initialized with ${articles.length} articles`);
    } catch (error) {
      console.error('[Trending] Initialization error:', error);
    }
  }

  /**
   * Periodic cleanup of old data
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours

      // Clean old article metrics
      let removed = 0;
      this.articleMetrics.forEach((metrics, id) => {
        if (metrics.firstSeen < cutoff) {
          this.articleMetrics.delete(id);
          removed++;
        }
      });

      // Clean old activity
      this.recentActivity = this.recentActivity.filter(
        activity => activity.timestamp >= cutoff
      );

      // Decay word frequencies slightly (50% every 24 hours)
      this.wordFrequencies.forEach((freq, word) => {
        const newFreq = freq * 0.5;
        if (newFreq < 1) {
          this.wordFrequencies.delete(word);
        } else {
          this.wordFrequencies.set(word, newFreq);
        }
      });

      if (removed > 0) {
        console.log(`[Trending] Cleanup: Removed ${removed} old articles`);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      trackedArticles: this.articleMetrics.size,
      categories: this.categoryTrends.size,
      uniqueWords: this.wordFrequencies.size,
      recentActivity: this.recentActivity.length
    };
  }
}

// Singleton instance
const trendingAnalytics = new TrendingAnalytics();

module.exports = trendingAnalytics;
