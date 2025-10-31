# 🤖 Telegram Bot Setup Guide

Get real-time animal news alerts directly in Telegram!

---

## Quick Start

### 1. Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the prompts:
   - Choose a name for your bot (e.g., "Animal News Alerts")
   - Choose a username (must end in 'bot', e.g., "animal_news_alerts_bot")
4. Copy the **bot token** provided by BotFather
   - It looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2. Configure the Bot

Add your bot token to the `.env` file:

```bash
cd animal-news-stream/backend
cp .env.example .env
```

Edit `.env` and add:

```
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

### 3. Start the Server

```bash
npm start
```

You should see:
```
[Server] 🤖 Telegram bot enabled and ready
```

### 4. Find Your Bot on Telegram

Search for your bot by username on Telegram and start chatting!

---

## Bot Commands

### Getting Started

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and quick intro |
| `/help` | Show all available commands |

---

### Alerts & Subscriptions

| Command | Description | Example |
|---------|-------------|---------|
| `/subscribe` | Enable all alerts | `/subscribe` |
| `/unsubscribe` | Disable all alerts | `/unsubscribe` |
| `/keywords [words]` | Get alerts for specific keywords | `/keywords dolphin rescue` |
| `/category [name]` | Get alerts for a category | `/category wildlife` |
| `/threshold [score]` | Set viral alert threshold | `/threshold 150` |

---

### Get Information

| Command | Description |
|---------|-------------|
| `/trending` | See top 5 trending articles now |
| `/velocity` | Check viral velocity (articles/min) |
| `/words` | See trending word cloud |
| `/settings` | View your alert preferences |

---

## Alert Types

### 🔥 Viral Alerts

Automatically notified when articles go viral!

- Triggers when trending score exceeds your threshold (default: 100)
- Shows score, velocity, and category
- Only sent for "HOT" articles

**Example Alert:**
```
🔥 VIRAL ALERT! 🔥

This article is going viral RIGHT NOW!

📰 Dolphin Rescue Mission Saves 50 Marine Animals

📊 Stats:
• Trending Score: 245
• Velocity: 12.5 views/min
• Category: wildlife

🔗 Don't miss out - read it now!
```

---

### 🎯 Keyword Alerts

Get notified when your keywords appear in new articles.

**Setup:**
```
/keywords dog cat rescue
```

**Example Alert:**
```
🔔 New Article Alert!

🎯 Keyword match: rescue, dog

📰 Amazing Dog Rescue Story Touches Hearts

Heartwarming tale of courage and compassion...

🏷️ Category: pets
🔗 Read more
```

---

### 📊 Category Alerts

Track specific categories you care about.

**Setup:**
```
/category wildlife
/category pets
```

**Example Alert:**
```
🔔 New Article Alert!

📊 Category: wildlife

📰 New Species Discovered in Amazon Rainforest

Scientists have made an incredible discovery...

🔗 Read more
```

---

### 🌅 Daily Summary

Automatically sent every morning at 9 AM.

**Example:**
```
🌅 Daily Trending Summary

Top stories from the last 24 hours:

1. Dolphin Rescue Mission Saves 50 Animals
   📊 Score: 245

2. New Species Discovered in Amazon
   📊 Score: 198

3. Dog Saves Owner from House Fire
   📊 Score: 176
```

---

## Customization

### Set Your Viral Threshold

Control when you get viral alerts:

```
/threshold 50   # Get alerts for mildly viral (50+)
/threshold 100  # Default - moderately viral
/threshold 200  # Only the hottest content
```

**Threshold Guide:**
- **50-99**: Mildly trending
- **100-199**: Moderately viral
- **200-299**: Very hot
- **300+**: Extremely viral

---

### Combine Filters

Set up multiple filters for precise alerts:

```
/keywords endangered species conservation
/category wildlife
/threshold 80
/subscribe
```

Now you'll get:
- ✅ Wildlife articles with your keywords
- ✅ Viral wildlife articles (score > 80)
- ✅ Any viral article with your keywords

---

## Example Usage Scenarios

### Scenario 1: Wildlife Enthusiast

**Goal:** Stay updated on wildlife conservation news

**Setup:**
```
/category wildlife
/keywords conservation endangered
/threshold 100
/subscribe
```

**Result:** Alerts for trending wildlife conservation stories

---

### Scenario 2: Pet Owner

**Goal:** Get heartwarming pet stories

**Setup:**
```
/category pets
/keywords dog cat rescue adoption
/subscribe
```

**Result:** Alerts for pet-related news matching your interests

---

### Scenario 3: News Curator

**Goal:** Track all viral content

**Setup:**
```
/threshold 150
/subscribe
```

**Result:** Only high-velocity viral articles across all categories

---

### Scenario 4: Researcher

**Goal:** Monitor specific topics

**Setup:**
```
/keywords marine biology ocean dolphin whale
/category wildlife
/category marine
/subscribe
```

**Result:** Comprehensive marine life coverage

---

## Alert Frequency

### How Often Will I Receive Alerts?

Depends on your settings:

- **Viral Alerts**: When articles exceed your threshold
- **Keyword Alerts**: When new articles match your keywords
- **Category Alerts**: When new articles in your categories are published
- **Daily Summary**: Once per day at 9 AM

### Managing Alert Volume

Too many alerts?

1. **Increase threshold**: `/threshold 200`
2. **Remove keywords**: `/keywords` (with no words = clear all)
3. **Unsubscribe temporarily**: `/unsubscribe`
4. **Re-subscribe anytime**: `/subscribe`

---

## Privacy & Data

### What Data is Stored?

The bot stores in-memory (not permanent):
- Your Telegram chat ID
- Your alert preferences (keywords, categories, threshold)
- Subscription status

### Data Retention

- **In-Memory Only**: Data is lost when server restarts
- **No Message History**: Your messages are not stored
- **No Personal Info**: Only your Telegram chat ID is used

### In Production

For production use, consider:
- Storing preferences in Supabase
- Adding user authentication
- Implementing data export/delete options

---

## Troubleshooting

### Bot Not Responding?

**Check:**
1. Server is running: `npm start`
2. Bot token is correct in `.env`
3. No errors in server logs

**Test:**
```bash
curl http://localhost:3001/health
```

---

### Not Receiving Alerts?

**Check:**
1. Subscription status: `/settings`
2. Alerts are enabled: `/subscribe`
3. Keywords/categories are set correctly
4. New articles are being published

**Debug:**
```
/settings  # View current configuration
/trending  # Check if trending system is working
/subscribe # Re-enable alerts
```

---

### WebSocket Connection Issues?

If you see: `Cannot connect to server`

**Fix:**
1. Ensure server is running on port 3001
2. Check `WS_URL` in `.env`: `ws://localhost:3001`
3. Restart the server

---

## Advanced Configuration

### Environment Variables

```bash
# Required
TELEGRAM_BOT_TOKEN=your_token_here

# Optional (defaults shown)
PORT=3001
WS_URL=ws://localhost:3001
API_URL=http://localhost:3001
```

### Custom Thresholds in Code

Edit `telegramBot.js`:

```javascript
this.VIRAL_THRESHOLD = 10; // articles per minute
this.TRENDING_SCORE_THRESHOLD = 100; // default user threshold
```

### Daily Summary Time

Edit `telegramBot.js`, line ~450:

```javascript
if (hour === 9) {  // Change to desired hour (0-23)
  this.sendDailySummary();
}
```

---

## API Integration

### Get Bot Stats

```bash
# Add to server.js for bot stats endpoint
app.get('/api/telegram/stats', (req, res) => {
  const stats = telegramBot.getStats();
  res.json({ data: stats });
});
```

**Response:**
```json
{
  "enabled": true,
  "totalSubscribers": 42,
  "activeSubscribers": 38,
  "wsConnected": true
}
```

---

## Production Deployment

### Considerations

1. **Persistent Storage**
   - Store user preferences in Supabase
   - Save subscription data to database

2. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent spam/abuse

3. **Error Handling**
   - Handle Telegram API rate limits
   - Retry failed message sends

4. **Monitoring**
   - Log all alerts sent
   - Track delivery success rates

5. **Security**
   - Validate user input
   - Sanitize markdown content
   - Implement admin controls

---

## Examples & Templates

### Message Templates

The bot uses these templates for alerts. Customize them in `telegramBot.js`:

**Viral Alert Template:**
```javascript
const message = `
🔥 *VIRAL ALERT!* 🔥

This article is going viral RIGHT NOW!

📰 *${article.title}*

📊 *Stats:*
• Trending Score: ${score}
• Velocity: ${velocity} views/min
• Category: ${category}
`.trim();
```

**Keyword Alert Template:**
```javascript
const message = `
🔔 *New Article Alert!*

🎯 Keyword match: ${keywords}

📰 *${title}*
${description}

🏷️ Category: ${category}
🔗 [Read more](${url})
`.trim();
```

---

## Support

### Getting Help

1. Check this documentation
2. Review server logs for errors
3. Test with `/help` command in bot
4. Check `/settings` for configuration

### Common Issues

| Issue | Solution |
|-------|----------|
| Bot offline | Check bot token, restart server |
| No alerts | Use `/subscribe` to enable |
| Too many alerts | Increase threshold or reduce keywords |
| Wrong keywords | Use `/keywords` with new words |

---

## Next Steps

Ready to enhance your bot?

**Add Features:**
- [ ] Image/photo support for articles
- [ ] Inline keyboards for quick actions
- [ ] User analytics and stats
- [ ] Multi-language support
- [ ] Group chat support
- [ ] Admin commands
- [ ] Custom alert schedules

**Integration Ideas:**
- Connect with your CRM
- Export alerts to email
- Integrate with Slack
- Add voice message summaries
- Create content calendars

---

## 🎉 You're All Set!

Your Telegram bot is ready to send real-time animal news alerts!

**Quick Test:**
1. Message your bot: `/start`
2. Subscribe: `/subscribe`
3. Check trending: `/trending`
4. Set keywords: `/keywords your favorite animal`

Enjoy your personalized news alerts! 🐾
