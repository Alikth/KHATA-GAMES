# KHATA GAMES — Cloudflare version

این نسخه ظاهر و فایل‌های public نسخه قبلی را نگه می‌دارد و بک‌اند را برای Cloudflare Workers + D1 آماده می‌کند.

## Deploy
1. در Cloudflare یک D1 Database با نام `khata-games-db` بساز.
2. شناسه Database ID را داخل `wrangler.jsonc` جایگزین `REPLACE_WITH_D1_DATABASE_ID` کن.
3. migration `migrations/0001_init.sql` را روی D1 اجرا کن.
4. پروژه را به GitHub push کن و در Workers & Pages با `npx wrangler deploy` deploy کن.

Admin password از `ADMIN_PASSWORD` خوانده می‌شود؛ برای محیط واقعی آن را به Secret تبدیل کن.
