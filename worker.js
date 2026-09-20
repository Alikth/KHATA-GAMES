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

async function handleApi(request, env, url) {
  const method=request.method, path=url.pathname;
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
    const p={id:newId(),username:"@"+username,region,house:selected.house,castle,account_id:userSession.user_id,created_at:new Date().toISOString()}; await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,p.account_id,p.created_at).run(); return json({message:`ثبت شد لرد ${selected.house}`,player:p});
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
    const p={id:newId(),username:"@"+username,region,house:selected.house,castle,created_at:new Date().toISOString()}; await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,null,p.created_at).run(); return json({player:p});
  }
  if(path.startsWith("/api/admin/players/")&&method==="DELETE"){ if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401); const id=decodeURIComponent(path.split("/").pop()); const r=await env.DB.prepare("DELETE FROM players WHERE id=?").bind(id).run(); if(!r.meta.changes)return json({error:"پلیر پیدا نشد."},404); return json({ok:true}); }
  if(method==="GET"&&path.startsWith("/api/castles/")){const name=decodeURIComponent(path.slice("/api/castles/".length));const info=castleInfo[name];if(!info)return json({error:"اطلاعات قلعه پیدا نشد."},404);return json(info);}
  return json({error:"Not found"},404);
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    try {
      await cleanupExpiredSessions(env);
      if(url.pathname.startsWith("/api/")) return await handleApi(request,env,url);
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch(e) { console.error(e); return json({error:e?.status ? e.message : "خطای داخلی سرور رخ داد."},e?.status || 500); }
  }
};
