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



const SESSION_TTL = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_PASSWORD_LENGTH = 128;
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; script-src 'self'; connect-src 'self'; upgrade-insecure-requests"
};


function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...SECURITY_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}
async function body(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) { const e = new Error("Request body too large"); e.status = 413; throw e; }
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) { const e = new Error("JSON required"); e.status = 415; throw e; }
  try { return await request.json(); } catch { const e = new Error("Invalid JSON"); e.status = 400; throw e; }
}
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}
function base64url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
async function constantTimeSecretEqual(a, b) {
  const [ha, hb] = await Promise.all([sha256Base64Url(String(a)), sha256Base64Url(String(b))]);
  if (ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}
function normalizeUsername(value) { return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, ""); }
function validTelegramUsername(value) { return /^[A-Za-z0-9_]{5,32}$/.test(value); }
function validAccountUsername(value) { return /^[A-Za-z0-9_]{3,24}$/.test(value); }
function findCastle(region, castle) { const r = houses.find(x => x.region === region); return r?.castles.find(x => x.castle === castle); }
function cookie(name, value, maxAge = SESSION_TTL / 1000) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(maxAge)}`; }
function clearCookie(name) { return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function getCookie(request, name) { const raw = request.headers.get("Cookie") || ""; const m = raw.match(new RegExp(`(?:^|; )${name}=([^;]*)`)); return m ? decodeURIComponent(m[1]) : null; }
function newId() { return crypto.randomUUID(); }
async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 12000, hash: "SHA-256" }, key, 256);
  return { salt: btoa(String.fromCharCode(...salt)), hash: btoa(String.fromCharCode(...new Uint8Array(bits))) };
}
function bytes(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
async function verifyPassword(password, salt, storedHash) {
  const made = await hashPassword(password, bytes(salt));
  const a = bytes(made.hash), b = bytes(storedHash); if (a.length !== b.length) return false; let diff = 0; for (let i=0;i<a.length;i++) diff |= a[i]^b[i]; return diff === 0;
}
async function getSession(request, env) {
  const token = getCookie(request, "khata_session"); if (!token) return null;
  const sid = await sha256Base64Url(token);
  const row = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > ?").bind(sid, Date.now()).first();
  return row || null;
}
async function requireUser(request, env) {
  const s = await getSession(request, env);
  if (!s || s.is_admin) return null;
  const user = await env.DB.prepare("SELECT id FROM users WHERE id=?").bind(s.user_id).first();
  return user ? s : null;
}
async function createSession(env, userId, admin = 0) {
  const token = randomToken(), id = await sha256Base64Url(token), expires = Date.now() + SESSION_TTL;
  await env.DB.prepare("INSERT INTO sessions (id,user_id,is_admin,expires_at) VALUES (?,?,?,?)").bind(id,userId,admin,expires).run();
  return token;
}
async function deleteSession(request, env) {
  const token=getCookie(request,"khata_session");
  if(token){ const sid=await sha256Base64Url(token); await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(sid).run(); }
}
async function cleanupExpiredSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(Date.now()).run();
}
async function rateLimit(request, env, action, limit, windowMs = 15 * 60 * 1000) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = action + ":" + await sha256Base64Url(ip);
  const now = Date.now(), bucket = now - (now % windowMs);
  const row = await env.DB.prepare(`INSERT INTO rate_limits (bucket_key, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(bucket_key) DO UPDATE SET count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END, window_start = excluded.window_start
    RETURNING count`).bind(key, bucket).first();
  return Number(row?.count || 1) <= limit;
}
function publicUser(u) { return u ? { id: u.id, username: u.username } : null; }
async function players(env) { return (await env.DB.prepare("SELECT id, username, region, house, castle, created_at AS createdAt FROM players ORDER BY created_at").all()).results; }



const ECONOMY_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS castle_state (
    castle TEXT PRIMARY KEY, region TEXT NOT NULL, owner_account_id TEXT,
    peasants INTEGER NOT NULL DEFAULT 500, coins INTEGER NOT NULL DEFAULT 5000,
    wood INTEGER NOT NULL DEFAULT 500, stone INTEGER NOT NULL DEFAULT 500, iron INTEGER NOT NULL DEFAULT 500,
    meat INTEGER NOT NULL DEFAULT 500, fish INTEGER NOT NULL DEFAULT 500, grain INTEGER NOT NULL DEFAULT 6000,
    horses INTEGER NOT NULL DEFAULT 0, dragon_glass INTEGER NOT NULL DEFAULT 0, wildfire INTEGER NOT NULL DEFAULT 0,
    tar INTEGER NOT NULL DEFAULT 0, grapes INTEGER NOT NULL DEFAULT 50,
    workshop_level INTEGER NOT NULL DEFAULT 0, port_level INTEGER NOT NULL DEFAULT 0, port_enabled INTEGER NOT NULL DEFAULT 0,
    special_item TEXT, equipment_day TEXT, equipment_week TEXT,
    UNIQUE(castle)
  )`,
  `CREATE TABLE IF NOT EXISTS castle_production (castle TEXT NOT NULL, production_key TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,production_key))`,
  `CREATE TABLE IF NOT EXISTS castle_camps (castle TEXT NOT NULL, camp_key TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,camp_key))`,
  `CREATE TABLE IF NOT EXISTS castle_special_camps (castle TEXT NOT NULL, camp_key TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,camp_key))`,
  `CREATE TABLE IF NOT EXISTS castle_army (castle TEXT NOT NULL, unit_key TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,unit_key))`,
  `CREATE TABLE IF NOT EXISTS castle_equipment (castle TEXT NOT NULL, item_key TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,item_key))`,
  `CREATE TABLE IF NOT EXISTS castle_fleet (castle TEXT NOT NULL, ship_key TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,ship_key))`,
  `CREATE TABLE IF NOT EXISTS game_week_runs (week_key TEXT PRIMARY KEY, processed_at TEXT NOT NULL)`
];

const GENERAL_PRODUCTIONS = {
  farm:{label:"🌾 مزرعه",max:50,cost:{coins:500,wood:100,stone:20,peasants:20},base:"grain",yield:500},
  lumber:{label:"🪵 چوب‌بری",max:50,cost:{coins:400,stone:25,peasants:20},base:"wood",yield:300},
  stone:{label:"🪨 معدن سنگ",max:50,cost:{coins:200,wood:100,peasants:20},base:"stone",yield:50},
  iron:{label:"⛓ معدن آهن",max:50,cost:{coins:200,wood:100,stone:25,peasants:20},base:"iron",yield:100},
  recreation:{label:"🕹 مرکز تفریحی",max:50,cost:{coins:500,wood:100,stone:25,peasants:25},base:"coins",yield:500},
  village:{label:"🏘 دهکده",max:50,cost:{coins:200,wood:100,stone:25,peasants:20},base:"peasants",yield:50},
  market:{label:"🛒 بازارچه",max:50,cost:{coins:1000,wood:200,stone:50,peasants:20},base:"coins",yield:800},
  stable:{label:"🐎 اصطبل",max:50,cost:{coins:200,wood:150,stone:25,peasants:20},base:"horses",yield:20},
  slaughterhouse:{label:"🥩 کشتارگاه",max:50,cost:{coins:300,wood:100,stone:20,peasants:20},base:"meat",yield:100}
};
const SPECIAL_PRODUCTIONS = {
  Riverlands:{key:"fishery",label:"🐟 شیلات",max:20,cost:{coins:250,wood:150,peasants:15},base:"fish",yield:250},
  Westerlands:{key:"gold_mine",label:"🦁 معدن طلا",max:20,cost:{wood:300,iron:150,peasants:20},base:"coins",yield:2500},
  Crownlands:{key:"dragon_glass",label:"🐉 تولید شیشه اژدها",max:20,cost:{coins:1200,peasants:20,wood:70,iron:25},base:"dragon_glass",yield:50},
  Stormlands:{key:"tar",label:"🛢 تولید قیر",max:20,cost:{coins:200,wood:100,stone:250,peasants:20},base:"tar",yield:5},
  Dorne:{key:"vineyard",label:"🍇 تاکستان",max:20,cost:{coins:250,wood:100,peasants:20},base:"grapes",yield:300}
};
const REGION_MULTIPLIERS = {
  "The Wall":{lumber:2},"North":{lumber:2},"Vale":{stone:2},"Iron Islands":{iron:2},"Reach":{farm:2},
  "Free Folk":{slaughterhouse:2}
};
const GENERAL_CAMPS = {
  swordsman:{label:"🗡 کمپ شمشیرزن",max:20,unit:"swordsman",cost:{coins:300,wood:100,iron:25,peasants:100},yield:100},
  archer:{label:"🏹 کمپ کماندار",max:20,unit:"archer",cost:{coins:300,wood:100,iron:25,peasants:100},yield:100},
  spearman:{label:"🔱 کمپ نیزه‌دار",max:20,unit:"spearman",cost:{coins:300,wood:100,iron:25,peasants:100},yield:100},
  cavalry:{label:"🏇 کمپ سواره‌نظام",max:20,unit:"cavalry",cost:{coins:350,wood:150,iron:25,peasants:50,horses:50},yield:100}
};
const SPECIAL_CAMPS = {
  "The Wall":[{key:"ranger",label:"🥷 کمپ رنجر",cost:{wood:200,iron:20,peasants:50},unit:"ranger",yield:50}],
  "North":[{key:"winter_soldier",label:"🐺 کمپ سرباز زمستان",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"winter_soldier",yield:50}],
  "Riverlands":[
    {key:"vale_knight",label:"😀 کمپ شوالیه ویل",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"vale_knight",yield:50},
    {key:"crossbowman",label:"🏹 کمپ کراسبو‌دار",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"crossbowman",yield:50}
  ],
  "Westerlands":[{key:"red_cloak",label:"🩸 کمپ ردا سرخ",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"red_cloak",yield:50}],
  "Crownlands":[{key:"dragon_knight",label:"🐉 کمپ شوالیه اژدها",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"dragon_knight",yield:50}],
  "Iron Islands":[{key:"axeman",label:"🪓 کمپ تبر‌دار",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"axeman",yield:50}],
  "Reach":[{key:"flower_knight",label:"🏵 شوالیه گل",cost:{coins:300,wood:200,iron:20,peasants:50},unit:"flower_knight",yield:50}],
  "Stormlands":[{key:"hammer_wielder",label:"🔨 پتک‌دار",cost:{coins:300,wood:200,iron:30,peasants:50},unit:"hammer_wielder",yield:50}],
  "Dorne":[{key:"dornish_spearman",label:"🔱 نیزه‌دار دورنیش",cost:{coins:300,wood:200,iron:10,peasants:50},unit:"dornish_spearman",yield:50}]
};
const EQUIPMENT = {
  ladder:{label:"🪜 نردبان",level:1,cost:{wood:70},limit:10,period:"day"},
  ram:{label:"🔩 دژکوب",level:2,cost:{wood:500,iron:50},limit:3,period:"day"},
  catapult:{label:"☄ منجنیق",level:3,cost:{wood:700,stone:75},limit:3,period:"day"},
  scorpion:{label:"🦂 اسکورپین",level:4,cost:{wood:1200,iron:90},limit:1,period:"day"},
  siege_tower:{label:"🏗 برج محاصره",level:5,cost:{wood:1500,stone:120,iron:120},limit:2,period:"week"}
};
const EQUIPMENT_UPGRADE_COST = 6000;
const RESOURCE_KEYS = ["peasants","coins","wood","stone","iron","meat","fish","grain","horses","dragon_glass","wildfire","tar","grapes"];
const RESOURCE_LABELS = {peasants:"👥 رعیت",coins:"💰 سکه",wood:"🪵 چوب",stone:"🪨 سنگ",iron:"⛓ آهن",meat:"🥩 گوشت",fish:"🐟 ماهی",grain:"🌾 غلات",horses:"🐎 اسب",dragon_glass:"🌑 شیشه اژدها",wildfire:"🧪 وایلدفایر",tar:"🛢 قیر",grapes:"🍇 انگور"};

function gameWeekKey(date=new Date()) {
  const d=new Date(date); const day=d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate()-day+1); d.setUTCHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function gameDayKey(date=new Date()) { return new Date(date).toISOString().slice(0,10); }
function addCostCheck(state,cost){ return Object.entries(cost).every(([k,v])=>Number(state[k]||0)>=Number(v)); }
function costText(cost){ return Object.entries(cost).map(([k,v])=>`\${RESOURCE_LABELS[k]||k} \${v}`).join(" + "); }

async function ensureEconomySchema(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS economy_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
  const ready=await env.DB.prepare("SELECT value FROM economy_meta WHERE key='seeded'").first();
  if(ready?.value==="1") return;
  for (const sql of ECONOMY_SCHEMA) await env.DB.prepare(sql).run();
  for (const r of houses) {
    for (const c of r.castles) {
      await env.DB.prepare("INSERT OR IGNORE INTO castle_state (castle,region) VALUES (?,?)").bind(c.castle,r.region).run();
      await env.DB.prepare("INSERT OR IGNORE INTO castle_week_state (castle,last_week_key) VALUES (?,?)").bind(c.castle,gameWeekKey()).run();
      const defaults={farm:1,village:1,lumber:0,stone:0,iron:0,recreation:0,market:0,stable:0,slaughterhouse:0};
      for (const [k,lvl] of Object.entries(defaults)) await env.DB.prepare("INSERT OR IGNORE INTO castle_production (castle,production_key,level) VALUES (?,?,?)").bind(c.castle,k,lvl).run();
      const sp=SPECIAL_PRODUCTIONS[r.region];
      if(sp) await env.DB.prepare("INSERT OR IGNORE INTO castle_production (castle,production_key,level) VALUES (?,?,0)").bind(c.castle,sp.key).run();
      for (const k of Object.keys(GENERAL_CAMPS)) await env.DB.prepare("INSERT OR IGNORE INTO castle_camps (castle,camp_key,level) VALUES (?,?,0)").bind(c.castle,k).run();
      for (const unit of ["swordsman","archer","spearman","cavalry"]) await env.DB.prepare("INSERT OR IGNORE INTO castle_army (castle,unit_key,count) VALUES (?,?,?)").bind(c.castle,unit,unit==="swordsman"?500:unit==="archer"?200:100).run();
      for (const item of Object.keys(EQUIPMENT)) await env.DB.prepare("INSERT OR IGNORE INTO castle_equipment (castle,item_key,count) VALUES (?,?,0)").bind(c.castle,item).run();
      for (const ship of ["transport","warship"]) await env.DB.prepare("INSERT OR IGNORE INTO castle_fleet (castle,ship_key,count) VALUES (?,?,1)").bind(c.castle,ship).run();
      for (const spc of (SPECIAL_CAMPS[r.region]||[])) await env.DB.prepare("INSERT OR IGNORE INTO castle_special_camps (castle,camp_key,level) VALUES (?,?,0)").bind(c.castle,spc.key).run();
    }
  }
  await env.DB.prepare("INSERT OR REPLACE INTO economy_meta(key,value) VALUES ('seeded','1')").run();
}

async function loadCastleEconomy(env, castle) {
  const state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first();
  if(!state) return null;
  const [prod,camps,specialCamps,army,equipment,fleet]=await Promise.all([
    env.DB.prepare("SELECT production_key,level FROM castle_production WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT camp_key,level FROM castle_camps WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT camp_key,level FROM castle_special_camps WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT item_key,count FROM castle_equipment WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT ship_key,count FROM castle_fleet WHERE castle=?").bind(castle).all()
  ]);
  const production=Object.fromEntries(prod.results.map(x=>[x.production_key,{level:Number(x.level),...GENERAL_PRODUCTIONS[x.production_key]}]));
  const campMap=Object.fromEntries(camps.results.map(x=>[x.camp_key,{level:Number(x.level),...GENERAL_CAMPS[x.camp_key]}]));
  const specialCampMap=Object.fromEntries(specialCamps.results.map(x=>[x.camp_key,{level:Number(x.level),...(SPECIAL_CAMPS[state.region]||[]).find(s=>s.key===x.camp_key)}]));
  const armyMap=Object.fromEntries(army.results.map(x=>[x.unit_key,Number(x.count)]));
  const equipmentMap=Object.fromEntries(equipment.results.map(x=>[x.item_key,Number(x.count)]));
  const fleetMap=Object.fromEntries(fleet.results.map(x=>[x.ship_key,Number(x.count)]));
  let parsedSpecialItem=null; try{parsedSpecialItem=state.special_item?JSON.parse(state.special_item):null;}catch{parsedSpecialItem=null;}
  const sp=SPECIAL_PRODUCTIONS[state.region]||null;
  const specialProduction=sp?{key:sp.key,level:Number(production[sp.key]?.level||0),label:sp.label,max:sp.max,cost:sp.cost,base:sp.base,yield:sp.yield}:null;
  return {castle:state.castle,region:state.region,ownerAccountId:state.owner_account_id,resources:Object.fromEntries(RESOURCE_KEYS.map(k=>[k,Number(state[k]||0)])),production,camps:campMap,specialCamps:specialCampMap,specialProduction,army:armyMap,equipment:equipmentMap,fleet:fleetMap,workshop:{level:Number(state.workshop_level),maxLevel:5,upgradeCost:EQUIPMENT_UPGRADE_COST},port:{enabled:!!state.port_enabled,level:Number(state.port_level),maxLevel:15,weeklyYieldPerShipType:Number(state.port_level)},specialItem:parsedSpecialItem,gameWeek:gameWeekKey()};
}

async function runWeeklyUpdate(env) {
  const week=gameWeekKey();
  const rows=(await env.DB.prepare("SELECT * FROM castle_state").all()).results;
  for(const s of rows){
    const marker=await env.DB.prepare("SELECT last_week_key FROM castle_week_state WHERE castle=?").bind(s.castle).first();
    if(marker?.last_week_key===week) continue;
    const prods=(await env.DB.prepare("SELECT production_key,level FROM castle_production WHERE castle=?").bind(s.castle).all()).results;
    const camps=(await env.DB.prepare("SELECT camp_key,level FROM castle_camps WHERE castle=?").bind(s.castle).all()).results;
    const scamps=(await env.DB.prepare("SELECT camp_key,level FROM castle_special_camps WHERE castle=?").bind(s.castle).all()).results;
    const army=(await env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=?").bind(s.castle).all()).results;
    const changes={}; const add=(k,v)=>changes[k]=(changes[k]||0)+v;
    for(const p of prods){
      const def=GENERAL_PRODUCTIONS[p.production_key]; if(!def||!p.level) continue;
      let gain=Number(p.level)*def.yield;
      if(p.production_key==="farm"&&Number(p.level)===1) gain=300;
      gain*=REGION_MULTIPLIERS[s.region]?.[p.production_key]||1;
      add(def.base,gain);
    }
    const sp=SPECIAL_PRODUCTIONS[s.region];
    if(sp){
      const lvl=Number(prods.find(x=>x.production_key===sp.key)?.level||0);
      if(lvl) add(sp.base,lvl*sp.yield);
    }
    for(const c of camps){const d=GENERAL_CAMPS[c.camp_key];if(d&&c.level)add(d.unit,c.level*d.yield);}
    for(const c of scamps){const d=(SPECIAL_CAMPS[s.region]||[]).find(x=>x.key===c.camp_key);if(d&&c.level)add(d.unit,c.level*d.yield);}
    const a=Object.fromEntries(army.map(x=>[x.unit_key,Number(x.count)]));
    let grainNeed=(a.swordsman||0)+(a.archer||0)+(a.spearman||0)+((a.cavalry||0)*2);
    let meatNeed=(a.giants||0)*2;
    for(const [key,count] of Object.entries(a)) if(!["swordsman","archer","spearman","cavalry","giants"].includes(key)) grainNeed+=count*2;
    let grainUsed=Math.min(Number(s.grain),grainNeed);
    let rem=grainNeed-grainUsed;
    let fishUsed=Math.min(Number(s.fish),Math.ceil(rem/2));
    rem-=fishUsed*2;
    let meatUsed=Math.min(Number(s.meat),Math.max(Math.ceil(Math.max(0,rem)/2),meatNeed));
    const resourceParts=[]; const resourceBind=[];
    for(const [k,v] of Object.entries(changes)){
      if(RESOURCE_KEYS.includes(k)&&v){resourceParts.push(`\${k}=\${k}+?`);resourceBind.push(Math.floor(v));}
    }
    resourceParts.push("grain=grain-?","fish=fish-?","meat=meat-?");
    resourceBind.push(grainUsed,fishUsed,meatUsed);
    const statements=[
      env.DB.prepare(`UPDATE castle_state SET \${resourceParts.join(",")} WHERE castle=?`).bind(...resourceBind,s.castle),
      env.DB.prepare("UPDATE castle_week_state SET last_week_key=? WHERE castle=?").bind(week,s.castle)
    ];
    for(const [unit,gain] of Object.entries(changes).filter(([k])=>!RESOURCE_KEYS.includes(k))){
      statements.push(env.DB.prepare("INSERT INTO castle_army(castle,unit_key,count) VALUES (?,?,?) ON CONFLICT(castle,unit_key) DO UPDATE SET count=count+excluded.count").bind(s.castle,unit,Math.floor(gain)));
    }
    if(Number(s.port_enabled)&&Number(s.port_level)>0){
      statements.push(
        env.DB.prepare("UPDATE castle_fleet SET count=count+? WHERE castle=? AND ship_key='transport'").bind(Number(s.port_level),s.castle),
        env.DB.prepare("UPDATE castle_fleet SET count=count+? WHERE castle=? AND ship_key='warship'").bind(Number(s.port_level),s.castle)
      );
    }
    await env.DB.batch(statements);
  }
}

async function requireCastleOwner(request,env){
  const s=await requireUser(request,env); if(!s)return null;
  return await env.DB.prepare("SELECT * FROM castle_state WHERE owner_account_id=?").bind(s.user_id).first();
}
function safeCost(cost){return Object.fromEntries(Object.entries(cost).filter(([k,v])=>RESOURCE_KEYS.includes(k)&&Number(v)>0));}
async function upgradeResourceBacked(env,castle,table,key,def,maxLevel){
  const row=await env.DB.prepare(`SELECT level FROM \${table} WHERE castle=? AND \${table==="castle_production"?"production_key":"camp_key"}=?`).bind(castle,key).first();
  const level=Number(row?.level||0); if(level>=maxLevel)return {error:"این مورد به حداکثر سطح رسیده است.",status:400};
  if(!addCostCheck(await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first(),def.cost))return {error:"منابع کافی نیست.",status:400};
  const cost=safeCost(def.cost); const sets=Object.keys(cost).map(k=>`\${k}=\${k}-?`).join(",");
  const where=table==="castle_production"?"production_key":"camp_key";
  const q1=env.DB.prepare(`UPDATE castle_state SET \${sets} WHERE castle=? AND \${Object.keys(cost).map(k=>`\${k}>=?`).join(" AND ")}`).bind(...Object.values(cost),castle,...Object.values(cost));
  const q2=env.DB.prepare(`UPDATE \${table} SET level=level+1 WHERE castle=? AND \${where}=? AND level=?`).bind(castle,key,level);
  const b=await env.DB.batch([q1,q2]); if(!b[1]?.meta?.changes)return {error:"ارتقا همزمان تغییر کرده؛ دوباره تلاش کن.",status:409}; return {ok:true,newLevel:level+1};
}

async function handleApi(request, env, url) {
  const method=request.method, path=url.pathname;
  if (method === "GET" && path === "/api/health") { await env.DB.prepare("SELECT 1 AS ok").first(); return json({ok:true,service:"khata-games"}); }
  if (method === "GET" && path === "/api/auth/status") {
    const s=await getSession(request,env); let user=null; if(s?.user_id) user=await env.DB.prepare("SELECT id,username FROM users WHERE id=?").bind(s.user_id).first();
    return json({authenticated:!!user,user:publicUser(user)});
  }
  if (method === "POST" && path === "/api/auth/register") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if (!(await rateLimit(request, env, "register", 10))) return json({error:"تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید."},429, {"retry-after":"900"});
    const b=await body(request), username=String(b.username||"").trim(), password=String(b.password||"");
    if(!validAccountUsername(username)) return json({error:"نام کاربری باید ۳ تا ۲۴ کاراکتر و فقط شامل حروف، عدد یا _ باشد."},400);
    if(password.length<12 || password.length>MAX_PASSWORD_LENGTH) return json({error:"رمز عبور باید بین ۱۲ تا ۱۲۸ کاراکتر باشد."},400);
    const exists=await env.DB.prepare("SELECT id FROM users WHERE lower(username)=lower(?)").bind(username).first(); if(exists) return json({error:"این نام کاربری قبلاً ثبت شده است."},409);
    const h=await hashPassword(password), id=newId(); await env.DB.prepare("INSERT INTO users (id,username,salt,hash,created_at) VALUES (?,?,?,?,?)").bind(id,username,h.salt,h.hash,new Date().toISOString()).run();
    await deleteSession(request,env);
    await deleteSession(request,env);
    const sid=await createSession(env,id); return new Response(JSON.stringify({ok:true,user:{id,username}}),{status:200,headers:{"content-type":"application/json","set-cookie":cookie("khata_session",sid)}});
  }
  if (method === "POST" && path === "/api/auth/login") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if (!(await rateLimit(request, env, "login", 10))) return json({error:"تعداد تلاش‌های ورود زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید."},429, {"retry-after":"900"});
    const b=await body(request), username=String(b.username||"").trim(), password=String(b.password||""); if(username.length>24 || password.length>MAX_PASSWORD_LENGTH) return json({error:"نام کاربری یا رمز عبور اشتباه است."},401); const u=await env.DB.prepare("SELECT * FROM users WHERE lower(username)=lower(?)").bind(username).first();
    if(!u || !(await verifyPassword(password,u.salt,u.hash))) return json({error:"نام کاربری یا رمز عبور اشتباه است."},401); await deleteSession(request,env); const sid=await createSession(env,u.id); return json({ok:true,user:publicUser(u)},200,{"set-cookie":cookie("khata_session",sid)});
  }
  if (method === "POST" && path === "/api/auth/logout") { if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); await deleteSession(request,env); return new Response(JSON.stringify({ok:true}),{status:200,headers:{"content-type":"application/json","set-cookie":clearCookie("khata_session")}}); }
  if (method === "GET" && path === "/api/houses") return json(houses);
  if (method === "GET" && path === "/api/players") return json(await players(env));
  const session=await getSession(request,env);
  const userSession=await requireUser(request,env);
  if (method === "GET" && path === "/api/my-castles") { if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401); return json((await env.DB.prepare("SELECT id,username,region,house,castle,created_at AS createdAt FROM players WHERE account_id=? ORDER BY created_at").bind(userSession.user_id).all()).results); }
  if (method === "POST" && path === "/api/register") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401); const b=await body(request), username=normalizeUsername(b.username), region=String(b.region||"").trim(), castle=String(b.castle||"").trim();
    if(!validTelegramUsername(username)) return json({error:"Username تلگرام معتبر نیست. فقط حروف، عدد و _ و بین ۵ تا ۳۲ کاراکتر."},400); const selected=findCastle(region,castle); if(!selected) return json({error:"قلمرو یا قلعه معتبر نیست."},400);
    if(await env.DB.prepare("SELECT id FROM players WHERE region=? AND castle=?").bind(region,castle).first()) return json({error:"این قلعه قبلاً توسط یک لرد انتخاب شده است."},409);
    if(await env.DB.prepare("SELECT id FROM players WHERE lower(username)=lower(?)").bind("@"+username).first()) return json({error:"این Telegram Username قبلاً ثبت شده است."},409);
    if(await env.DB.prepare("SELECT id FROM players WHERE account_id=?").bind(userSession.user_id).first()) return json({error:"این حساب قبلاً برای Kill The King یک قلعه انتخاب کرده است."},409);
    const p={id:newId(),username:"@"+username,region,house:selected.house,castle,account_id:userSession.user_id,created_at:new Date().toISOString()}; await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,p.account_id,p.created_at).run(); await ensureEconomySchema(env); await env.DB.prepare("UPDATE castle_state SET owner_account_id=? WHERE castle=?").bind(p.account_id,p.castle).run(); return json({message:`ثبت شد لرد ${selected.house}`,player:p});
  }
  if (method === "POST" && path === "/api/admin/login") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if (!(await rateLimit(request, env, "admin-login", 5))) return json({error:"تعداد تلاش‌های ورود مدیر زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید."},429, {"retry-after":"900"});
    if (!env.ADMIN_PASSWORD) return json({error:"رمز مدیر روی سرور تنظیم نشده است."},503);
    const b=await body(request);
    if(!(await constantTimeSecretEqual(String(b.password||""), String(env.ADMIN_PASSWORD)))) return json({error:"رمز مدیر اشتباه است."},401);
    await deleteSession(request,env);
    const sid=await createSession(env,"__admin__",1);
    return json({ok:true},200,{"set-cookie":cookie("khata_session",sid)});
  }
  if (method === "POST" && path === "/api/admin/logout") { if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); await deleteSession(request,env); return new Response(JSON.stringify({ok:true}),{status:200,headers:{"content-type":"application/json","set-cookie":clearCookie("khata_session")}}); }
  if (method === "GET" && path === "/api/admin/status") return json({admin:!!session?.is_admin});
  if (path === "/api/admin/players" && method === "POST") {
    if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin) return json({error:"دسترسی مدیر لازم است."},401); const b=await body(request), username=normalizeUsername(b.username),region=String(b.region||"").trim(),castle=String(b.castle||"").trim(),selected=findCastle(region,castle); if(!validTelegramUsername(username)||!selected)return json({error:"اطلاعات واردشده معتبر نیست."},400);
    if(await env.DB.prepare("SELECT id FROM players WHERE region=? AND castle=?").bind(region,castle).first())return json({error:"این قلعه قبلاً رزرو شده است."},409); if(await env.DB.prepare("SELECT id FROM players WHERE lower(username)=lower(?)").bind("@"+username).first())return json({error:"این Username قبلاً ثبت شده است."},409);
    const p={id:newId(),username:"@"+username,region,house:selected.house,castle,created_at:new Date().toISOString()}; await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,null,p.created_at).run(); await ensureEconomySchema(env); return json({player:p});
  }
  if(path.startsWith("/api/admin/players/")&&method==="DELETE"){ if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401); const id=decodeURIComponent(path.split("/").pop()); const old=await env.DB.prepare("SELECT castle FROM players WHERE id=?").bind(id).first(); const r=await env.DB.prepare("DELETE FROM players WHERE id=?").bind(id).run(); if(!r.meta.changes)return json({error:"پلیر پیدا نشد."},404); await ensureEconomySchema(env); if(old?.castle) await env.DB.prepare("UPDATE castle_state SET owner_account_id=NULL WHERE castle=?").bind(old.castle).run(); return json({ok:true}); }
  if(method==="GET"&&path.startsWith("/api/castles/")){const name=decodeURIComponent(path.slice("/api/castles/".length));const info=castleInfo[name];if(!info)return json({error:"اطلاعات قلعه پیدا نشد."},404);return json(info);}

  if (path.startsWith("/api/my-castle") || path.startsWith("/api/game/")) {
    await ensureEconomySchema(env);
    await runWeeklyUpdate(env);
  }
  if (method==="GET" && path==="/api/game/week") return json({week:gameWeekKey()});
  if (method==="GET" && path==="/api/my-castle/assets") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"ابتدا قلعه خود را ثبت کنید."},404);
    return json(await loadCastleEconomy(env,state.castle));
  }
  if (method==="POST" && path==="/api/my-castle/production/upgrade") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const b=await body(request), key=String(b.key||""); const def=GENERAL_PRODUCTIONS[key];
    if(!def)return json({error:"تولیدی معتبر نیست."},400);
    const result=await upgradeResourceBacked(env,state.castle,"castle_production",key,def,def.max);
    if(result.error)return json({error:result.error},result.status);
    return json(result);
  }
  if (method==="POST" && path==="/api/my-castle/camp/upgrade") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const b=await body(request), key=String(b.key||""); const def=GENERAL_CAMPS[key];
    if(!def)return json({error:"کمپ معتبر نیست."},400);
    const result=await upgradeResourceBacked(env,state.castle,"castle_camps",key,def,def.max);
    if(result.error)return json({error:result.error},result.status);
    return json(result);
  }
  if (method==="POST" && path==="/api/my-castle/special-camp/upgrade") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const b=await body(request), key=String(b.key||""); const def=(SPECIAL_CAMPS[state.region]||[]).find(x=>x.key===key);
    if(!def)return json({error:"کمپ ویژه این اقلیم معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT level FROM castle_special_camps WHERE castle=? AND camp_key=?").bind(state.castle,key).first(); const level=Number(row?.level||0);
    if(level>=50)return json({error:"کمپ به حداکثر سطح 50 رسیده است."},400);
    if(!addCostCheck(state,def.cost))return json({error:"منابع کافی نیست."},400);
    const cost=safeCost(def.cost), sets=Object.keys(cost).map(k=>`\${k}=\${k}-?`).join(","), cond=Object.keys(cost).map(k=>`\${k}>=?`).join(" AND ");
    const bres=await env.DB.batch([
      env.DB.prepare(`UPDATE castle_state SET \${sets} WHERE castle=? AND \${cond}`).bind(...Object.values(cost),state.castle,...Object.values(cost)),
      env.DB.prepare("UPDATE castle_special_camps SET level=level+1 WHERE castle=? AND camp_key=? AND level=?").bind(state.castle,key,level)
    ]);
    if(!bres[1]?.meta?.changes)return json({error:"ارتقا همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    return json({ok:true,newLevel:level+1});
  }
  if (method==="POST" && path==="/api/my-castle/special-production/upgrade") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const sp=SPECIAL_PRODUCTIONS[state.region]; if(!sp)return json({error:"این اقلیم تولیدی ویژه ندارد."},400);
    const row=await env.DB.prepare("SELECT level FROM castle_production WHERE castle=? AND production_key=?").bind(state.castle,sp.key).first(); const level=Number(row?.level||0);
    if(level>=sp.max)return json({error:"تولیدی ویژه به حداکثر سطح رسیده است."},400); if(!addCostCheck(state,sp.cost))return json({error:"منابع کافی نیست."},400);
    const cost=safeCost(sp.cost),sets=Object.keys(cost).map(k=>`\${k}=\${k}-?`).join(","),cond=Object.keys(cost).map(k=>`\${k}>=?`).join(" AND ");
    const bres=await env.DB.batch([env.DB.prepare(`UPDATE castle_state SET \${sets} WHERE castle=? AND \${cond}`).bind(...Object.values(cost),state.castle,...Object.values(cost)),env.DB.prepare("UPDATE castle_production SET level=level+1 WHERE castle=? AND production_key=? AND level=?").bind(state.castle,sp.key,level)]);
    if(!bres[1]?.meta?.changes)return json({error:"ارتقا همزمان تغییر کرده؛ دوباره تلاش کن."},409); return json({ok:true,newLevel:level+1});
  }
  if (method==="POST" && path==="/api/my-castle/workshop/upgrade") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    if(state.workshop_level>=5)return json({error:"کارگاه به حداکثر سطح رسیده است."},400);
    if(Number(state.coins)<EQUIPMENT_UPGRADE_COST)return json({error:"6000 سکه لازم است."},400);
    const bres=await env.DB.batch([env.DB.prepare("UPDATE castle_state SET coins=coins-6000 WHERE castle=? AND coins>=6000").bind(state.castle),env.DB.prepare("UPDATE castle_state SET workshop_level=workshop_level+1 WHERE castle=? AND workshop_level=?").bind(state.castle,state.workshop_level)]);
    if(!bres[1]?.meta?.changes)return json({error:"ارتقا همزمان تغییر کرده؛ دوباره تلاش کن."},409); return json({ok:true,newLevel:state.workshop_level+1});
  }
  if (method==="POST" && path==="/api/my-castle/equipment/build") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const b=await body(request),key=String(b.key||""),def=EQUIPMENT[key]; if(!def)return json({error:"ادوات معتبر نیست."},400);
    if(Number(state.workshop_level)<def.level)return json({error:`برای ساخت \${def.label} کارگاه باید حداقل سطح \${def.level} باشد.`},400);
    const trackerKey=`\${def.period}:\${def.period==="day"?gameDayKey():gameWeekKey()}:\${key}`;
    const used=Number((await env.DB.prepare("SELECT used FROM castle_equipment_limits WHERE castle=? AND tracker_key=?").bind(state.castle,trackerKey).first())?.used||0);
    if(used>=def.limit)return json({error:`سقف ساخت \${def.label} برای این \${def.period==="day"?"روز":"هفته"} پر شده است.`},400);
    if(!addCostCheck(state,def.cost))return json({error:"منابع کافی نیست."},400);
    const cost=safeCost(def.cost),sets=Object.keys(cost).map(k=>`\${k}=\${k}-?`).join(","),cond=Object.keys(cost).map(k=>`\${k}>=?`).join(" AND ");
    const bres=await env.DB.batch([
      env.DB.prepare(`UPDATE castle_state SET \${sets} WHERE castle=? AND \${cond}`).bind(...Object.values(cost),state.castle,...Object.values(cost)),
      env.DB.prepare("UPDATE castle_equipment SET count=count+1 WHERE castle=? AND item_key=?").bind(state.castle,key),
      env.DB.prepare("INSERT INTO castle_equipment_limits(castle,tracker_key,used) VALUES (?,?,1) ON CONFLICT(castle,tracker_key) DO UPDATE SET used=used+1").bind(state.castle,trackerKey)
    ]);
    if(!bres[1]?.meta?.changes || !bres[2]?.meta?.changes)return json({error:"ساخت همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    return json({ok:true});
  }

  if (method==="POST" && path==="/api/my-castle/port/upgrade") {
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    if(!Number(state.port_enabled))return json({error:"این قلعه فعلاً بندری تعریف نشده است."},400);
    if(Number(state.port_level)>=15)return json({error:"اسکله به حداکثر سطح 15 رسیده است."},400);
    if(Number(state.coins)<1500||Number(state.wood)<1000)return json({error:"برای ارتقای اسکله 1500 سکه و 1000 چوب لازم است."},400);
    const bres=await env.DB.batch([env.DB.prepare("UPDATE castle_state SET coins=coins-1500,wood=wood-1000 WHERE castle=? AND coins>=1500 AND wood>=1000").bind(state.castle),env.DB.prepare("UPDATE castle_state SET port_level=port_level+1 WHERE castle=? AND port_level=?").bind(state.castle,state.port_level)]);
    if(!bres[1]?.meta?.changes)return json({error:"ارتقا همزمان تغییر کرده؛ دوباره تلاش کن."},409); return json({ok:true,newLevel:state.port_level+1});
  }

  return json({error:"Not found"},404);
}

async function serveCharacterImage(request, env, url) {
  if (!url.pathname.startsWith("/assets/characters/") || !url.pathname.endsWith(".txt")) return null;
  const source = await env.ASSETS.fetch(request);
  if (!source.ok) return null;

  const buffer = await source.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const isWebP = bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  const isPNG = bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isJPG = bytes.length >= 3 &&
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  let imageBytes = bytes;
  let contentType = isWebP ? "image/webp" : isPNG ? "image/png" : isJPG ? "image/jpeg" : "";

  if (!contentType) {
    let text = new TextDecoder().decode(bytes).trim();
    if (!text) return null;
    if (text.startsWith("data:image/")) {
      const comma = text.indexOf(",");
      if (comma === -1) return null;
      text = text.slice(comma + 1);
    }
    text = text.replace(/\s+/g, "");
    try {
      const binary = atob(text);
      imageBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) imageBytes[i] = binary.charCodeAt(i);
    } catch {
      return null;
    }

    const b = imageBytes;
    if (b.length >= 12 &&
        b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) contentType = "image/webp";
    else if (b.length >= 8 &&
        b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) contentType = "image/png";
    else if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) contentType = "image/jpeg";
    else return null;
  }

  return new Response(imageBytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; object-src 'none'"
    }
  });
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    try {
      await cleanupExpiredSessions(env);
      if(url.pathname.startsWith("/api/")) return await handleApi(request,env,url);
      const characterImage = await serveCharacterImage(request, env, url);
      if(characterImage) return characterImage;
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch(e) { console.error(e); return json({error:e?.status ? e.message : "خطای داخلی سرور رخ داد."},e?.status || 500); }
  }
};
