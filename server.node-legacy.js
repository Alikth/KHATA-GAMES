const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "khata-admin-2026";

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "players.json");
const usersFile = path.join(dataDir, "users.json");
fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([], null, 2));

const castleInfo = {
  "Castle Black": { location: "The Wall", description: "دژ اصلی نگهبانان شب در دیوار؛ یکی از مهم‌ترین پایگاه‌های دفاعی شمال و محل فرماندهی Lord Commander." },
  "Eastwatch": { location: "ساحل شرقی دیوار", description: "قلعه‌ای ساحلی در انتهای شرقی دیوار که بر مسیرهای دریایی و دفاع از بخش شرقی دیوار نظارت دارد." },
  "Shadow Tower": { location: "بخش غربی دیوار", description: "یکی از قلعه‌های اصلی Night's Watch در امتداد دیوار، در ناحیه غربی Castle Black." },
  "Winterfell": { location: "North، مرکز سرزمین‌های شمالی", description: "قلعه باستانی خاندان Stark و مرکز سیاسی و نظامی North؛ در میان سرزمین‌های شمالی و بر مسیرهای مهم آن قرار دارد." },
  "The Dreadfort": { location: "شرق North", description: "دژ تاریخی خاندان Bolton در شمال؛ قلعه‌ای سنگی و مستحکم که در سرزمین‌های Bolton قرار دارد." },
  "Karhold": { location: "شمال شرقی North", description: "دژ خاندان Karstark در شمال شرقی؛ یکی از پایگاه‌های مهم خاندان‌های شمالی." },
  "Riverrun": { location: "Riverlands، محل تلاقی Red Fork و Tumblestone", description: "دژ اصلی خاندان Tully و قلعه‌ای آبیاری‌شده در محل پیوند رودها؛ موقعیت آن برای دفاع و کنترل Riverlands اهمیت زیادی دارد." },
  "The Twins": { location: "Riverlands، گذرگاه Green Fork", description: "دو قلعه خاندان Frey در دو سوی Green Fork که پل بزرگ میان آن‌ها یکی از مهم‌ترین گذرگاه‌های Riverlands است." },
  "Seagard": { location: "ساحل غربی Riverlands", description: "دژ ساحلی خاندان Mallister که برای دفاع از Riverlands در برابر حملات دریایی Ironborn اهمیت دارد." },
  "The Eyrie": { location: "کوه‌های Moon، Vale", description: "قلعه مرتفع خاندان Arryn بر فراز Mountains of the Moon؛ دسترسی به آن دشوار و موقعیت دفاعی آن بسیار قدرتمند است." },
  "Gulltown": { location: "ساحل شرقی Vale", description: "بزرگ‌ترین شهر و بندر Vale و یکی از مهم‌ترین مراکز تجاری این منطقه؛ تحت نفوذ خاندان Grafton." },
  "Redfort": { location: "Vale، جنوب The Eyrie", description: "قلعه خاندان Redfort در Vale که در مسیرهای داخلی منطقه قرار دارد و از دژهای شناخته‌شده این قلمرو است." },
  "Pyke": { location: "جزایر Iron Islands، جزیره Pyke", description: "دژ و مقر خاندان Greyjoy؛ قلعه‌ای دریایی که بر صخره‌های جزیره Pyke ساخته شده و با پل‌ها و برج‌های سنگی به هم پیوند خورده است." },
  "Ten Towers": { location: "جزیره Harlaw، Iron Islands", description: "دژ خاندان Harlaw و یکی از استحکامات مهم جزیره Harlaw در Iron Islands." },
  "Hammerhorn": { location: "جزیره Great Wyk، Iron Islands", description: "دژ خاندان Goodbrother در Great Wyk و یکی از مراکز مهم قدرت این خاندان در Iron Islands." },
  "Casterly Rock": { location: "ساحل غربی Westerlands", description: "دژ باستانی خاندان Lannister که در دل یک توده عظیم سنگی قرار دارد؛ از ثروتمندترین و استراتژیک‌ترین دژهای Westeros." },
  "Hornvale": { location: "Westerlands", description: "مقر خاندان Brax در Westerlands؛ قلعه‌ای مهم در شبکه دژهای اشرافی این منطقه." },
  "Ashemark": { location: "Westerlands، شرق Casterly Rock", description: "دژ خاندان Marbrand در Westerlands که بر سرزمین‌های اطراف و مسیرهای داخلی منطقه نظارت دارد." },
  "King's Landing": { location: "ساحل شرقی Westeros، Crownlands، دهانه Blackwater Rush", description: "پایتخت هفت پادشاهی و بزرگ‌ترین شهر Westeros؛ بر تپه‌های اطراف Blackwater ساخته شده و مرکز قدرت سیاسی تاج‌وتخت است." },
  "Dragonstone": { location: "جزیره Dragonstone، ورودی Blackwater Bay", description: "قلعه آتشفشانی خاندان Targaryen بر جزیره Dragonstone؛ موقعیتی استراتژیک برای کنترل ورودی Blackwater Bay دارد." },
  "Sharp Point": { location: "ساحل شرقی Crownlands", description: "دژ خاندان Bar Emmon در ساحل Crownlands، نزدیک مسیرهای دریایی Blackwater Bay." },
  "Storm's End": { location: "ساحل شرقی Stormlands", description: "دژ افسانه‌ای خاندان Baratheon با دیوارهای عظیم و مقاوم در برابر طوفان؛ یکی از مستحکم‌ترین قلعه‌های Westeros." },
  "Fellwood": { location: "Stormlands", description: "مرکز خاندان Fell در Stormlands و یکی از املاک شناخته‌شده این خاندان در منطقه." },
  "Blackhaven": { location: "مرز شمالی Dorne و جنوب Stormlands", description: "دژ خاندان Dondarrion در مرزهای Stormlands؛ موقعیتی مهم برای کنترل مسیرهای زمینی جنوب." },
  "Highgarden": { location: "مرکز Reach، کنار Mander", description: "مقر خاندان Tyrell و مرکز سیاسی Reach؛ در میان زمین‌های حاصلخیز و مسیرهای مهم رود Mander قرار دارد." },
  "Horn Hill": { location: "Reach، جنوب Highgarden", description: "مقر خاندان Tarly در Reach؛ دژی شناخته‌شده در منطقه و خانه یکی از خاندان‌های نظامی قدرتمند جنوب." },
  "Oldtown": { location: "جنوب‌غربی Reach، دهانه Honeywine", description: "یکی از قدیمی‌ترین و بزرگ‌ترین شهرهای Westeros؛ مرکز خاندان Hightower و محل Citadel، با بندری مهم در جنوب‌غربی قاره." },
  "Sunspear": { location: "ساحل شرقی Dorne", description: "مقر خاندان Martell و مرکز سیاسی Dorne؛ شهری ساحلی که بر سرزمین‌های جنوب شرقی Dorne مشرف است." },
  "Kingsgrave": { location: "Dorne", description: "مقر خاندان Manwoody در Dorne و یکی از دژهای مهم خاندان‌های نجیب این منطقه." },
  "Yronwood": { location: "Dorne، شمال‌غربی Dorne", description: "مقر خاندان Yronwood و یکی از بزرگ‌ترین دژهای Dorne؛ بر مسیرهای مهم شمال‌غربی منطقه قرار دارد." }
};

const houses = [
  { region: "The Wall", icon: "🌓", castles: [
    { house: "Night's Watch", castle: "Castle Black", icon: "🌟🏰" },
    { house: "Night's Watch", castle: "Eastwatch", icon: "⚓" },
    { house: "Night's Watch", castle: "Shadow Tower", icon: "🏰" }
  ]},
  { region: "North", icon: "🐺", castles: [
    { house: "Stark", castle: "Winterfell", icon: "🌟🔱" },
    { house: "Bolton", castle: "The Dreadfort", icon: "🏯" },
    { house: "Karstark", castle: "Karhold", icon: "⚓" }
  ]},
  { region: "Riverlands", icon: "🌊", castles: [
    { house: "Tully", castle: "Riverrun", icon: "🌟🔱" },
    { house: "Frey", castle: "The Twins", icon: "🏯" },
    { house: "Mallister", castle: "Seagard", icon: "⚓" }
  ]},
  { region: "Vale", icon: "⛰️", castles: [
    { house: "Arryn", castle: "The Eyrie", icon: "🌟🔱" },
    { house: "Grafton", castle: "Gulltown", icon: "⚓" },
    { house: "Redfort", castle: "Redfort", icon: "🏯" }
  ]},
  { region: "Iron Islands", icon: "⚒️", castles: [
    { house: "Greyjoy", castle: "Pyke", icon: "🌟🔱⚓" },
    { house: "Harlaw", castle: "Ten Towers", icon: "⚓" },
    { house: "Goodbrother", castle: "Hammerhorn", icon: "⚓" }
  ]},
  { region: "Westerlands", icon: "🦁", castles: [
    { house: "Lannister", castle: "Casterly Rock", icon: "🌟🔱⚓" },
    { house: "Brax", castle: "Hornvale", icon: "🏯" },
    { house: "Marbrand", castle: "Ashemark", icon: "🏯" }
  ]},
  { region: "Crownlands", icon: "🐉", castles: [
    { house: "Crownlands", castle: "King's Landing", icon: "🌟👑" },
    { house: "Targaryen", castle: "Dragonstone", icon: "⚓" },
    { house: "Bar Emmon", castle: "Sharp Point", icon: "🏯" }
  ]},
  { region: "Stormlands", icon: "🦌", castles: [
    { house: "Baratheon", castle: "Storm's End", icon: "🌟🔱⚓" },
    { house: "Fell", castle: "Fellwood", icon: "🏯" },
    { house: "Dondarrion", castle: "Blackhaven", icon: "🏯" }
  ]},
  { region: "Reach", icon: "🏵️", castles: [
    { house: "Tyrell", castle: "Highgarden", icon: "🌟🔱" },
    { house: "Tarly", castle: "Horn Hill", icon: "🏯" },
    { house: "Hightower", castle: "Oldtown", icon: "⚓" }
  ]},
  { region: "Dorne", icon: "☀️", castles: [
    { house: "Martell", castle: "Sunspear", icon: "🌟🔱⚓" },
    { house: "Manwoody", castle: "Kingsgrave", icon: "🏯" },
    { house: "Yronwood", castle: "Yronwood", icon: "⚓" }
  ]}
];

function readJson(file) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; } }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2)); }
function readPlayers() { return readJson(dataFile); }
function writePlayers(players) { writeJson(dataFile, players); }
function readUsers() { return readJson(usersFile); }
function writeUsers(users) { writeJson(usersFile, users); }
function normalizeUsername(value) { return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, ""); }
function validTelegramUsername(value) { return /^[A-Za-z0-9_]{5,32}$/.test(value); }
function validAccountUsername(value) { return /^[A-Za-z0-9_]{3,24}$/.test(value); }
function findCastle(region, castle) { const r = houses.find(x => x.region === region); return r?.castles.find(x => x.castle === castle); }
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) { const hash = crypto.scryptSync(password, salt, 64).toString("hex"); return { salt, hash }; }
function verifyPassword(password, salt, storedHash) { const hash = crypto.scryptSync(password, salt, 64).toString("hex"); return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex")); }
function requireAuth(req, res, next) { if (!req.session.userId) return res.status(401).json({ error: "ابتدا وارد حساب کاربری شوید." }); next(); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/auth/status", (req, res) => {
  const user = readUsers().find(u => u.id === req.session.userId);
  res.json({ authenticated: !!user, user: user ? { id: user.id, username: user.username } : null });
});

app.post("/api/auth/register", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  if (!validAccountUsername(username)) return res.status(400).json({ error: "نام کاربری باید ۳ تا ۲۴ کاراکتر و فقط شامل حروف، عدد یا _ باشد." });
  if (password.length < 6) return res.status(400).json({ error: "رمز عبور باید حداقل ۶ کاراکتر باشد." });
  const users = readUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: "این نام کاربری قبلاً ثبت شده است." });
  const { salt, hash } = hashPassword(password);
  const user = { id: crypto.randomUUID(), username, salt, hash, createdAt: new Date().toISOString() };
  users.push(user); writeUsers(users); req.session.userId = user.id;
  res.json({ ok: true, user: { id: user.id, username: user.username } });
});

app.post("/api/auth/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");
  const user = readUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user || !verifyPassword(password, user.salt, user.hash)) return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
  req.session.userId = user.id;
  res.json({ ok: true, user: { id: user.id, username: user.username } });
});

app.post("/api/auth/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get("/api/houses", (req, res) => res.json(houses));

app.get("/api/players", (req, res) => {
  res.json(readPlayers().map(p => ({ id: p.id, username: p.username, region: p.region, house: p.house, castle: p.castle, accountId: p.accountId, createdAt: p.createdAt })));
});

app.get("/api/my-castles", requireAuth, (req, res) => {
  const mine = readPlayers().filter(p => p.accountId === req.session.userId);
  res.json(mine.map(p => ({ id: p.id, username: p.username, region: p.region, house: p.house, castle: p.castle, createdAt: p.createdAt })));
});

app.post("/api/register", requireAuth, (req, res) => {
  const username = normalizeUsername(req.body.username);
  const region = String(req.body.region || "").trim();
  const castle = String(req.body.castle || "").trim();
  if (!validTelegramUsername(username)) return res.status(400).json({ error: "Username تلگرام معتبر نیست. فقط حروف، عدد و _ و بین ۵ تا ۳۲ کاراکتر." });
  const selected = findCastle(region, castle);
  if (!selected) return res.status(400).json({ error: "قلمرو یا قلعه معتبر نیست." });
  const players = readPlayers();
  if (players.some(p => p.region === region && p.castle === castle)) return res.status(409).json({ error: "این قلعه قبلاً توسط یک لرد انتخاب شده است." });
  if (players.some(p => p.username.toLowerCase() === username.toLowerCase())) return res.status(409).json({ error: "این Telegram Username قبلاً ثبت شده است." });
  if (players.some(p => p.accountId === req.session.userId)) return res.status(409).json({ error: "این حساب قبلاً برای Kill The King یک قلعه انتخاب کرده است." });
  const player = { id: Date.now().toString(36), username: "@" + username, region, house: selected.house, castle, accountId: req.session.userId, createdAt: new Date().toISOString() };
  players.push(player); writePlayers(players);
  res.json({ message: `ثبت شد لرد ${selected.house}`, player });
});

app.post("/api/admin/login", (req, res) => { if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ error: "رمز مدیر اشتباه است." }); req.session.admin = true; res.json({ ok: true }); });
app.post("/api/admin/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/admin/status", (req, res) => res.json({ admin: !!req.session.admin }));
function requireAdmin(req, res, next) { if (!req.session.admin) return res.status(401).json({ error: "دسترسی مدیر لازم است." }); next(); }
app.post("/api/admin/players", requireAdmin, (req, res) => {
  const username = normalizeUsername(req.body.username), region = String(req.body.region || "").trim(), castle = String(req.body.castle || "").trim();
  const selected = findCastle(region, castle);
  if (!validTelegramUsername(username) || !selected) return res.status(400).json({ error: "اطلاعات واردشده معتبر نیست." });
  const players = readPlayers();
  if (players.some(p => p.region === region && p.castle === castle)) return res.status(409).json({ error: "این قلعه قبلاً رزرو شده است." });
  if (players.some(p => p.username.toLowerCase() === ("@" + username).toLowerCase())) return res.status(409).json({ error: "این Username قبلاً ثبت شده است." });
  const player = { id: Date.now().toString(36), username: "@" + username, region, house: selected.house, castle, createdAt: new Date().toISOString() };
  players.push(player); writePlayers(players); res.json({ player });
});
app.delete("/api/admin/players/:id", requireAdmin, (req, res) => { const players = readPlayers(); const next = players.filter(p => p.id !== req.params.id); if (next.length === players.length) return res.status(404).json({ error: "پلیر پیدا نشد." }); writePlayers(next); res.json({ ok: true }); });

app.get("/api/castles/:castle", (req, res) => {
  const info = castleInfo[req.params.castle];
  if (!info) return res.status(404).json({ error: "اطلاعات قلعه پیدا نشد." });
  res.json(info);
});

app.use((req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`KHATA GAMES running at http://localhost:${PORT}`));
