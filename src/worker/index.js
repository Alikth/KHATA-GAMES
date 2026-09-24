import {
  SESSION_TTL,
  SESSION_COOKIE_NAME,
  MAX_BODY_BYTES,
  MAX_PASSWORD_LENGTH,
  SECURITY_HEADERS,
  json,
  body,
  sameOrigin,
  sha256Base64Url,
  base64url,
  randomToken,
  constantTimeSecretEqual,
  normalizeUsername,
  validTelegramUsername,
  validAccountUsername,
  cookie,
  clearCookie,
  getCookie,
  newId,
  hashPassword,
  bytes,
  verifyPassword,
  getSession,
  requireUser,
  createSession,
  deleteSession,
  cleanupExpiredSessions,
  rateLimit,
  publicUser,
  players
} from "./utils/runtime.js";

/* Cloudflare build retry marker */
import { castleInfo, houses } from "./data/game-data.js";
import {
  GENERAL_PRODUCTIONS,
  SPECIAL_PRODUCTIONS,
  REGION_MULTIPLIERS,
  GENERAL_CAMPS,
  SPECIAL_CAMPS,
  EQUIPMENT,
  EQUIPMENT_UPGRADE_COST,
  RESOURCE_KEYS,
  RESOURCE_LABELS,
  WAR_LORDS
} from "./data/game-rules.js";


const COASTAL_CASTLES = new Set(["Karhold","Seagard","Gulltown","Pyke","Ten Towers","Hammerhorn","Casterly Rock","King's Landing","Dragonstone","Storm's End","Oldtown","Sunspear","Yronwood"]);

const ECONOMY_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS castle_state (
    castle TEXT PRIMARY KEY, region TEXT NOT NULL, owner_account_id TEXT,
    peasants INTEGER NOT NULL DEFAULT 500, coins INTEGER NOT NULL DEFAULT 5000,
    wood INTEGER NOT NULL DEFAULT 500, stone INTEGER NOT NULL DEFAULT 500, iron INTEGER NOT NULL DEFAULT 500,
    meat INTEGER NOT NULL DEFAULT 500, fish INTEGER NOT NULL DEFAULT 500, grain INTEGER NOT NULL DEFAULT 6000,
    horses INTEGER NOT NULL DEFAULT 0, dragon_glass INTEGER NOT NULL DEFAULT 0, wildfire INTEGER NOT NULL DEFAULT 0,
    tar INTEGER NOT NULL DEFAULT 0, grapes INTEGER NOT NULL DEFAULT 50,
    food_debt INTEGER NOT NULL DEFAULT 0,
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
  `CREATE TABLE IF NOT EXISTS game_week_runs (week_key TEXT PRIMARY KEY, processed_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS castle_week_state (castle TEXT PRIMARY KEY, last_week_key TEXT)`,
  `CREATE TABLE IF NOT EXISTS castle_equipment_limits (castle TEXT NOT NULL, tracker_key TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,tracker_key))`,
  `CREATE TABLE IF NOT EXISTS game_controls (control_key TEXT PRIMARY KEY, locked INTEGER NOT NULL DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS war_logs (
    id TEXT PRIMARY KEY, week_key TEXT NOT NULL, created_at TEXT NOT NULL,
    attacker_account_id TEXT NOT NULL, attacker_username TEXT NOT NULL, lord_name TEXT,
    type TEXT NOT NULL, source_castle TEXT NOT NULL, destination_castle TEXT NOT NULL,
    arrival_time TEXT NOT NULL, is_fake INTEGER NOT NULL DEFAULT 0,
    assets_json TEXT NOT NULL DEFAULT '{}'
  )`
];

function findCastle(region, castle) {
  const r = houses.find(x => x.region === region);
  return r?.castles.find(x => x.castle === castle);
}
async function ensureCustomCastlesSchema(env){
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS game_castles (castle TEXT PRIMARY KEY, region TEXT NOT NULL, house TEXT NOT NULL, icon TEXT NOT NULL DEFAULT '🏰', location TEXT, description TEXT, created_at TEXT NOT NULL)").run();
}
async function getHouses(env){
  await ensureCustomCastlesSchema(env);
  const rows=(await env.DB.prepare("SELECT castle,region,house,icon FROM game_castles ORDER BY created_at").all()).results;
  const out=houses.map(r=>({...r,castles:r.castles.map(c=>({...c}))}));
  for(const x of rows){const r=out.find(v=>v.region===x.region);if(r&&!r.castles.some(c=>c.castle===x.castle))r.castles.push({house:x.house,castle:x.castle,icon:x.icon||'🏰'});}
  return out;
}
async function getCastle(env,region,castle){
  const base=findCastle(region,castle);if(base)return base;
  await ensureCustomCastlesSchema(env);return await env.DB.prepare("SELECT castle,region,house,icon,location,description FROM game_castles WHERE region=? AND castle=?").bind(region,castle).first();
}
async function castleExists(env,castle){
  if(houses.some(r=>r.castles.some(c=>c.castle===castle)))return true;
  await ensureCustomCastlesSchema(env);return !!(await env.DB.prepare("SELECT castle FROM game_castles WHERE castle=?").bind(castle).first());
}













async function ensureWarLogSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS war_logs (
    id TEXT PRIMARY KEY, week_key TEXT NOT NULL, created_at TEXT NOT NULL,
    attacker_account_id TEXT NOT NULL, attacker_username TEXT NOT NULL, lord_name TEXT,
    type TEXT NOT NULL, source_castle TEXT NOT NULL, destination_castle TEXT NOT NULL,
    arrival_time TEXT NOT NULL, is_fake INTEGER NOT NULL DEFAULT 0,
    assets_json TEXT NOT NULL DEFAULT '{}', cancelled INTEGER NOT NULL DEFAULT 0, siege_resolved INTEGER NOT NULL DEFAULT 0,
    cancelled_at TEXT, cancelled_by TEXT
  )`).run();
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN cancelled INTEGER NOT NULL DEFAULT 0").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN cancelled_at TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN cancelled_by TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN lord_present INTEGER NOT NULL DEFAULT 0").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN remaining_seconds INTEGER NOT NULL DEFAULT 3600").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN last_resumed_at TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN command TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN command_at TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN casualties_json TEXT NOT NULL DEFAULT '{}'").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN siege_resolved INTEGER NOT NULL DEFAULT 0").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN siege_day_key TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN siege_attacker_decision INTEGER").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN siege_defender_decision INTEGER").run();}catch{}
  try{await env.DB.prepare("UPDATE war_logs SET remaining_seconds=0 WHERE arrival_time NOT LIKE '____-__-__T%' AND last_resumed_at IS NULL").run();}catch{}
}
async function ensureTradeSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS trade_requests (
    id TEXT PRIMARY KEY, sender_account_id TEXT NOT NULL, sender_castle TEXT NOT NULL,
    receiver_account_id TEXT NOT NULL, receiver_castle TEXT NOT NULL,
    send_assets_json TEXT NOT NULL DEFAULT '{}', receive_assets_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, responded_at TEXT
  )`).run();
}
async function ensureGameControls(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_controls (control_key TEXT PRIMARY KEY, locked INTEGER NOT NULL DEFAULT 0)`).run();
  await env.DB.prepare("INSERT OR IGNORE INTO game_controls(control_key,locked) VALUES ('war',0),('trade',0),('game_running',1)").run();
}
async function isGameControlLocked(env,key){
  await ensureGameControls(env);
  const row=await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key=?").bind(key).first();
  return Number(row?.locked||0)===1;
}
function tradeAssets(raw){
  const out={}; const allowed=RESOURCE_KEYS.filter(k=>k!=="peasants");
  if(!raw || typeof raw!=="object") return out;
  for(const [k,v] of Object.entries(raw)){
    if(!allowed.includes(k)) continue;
    const n=Math.floor(Number(v));
    if(Number.isFinite(n)&&n>0&&n<=100000000) out[k]=n;
  }
  return out;
}
function hasAssets(obj){return Object.values(obj||{}).some(v=>Number(v)>0);}
function warArrivalDate(createdAt,arrivalTime){
  const d=new Date(createdAt); const m=/^(\d{2}):(\d{2})$/.exec(String(arrivalTime||""));
  if(!m||Number.isNaN(d.getTime())) return null;
  d.setUTCHours(Number(m[1]),Number(m[2]),0,0);
  if(d.getTime()<=new Date(createdAt).getTime()) d.setUTCDate(d.getUTCDate()+1);
  return d;
}
function warRemainingSeconds(row,now=Date.now()){
  const stored=Number(row.remaining_seconds);
  if(Number.isFinite(stored)&&stored>=0){const resumed=row.last_resumed_at?new Date(row.last_resumed_at).getTime():0;return Math.max(0,stored+(resumed?-(Math.max(0,now-resumed)/1000):0));}
  const arrival=warArrivalDate(row.created_at||row.createdAt,row.arrival_time||row.arrivalTime);return arrival?Math.max(0,(arrival.getTime()-now)/1000):0;
}
function warIsActive(row){return !Number(row.cancelled)&&warRemainingSeconds(row)>0;}
function warArrivalISO(row){const left=warRemainingSeconds(row);return left?new Date(Date.now()+left*1000).toISOString():null;}
async function castleOwner(env,castle){
  return env.DB.prepare("SELECT owner_account_id AS accountId FROM castle_state WHERE castle=?").bind(castle).first();
}
async function tradeRowsForAccount(env,accountId){
  await ensureTradeSchema(env);
  return (await env.DB.prepare("SELECT * FROM trade_requests WHERE (sender_account_id=? OR receiver_account_id=?) AND status='pending' ORDER BY created_at DESC").bind(accountId,accountId).all()).results;
}

function gameWeekKey(date=new Date()) {
  const d=new Date(date); const day=d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate()-day+1); d.setUTCHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function gameDayKey(date=new Date()) { return new Date(date).toISOString().slice(0,10); }
function addCostCheck(state,cost){ return Object.entries(cost).every(([k,v])=>Number(state[k]||0)>=Number(v)); }
function costText(cost){ return Object.entries(cost).map(([k,v])=>`${RESOURCE_LABELS[k]||k} ${v}`).join(" + "); }

async function ensureEconomySchema(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS economy_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
  // CREATE TABLE IF NOT EXISTS is cheap enough for the economy entry point and
  // guarantees that the two runtime support tables exist after an old deploy.
  for (const sql of ECONOMY_SCHEMA) await env.DB.prepare(sql).run();

  const ready=await env.DB.prepare("SELECT value FROM economy_meta WHERE key='seeded'").first();
  const version=await env.DB.prepare("SELECT value FROM economy_meta WHERE key='schema_version'").first();
  if(ready?.value==="1" && version?.value==="3") return;
  try{await env.DB.prepare("ALTER TABLE castle_state ADD COLUMN food_debt INTEGER NOT NULL DEFAULT 0").run();}catch{}
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS game_notifications (id TEXT PRIMARY KEY, kind TEXT NOT NULL, castle TEXT NOT NULL, message TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)").run();

  const week=gameWeekKey();
  const defaults={farm:1,village:1,lumber:0,stone:0,iron:0,recreation:0,market:0,stable:0,slaughterhouse:0};
  for (const r of houses) {
    for (const c of r.castles) {
      await env.DB.prepare("INSERT OR IGNORE INTO castle_state (castle,region,port_enabled) VALUES (?,?,?)").bind(c.castle,r.region,COASTAL_CASTLES.has(c.castle)?1:0).run();
      if(COASTAL_CASTLES.has(c.castle))await env.DB.prepare("UPDATE castle_state SET port_enabled=1 WHERE castle=?").bind(c.castle).run();
      // Repair support rows once when migrating an older economy database.
      await env.DB.prepare("INSERT OR IGNORE INTO castle_week_state (castle,last_week_key) VALUES (?,?)").bind(c.castle,week).run();
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
  await env.DB.prepare("INSERT OR REPLACE INTO economy_meta(key,value) VALUES ('schema_version','3')").run();
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
  return {castle:state.castle,region:state.region,ownerAccountId:state.owner_account_id,foodDebt:Number(state.food_debt||0),resources:Object.fromEntries(RESOURCE_KEYS.map(k=>[k,Number(state[k]||0)])),production,camps:campMap,specialCamps:specialCampMap,specialProduction,army:armyMap,equipment:equipmentMap,fleet:fleetMap,workshop:{level:Number(state.workshop_level),maxLevel:5,upgradeCost:EQUIPMENT_UPGRADE_COST},port:{enabled:!!state.port_enabled,level:Number(state.port_level),maxLevel:15,weeklyYieldPerShipType:Number(state.port_level)},specialItem:parsedSpecialItem,gameWeek:gameWeekKey()};
}

async function isCastleUnderSiege(env,castle){
  await ensureWarLogSchema(env);
  return !!(await env.DB.prepare("SELECT id FROM war_logs WHERE destination_castle=? AND command='siege' AND cancelled=0 AND siege_resolved=0 LIMIT 1").bind(castle).first());
}
async function runWeeklyUpdate(env, force=false) {
  const week=gameWeekKey(), alerts=[];
  const rows=(await env.DB.prepare("SELECT * FROM castle_state").all()).results;
  for(const s of rows){
    const marker=await env.DB.prepare("SELECT last_week_key FROM castle_week_state WHERE castle=?").bind(s.castle).first();
    if(!force && marker?.last_week_key===week) continue;
    const underSiege=await isCastleUnderSiege(env,s.castle);
    const prods=(await env.DB.prepare("SELECT production_key,level FROM castle_production WHERE castle=?").bind(s.castle).all()).results;
    const camps=(await env.DB.prepare("SELECT camp_key,level FROM castle_camps WHERE castle=?").bind(s.castle).all()).results;
    const scamps=(await env.DB.prepare("SELECT camp_key,level FROM castle_special_camps WHERE castle=?").bind(s.castle).all()).results;
    const army=(await env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=?").bind(s.castle).all()).results;
    const changes={}; const add=(k,v)=>changes[k]=(changes[k]||0)+v;
    if(!underSiege){
      for(const p of prods){const def=GENERAL_PRODUCTIONS[p.production_key];if(!def||!p.level)continue;let gain=Number(p.level)*def.yield;if(p.production_key==='farm'&&Number(p.level)===1)gain=300;gain*=REGION_MULTIPLIERS[s.region]?.[p.production_key]||1;add(def.base,gain);}
      const sp=SPECIAL_PRODUCTIONS[s.region];
      if(sp){const lvl=Number(prods.find(x=>x.production_key===sp.key)?.level||0);if(lvl)add(sp.base,lvl*sp.yield);}
    }
    for(const c of camps){const d=GENERAL_CAMPS[c.camp_key];if(d&&c.level)add(d.unit,c.level*d.yield);}
    for(const c of scamps){const d=(SPECIAL_CAMPS[s.region]||[]).find(x=>x.key===c.camp_key);if(d&&c.level)add(d.unit,c.level*d.yield);}
    const a=Object.fromEntries(army.map(x=>[x.unit_key,Number(x.count)]));
    const grainNeed=(a.swordsman||0)+(a.archer||0)+(a.spearman||0)+((a.cavalry||0)*2)+Object.entries(a).filter(([key])=>!['swordsman','archer','spearman','cavalry','giants'].includes(key)).reduce((sum,[,count])=>sum+Number(count||0)*2,0);
    const meatNeed=(a.giants||0)*2;
    const grainUsed=Math.min(Number(s.grain||0),grainNeed);
    let rem=Math.max(0,grainNeed-grainUsed);
    const fishUsed=Math.min(Number(s.fish||0),Math.ceil(rem/2));
    rem=Math.max(0,rem-fishUsed*2);
    const meatUsed=Math.min(Number(s.meat||0),Math.max(meatNeed,Math.ceil(rem/2)));
    const foodShortage=Math.max(0,rem);
    const resourceParts=[];const resourceBind=[];
    for(const [k,v] of Object.entries(changes)){if(RESOURCE_KEYS.includes(k)&&v){resourceParts.push(k+'='+k+'+?');resourceBind.push(Math.floor(v));}}
    resourceParts.push('grain=MAX(0,grain-?)','fish=MAX(0,fish-?)','meat=MAX(0,meat-?)','food_debt=?');
    resourceBind.push(grainUsed,fishUsed,meatUsed,-foodShortage);
    const statements=[env.DB.prepare('UPDATE castle_state SET '+resourceParts.join(',')+' WHERE castle=?').bind(...resourceBind,s.castle)];
    for(const [unit,gain] of Object.entries(changes).filter(([k])=>!RESOURCE_KEYS.includes(k)))statements.push(env.DB.prepare('INSERT INTO castle_army(castle,unit_key,count) VALUES (?,?,?) ON CONFLICT(castle,unit_key) DO UPDATE SET count=count+excluded.count').bind(s.castle,unit,Math.floor(gain)));
    if(!underSiege && Number(s.port_enabled)&&Number(s.port_level)>0){statements.push(env.DB.prepare("UPDATE castle_fleet SET count=count+? WHERE castle=? AND ship_key='transport'").bind(Number(s.port_level),s.castle));statements.push(env.DB.prepare("UPDATE castle_fleet SET count=count+? WHERE castle=? AND ship_key='warship'").bind(Number(s.port_level),s.castle));}
    if(foodShortage>0){const message='قلعه '+s.castle+' غذاش تمام شد؛ کمبود غذا: -'+foodShortage;alerts.push({castle:s.castle,amount:-foodShortage,message});statements.push(env.DB.prepare('INSERT INTO game_notifications(id,kind,castle,message,amount,created_at) VALUES(?,?,?,?,?,?)').bind(newId(),'food_shortage',s.castle,message,-foodShortage,new Date().toISOString()));}
    statements.push(env.DB.prepare('UPDATE castle_week_state SET last_week_key=? WHERE castle=?').bind(week,s.castle));
    await env.DB.batch(statements);
  }
  return alerts;
}
async function requireCastleOwner(request,env){
  const s=await requireUser(request,env); if(!s)return null;

  // players.account_id is the authoritative ownership record created by
  // /api/register. Do not depend solely on the denormalized economy owner field:
  // older castle rows may have a missing/stale owner_account_id.
  const player=await env.DB.prepare(
    "SELECT castle,region FROM players WHERE account_id=? ORDER BY created_at LIMIT 1"
  ).bind(s.user_id).first();
  if(!player)return null;

  let state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(player.castle).first();
  if(!state)return null;

  // Repair the denormalized owner field so the rest of the castle API stays
  // consistent with the actual account ownership.
  if(state.owner_account_id!==s.user_id){
    await env.DB.prepare("UPDATE castle_state SET owner_account_id=? WHERE castle=?").bind(s.user_id,player.castle).run();
    state={...state,owner_account_id:s.user_id};
  }
  return state;
}
function safeCost(cost){return Object.fromEntries(Object.entries(cost).filter(([k,v])=>RESOURCE_KEYS.includes(k)&&Number(v)>0));}
async function upgradeResourceBacked(env,castle,table,key,def,maxLevel){
  const row=await env.DB.prepare(`SELECT level FROM ${table} WHERE castle=? AND ${table==="castle_production"?"production_key":"camp_key"}=?`).bind(castle,key).first();
  const level=Number(row?.level||0); if(level>=maxLevel)return {error:"این مورد به حداکثر سطح رسیده است.",status:400};
  if(!addCostCheck(await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first(),def.cost))return {error:"منابع کافی نیست.",status:400};
  const cost=safeCost(def.cost); const sets=Object.keys(cost).map(k=>`${k}=${k}-?`).join(",");
  const where=table==="castle_production"?"production_key":"camp_key";
  const q1=env.DB.prepare(`UPDATE castle_state SET ${sets} WHERE castle=? AND ${Object.keys(cost).map(k=>`${k}>=?`).join(" AND ")}`).bind(...Object.values(cost),castle,...Object.values(cost));
  const q2=env.DB.prepare(`UPDATE ${table} SET level=level+1 WHERE castle=? AND ${where}=? AND level=?`).bind(castle,key,level);
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
    const sid=await createSession(env,id); return new Response(JSON.stringify({ok:true,user:{id,username}}),{status:200,headers:{"content-type":"application/json","set-cookie":cookie(SESSION_COOKIE_NAME,sid)}});
  }
  if (method === "POST" && path === "/api/auth/login") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if (!(await rateLimit(request, env, "login", 10))) return json({error:"تعداد تلاش‌های ورود زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید."},429, {"retry-after":"900"});
    const b=await body(request), username=String(b.username||"").trim(), password=String(b.password||""); if(username.length>24 || password.length>MAX_PASSWORD_LENGTH) return json({error:"نام کاربری یا رمز عبور اشتباه است."},401); const u=await env.DB.prepare("SELECT * FROM users WHERE lower(username)=lower(?)").bind(username).first();
    if(!u || !(await verifyPassword(password,u.salt,u.hash))) return json({error:"نام کاربری یا رمز عبور اشتباه است."},401); await deleteSession(request,env); const sid=await createSession(env,u.id); return json({ok:true,user:publicUser(u)},200,{"set-cookie":cookie(SESSION_COOKIE_NAME,sid)});
  }
  if (method === "POST" && path === "/api/auth/logout") { if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); await deleteSession(request,env); return new Response(JSON.stringify({ok:true}),{status:200,headers:{"content-type":"application/json","set-cookie":clearCookie(SESSION_COOKIE_NAME)}}); }
  if (method === "GET" && path === "/api/houses") return json(await getHouses(env));
  if (method === "GET" && path === "/api/players") return json(await players(env));
  const session=await getSession(request,env);
  const userSession=await requireUser(request,env);
  if (method === "GET" && path === "/api/my-castles") { if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401); return json((await env.DB.prepare("SELECT id,username,region,house,castle,created_at AS createdAt FROM players WHERE account_id=? ORDER BY created_at").bind(userSession.user_id).all()).results); }
  if (method === "POST" && path === "/api/register") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401); const b=await body(request), username=normalizeUsername(b.username), region=String(b.region||"").trim(), castle=String(b.castle||"").trim();
    if(!validTelegramUsername(username)) return json({error:"Username تلگرام معتبر نیست. فقط حروف، عدد و _ و بین ۵ تا ۳۲ کاراکتر."},400); const selected=await getCastle(env,region,castle); if(!selected) return json({error:"قلمرو یا قلعه معتبر نیست."},400);
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
    return json({ok:true},200,{"set-cookie":cookie(SESSION_COOKIE_NAME,sid)});
  }
  if (method === "POST" && path === "/api/admin/logout") { if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); await deleteSession(request,env); return new Response(JSON.stringify({ok:true}),{status:200,headers:{"content-type":"application/json","set-cookie":clearCookie(SESSION_COOKIE_NAME)}}); }
  if (method === "GET" && path === "/api/admin/status") return json({admin:!!session?.is_admin});
  if (path === "/api/admin/players" && method === "GET") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    const rows=(await env.DB.prepare("SELECT id,username,region,house,castle,account_id AS accountId,created_at AS createdAt FROM players ORDER BY created_at").all()).results;
    return json(rows);
  }
  if (path === "/api/admin/players" && method === "POST") {
    if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin) return json({error:"دسترسی مدیر لازم است."},401); const b=await body(request), username=normalizeUsername(b.username),region=String(b.region||"").trim(),castle=String(b.castle||"").trim(); const selected=await getCastle(env,region,castle); if(!validTelegramUsername(username)||!selected)return json({error:"اطلاعات واردشده معتبر نیست."},400);
    if(await env.DB.prepare("SELECT id FROM players WHERE region=? AND castle=?").bind(region,castle).first())return json({error:"این قلعه قبلاً رزرو شده است."},409); if(await env.DB.prepare("SELECT id FROM players WHERE lower(username)=lower(?)").bind("@"+username).first())return json({error:"این Username قبلاً ثبت شده است."},409);
    const p={id:newId(),username:"@"+username,region,house:selected.house,castle,created_at:new Date().toISOString()}; await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,null,p.created_at).run(); await ensureEconomySchema(env); return json({player:p});
  }
  if(path.startsWith("/api/admin/players/")&&method==="DELETE"){ if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401); const id=decodeURIComponent(path.split("/").pop()); const old=await env.DB.prepare("SELECT castle FROM players WHERE id=?").bind(id).first(); const r=await env.DB.prepare("DELETE FROM players WHERE id=?").bind(id).run(); if(!r.meta.changes)return json({error:"پلیر پیدا نشد."},404); await ensureEconomySchema(env); if(old?.castle) await env.DB.prepare("UPDATE castle_state SET owner_account_id=NULL WHERE castle=?").bind(old.castle).run(); return json({ok:true}); }
  if(method==="GET"&&path.startsWith("/api/castles/")){const name=decodeURIComponent(path.slice("/api/castles/".length));const info=castleInfo[name];if(info)return json(info);await ensureCustomCastlesSchema(env);const custom=await env.DB.prepare("SELECT location,description FROM game_castles WHERE castle=?").bind(name).first();if(!custom)return json({error:"اطلاعات قلعه پیدا نشد."},404);return json(custom);}

  if (path.startsWith("/api/my-castle") || path.startsWith("/api/game/")) {
    await ensureEconomySchema(env);
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
    const cost=safeCost(def.cost), sets=Object.keys(cost).map(k=>`${k}=${k}-?`).join(","), cond=Object.keys(cost).map(k=>`${k}>=?`).join(" AND ");
    const bres=await env.DB.batch([
      env.DB.prepare(`UPDATE castle_state SET ${sets} WHERE castle=? AND ${cond}`).bind(...Object.values(cost),state.castle,...Object.values(cost)),
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
    const cost=safeCost(sp.cost),sets=Object.keys(cost).map(k=>`${k}=${k}-?`).join(","),cond=Object.keys(cost).map(k=>`${k}>=?`).join(" AND ");
    const bres=await env.DB.batch([env.DB.prepare(`UPDATE castle_state SET ${sets} WHERE castle=? AND ${cond}`).bind(...Object.values(cost),state.castle,...Object.values(cost)),env.DB.prepare("UPDATE castle_production SET level=level+1 WHERE castle=? AND production_key=? AND level=?").bind(state.castle,sp.key,level)]);
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
    if(Number(state.workshop_level)<def.level)return json({error:`برای ساخت ${def.label} کارگاه باید حداقل سطح ${def.level} باشد.`},400);
    const trackerKey=`${def.period}:${def.period==="day"?gameDayKey():gameWeekKey()}:${key}`;
    const used=Number((await env.DB.prepare("SELECT used FROM castle_equipment_limits WHERE castle=? AND tracker_key=?").bind(state.castle,trackerKey).first())?.used||0);
    if(used>=def.limit)return json({error:`سقف ساخت ${def.label} برای این ${def.period==="day"?"روز":"هفته"} پر شده است.`},400);
    if(!addCostCheck(state,def.cost))return json({error:"منابع کافی نیست."},400);
    const cost=safeCost(def.cost),sets=Object.keys(cost).map(k=>`${k}=${k}-?`).join(","),cond=Object.keys(cost).map(k=>`${k}>=?`).join(" AND ");
    const bres=await env.DB.batch([
      env.DB.prepare(`UPDATE castle_state SET ${sets} WHERE castle=? AND ${cond}`).bind(...Object.values(cost),state.castle,...Object.values(cost)),
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

  if (method==="GET" && path==="/api/game/status") {
    await ensureGameControls(env);
    const row=await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key='game_running'").first();
    return json({running:Number(row?.locked??1)===1});
  }
  if (method==="GET" && path==="/api/my-siege-prompts") {
    const session=await requireUser(request,env);if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureWarLogSchema(env);await ensureEconomySchema(env);
    const day=gameDayKey();
    const rows=(await env.DB.prepare("SELECT w.id,w.attacker_account_id AS attackerAccountId,w.attacker_username AS attackerUsername,w.source_castle AS sourceCastle,w.destination_castle AS destinationCastle,w.siege_day_key AS siegeDayKey,w.siege_attacker_decision AS attackerDecision,w.siege_defender_decision AS defenderDecision,c.owner_account_id AS defenderAccountId FROM war_logs w LEFT JOIN castle_state c ON c.castle=w.destination_castle WHERE w.command='siege' AND w.cancelled=0 AND w.siege_resolved=0").all()).results;
    const prompts=rows.flatMap(x=>{
      const out=[];
      if(x.attackerAccountId===session.user_id && x.siegeDayKey===day && x.attackerDecision===null)out.push({...x,role:"attacker"});
      if(x.defenderAccountId===session.user_id && x.siegeDayKey===day && x.defenderDecision===null)out.push({...x,role:"defender"});
      return out;
    });
    return json({prompts});
  }
  if (method==="POST" && path.match(/^\/api\/my-siege-prompts\/[^/]+\/decision$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const session=await requireUser(request,env);if(!session)return json({error:"دسترسی لازم است."},401);
    await ensureWarLogSchema(env);await ensureEconomySchema(env);
    const id=decodeURIComponent(path.split("/")[3]),b=await body(request),attack=b.attack===true;
    const role=String(b.role||"");
    if(!["attacker","defender"].includes(role))return json({error:"نقش معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=? AND command='siege' AND cancelled=0 AND siege_resolved=0").bind(id).first();
    if(!row)return json({error:"محاصره فعال پیدا نشد."},404);
    const destination=await env.DB.prepare("SELECT owner_account_id FROM castle_state WHERE castle=?").bind(row.destination_castle).first();
    if(role==="attacker"&&row.attacker_account_id!==session.user_id)return json({error:"دسترسی ندارید."},403);
    if(role==="defender"&&destination?.owner_account_id!==session.user_id)return json({error:"دسترسی ندارید."},403);
    if(row.siege_day_key!==gameDayKey())return json({error:"این نوبت محاصره مربوط به زمان شروع فعلی نیست."},409);
    const col=role==="attacker"?"siege_attacker_decision":"siege_defender_decision";
    await env.DB.prepare("UPDATE war_logs SET "+col+"=? WHERE id=? AND "+col+" IS NULL").bind(attack?1:0,id).run();
    return json({ok:true});
  }
  if (method==="GET" && path==="/api/war-expeditions/status") {
    await ensureWarLogSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const fake=await env.DB.prepare("SELECT id FROM war_logs WHERE attacker_account_id=? AND week_key=? AND is_fake=1 LIMIT 1").bind(session.user_id,gameWeekKey()).first();
    return json({fakeAvailable:!fake});
  }
  if (method==="GET" && path==="/api/war-logs") {
    await ensureWarLogSchema(env);
    const rows=(await env.DB.prepare("SELECT id,attacker_username AS attackerUsername,lord_name AS lordName,lord_present AS lordPresent,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,duration_minutes AS durationMinutes,remaining_seconds AS remainingSeconds,last_resumed_at AS lastResumedAt,is_fake AS fake,created_at AS createdAt,cancelled,cancelled_at AS cancelledAt,command,command_at AS commandAt FROM war_logs ORDER BY created_at DESC").all()).results;
    return json({logs:rows.map(x=>({...x,remainingSeconds:Math.ceil(warRemainingSeconds(x)),arrivalAt:warArrivalISO(x)}))});
  }
  if (method==="GET" && path==="/api/my-war-expeditions/active") {
    await ensureWarLogSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const rows=(await env.DB.prepare("SELECT id,attacker_username AS attackerUsername,lord_name AS lordName,lord_present AS lordPresent,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,duration_minutes AS durationMinutes,remaining_seconds AS remainingSeconds,last_resumed_at AS lastResumedAt,is_fake AS fake,created_at AS createdAt,assets_json AS assetsJson,cancelled FROM war_logs WHERE attacker_account_id=? AND cancelled=0 ORDER BY created_at DESC").bind(session.user_id).all()).results.filter(warIsActive);
    return json({expeditions:rows.map(x=>({...x,remainingSeconds:Math.ceil(warRemainingSeconds(x)),arrivalAt:warArrivalISO(x)}))});
  }
  if (method==="GET" && path==="/api/my-war-expeditions/arrived") {
    await ensureWarLogSchema(env);
    const session=await requireUser(request,env);if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const rows=(await env.DB.prepare("SELECT id,attacker_username AS attackerUsername,lord_name AS lordName,lord_present AS lordPresent,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,created_at AS createdAt,assets_json AS assetsJson,command,command_at AS commandAt,cancelled FROM war_logs WHERE attacker_account_id=? AND cancelled=0 AND remaining_seconds<=0 ORDER BY created_at DESC").bind(session.user_id).all()).results;
    return json({expeditions:rows});
  }
  if (method==="POST" && path.match(/^\/api\/war-expeditions\/[^/]+\/command$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const session=await requireUser(request,env);if(!session)return json({error:"دسترسی لازم است."},401);
    const id=decodeURIComponent(path.split("/")[3]),b=await body(request),command=String(b.command||"");
    if(!["attack","deployment","siege"].includes(command))return json({error:"دستور معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=? AND attacker_account_id=?").bind(id,session.user_id).first();
    if(!row)return json({error:"لشکرکشی پیدا نشد."},404);
    if(Number(row.cancelled))return json({error:"این لشکرکشی لغو شده است."},409);
    if(warIsActive(row))return json({error:"هنوز زمان رسیدن لشکرکشی نرسیده است."},409);
    await env.DB.prepare("UPDATE war_logs SET command=?,command_at=?,siege_resolved=CASE WHEN ?='siege' THEN 0 ELSE siege_resolved END,siege_day_key=CASE WHEN ?='siege' THEN ? ELSE siege_day_key END,siege_attacker_decision=CASE WHEN ?='siege' THEN NULL ELSE siege_attacker_decision END,siege_defender_decision=CASE WHEN ?='siege' THEN NULL ELSE siege_defender_decision END WHERE id=?").bind(command,new Date().toISOString(),command,command,gameDayKey(),command,command,id).run();
    return json({ok:true});
  }
  if (method==="POST" && path.match(/^\/api\/war-expeditions\/[^/]+\/cancel$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    await ensureWarLogSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"دسترسی لازم است."},401);
    const id=decodeURIComponent(path.split("/")[3]);
    const row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=? AND attacker_account_id=?").bind(id,session.user_id).first();
    if(!row)return json({error:"لشکرکشی پیدا نشد."},404);
    if(Number(row.cancelled))return json({error:"این لشکرکشی قبلاً لغو شده است."},409);
    if(!warIsActive(row))return json({error:"زمان رسیدن این لشکرکشی گذشته است."},409);
    const assets=JSON.parse(row.assets_json||"{}"); const updates=[];
    if(!Number(row.is_fake)){
      for(const kind of ["army","equipment","fleet"]){
        for(const [key,raw] of Object.entries(assets[kind]||{})){
          const table=kind==="army"?"castle_army":kind==="equipment"?"castle_equipment":"castle_fleet";
          const field=kind==="army"?"unit_key":kind==="equipment"?"item_key":"ship_key";
          updates.push(env.DB.prepare(`UPDATE ${table} SET count=count+? WHERE castle=? AND ${field}=?`).bind(Math.floor(Number(raw)||0),row.source_castle,key));
        }
      }
    }
    updates.push(env.DB.prepare("UPDATE war_logs SET cancelled=1,cancelled_at=?,cancelled_by=? WHERE id=? AND cancelled=0").bind(new Date().toISOString(),session.user_id,id));
    const result=await env.DB.batch(updates);
    if(!result[updates.length-1]?.meta?.changes)return json({error:"لغو همزمان انجام نشد؛ دوباره تلاش کن."},409);
    return json({ok:true});
  }
  if (method==="POST" && path==="/api/war-expeditions") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(await isGameControlLocked(env,"war"))return json({error:"لشکرکشی‌ها فعلاً توسط ادمین قفل شده‌اند."},423);
    await ensureGameControls(env);const gameRunning=Number((await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key='game_running'").first())?.locked??1)===1;
    if(!gameRunning)return json({error:"بازی فعلاً متوقف است و لشکرکشی جدید امکان‌پذیر نیست."},423);
    await ensureWarLogSchema(env);
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"ابتدا قلعه خود را ثبت کنید."},404);
    const b=await body(request), type=String(b.type||""), source=String(b.source||"").trim(), destination=String(b.destination||"").trim(), durationMinutes=Math.floor(Number(b.durationMinutes||0)), isFake=!!b.fake, lordPresent=!!b.lordPresent;
    if(!["land","sea"].includes(type))return json({error:"نوع لشکرکشی معتبر نیست."},400);
    if(type==="sea"&&!Number(state.port_enabled))return json({error:"این قلعه اسکله فعال ندارد."},400);
    const validCastleName=name=>houses.some(r=>r.castles.some(c=>c.castle===name));
    if(!(await castleExists(env,source)))return json({error:"مبدا معتبر نیست."},400);
    if(!(await castleExists(env,destination)))return json({error:"مقصد معتبر نیست."},400);
    if(source!==state.castle)return json({error:"مبدا باید قلعه ثبت‌شده خودت باشد."},403);
    if(destination===source)return json({error:"مقصد باید با مبدا متفاوت باشد."},400);
    if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>10080)return json({error:"مدت لشکرکشی باید بین 1 دقیقه تا 7 روز باشد."},400);
    const accountId=state.owner_account_id, user=await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(accountId).first();
    if(!user)return json({error:"حساب کاربری پیدا نشد."},404);
    const week=gameWeekKey();
    if(isFake){
      const used=await env.DB.prepare("SELECT id FROM war_logs WHERE attacker_account_id=? AND week_key=? AND is_fake=1 LIMIT 1").bind(accountId,week).first();
      if(used)return json({error:"لشکرکشی فیک این هفته قبلاً استفاده شده است."},409);
    }
    const selected=b.assets&&typeof b.assets==="object"?b.assets:{};
    const allowed={army:["castle_army","unit_key"],equipment:["castle_equipment","item_key"],fleet:["castle_fleet","ship_key"]};
    const deductions=[];
    let selectedTotal=0;
    if(!isFake){
      for(const kind of type==="sea"?["army","equipment","fleet"]:["army","equipment"]){
        const group=selected[kind]&&typeof selected[kind]==="object"?selected[kind]:{};
        for(const [key,raw] of Object.entries(group)){
          const n=Math.floor(Number(raw));
          if(!Number.isFinite(n)||n<0||n>1000000) return json({error:"تعداد واردشده معتبر نیست."},400);
          if(!n)continue;
          const def=allowed[kind]; if(!def)return json({error:"دارایی معتبر نیست."},400);
          const row=await env.DB.prepare(`SELECT count FROM ${def[0]} WHERE castle=? AND ${def[1]}=?`).bind(state.castle,key).first();
          const have=Number(row?.count||0);
          if(n>have)return json({error:`تعداد ${key} بیشتر از موجودی قلعه است.`},400);
          deductions.push({table:def[0],keyField:def[1],key,n});
          selectedTotal+=n;
        }
      }
      if(!selectedTotal)return json({error:"برای لشکرکشی واقعی حداقل یک نیرو، ادوات یا کشتی انتخاب کن."},400);
    } else if(type==="sea" && Object.keys(selected.fleet||{}).length) {
      // Fake expeditions do not consume any assets.
    }
    const statements=[];
    if(!isFake){
      for(const d of deductions){
        statements.push(env.DB.prepare(`UPDATE ${d.table} SET count=count-? WHERE castle=? AND ${d.keyField}=? AND count>=?`).bind(d.n,state.castle,d.key,d.n));
      }
    }
    const id=newId(),createdAt=new Date().toISOString(),lordName=lordPresent?(WAR_LORDS[source]||""):"";
    await ensureGameControls(env);
    const running=Number((await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key='game_running'").first())?.locked??1)===1;
    statements.push(env.DB.prepare("INSERT INTO war_logs(id,week_key,created_at,attacker_account_id,attacker_username,lord_name,lord_present,type,source_castle,destination_castle,arrival_time,duration_minutes,remaining_seconds,last_resumed_at,is_fake,assets_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,week,createdAt,accountId,user.username,lordName,lordPresent?1:0,type,source,destination,new Date(Date.now()+durationMinutes*60000).toISOString(),durationMinutes,durationMinutes*60,running?createdAt:null,isFake?1:0,JSON.stringify(isFake?{}:selected)));
    const result=await env.DB.batch(statements);
    for(let i=0;i<deductions.length;i++)if(!result[i]?.meta?.changes)return json({error:"تغییر همزمان دارایی انجام نشد؛ دوباره تلاش کن."},409);
    return json({ok:true,id});
  }

  if (method==="POST" && path==="/api/admin/game-control") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureGameControls(env);
    const b=await body(request), action=String(b.action||"");
    if(!["start","stop"].includes(action))return json({error:"عملیات معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key='game_running'").first();
    const running=Number(row?.locked??1)===1;if((action==="start")===running)return json({ok:true,running});
    if(action==="stop"){
      const active=(await env.DB.prepare("SELECT id,remaining_seconds,last_resumed_at FROM war_logs WHERE cancelled=0 AND remaining_seconds>0").all()).results;
      const updates=active.map(w=>{const left=Math.max(0,Number(w.remaining_seconds||0)-(w.last_resumed_at?Math.max(0,Date.now()-new Date(w.last_resumed_at).getTime())/1000:0));return env.DB.prepare("UPDATE war_logs SET remaining_seconds=?,last_resumed_at=NULL WHERE id=?").bind(Math.ceil(left),w.id);});
      updates.push(env.DB.prepare("UPDATE game_controls SET locked=0 WHERE control_key='game_running'"));await env.DB.batch(updates);return json({ok:true,running:false});
    }
    await env.DB.prepare("UPDATE game_controls SET locked=1 WHERE control_key='game_running'").run();
    await env.DB.prepare("UPDATE war_logs SET siege_day_key=?,siege_attacker_decision=NULL,siege_defender_decision=NULL WHERE command='siege' AND cancelled=0 AND siege_resolved=0").bind(gameDayKey()).run();
    const active=(await env.DB.prepare("SELECT id FROM war_logs WHERE cancelled=0 AND remaining_seconds>0").all()).results;
    if(active.length)await env.DB.batch(active.map(w=>env.DB.prepare("UPDATE war_logs SET last_resumed_at=? WHERE id=? AND remaining_seconds>0").bind(new Date().toISOString(),w.id)));
    return json({ok:true,running:true});
  }
  if (method==="GET" && path==="/api/admin/controls") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureGameControls(env);
    const rows=(await env.DB.prepare("SELECT control_key AS key,locked FROM game_controls ORDER BY control_key").all()).results;
    return json({controls:Object.fromEntries(rows.map(x=>[x.key,!!Number(x.locked)]))});
  }
  if (method==="POST" && path==="/api/admin/controls") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureGameControls(env);
    const b=await body(request), key=String(b.key||""), locked=!!b.locked;
    if(!["war","trade"].includes(key))return json({error:"قفل نامعتبر است."},400);
    await env.DB.prepare("UPDATE game_controls SET locked=? WHERE control_key=?").bind(locked?1:0,key).run();
    return json({ok:true,key,locked});
  }
  if (method==="POST" && path==="/api/admin/weekly-update") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const week=gameWeekKey();
    const done=await env.DB.prepare("SELECT week_key FROM game_week_runs WHERE week_key=?").bind(week).first();
    if(done)return json({error:"آپدیت این هفته قبلاً انجام شده است.",week,already:true},409);
    const alerts=await runWeeklyUpdate(env,true);
    await env.DB.prepare("INSERT INTO game_week_runs(week_key,processed_at) VALUES(?,?)").bind(week,new Date().toISOString()).run();
    return json({ok:true,week,alerts});
  }
  if (method==="GET" && path==="/api/admin/food-alerts") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const rows=(await env.DB.prepare("SELECT id,castle,message,amount,created_at AS createdAt FROM game_notifications WHERE kind='food_shortage' ORDER BY created_at DESC LIMIT 50").all()).results;
    return json({alerts:rows});
  }
  if (method==="GET" && path==="/api/admin/trades") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureTradeSchema(env);
    const rows=(await env.DB.prepare("SELECT t.*, su.username AS sender_username, ru.username AS receiver_username FROM trade_requests t LEFT JOIN users su ON su.id=t.sender_account_id LEFT JOIN users ru ON ru.id=t.receiver_account_id ORDER BY t.created_at DESC").all()).results;
    return json({trades:rows.map(x=>({...x,sendAssets:JSON.parse(x.send_assets_json||"{}"),receiveAssets:JSON.parse(x.receive_assets_json||"{}")}))});
  }
  if (method==="POST" && path==="/api/admin/castles") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureCustomCastlesSchema(env);await ensureEconomySchema(env);
    const b=await body(request),region=String(b.region||"").trim(),castle=String(b.castle||"").trim(),house=String(b.house||"").trim(),icon=String(b.icon||"🏰").trim(),location=String(b.location||"").trim(),description=String(b.description||"").trim();
    if(!houses.some(r=>r.region===region))return json({error:"اقلیم معتبر نیست."},400);
    if(!castle||castle.length>80||!house||house.length>80)return json({error:"نام قلعه و خاندان معتبر نیست."},400);
    if(await castleExists(env,castle))return json({error:"این نام قلعه قبلاً استفاده شده است."},409);
    await env.DB.prepare("INSERT INTO game_castles(castle,region,house,icon,location,description,created_at) VALUES(?,?,?,?,?,?,?)").bind(castle,region,house,icon||"🏰",location,description,new Date().toISOString()).run();
    await env.DB.prepare("INSERT OR IGNORE INTO castle_state(castle,region,port_enabled) VALUES(?,?,0)").bind(castle,region).run();
    const week=gameWeekKey();
    await env.DB.prepare("INSERT OR IGNORE INTO castle_week_state(castle,last_week_key) VALUES(?,?)").bind(castle,week).run();
    const defaults={farm:1,village:1,lumber:0,stone:0,iron:0,recreation:0,market:0,stable:0,slaughterhouse:0};
    for(const [k,lvl] of Object.entries(defaults))await env.DB.prepare("INSERT OR IGNORE INTO castle_production(castle,production_key,level) VALUES(?,?,?)").bind(castle,k,lvl).run();
    const sp=SPECIAL_PRODUCTIONS[region];if(sp)await env.DB.prepare("INSERT OR IGNORE INTO castle_production(castle,production_key,level) VALUES(?,?,0)").bind(castle,sp.key).run();
    for(const k of Object.keys(GENERAL_CAMPS))await env.DB.prepare("INSERT OR IGNORE INTO castle_camps(castle,camp_key,level) VALUES(?,?,0)").bind(castle,k).run();
    for(const unit of ["swordsman","archer","spearman","cavalry"])await env.DB.prepare("INSERT OR IGNORE INTO castle_army(castle,unit_key,count) VALUES(?,?,?)").bind(castle,unit,unit==="swordsman"?500:unit==="archer"?200:100).run();
    for(const item of Object.keys(EQUIPMENT))await env.DB.prepare("INSERT OR IGNORE INTO castle_equipment(castle,item_key,count) VALUES(?,?,0)").bind(castle,item).run();
    for(const ship of ["transport","warship"])await env.DB.prepare("INSERT OR IGNORE INTO castle_fleet(castle,ship_key,count) VALUES(?,?,1)").bind(castle,ship).run();
    for(const spc of (SPECIAL_CAMPS[region]||[]))await env.DB.prepare("INSERT OR IGNORE INTO castle_special_camps(castle,camp_key,level) VALUES(?,?,0)").bind(castle,spc.key).run();
    return json({ok:true,castle:{castle,region,house,icon,location,description}});
  }
  if (method==="GET" && path==="/api/admin/castles") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const rows=(await env.DB.prepare("SELECT c.castle,c.region,p.house,c.owner_account_id AS ownerAccountId,u.username FROM castle_state c LEFT JOIN players p ON p.castle=c.castle AND p.account_id=c.owner_account_id LEFT JOIN users u ON u.id=c.owner_account_id ORDER BY c.region,c.castle").all()).results;
    return json({castles:rows});
  }
  if (method==="POST" && path.match(/^\/api\/admin\/players\/[^/]+\/castles$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    const playerId=decodeURIComponent(path.split("/")[4]), b=await body(request), region=String(b.region||"").trim(), castle=String(b.castle||"").trim(), selected=await getCastle(env,region,castle);
    if(!selected)return json({error:"قلمرو یا قلعه معتبر نیست."},400);
    const player=await env.DB.prepare("SELECT id,account_id AS accountId FROM players WHERE id=?").bind(playerId).first();
    if(!player?.accountId)return json({error:"این پلیر حساب کاربری معتبر ندارد."},400);
    const taken=await env.DB.prepare("SELECT owner_account_id FROM castle_state WHERE castle=?").bind(castle).first();
    if(taken?.owner_account_id)return json({error:"این قلعه قبلاً در اختیار یک پلیر است."},409);
    await ensureEconomySchema(env);
    const exists=await env.DB.prepare("SELECT id FROM players WHERE account_id=? AND castle=?").bind(player.accountId,castle).first();
    if(exists)return json({error:"این قلعه قبلاً برای این پلیر ثبت شده است."},409);
    const u=await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(player.accountId).first();
    const p={id:newId(),username:u?.username||"",region,house:selected.house,castle,account_id:player.accountId,created_at:new Date().toISOString()};
    await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,p.account_id,p.created_at).run();
    await env.DB.prepare("UPDATE castle_state SET owner_account_id=? WHERE castle=?").bind(player.accountId,castle).run();
    return json({ok:true,player:p});
  }
  if (method==="GET" && path==="/api/admin/castle-assets") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const castle=String(url.searchParams.get("castle")||"").trim();
    if(!castle)return json({error:"قلعه را انتخاب کنید."},400);
    const state=await loadCastleEconomy(env,castle);
    if(!state)return json({error:"قلعه پیدا نشد."},404);
    return json(state);
  }
  if (method==="POST" && path==="/api/admin/castle-assets") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const b=await body(request), castle=String(b.castle||"").trim(), changes=b.changes&&typeof b.changes==="object"?b.changes:{};
    const state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first();
    if(!state)return json({error:"قلعه پیدا نشد."},404);
    const updates=[];
    const res=changes.resources&&typeof changes.resources==="object"?changes.resources:{};
    for(const k of RESOURCE_KEYS){
      if(Object.prototype.hasOwnProperty.call(res,k)){
        const n=Math.floor(Number(res[k])); if(!Number.isFinite(n)||n<0||n>1000000000)return json({error:"مقدار دارایی نامعتبر است."},400);
        updates.push(env.DB.prepare("UPDATE castle_state SET "+k+"=? WHERE castle=?").bind(n,castle));
      }
    }
    for(const pair of [["workshop_level",changes.workshopLevel],["port_level",changes.portLevel]]){
      if(pair[1]!==undefined){const n=Math.floor(Number(pair[1]));if(!Number.isFinite(n)||n<0)return json({error:"سطح نامعتبر است."},400);updates.push(env.DB.prepare("UPDATE castle_state SET "+pair[0]+"=? WHERE castle=?").bind(n,castle));}
    }
    if(changes.portEnabled!==undefined)updates.push(env.DB.prepare("UPDATE castle_state SET port_enabled=? WHERE castle=?").bind(changes.portEnabled?1:0,castle));
    const updateRows=async(table,keyField,source)=>{if(!source||typeof source!=="object")return;for(const [k,raw] of Object.entries(source)){const n=Math.floor(Number(raw));if(!Number.isFinite(n)||n<0||n>1000000000)throw new Error("مقدار نامعتبر است.");let valid=true;if(table==="castle_production")valid=!!GENERAL_PRODUCTIONS[k]||!!(SPECIAL_PRODUCTIONS[state.region]&&SPECIAL_PRODUCTIONS[state.region].key===k);else if(table==="castle_camps")valid=!!GENERAL_CAMPS[k];else if(table==="castle_special_camps")valid=!!(SPECIAL_CAMPS[state.region]||[]).find(x=>x.key===k);if(!valid&&table!=="castle_army"&&table!=="castle_equipment"&&table!=="castle_fleet")throw new Error("کلید نامعتبر است.");const valueField=(table==="castle_army"||table==="castle_equipment"||table==="castle_fleet")?"count":"level";updates.push(env.DB.prepare("UPDATE "+table+" SET "+valueField+"=? WHERE castle=? AND "+keyField+"=?").bind(n,castle,k));}};
    try{
      await updateRows("castle_production","production_key",changes.production);
      await updateRows("castle_camps","camp_key",changes.camps);
      await updateRows("castle_special_camps","camp_key",changes.specialCamps);
      await updateRows("castle_army","unit_key",changes.army);
      await updateRows("castle_equipment","item_key",changes.equipment);
      await updateRows("castle_fleet","ship_key",changes.fleet);
    }catch(e){return json({error:e.message||"مقدار نامعتبر است."},400);}
    if(changes.specialItem!==undefined)updates.push(env.DB.prepare("UPDATE castle_state SET special_item=? WHERE castle=?").bind(changes.specialItem==null?null:JSON.stringify(changes.specialItem),castle));
    if(!updates.length)return json({ok:true});
    await env.DB.batch(updates);
    return json({ok:true});
  }
  if (method==="GET" && path==="/api/admin/scenarios") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    return json({items:[]});
  }
  if (method==="GET" && path==="/api/admin/roles") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    return json({items:[]});
  }

  if (method==="POST" && path.match(/^\/api\/admin\/war-expeditions\/[^/]+\/casualties$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureWarLogSchema(env);await ensureEconomySchema(env);
    const id=decodeURIComponent(path.split("/")[4]),row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=?").bind(id).first();
    if(!row)return json({error:"لشکرکشی پیدا نشد."},404);
    if(Number(row.cancelled))return json({error:"لشکرکشی لغو شده است."},409);
    if(warIsActive(row))return json({error:"ابتدا باید لشکرکشی به مقصد برسد."},409);
    if(String(row.command||"")!=="attack")return json({error:"تلفات فقط بعد از دستور حمله قابل ثبت است."},409);
    if(String(row.casualties_json||"{}")!=="{}")return json({error:"تلفات این نبرد قبلاً ثبت شده است."},409);
    const b=await body(request),attacker=b.attacker&&typeof b.attacker==="object"?b.attacker:{},defender=b.defender&&typeof b.defender==="object"?b.defender:{};
    const original=JSON.parse(row.assets_json||"{}"),updates=[],saved={attacker:{},defender:{}};
    const tables={army:["castle_army","unit_key"],equipment:["castle_equipment","item_key"],fleet:["castle_fleet","ship_key"]};
    for(const side of ["attacker","defender"]){
      const source=side==="attacker"?attacker:defender,castle=side==="attacker"?row.destination_castle:row.destination_castle,base=side==="attacker"?original:{};
      for(const kind of ["army","equipment","fleet"]){
        const table=tables[kind][0],field=tables[kind][1],requested=source[kind]&&typeof source[kind]==="object"?source[kind]:{};
        const keys=side==="attacker"?Object.keys(base[kind]||{}):Object.keys(requested);
        for(const key of keys){
          const current=side==="attacker"?Math.floor(Number(base[kind]?.[key]||0)):Math.floor(Number((await env.DB.prepare("SELECT count FROM "+table+" WHERE castle=? AND "+field+"=?").bind(castle,key).first())?.count||0));
          const left=Math.floor(Number(requested[key]));
          if(!Number.isFinite(left)||left<0||left>current)return json({error:"مقدار باقی‌مانده تلفات معتبر نیست."},400);
          saved[side][kind]??={};saved[side][kind][key]=left;
          if(side==="attacker"&&left>0)updates.push(env.DB.prepare("INSERT INTO "+table+"(castle,"+field+",count) VALUES (?,?,?) ON CONFLICT(castle,"+field+") DO UPDATE SET count=count+excluded.count").bind(row.destination_castle,key,left));
          if(side==="defender")updates.push(env.DB.prepare("UPDATE "+table+" SET count=? WHERE castle=? AND "+field+"=?").bind(left,castle,key));
        }
      }
    }
    updates.push(env.DB.prepare("UPDATE war_logs SET casualties_json=? WHERE id=? AND casualties_json='{}'").bind(JSON.stringify(saved),id));
    const result=await env.DB.batch(updates);if(!result[updates.length-1]?.meta?.changes)return json({error:"ثبت تلفات همزمان انجام نشد؛ دوباره تلاش کن."},409);
    return json({ok:true});
  }
  if (method==="GET" && path==="/api/admin/war-expeditions") {
    await ensureWarLogSchema(env);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    const rows=(await env.DB.prepare("SELECT id,attacker_account_id AS attackerAccountId,attacker_username AS attackerUsername,lord_name AS lordName,lord_present AS lordPresent,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,duration_minutes AS durationMinutes,remaining_seconds AS remainingSeconds,last_resumed_at AS lastResumedAt,is_fake AS fake,created_at AS createdAt,assets_json AS assetsJson,cancelled,cancelled_at AS cancelledAt,command,command_at AS commandAt,casualties_json AS casualtiesJson FROM war_logs ORDER BY created_at DESC").all()).results;
    return json({expeditions:rows.map(x=>({...x,active:warIsActive(x),remainingSeconds:Math.ceil(warRemainingSeconds(x)),arrivalAt:warArrivalISO(x)}))});
  }
  if (method==="POST" && path.match(/^\/api\/admin\/war-expeditions\/[^/]+\/cancel$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureWarLogSchema(env);
    const id=decodeURIComponent(path.split("/")[4]);
    const row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=?").bind(id).first();
    if(!row)return json({error:"لشکرکشی پیدا نشد."},404);
    if(Number(row.cancelled))return json({error:"این لشکرکشی قبلاً لغو شده است."},409);
    if(!warIsActive(row))return json({error:"زمان رسیدن این لشکرکشی گذشته است."},409);
    const assets=JSON.parse(row.assets_json||"{}"); const updates=[];
    if(!Number(row.is_fake)){
      for(const kind of ["army","equipment","fleet"]){
        for(const [key,raw] of Object.entries(assets[kind]||{})){
          const table=kind==="army"?"castle_army":kind==="equipment"?"castle_equipment":"castle_fleet";
          const field=kind==="army"?"unit_key":kind==="equipment"?"item_key":"ship_key";
          updates.push(env.DB.prepare(`UPDATE ${table} SET count=count+? WHERE castle=? AND ${field}=?`).bind(Math.floor(Number(raw)||0),row.source_castle,key));
        }
      }
    }
    updates.push(env.DB.prepare("UPDATE war_logs SET cancelled=1,cancelled_at=?,cancelled_by=? WHERE id=? AND cancelled=0").bind(new Date().toISOString(),"admin",id));
    const result=await env.DB.batch(updates);
    if(!result[updates.length-1]?.meta?.changes)return json({error:"لغو همزمان انجام نشد؛ دوباره تلاش کن."},409);
    return json({ok:true});
  }
  if (method==="GET" && path==="/api/trades/notifications") {
    await ensureTradeSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const rows=await tradeRowsForAccount(env,session.user_id);
    const incoming=rows.filter(x=>x.receiver_account_id===session.user_id);
    const byCastle={}; incoming.forEach(x=>byCastle[x.receiver_castle]=(byCastle[x.receiver_castle]||0)+1); return json({count:incoming.length,byCastle});
  }
  if (method==="GET" && path==="/api/trades/incoming") {
    await ensureTradeSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const rows=await tradeRowsForAccount(env,session.user_id);
    return json({requests:rows.filter(x=>x.receiver_account_id===session.user_id).map(x=>({...x,sendAssets:JSON.parse(x.send_assets_json||"{}"),receiveAssets:JSON.parse(x.receive_assets_json||"{}")}))});
  }
  if (method==="POST" && path==="/api/trades") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(await isGameControlLocked(env,"trade"))return json({error:"تجارت فعلاً توسط ادمین قفل شده است."},423);
    await ensureTradeSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const state=await requireCastleOwner(request,env); if(!state)return json({error:"ابتدا قلعه خود را ثبت کنید."},404);
    const b=await body(request), source=String(b.source||"").trim(), destination=String(b.destination||"").trim();
    if(await isCastleUnderSiege(env,source))return json({error:"این قلعه در محاصره است و امکان تجارت ندارد."},423);
    
    const sourceRow=source?await env.DB.prepare("SELECT * FROM castle_state WHERE castle=? AND owner_account_id=?").bind(source,session.user_id).first():state;
    if(!sourceRow)return json({error:"قلعه مبدا متعلق به این حساب نیست."},403);
    const sendAssets=tradeAssets(b.sendAssets), receiveAssets=tradeAssets(b.receiveAssets);
    if(!destination || destination===sourceRow.castle)return json({error:"مقصد تجارت را انتخاب کن."},400);
    if(!hasAssets(sendAssets)||!hasAssets(receiveAssets))return json({error:"حداقل یک کالا برای ارسال و یک کالا برای دریافت انتخاب کن."},400);
    const dest=await env.DB.prepare("SELECT castle,owner_account_id AS accountId FROM castle_state WHERE castle=?").bind(destination).first();
    if(!dest?.accountId || dest.accountId===session.user_id)return json({error:"مقصد باید قلعه ثبت‌شده یک بازیکن دیگر باشد."},400);
    if(await isCastleUnderSiege(env,destination))return json({error:"این قلعه در محاصره است و امکان تجارت ندارد."},423);
    for(const [k,v] of Object.entries(sendAssets))if(Number(sourceRow[k]||0)<v)return json({error:"موجودی کافی برای کالاهای ارسالی نیست."},400);
    const id=newId();
    await env.DB.prepare("INSERT INTO trade_requests(id,sender_account_id,sender_castle,receiver_account_id,receiver_castle,send_assets_json,receive_assets_json,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,session.user_id,sourceRow.castle,dest.accountId,destination,JSON.stringify(sendAssets),JSON.stringify(receiveAssets),"pending",new Date().toISOString()).run();
    return json({ok:true,id});
  }
  if (method==="POST" && path.match(/^\/api\/trades\/[^/]+\/respond$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(await isGameControlLocked(env,"trade"))return json({error:"تجارت فعلاً توسط ادمین قفل شده است."},423);
    await ensureTradeSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const id=decodeURIComponent(path.split("/")[3]), action=String((await body(request)).action||"");
    if(!["accept","reject"].includes(action))return json({error:"عملیات تجارت معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT * FROM trade_requests WHERE id=? AND receiver_account_id=? AND status='pending'").bind(id,session.user_id).first();
    if(!row)return json({error:"درخواست تجارت پیدا نشد."},404);
    if(action==="reject"){await env.DB.prepare("UPDATE trade_requests SET status='rejected',responded_at=? WHERE id=? AND status='pending'").bind(new Date().toISOString(),id).run();return json({ok:true});}
    const sendAssets=JSON.parse(row.send_assets_json||"{}"), receiveAssets=JSON.parse(row.receive_assets_json||"{}");
    const sender=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=? AND owner_account_id=?").bind(row.sender_castle,row.sender_account_id).first();
    const receiver=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=? AND owner_account_id=?").bind(row.receiver_castle,row.receiver_account_id).first();
    if(await isCastleUnderSiege(env,row.sender_castle)||await isCastleUnderSiege(env,row.receiver_castle))return json({error:"این تجارت به دلیل محاصره یکی از قلعه‌ها قابل انجام نیست."},423);
    if(!sender||!receiver)return json({error:"یکی از قلعه‌های این تجارت دیگر معتبر نیست."},409);
    for(const [k,v] of Object.entries(sendAssets))if(Number(sender[k]||0)<v)return json({error:"موجودی فرستنده برای این تجارت کافی نیست."},409);
    for(const [k,v] of Object.entries(receiveAssets))if(Number(receiver[k]||0)<v)return json({error:"موجودی گیرنده برای کالای پیشنهادی کافی نیست."},409);
    const keys=[...new Set([...Object.keys(sendAssets),...Object.keys(receiveAssets)])];
    const senderSets=[],receiverSets=[],senderBinds=[],receiverBinds=[];
    for(const k of keys){const s=Number(sendAssets[k]||0),r=Number(receiveAssets[k]||0);senderSets.push(`${k}=${k}-?`);senderBinds.push(s-r);receiverSets.push(`${k}=${k}-?`);receiverBinds.push(r-s);}
    const senderWhere=keys.map(k=>`${k}>=?`).join(" AND "), receiverWhere=keys.map(k=>`${k}>=?`).join(" AND ");
    const q1=env.DB.prepare(`UPDATE castle_state SET ${senderSets.join(",")} WHERE castle=? AND ${senderWhere}`).bind(...senderBinds,row.sender_castle,...keys.map(k=>Number(sendAssets[k]||0)));
    const q2=env.DB.prepare(`UPDATE castle_state SET ${receiverSets.join(",")} WHERE castle=? AND ${receiverWhere}`).bind(...receiverBinds,row.receiver_castle,...keys.map(k=>Number(receiveAssets[k]||0)));
    const q3=env.DB.prepare("UPDATE trade_requests SET status='accepted',responded_at=? WHERE id=? AND status='pending'").bind(new Date().toISOString(),id);
    const result=await env.DB.batch([q1,q2,q3]);
    if(!result[0]?.meta?.changes||!result[1]?.meta?.changes||!result[2]?.meta?.changes)return json({error:"تجارت همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    return json({ok:true});
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