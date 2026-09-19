# KHATA GAMES — Cloudflare

نسخه Cloudflare Worker + D1 با همان رابط QA شده نسخه جدید.

## Deploy
```bash
npm install
npm run deploy
```

`wrangler.jsonc` اتصال Worker به D1 و Assets را نگه می‌دارد. مقدار `ADMIN_PASSWORD` به‌صورت variable تنظیم شده؛ برای امنیت بالاتر می‌توان آن را به Cloudflare Secret منتقل کرد.

## تغییرات
- رابط frontend جدید و responsive
- Admin flow پایدارتر و حفظ user session هنگام ورود Admin
- map zoom controls
- modal/state fixes
- حذف inline handlers
- escape داده‌های dynamic
- بهبود session/auth behavior


Mobile login v14: centered auth content, smaller login card/logo, fantasy border, Admin Access removed from login, and a 2-second login transition with dragon battle overlay.
