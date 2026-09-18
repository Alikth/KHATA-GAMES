# KHATA GAMES — updated

این نسخه شامل تغییرات جدید رابط و حساب کاربری است.

## اجرا
```bash
npm install
npm start
```
سپس: `http://localhost:3000`

## جریان ورود
کاربر ابتدا صفحه Login را می‌بیند. از همان صفحه می‌تواند حساب بسازد؛ پس از ورود وارد Lobby می‌شود و سپس Kill The King را باز می‌کند.

## نقشه
نقشه فقط بخش Westeros را نشان می‌دهد و ۱۰ Marker اقلیم‌ها روی همان نقاط مشخص‌شده در تصویر مرجع قرار گرفته‌اند.

## خاندان‌ها و قلعه‌ها
بازیکن‌ها بر اساس اقلیم تفکیک می‌شوند. هر قلعه پنل جزئیات دارد و موقعیت، خاندان، وضعیت و توضیح آن نمایش داده می‌شود.

## Admin
برای ورود مستقیم به مدیریت: `http://localhost:3000/?admin=1`

رمز پیش‌فرض: `khata-admin-2026`

برای محیط واقعی حتماً `ADMIN_PASSWORD` و `SESSION_SECRET` را در Environment تنظیم کن.

## v10 visual polish
- Replaced the main site background with the approved raw cinematic two-warrior battle image.
- Kept the image free of UI text/logos.
- Removed the @ prefix from the logged-in account username in the top controls.
- Restyled the Lobby / Logout / username controls with a subtle dark cinematic treatment.
- Added subtle black text shadowing for readability without a heavy overlay.
- Backend, authentication flow, game data, and D1-related structure were left unchanged.
