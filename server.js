require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fetch = require('node-fetch');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== DISCORD BOT ==========
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

bot.once('ready', () => {
  console.log(`Discord bot online as ${bot.user.tag}`);
});

bot.on('error', (err) => console.error('Bot error:', err));

if (process.env.DISCORD_BOT_TOKEN) {
  bot.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('Bot login failed:', err.message);
  });
} else {
  console.warn('DISCORD_BOT_TOKEN not set — bot disabled');
}

// ========== PASSPORT / DISCORD OAUTH ==========
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || `https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost:3000'}/auth/discord/callback`,
    scope: ['identify', 'email']
  }, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
  }));
}

// ========== MIDDLEWARE ==========
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'corsairs-super-secret-key-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// ========== AUTH ROUTES ==========
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/?logged_in=1');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.get('/api/user', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({
      loggedIn: true,
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatar: req.user.avatar
        ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
        : null
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// ========== QR CODE API ==========
app.post('/api/qr', async (req, res) => {
  try {
    const { text, size = 300, dark = '#000000', light = '#ffffff' } = req.body;
    if (!text || text.length > 2000) {
      return res.status(400).json({ error: 'Invalid text' });
    }
    const dataUrl = await QRCode.toDataURL(text, {
      width: Math.min(Math.max(size, 100), 800),
      color: { dark, light },
      margin: 2
    });
    res.json({ success: true, dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

// ========== TIKTOK DOWNLOADER (no watermark) ==========
// Uses public TikTok API proxies. For production you can swap with a paid service.
app.post('/api/tiktok', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('tiktok.com')) {
      return res.status(400).json({ error: 'Valid TikTok URL required' });
    }

    // Multiple fallback endpoints (community maintained)
    const endpoints = [
      `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
      `https://tikwm.com/api/?url=${encodeURIComponent(url)}`
    ];

    let data = null;
    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 12000
        });
        if (r.ok) {
          data = await r.json();
          break;
        }
      } catch (e) { /* try next */ }
    }

    if (!data) {
      return res.status(502).json({ error: 'Could not fetch TikTok data. Try another URL or later.' });
    }

    // Normalize response
    let videoUrl = null;
    let title = 'TikTok Video';
    let cover = null;

    if (data.video && data.video.noWatermark) {
      videoUrl = data.video.noWatermark;
      title = data.title || title;
      cover = data.video.cover || null;
    } else if (data.data && data.data.play) {
      videoUrl = data.data.play;
      title = data.data.title || title;
      cover = data.data.cover || null;
    } else if (data.nwm_video_url) {
      videoUrl = data.nwm_video_url;
      title = data.title || title;
    }

    if (!videoUrl) {
      return res.status(404).json({ error: 'No watermark-free video found' });
    }

    res.json({
      success: true,
      title,
      videoUrl,
      cover
    });
  } catch (err) {
    console.error('TikTok error:', err.message);
    res.status(500).json({ error: 'Server error while processing TikTok' });
  }
});

// ========== KEEP-ALIVE + DISCORD DM ==========
const OWNER_DISCORD_ID = process.env.OWNER_DISCORD_ID || ''; // set in Render env
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL || `http://localhost:${PORT}`;

async function keepAliveAndNotify() {
  try {
    // 1. Ping self so Render doesn't sleep
    const ping = await fetch(`${SELF_URL}/api/ping`, { timeout: 8000 });
    const status = ping.ok ? 'OK' : `HTTP ${ping.status}`;

    // 2. DM owner
    if (OWNER_DISCORD_ID && bot.isReady()) {
      try {
        const user = await bot.users.fetch(OWNER_DISCORD_ID);
        const now = new Date().toLocaleString('az-AZ', { timeZone: 'Asia/Baku' });
        await user.send({
          content: `🟢 **Corsairs Site aktivdir**\n` +
                   `⏰ ${now}\n` +
                   `📡 Ping: ${status}\n` +
                   `🔗 ${SELF_URL}`
        });
        console.log(`[KeepAlive] DM sent to owner at ${now}`);
      } catch (dmErr) {
        console.error('[KeepAlive] DM failed:', dmErr.message);
      }
    }
  } catch (err) {
    console.error('[KeepAlive] Error:', err.message);
  }
}

app.get('/api/ping', (req, res) => {
  res.json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Run every 2 minutes (120000 ms)
setInterval(keepAliveAndNotify, 2 * 60 * 1000);

// Also run once 30s after start
setTimeout(keepAliveAndNotify, 30000);

// ========== FALLBACK ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Corsairs server running on port ${PORT}`);
  console.log(`Self URL: ${SELF_URL}`);
});
