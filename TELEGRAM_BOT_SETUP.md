# 🤖 Telegram Bot Setup Guide for Starcom Intel Group

## 🚨 CRITICAL SECURITY WARNING

**NEVER PUT BOT TOKENS IN SOURCE CODE!** 

Your repository is public, so any tokens committed to Git will be visible to everyone on the internet. Always use environment variables for secrets.

## Quick Setup (5 minutes, 100% Free)

### Step 1: Create Your Bot with BotFather

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send:** `/newbot`
4. **Bot Name:** `Starcom Intel Assistant`
5. **Username:** `starcomintel_bot` (or `starcom_intel_bot` if taken)
6. **Save the Bot Token** that BotFather gives you (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Add Bot to Your Channel

1. **Go to your channel** `@starcomintelgroup`
2. **Channel Settings** → **Administrators** → **Add Administrator**
3. **Search and add** your new bot
4. **Give permissions:**
   - ✅ Delete Messages
   - ✅ Restrict Members
   - ✅ Pin Messages
   - ✅ Manage Video Chats

### Step 3: Get Channel Information

Copy this simple script and run it to get your channel details:

```javascript
// Simple Node.js script to get channel info
const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_BOT_TOKEN_HERE'; // Replace with your actual token
const bot = new TelegramBot(token, {polling: false});

// Get channel info
bot.getChat('@starcomintelgroup')
  .then(chat => {
    console.log('Channel ID:', chat.id);
    console.log('Member Count:', chat.members_count || 'Private group');
    console.log('Title:', chat.title);
  })
  .catch(err => console.error('Error:', err));
```

### Step 4: Secure Environment Setup

**Update your `.env.local` file** (NOT committed to Git):

```bash
# Telegram Bot Configuration (SECURE - NOT in source code!)
VITE_TELEGRAM_BOT_TOKEN=your_new_bot_token_here
VITE_TELEGRAM_CHANNEL_ID=your_channel_id_here
```

The widget will automatically use these environment variables safely.

## 🚀 Enhanced Features Available

### With Bot Token:
- **Real member count** from Telegram API
- **Online status** indicators
- **Channel statistics** tracking
- **Automated welcome messages**

### Widget Enhancements:
- **Live activity feed** (if you want to display recent messages)
- **Member count updates** every few minutes
- **Bot command integration** for interactive features
- **Analytics tracking** of Telegram engagement

## 📊 Optional: Real-Time Member Count

If you want live member counts, I can add this API call:

```typescript
// Function to fetch real member count
const fetchMemberCount = async () => {
  if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.channelId) return;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/getChatMemberCount?chat_id=${TELEGRAM_CONFIG.channelId}`);
    const data = await response.json();
    
    if (data.ok) {
      setMemberCount(data.result);
    }
  } catch (error) {
    console.log('Could not fetch member count:', error);
  }
};
```

## 🔒 Security Notes

- **Keep your bot token secret** - never commit it to Git
- **Use environment variables** for production
- **Bot has limited permissions** - only what you grant
- **100% free** - no limits for basic functionality

## ❓ Questions?

1. **Do you want real member counts?** → Set up the bot
2. **Do you want to display recent messages?** → We can add that
3. **Do you want bot commands?** → We can create interactive features

---

**Next Step:** Create the bot and send me the token, then I'll integrate the real-time features!
