# Corsairs — Orbit Game + Tools

Peşəkar, estetik və tam funksional veb sayt.

## Xüsusiyyətlər

- 🎮 **Corsairs oyunu** — videodakı orbit oyununa bənzər (kətan, səviyyələr, sikkələr, mərmilər)
- 🍔 **Hamburger menyu**
  - TikTok su nişansız video yükləyici
  - QR kod generatoru
  - Ayarlar (dil, tema, çətinlik, səs)
- 🔐 **Discord ilə giriş** (OAuth2)
- 🤖 **Discord bot** — hər 2 dəqiqədən bir saytın aktiv olduğunu sizə DM göndərir + Render-i oyaq saxlayır
- 🌍 Dil dəstəyi: Azərbaycan, English, Türkçe, Русский
- 🎨 Dark / Light / Pro temalar

## Render-də quraşdırma

1. Bu repoyu GitHub-a yükləyin.
2. [Render.com](https://render.com) → **New → Web Service** → GitHub repo seçin.
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment** bölməsinə aşağıdakıları əlavə edin:

| Key | Value |
|-----|-------|
| `DISCORD_CLIENT_ID` | Discord App Client ID |
| `DISCORD_CLIENT_SECRET` | Discord App Client Secret |
| `DISCORD_BOT_TOKEN` | Bot token |
| `DISCORD_CALLBACK_URL` | `https://YOUR-APP.onrender.com/auth/discord/callback` |
| `OWNER_DISCORD_ID` | Sizin Discord User ID |
| `SESSION_SECRET` | Uzun random string |

6. Discord Developer Portal-da:
   - OAuth2 → Redirects: `https://YOUR-APP.onrender.com/auth/discord/callback`
   - Bot → Enable Message Content Intent (əgər lazımdırsa)
   - Bot-u özünüzə DM aça bilmək üçün bot ilə bir serverdə olun və ya botu əlavə edin.

## Lokal işə salma

```bash
cp .env.example .env
# .env-i doldurun
npm install
npm start
```

Açın: http://localhost:3000

## Keep-alive

Hər **2 dəqiqədən bir**:
1. Sayt özünə `GET /api/ping` göndərir (Render yatmır)
2. Bot sizin Discord ID-nizə DM yazır: "🟢 Corsairs Site aktivdir"

## Oyun idarəsi

- ◀ ▶ düymələri və ya `A` / `D` / ox düymələri
- Space / Enter — start/pause
- Sikkələri yığ, qara toplardan qaç

---

Hazırlayan: Corsairs Pro Edition
