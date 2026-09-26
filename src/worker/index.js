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
  passwordNeedsUpgrade,
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
import { DurableObject } from "cloudflare:workers";
import {
  GENERAL_PRODUCTIONS,
  SPECIAL_PRODUCTIONS,
  REGION_MULTIPLIERS,
  GENERAL_CAMPS,
  SPECIAL_CAMPS,
  EQUIPMENT,
  SHIP_CAPACITY,
  EQUIPMENT_UPGRADE_COST,
  RESOURCE_KEYS,
  RESOURCE_LABELS,
  WAR_LORDS
} from "./data/game-rules.js";
const NAVAL_CASTLES = new Set(["Eastwatch","Karhold","Seagard","Gulltown","Pyke","Ten Towers","Hammerhorn","Casterly Rock","King's Landing","Dragonstone","Storm's End","Oldtown","Sunspear","Yronwood"]);
const GAME_REGIONS = houses.map(x=>x.region);

export class RealtimeHub extends DurableObject {
  async fetch(request){
    const url=new URL(request.url);
    if(url.pathname==="/broadcast"){
      if(request.method!=="POST")return new Response("Method Not Allowed",{status:405});
      const message=await request.text();
      for(const ws of this.ctx.getWebSockets()){
        if(ws.readyState===WebSocket.OPEN){try{ws.send(message)}catch{}}
      }
      return new Response("ok");
    }
    if(url.pathname==="/connect"){
      if(request.headers.get("Upgrade")!=="websocket")return new Response("Expected WebSocket",{status:426});
      const [client,server]=Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({connectedAt:Date.now()});
      server.send(JSON.stringify({type:"connected"}));
      return new Response(null,{status:101,webSocket:client});
    }
    return new Response("Not found",{status:404});
  }
  webSocketMessage(ws,message){ if(typeof message==="string"&&message==="ping")ws.send("pong"); }
  webSocketClose(ws,code,reason){ try{ws.close(code,reason)}catch{} }
  webSocketError(ws,error){ console.error("realtime websocket error",error); }
}
function shouldBroadcastRealtime(path){
  return path==="/api/register" ||
    path==="/api/scenarios" ||
    path==="/api/roles" ||
    path==="/api/trades" ||
    /^\/api\/trades\/[^/]+\/respond$/.test(path) ||
    path==="/api/war-expeditions" ||
    /^\/api\/war-expeditions\/[^/]+\/cancel$/.test(path) ||
    path.startsWith("/api/my-castle/") ||
    path==="/api/admin/weekly-update" ||
    path==="/api/admin/controls" ||
    path==="/api/admin/game-runtime" ||
    path==="/api/admin/castle-assets" ||
    path.startsWith("/api/admin/war-expeditions/") ||
    /^\/api\/admin\/players(?:\/[^/]+)?$/.test(path) ||
    /^\/api\/admin\/castles(?:\/[^/]+)?$/.test(path);
}
async function broadcastRealtime(env,payload){
  try{
    if(!env.REALTIME)return;
    const id=env.REALTIME.idFromName("global");
    await env.REALTIME.get(id).fetch("https://realtime/broadcast",{method:"POST",body:JSON.stringify(payload)});
  }catch(e){console.error("realtime broadcast failed",e);}
}

async function ensureDynamicCastleSchema(env){await env.DB.prepare("CREATE TABLE IF NOT EXISTS dynamic_castles (name TEXT PRIMARY KEY, region TEXT NOT NULL, naval INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)").run();await env.DB.prepare("CREATE TABLE IF NOT EXISTS deleted_castles (name TEXT PRIMARY KEY, deleted_at TEXT NOT NULL)").run();}
async function dynamicHouses(env){await ensureDynamicCastleSchema(env);const deletedRows=(await env.DB.prepare("SELECT name FROM deleted_castles").all()).results;const deleted=new Set(deletedRows.map(x=>x.name));const rows=(await env.DB.prepare("SELECT name AS castle,region,naval FROM dynamic_castles ORDER BY region,name").all()).results;const out=houses.map(r=>({...r,castles:r.castles.filter(c=>!deleted.has(c.castle)).map(c=>({...c,naval:NAVAL_CASTLES.has(c.castle)}))}));for(const row of rows){const region=out.find(x=>x.region===row.region);if(region&&!deleted.has(row.castle)&&!region.castles.some(c=>c.castle===row.castle))region.castles.push({house:"",castle:row.castle,icon:Number(row.naval)?"⚓":"🏯",naval:!!Number(row.naval)});}return out;}
async function dynamicCastle(env,region,castle){const hs=await dynamicHouses(env);return hs.find(x=>x.region===region)?.castles.find(x=>x.castle===castle)||null;}
async function isNavalCastle(env,castle){if(NAVAL_CASTLES.has(castle))return true;const row=await env.DB.prepare("SELECT naval FROM dynamic_castles WHERE name=?").bind(castle).first();return !!Number(row?.naval||0);}
async function initializeCastleEconomy(env,castle,region,naval){const week=gameWeekKey(),defaults={farm:1,village:1,lumber:0,stone:0,iron:0,recreation:0,market:0,stable:0,slaughterhouse:0};await env.DB.prepare("INSERT OR IGNORE INTO castle_state(castle,region,port_enabled,port_level) VALUES (?,?,?,0)").bind(castle,region,naval?1:0).run();await env.DB.prepare("UPDATE castle_state SET region=?,port_enabled=? WHERE castle=?").bind(region,naval?1:0,castle).run();await env.DB.prepare("INSERT OR IGNORE INTO castle_week_state(castle,last_week_key) VALUES (?,?)").bind(castle,week).run();for(const [k,lvl] of Object.entries(defaults))await env.DB.prepare("INSERT OR IGNORE INTO castle_production(castle,production_key,level) VALUES (?,?,?)").bind(castle,k,lvl).run();const sp=SPECIAL_PRODUCTIONS[region];if(sp)await env.DB.prepare("INSERT OR IGNORE INTO castle_production(castle,production_key,level) VALUES (?,?,0)").bind(castle,sp.key).run();for(const k of Object.keys(GENERAL_CAMPS))await env.DB.prepare("INSERT OR IGNORE INTO castle_camps(castle,camp_key,level) VALUES (?,?,0)").bind(castle,k,0).run();for(const unit of ["swordsman","archer","spearman","cavalry"])await env.DB.prepare("INSERT OR IGNORE INTO castle_army(castle,unit_key,count) VALUES (?,?,?)").bind(castle,unit,unit==="swordsman"?500:unit==="archer"?200:100).run();for(const item of Object.keys(EQUIPMENT))await env.DB.prepare("INSERT OR IGNORE INTO castle_equipment(castle,item_key,count) VALUES (?,?,0)").bind(castle,item).run();for(const ship of ["transport","warship"])await env.DB.prepare("INSERT OR IGNORE INTO castle_fleet(castle,ship_key,count) VALUES (?,?,?)").bind(castle,ship,naval?1:0).run();for(const spc of (SPECIAL_CAMPS[region]||[]))await env.DB.prepare("INSERT OR IGNORE INTO castle_special_camps(castle,camp_key,level) VALUES (?,?,0)").bind(castle,spc.key,0).run();}
function warElapsedSeconds(row,nowMs=Date.now(),running=true){let n=Number(row.elapsed_seconds||0);if(running&&row.run_started_at){const t=Date.parse(row.run_started_at);if(Number.isFinite(t))n+=Math.max(0,(nowMs-t)/1000);}return n;}
function legacyWarArrivalDate(createdAt,arrivalTime){const d=new Date(createdAt),m=/^(\d{2}):(\d{2})$/.exec(String(arrivalTime||""));if(!m||Number.isNaN(d.getTime()))return null;d.setUTCHours(Number(m[1]),Number(m[2]),0,0);if(d.getTime()<=new Date(createdAt).getTime())d.setUTCDate(d.getUTCDate()+1);return d;}
function warIsActive(row,runtime={running:true}){if(Number(row.cancelled)||row.command)return false;const duration=Number(row.duration_minutes||0)*60;if(duration>0)return warElapsedSeconds(row,Date.now(),runtime.running)<duration;const arrival=legacyWarArrivalDate(row.created_at||row.createdAt,row.arrival_time||row.arrivalTime);return !!arrival&&arrival.getTime()>Date.now();}
async function ensureWarRuntime(env){await env.DB.prepare("CREATE TABLE IF NOT EXISTS game_runtime (key TEXT PRIMARY KEY,value TEXT)").run();await env.DB.prepare("INSERT OR IGNORE INTO game_runtime(key,value) VALUES ('war_running','1')").run();}
async function warRuntime(env){await ensureWarRuntime(env);const rows=(await env.DB.prepare("SELECT key,value FROM game_runtime WHERE key IN ('war_running')").all()).results;const m=Object.fromEntries(rows.map(x=>[x.key,x.value]));return {running:m.war_running!=="0"};}
async function freezeWars(env){await ensureWarLogSchema(env);const rt=await warRuntime(env);if(!rt.running)return;const now=Date.now();const rows=(await env.DB.prepare("SELECT id,elapsed_seconds,run_started_at FROM war_logs WHERE cancelled=0 AND command IS NULL AND run_started_at IS NOT NULL").all()).results;const qs=rows.map(x=>env.DB.prepare("UPDATE war_logs SET elapsed_seconds=?,run_started_at=NULL WHERE id=?").bind(Number(x.elapsed_seconds||0)+Math.max(0,(now-Date.parse(x.run_started_at))/1000),x.id));qs.push(env.DB.prepare("UPDATE game_runtime SET value='0' WHERE key='war_running'"));if(qs.length)await env.DB.batch(qs);}
async function resumeWars(env){await ensureWarLogSchema(env);const rt=await warRuntime(env);if(rt.running)return;const now=new Date().toISOString();await env.DB.batch([env.DB.prepare("UPDATE game_runtime SET value='1' WHERE key='war_running'"),env.DB.prepare("UPDATE war_logs SET run_started_at=? WHERE cancelled=0 AND command IS NULL AND run_started_at IS NULL AND elapsed_seconds < duration_minutes*60").bind(now)]);}
async function castleTradeBlocked(env,castle){await ensureWarLogSchema(env);const row=await env.DB.prepare("SELECT id FROM war_logs WHERE cancelled=0 AND command IN ('attack','siege') AND outcome IS NULL AND (destination_castle=? OR source_castle=?) LIMIT 1").bind(castle,castle).first();return !!row;}


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
  `CREATE TABLE IF NOT EXISTS game_week_runs (week_key TEXT PRIMARY KEY, processed_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS castle_week_state (castle TEXT PRIMARY KEY, last_week_key TEXT)`,
  `CREATE TABLE IF NOT EXISTS castle_equipment_limits (castle TEXT NOT NULL, tracker_key TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(castle,tracker_key))`,
  `CREATE TABLE IF NOT EXISTS food_debts (castle TEXT PRIMARY KEY, debt_grain INTEGER NOT NULL DEFAULT 0, due_at TEXT, created_at TEXT NOT NULL)`,
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













async function ensureWarLogSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS war_logs (
    id TEXT PRIMARY KEY, week_key TEXT NOT NULL, created_at TEXT NOT NULL,
    attacker_account_id TEXT NOT NULL, attacker_username TEXT NOT NULL, lord_name TEXT,
    type TEXT NOT NULL, source_castle TEXT NOT NULL, destination_castle TEXT NOT NULL,
    arrival_time TEXT NOT NULL, is_fake INTEGER NOT NULL DEFAULT 0,
    assets_json TEXT NOT NULL DEFAULT '{}', cancelled INTEGER NOT NULL DEFAULT 0,
    cancelled_at TEXT, cancelled_by TEXT
  )`).run();
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN cancelled INTEGER NOT NULL DEFAULT 0").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN cancelled_at TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN cancelled_by TEXT").run();}catch{}
  let durationAdded=false;
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60").run();durationAdded=true;}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN elapsed_seconds REAL NOT NULL DEFAULT 0").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN run_started_at TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN lord_present INTEGER NOT NULL DEFAULT 1").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN command TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN command_at TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN outcome TEXT").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN defender_assets_json TEXT NOT NULL DEFAULT '{}'").run();}catch{}
  try{await env.DB.prepare("ALTER TABLE war_logs ADD COLUMN casualties_json TEXT NOT NULL DEFAULT '{}'").run();}catch{}
  if(durationAdded)await env.DB.prepare("UPDATE war_logs SET duration_minutes=0 WHERE run_started_at IS NULL AND elapsed_seconds=0 AND command IS NULL").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_war_logs_attacker_state ON war_logs(attacker_account_id,cancelled,command,created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_war_logs_destination_state ON war_logs(destination_castle,cancelled,command,created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_war_logs_source_state ON war_logs(source_castle,cancelled,command,created_at)").run();
  // Enforce the one-fake-expedition-per-player-per-week rule at the database level.
  // Remove any duplicate legacy rows before creating the unique index.
  await env.DB.prepare(`DELETE FROM war_logs
    WHERE is_fake=1
      AND id NOT IN (
        SELECT MIN(id) FROM war_logs WHERE is_fake=1 GROUP BY attacker_account_id,week_key
      )`).run();
  await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS uq_war_fake_week ON war_logs(attacker_account_id,week_key) WHERE is_fake=1").run();
}
async function ensureTradeSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS trade_requests (
    id TEXT PRIMARY KEY, sender_account_id TEXT NOT NULL, sender_castle TEXT NOT NULL,
    receiver_account_id TEXT NOT NULL, receiver_castle TEXT NOT NULL,
    send_assets_json TEXT NOT NULL DEFAULT '{}', receive_assets_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, responded_at TEXT
  )`).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_trade_sender_status ON trade_requests(sender_account_id,status,created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_trade_receiver_status ON trade_requests(receiver_account_id,status,created_at)").run();
}
async function ensureNarrativeSchema(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS scenario_submissions (
    id TEXT PRIMARY KEY, war_id TEXT NOT NULL, submitter_account_id TEXT NOT NULL,
    submitter_username TEXT NOT NULL, lord_name TEXT NOT NULL DEFAULT '', castle TEXT NOT NULL,
    side TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(war_id,submitter_account_id,side)
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS role_submissions (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL, username TEXT NOT NULL,
    lord_name TEXT NOT NULL DEFAULT '', castle TEXT NOT NULL, text TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS role_cooldowns (
    account_id TEXT PRIMARY KEY, next_available_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_scenario_created ON scenario_submissions(created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_scenario_submitter ON scenario_submissions(submitter_account_id,created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_role_account_created ON role_submissions(account_id,created_at)").run();
}
async function ensureGameControls(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_controls (control_key TEXT PRIMARY KEY, locked INTEGER NOT NULL DEFAULT 0)`).run();
  await env.DB.prepare("INSERT OR IGNORE INTO game_controls(control_key,locked) VALUES ('war',0),('trade',0),('claim',0)").run();
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

let economySchemaPromise=null;
async function ensureEconomySchema(env) {
  if(economySchemaPromise)return economySchemaPromise;
  economySchemaPromise=(async()=>{
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS economy_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
  // CREATE TABLE IF NOT EXISTS is cheap enough for the economy entry point and
  // guarantees that the two runtime support tables exist after an old deploy.
  for (const sql of ECONOMY_SCHEMA) await env.DB.prepare(sql).run();
  await ensureDynamicCastleSchema(env);
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_players_account_created ON players(account_id,created_at)").run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_castle_state_owner ON castle_state(owner_account_id)").run();

  const ready=await env.DB.prepare("SELECT value FROM economy_meta WHERE key='seeded'").first();
  const version=await env.DB.prepare("SELECT value FROM economy_meta WHERE key='schema_version'").first();
  if(ready?.value==="1" && version?.value==="5") return;

  const week=gameWeekKey();
  const defaults={farm:1,village:1,lumber:0,stone:0,iron:0,recreation:0,market:0,stable:0,slaughterhouse:0};
  const deletedStatic=(await env.DB.prepare("SELECT name FROM deleted_castles").all()).results;
  const deletedStaticSet=new Set(deletedStatic.map(x=>x.name));
  for (const r of houses) {
    for (const c of r.castles) {
      if(deletedStaticSet.has(c.castle))continue;
      await env.DB.prepare("INSERT OR IGNORE INTO castle_state (castle,region) VALUES (?,?)").bind(c.castle,r.region).run();
      // Repair support rows once when migrating an older economy database.
      await env.DB.prepare("INSERT OR IGNORE INTO castle_week_state (castle,last_week_key) VALUES (?,?)").bind(c.castle,week).run();
      for (const [k,lvl] of Object.entries(defaults)) await env.DB.prepare("INSERT OR IGNORE INTO castle_production (castle,production_key,level) VALUES (?,?,?)").bind(c.castle,k,lvl).run();
      const sp=SPECIAL_PRODUCTIONS[r.region];
      if(sp) await env.DB.prepare("INSERT OR IGNORE INTO castle_production (castle,production_key,level) VALUES (?,?,0)").bind(c.castle,sp.key).run();
      for (const k of Object.keys(GENERAL_CAMPS)) await env.DB.prepare("INSERT OR IGNORE INTO castle_camps (castle,camp_key,level) VALUES (?,?,0)").bind(c.castle,k).run();
      for (const unit of ["swordsman","archer","spearman","cavalry"]) await env.DB.prepare("INSERT OR IGNORE INTO castle_army (castle,unit_key,count) VALUES (?,?,?)").bind(c.castle,unit,unit==="swordsman"?500:unit==="archer"?200:100).run();
      for (const item of Object.keys(EQUIPMENT)) await env.DB.prepare("INSERT OR IGNORE INTO castle_equipment (castle,item_key,count) VALUES (?,?,0)").bind(c.castle,item).run();
      for (const ship of ["transport","warship"]) await env.DB.prepare("INSERT OR IGNORE INTO castle_fleet (castle,ship_key,count) VALUES (?,?,?)").bind(c.castle,ship,NAVAL_CASTLES.has(c.castle)?1:0).run();
      for (const spc of (SPECIAL_CAMPS[r.region]||[])) await env.DB.prepare("INSERT OR IGNORE INTO castle_special_camps (castle,camp_key,level) VALUES (?,?,0)").bind(c.castle,spc.key).run();
    }
  }
  if(ready?.value==="1" && version?.value!=="5"){
    for(const r of houses) for(const c of r.castles){
      const naval=NAVAL_CASTLES.has(c.castle);
      await env.DB.prepare("UPDATE castle_state SET port_enabled=?, port_level=CASE WHEN ?=0 THEN 0 ELSE port_level END WHERE castle=?").bind(naval?1:0,naval?1:0,c.castle).run();
      if(naval) await env.DB.prepare("UPDATE castle_fleet SET count=CASE WHEN count<1 THEN 1 ELSE count END WHERE castle=? AND ship_key IN ('transport','warship')").bind(c.castle).run();
      else await env.DB.prepare("UPDATE castle_fleet SET count=0 WHERE castle=? AND ship_key IN ('transport','warship')").bind(c.castle).run();
    }
  }
  await env.DB.prepare("INSERT OR REPLACE INTO economy_meta(key,value) VALUES ('seeded','1')").run();
  await env.DB.prepare("INSERT OR REPLACE INTO economy_meta(key,value) VALUES ('schema_version','5')").run();
  })().catch(e=>{economySchemaPromise=null;throw e;});
  return economySchemaPromise;
}

async function getFoodDebt(env,castle){
  await ensureEconomySchema(env);
  return await env.DB.prepare("SELECT debt_grain,due_at FROM food_debts WHERE castle=?").bind(castle).first();
}
async function createFoodDebt(env,castle,amount){
  const n=Math.max(0,Math.floor(Number(amount)||0)); if(!n)return;
  const now=new Date(), existing=await env.DB.prepare("SELECT debt_grain,due_at FROM food_debts WHERE castle=?").bind(castle).first();
  const due=existing?.due_at&&Date.parse(existing.due_at)>Date.now()?existing.due_at:new Date(now.getTime()+24*60*60*1000).toISOString();
  await env.DB.prepare("INSERT INTO food_debts(castle,debt_grain,due_at,created_at) VALUES(?,?,?,?) ON CONFLICT(castle) DO UPDATE SET debt_grain=food_debts.debt_grain+excluded.debt_grain,due_at=excluded.due_at").bind(castle,n,due,existing?.created_at||now.toISOString()).run();
}
async function settleFoodCredit(env,castle,resource,amount){
  const n=Math.max(0,Math.floor(Number(amount)||0)); if(!n||!["grain","fish","meat"].includes(resource))return;
  const debt=await env.DB.prepare("SELECT debt_grain FROM food_debts WHERE castle=?").bind(castle).first();
  const d=Math.max(0,Math.floor(Number(debt?.debt_grain||0)));
  if(!d){
    await env.DB.prepare("UPDATE castle_state SET "+resource+"="+resource+"+? WHERE castle=?").bind(n,castle).run();
    return;
  }
  const factor=resource==="grain"?1:2,credit=n*factor,usedCredit=Math.min(d,credit),usedUnits=Math.ceil(usedCredit/factor),remainingDebt=d-usedCredit,remainingUnits=n-usedUnits;
  if(remainingUnits>0)await env.DB.prepare("UPDATE castle_state SET "+resource+"="+resource+"+? WHERE castle=?").bind(remainingUnits,castle).run();
  if(remainingDebt>0)await env.DB.prepare("UPDATE food_debts SET debt_grain=? WHERE castle=?").bind(remainingDebt,castle).run();
  else await env.DB.prepare("DELETE FROM food_debts WHERE castle=?").bind(castle).run();
}
async function consumeFoodDebtCredit(env,castle,resource,amount){
  const n=Math.max(0,Math.floor(Number(amount)||0)); if(!n||!["grain","fish","meat"].includes(resource))return;
  const debt=await env.DB.prepare("SELECT debt_grain FROM food_debts WHERE castle=?").bind(castle).first();
  const d=Math.max(0,Math.floor(Number(debt?.debt_grain||0))); if(!d)return;
  const factor=resource==="grain"?1:2,usedCredit=Math.min(d,n*factor),usedUnits=Math.ceil(usedCredit/factor),remainingDebt=d-usedCredit;
  await env.DB.prepare("UPDATE castle_state SET "+resource+"=MAX(0,"+resource+"-?) WHERE castle=?").bind(usedUnits,castle).run();
  if(remainingDebt>0)await env.DB.prepare("UPDATE food_debts SET debt_grain=? WHERE castle=?").bind(remainingDebt,castle).run();
  else await env.DB.prepare("DELETE FROM food_debts WHERE castle=?").bind(castle).run();
}
async function settleExpiredFoodDebts(env,onlyCastle=null){
  await ensureEconomySchema(env);
  const now=new Date().toISOString();
  const rows=onlyCastle
    ? (await env.DB.prepare("SELECT castle,debt_grain FROM food_debts WHERE castle=? AND debt_grain>0 AND due_at IS NOT NULL AND due_at<=?").bind(onlyCastle,now).all()).results
    : (await env.DB.prepare("SELECT castle,debt_grain FROM food_debts WHERE debt_grain>0 AND due_at IS NOT NULL AND due_at<=?").bind(now).all()).results;
  for(const row of rows){
    const army=(await env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=? AND count>0").bind(row.castle).all()).results;
    const total=army.reduce((s,x)=>s+Math.max(0,Number(x.count)||0),0), target=Math.min(total,Math.max(0,Math.ceil(Number(row.debt_grain)||0)));
    if(target>0&&total>0){
      const deaths=army.map(x=>({key:x.unit_key,count:Number(x.count)||0,raw:(Number(x.count)||0)*target/total}));
      let assigned=0; for(const x of deaths){x.death=Math.floor(x.raw);assigned+=x.death;}
      let left=target-assigned;
      deaths.sort((a,b)=>(b.raw-b.death)-(a.raw-a.death));
      for(const x of deaths){if(left<=0)break;if(x.death<x.count){x.death++;left--;}}
      const qs=deaths.filter(x=>x.death>0).map(x=>env.DB.prepare("UPDATE castle_army SET count=MAX(0,count-?) WHERE castle=? AND unit_key=?").bind(x.death,row.castle,x.key));
      if(qs.length)await env.DB.batch(qs);
    }
    await env.DB.prepare("DELETE FROM food_debts WHERE castle=?").bind(row.castle).run();
  }
}
async function loadCastleEconomy(env, castle) {
  await settleExpiredFoodDebts(env,castle);
  const state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first();
  if(!state) return null;
  const [prod,camps,specialCamps,army,equipment,fleet,debt]=await Promise.all([
    env.DB.prepare("SELECT production_key,level FROM castle_production WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT camp_key,level FROM castle_camps WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT camp_key,level FROM castle_special_camps WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT item_key,count FROM castle_equipment WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT ship_key,count FROM castle_fleet WHERE castle=?").bind(castle).all(),
    env.DB.prepare("SELECT debt_grain,due_at FROM food_debts WHERE castle=?").bind(castle).first()
  ]);
  const production=Object.fromEntries(prod.results.map(x=>[x.production_key,{level:Number(x.level),...GENERAL_PRODUCTIONS[x.production_key]}]));
  const campMap=Object.fromEntries(camps.results.map(x=>[x.camp_key,{level:Number(x.level),...GENERAL_CAMPS[x.camp_key]}]));
  const specialCampMap=Object.fromEntries(specialCamps.results.map(x=>[x.camp_key,{level:Number(x.level),...(SPECIAL_CAMPS[state.region]||[]).find(s=>s.key===x.camp_key)}]));
  const armyMap=Object.fromEntries(army.results.map(x=>[x.unit_key,Number(x.count)]));
  for(const spc of (SPECIAL_CAMPS[state.region]||[])) if(!Object.prototype.hasOwnProperty.call(armyMap,spc.unit)) armyMap[spc.unit]=0;
  const equipmentMap=Object.fromEntries(equipment.results.map(x=>[x.item_key,Number(x.count)]));
  const fleetMap=Object.fromEntries(fleet.results.map(x=>[x.ship_key,Number(x.count)]));
  let parsedSpecialItem=null; try{parsedSpecialItem=state.special_item?JSON.parse(state.special_item):null}catch{parsedSpecialItem=null}
  const sp=SPECIAL_PRODUCTIONS[state.region]||null;
  const specialProduction=sp?{key:sp.key,level:Number(production[sp.key]?.level||0),label:sp.label,max:sp.max,cost:sp.cost,base:sp.base,yield:sp.yield}:null;
  const debtGrain=Math.max(0,Number(debt?.debt_grain||0));
  return {castle:state.castle,region:state.region,ownerAccountId:state.owner_account_id,resources:Object.fromEntries(RESOURCE_KEYS.map(k=>[k,k==="grain"?Number(state[k]||0)-debtGrain:Number(state[k]||0)])),foodDebt:{grain:debtGrain,dueAt:debt?.due_at||null},production,camps:campMap,specialCamps:specialCampMap,specialProduction,army:armyMap,equipment:equipmentMap,fleet:fleetMap,workshop:{level:Number(state.workshop_level),maxLevel:5,upgradeCost:EQUIPMENT_UPGRADE_COST},port:{enabled:!!state.port_enabled,level:Number(state.port_level),maxLevel:15,weeklyYieldPerShipType:Number(state.port_level)},specialItem:parsedSpecialItem,gameWeek:gameWeekKey()};
}

async function runWeeklyUpdate(env, force=false) {
  await settleExpiredFoodDebts(env);
  const week=gameWeekKey();
  const rows=(await env.DB.prepare("SELECT * FROM castle_state").all()).results;
  for(const s of rows){
    const marker=await env.DB.prepare("SELECT last_week_key FROM castle_week_state WHERE castle=?").bind(s.castle).first();
    if(!force && marker?.last_week_key===week) continue;
    const [prods,camps,scamps,armyRows]=await Promise.all([
      env.DB.prepare("SELECT production_key,level FROM castle_production WHERE castle=?").bind(s.castle).all(),
      env.DB.prepare("SELECT camp_key,level FROM castle_camps WHERE castle=?").bind(s.castle).all(),
      env.DB.prepare("SELECT camp_key,level FROM castle_special_camps WHERE castle=?").bind(s.castle).all(),
      env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=?").bind(s.castle).all()
    ]);
    const changes={}; const add=(k,v)=>changes[k]=(changes[k]||0)+v;
    for(const p of prods.results){const def=GENERAL_PRODUCTIONS[p.production_key];if(!def||!p.level)continue;let gain=Number(p.level)*def.yield;gain*=REGION_MULTIPLIERS[s.region]?.[p.production_key]||1;add(def.base,gain);}
    const sp=SPECIAL_PRODUCTIONS[s.region];if(sp){const lvl=Number(prods.results.find(x=>x.production_key===sp.key)?.level||0);if(lvl)add(sp.base,lvl*sp.yield);}
    for(const c of camps.results){const d=GENERAL_CAMPS[c.camp_key];if(d&&c.level)add(d.unit,c.level*d.yield);}
    for(const c of scamps.results){const d=(SPECIAL_CAMPS[s.region]||[]).find(x=>x.key===c.camp_key);if(d&&c.level)add(d.unit,c.level*d.yield);}
    const a=Object.fromEntries(armyRows.results.map(x=>[x.unit_key,Number(x.count)]));
    const grainNeed=(a.swordsman||0)+(a.archer||0)+(a.spearman||0)+((a.cavalry||0)*2)+Object.entries(a).filter(([key])=>!["swordsman","archer","spearman","cavalry","giants"].includes(key)).reduce((sum,[,count])=>sum+Number(count||0)*2,0);
    const grainUsed=Math.min(Number(s.grain||0),grainNeed);let rem=Math.max(0,grainNeed-grainUsed);
    const fishUsed=Math.min(Number(s.fish||0),Math.ceil(rem/2));rem=Math.max(0,rem-fishUsed*2);
    const meatUsed=Math.min(Number(s.meat||0),Math.ceil(rem/2));rem=Math.max(0,rem-meatUsed*2);
    const grapeUsed=Math.min(Number(s.grapes||0),Math.ceil(rem*2));rem=Math.max(0,rem-grapeUsed/2);
    if(rem>0)await createFoodDebt(env,s.castle,rem);
    const statements=[];
    if(grainUsed)statements.push(env.DB.prepare("UPDATE castle_state SET grain=MAX(0,grain-?) WHERE castle=?").bind(grainUsed,s.castle));
    if(fishUsed)statements.push(env.DB.prepare("UPDATE castle_state SET fish=MAX(0,fish-?) WHERE castle=?").bind(fishUsed,s.castle));
    if(meatUsed)statements.push(env.DB.prepare("UPDATE castle_state SET meat=MAX(0,meat-?) WHERE castle=?").bind(meatUsed,s.castle));
    if(grapeUsed)statements.push(env.DB.prepare("UPDATE castle_state SET grapes=MAX(0,grapes-?) WHERE castle=?").bind(grapeUsed,s.castle));
    for(const [unit,gain] of Object.entries(changes).filter(([k])=>!RESOURCE_KEYS.includes(k)))statements.push(env.DB.prepare("INSERT INTO castle_army(castle,unit_key,count) VALUES (?,?,?) ON CONFLICT(castle,unit_key) DO UPDATE SET count=count+excluded.count").bind(s.castle,unit,Math.floor(gain)));
    if(Number(s.port_enabled)&&Number(s.port_level)>0){
      statements.push(env.DB.prepare("UPDATE castle_fleet SET count=count+? WHERE castle=? AND ship_key='transport'").bind(Number(s.port_level),s.castle));
      statements.push(env.DB.prepare("UPDATE castle_fleet SET count=count+? WHERE castle=? AND ship_key='warship'").bind(Number(s.port_level),s.castle));
    }
    await env.DB.batch(statements);
    for(const [resource,gain] of Object.entries(changes).filter(([k])=>["grain","fish","meat"].includes(k))){
      if(Number(gain)>0)await settleFoodCredit(env,s.castle,resource,Math.floor(gain));
    }
    for(const [resource,gain] of Object.entries(changes).filter(([k])=>k==="grapes")){
      if(Number(gain)>0)await env.DB.prepare("UPDATE castle_state SET grapes=grapes+? WHERE castle=?").bind(Math.floor(gain),s.castle).run();
    }
    await env.DB.prepare("UPDATE castle_week_state SET last_week_key=? WHERE castle=?").bind(week,s.castle).run();
  }
}
async function requireCastleOwner(request,env,castleName=""){
  const s=await requireUser(request,env); if(!s)return null;
  const name=String(castleName||"").trim();
  const player=name
    ? await env.DB.prepare("SELECT castle,region FROM players WHERE account_id=? AND castle=? LIMIT 1").bind(s.user_id,name).first()
    : await env.DB.prepare("SELECT castle,region FROM players WHERE account_id=? ORDER BY created_at LIMIT 1").bind(s.user_id).first();
  if(!player)return null;
  const state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(player.castle).first();
  if(!state)return null;
  if(state.owner_account_id!==s.user_id){
    const fixed=await env.DB.prepare("UPDATE castle_state SET owner_account_id=? WHERE castle=? AND (owner_account_id IS NULL OR owner_account_id=?)").bind(s.user_id,player.castle,s.user_id).run();
    if(!fixed.meta?.changes){
      const current=await env.DB.prepare("SELECT owner_account_id FROM castle_state WHERE castle=?").bind(player.castle).first();
      if(current?.owner_account_id && current.owner_account_id!==s.user_id)return null;
    }
  }
  return {...state,owner_account_id:s.user_id};
}
function safeCost(cost){return Object.fromEntries(Object.entries(cost).filter(([k,v])=>RESOURCE_KEYS.includes(k)&&Number(v)>0));}
async function upgradeResourceBacked(env,castle,table,key,def,maxLevel){
  const where=table==="castle_production"?"production_key":"camp_key";
  const row=await env.DB.prepare(`SELECT level FROM ${table} WHERE castle=? AND ${where}=?`).bind(castle,key).first();
  const level=Number(row?.level||0);
  if(!row)return {error:"این مورد برای این قلعه تعریف نشده است.",status:404};
  if(level>=maxLevel)return {error:"این مورد به حداکثر سطح رسیده است.",status:400};

  const state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first();
  if(!state)return {error:"دادهٔ قلعه پیدا نشد.",status:404};
  if(!addCostCheck(state,def.cost))return {error:"منابع کافی نیست.",status:400};

  const cost=safeCost(def.cost);
  const keys=Object.keys(cost);
  if(!keys.length)return {error:"هزینهٔ ارتقا معتبر نیست.",status:500};

  const sets=keys.map(k=>`${k}=${k}-?`).join(",");
  const cond=keys.map(k=>`${k}>=?`).join(" AND ");

  const b=await env.DB.batch([
    env.DB.prepare(`UPDATE castle_state SET ${sets} WHERE castle=? AND ${cond}`)
      .bind(...keys.map(k=>Number(cost[k])),castle,...keys.map(k=>Number(cost[k]))),
    env.DB.prepare(`UPDATE ${table} SET level=level+1 WHERE castle=? AND ${where}=? AND level=?`)
      .bind(castle,key,level)
  ]);

  if(!b[0]?.meta?.changes||!b[1]?.meta?.changes){
    return {error:"منابع یا سطح همزمان تغییر کرده؛ دوباره تلاش کن.",status:409};
  }
  return {ok:true,newLevel:level+1};
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
    const exists=await env.DB.prepare("SELECT id FROM users WHERE lower(username)=lower(?)").bind(username).first(); if(exists) return json({error:"این نام کاربری قبلاً ثبت شده است."},409);     const h=await hashPassword(password), id=newId();
     try{
       await env.DB.prepare("INSERT INTO users (id,username,salt,hash,created_at) VALUES (?,?,?,?,?)").bind(id,username,h.salt,h.hash,new Date().toISOString()).run();
     }catch(e){
       if(String(e?.message||e).toLowerCase().includes("unique"))return json({error:"این نام کاربری قبلاً ثبت شده است."},409);
       throw e;
     }
    await deleteSession(request,env);
    const sid=await createSession(env,id); return json({ok:true,user:{id,username}},200,{"set-cookie":cookie(SESSION_COOKIE_NAME,sid)});
  }
  if (method === "POST" && path === "/api/auth/login") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if (!(await rateLimit(request, env, "login", 10))) return json({error:"تعداد تلاش‌های ورود زیاد است. ۱۵ دقیقه بعد دوباره تلاش کنید."},429, {"retry-after":"900"});
    const b=await body(request), username=String(b.username||"").trim(), password=String(b.password||""); if(username.length>24 || password.length>MAX_PASSWORD_LENGTH) return json({error:"نام کاربری یا رمز عبور اشتباه است."},401); const u=await env.DB.prepare("SELECT * FROM users WHERE lower(username)=lower(?)").bind(username).first();
    if(!u || !(await verifyPassword(password,u.salt,u.hash))) return json({error:"نام کاربری یا رمز عبور اشتباه است."},401);
    if(passwordNeedsUpgrade(u.hash)){
      const upgraded=await hashPassword(password);
      await env.DB.prepare("UPDATE users SET salt=?,hash=? WHERE id=?").bind(upgraded.salt,upgraded.hash,u.id).run();
    }
    await deleteSession(request,env); const sid=await createSession(env,u.id); return json({ok:true,user:publicUser(u)},200,{"set-cookie":cookie(SESSION_COOKIE_NAME,sid)});
  }
  if (method === "POST" && path === "/api/auth/logout") { if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); await deleteSession(request,env); return json({ok:true},200,{"set-cookie":clearCookie(SESSION_COOKIE_NAME)}); }
  if (method === "GET" && path === "/api/world-state") {
    const [houseList,playerList]=await Promise.all([dynamicHouses(env),players(env)]);
    return json({houses:houseList,players:playerList});
  }
  if (method === "GET" && path === "/api/houses") return json(await dynamicHouses(env));
  if (method === "GET" && path === "/api/players") return json(await players(env));
  const session=await getSession(request,env);
  const userSession=await requireUser(request,env);
  if (method === "GET" && path === "/api/my-dashboard") {
    if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401);
    await ensureEconomySchema(env);
    await ensureWarLogSchema(env);
    await ensureTradeSchema(env);
    await ensureNarrativeSchema(env);
    const accountId=userSession.user_id;
    const [castleRows,warRows,tradeRows,scenarioRows,roleRow,warRuntimeState]=await Promise.all([
      env.DB.prepare("SELECT id,username,region,house,castle,created_at AS createdAt FROM players WHERE account_id=? ORDER BY created_at").bind(accountId).all(),
      env.DB.prepare("SELECT id,attacker_username AS attackerUsername,lord_name AS lordName,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,is_fake AS fake,created_at AS createdAt,assets_json AS assetsJson,cancelled,duration_minutes AS durationMinutes,elapsed_seconds AS elapsedSeconds,run_started_at AS runStartedAt,command,command_at AS commandAt,outcome,lord_present AS lordPresent FROM war_logs WHERE attacker_account_id=? AND cancelled=0 AND command IS NULL ORDER BY created_at DESC").bind(accountId).all(),
      tradeRowsForAccount(env,accountId),
      env.DB.prepare(`SELECT w.id,w.attacker_username AS attackerUsername,w.source_castle AS sourceCastle,w.destination_castle AS destinationCastle,w.created_at AS createdAt,
        CASE WHEN w.attacker_account_id=? THEN 'attacker' ELSE 'defender' END AS side,
        CASE WHEN w.attacker_account_id=? THEN w.source_castle ELSE w.destination_castle END AS castle
        FROM war_logs w
        WHERE w.command='attack' AND w.cancelled=0
          AND (w.attacker_account_id=? OR EXISTS(SELECT 1 FROM castle_state cs WHERE cs.castle=w.destination_castle AND cs.owner_account_id=?))
        ORDER BY w.created_at DESC`).bind(accountId,accountId,accountId,accountId).all(),
      env.DB.prepare("SELECT next_available_at AS nextAvailableAt FROM role_cooldowns WHERE account_id=?").bind(accountId).first(),
      warRuntime(env)
    ]);
    const now=Date.now();
    const expeditions=warRows.results.map(x=>({...x,active:warIsActive(x,warRuntimeState),arrived:!warIsActive(x,warRuntimeState)}));
    const submitted=(await env.DB.prepare("SELECT war_id,side FROM scenario_submissions WHERE submitter_account_id=?").bind(accountId).all()).results;
    const sent=new Set(submitted.map(x=>x.war_id+"|"+x.side));
    const scenarioItems=scenarioRows.results.filter(x=>!sent.has(x.id+"|"+x.side)).map(x=>({
      warId:x.id,attackerUsername:x.attackerUsername,sourceCastle:x.sourceCastle,destinationCastle:x.destinationCastle,createdAt:x.createdAt,
      side:x.side,castle:x.castle,opponentCastle:x.side==="attacker"?x.destinationCastle:x.sourceCastle,lordName:WAR_LORDS[x.castle]||""
    }));
    const incoming=tradeRows.filter(x=>x.receiver_account_id===accountId);
    const byCastle={}; incoming.forEach(x=>byCastle[x.receiver_castle]=(byCastle[x.receiver_castle]||0)+1);
    const next=roleRow?.nextAvailableAt?Date.parse(roleRow.nextAvailableAt):NaN;
    await ensureGameControls(env);
    const claimRow=await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key='claim'").first();
    return json({
      castles:castleRows.results,
      activeWars:{expeditions},
      tradeNotice:{count:incoming.length,byCastle},
      scenarioNotice:{items:scenarioItems},
      roleStatus:{available:!Number.isFinite(next)||next<=now,nextAvailableAt:Number.isFinite(next)?new Date(next).toISOString():null,remainingSeconds:Number.isFinite(next)&&next>now?Math.ceil((next-now)/1000):0},
      claimLocked:Number(claimRow?.locked||0)===1
    });
  }
  if (method === "GET" && path === "/api/my-castles") { if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401); return json((await env.DB.prepare("SELECT id,username,region,house,castle,created_at AS createdAt FROM players WHERE account_id=? ORDER BY created_at").bind(userSession.user_id).all()).results); }
  if (method === "GET" && path === "/api/claim/status") {
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureGameControls(env); const row=await env.DB.prepare("SELECT locked FROM game_controls WHERE control_key='claim'").first();
    return json({locked:Number(row?.locked||0)===1});
  }
  if (method === "POST" && path === "/api/register") {
    if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if(await isGameControlLocked(env,"claim"))return json({error:"انتخاب قلعه فعلاً توسط ادمین قفل شده است."},423);
    if(!userSession) return json({error:"ابتدا وارد حساب کاربری شوید."},401); const b=await body(request), username=normalizeUsername(b.username), region=String(b.region||"").trim(), castle=String(b.castle||"").trim();
    if(!validTelegramUsername(username)) return json({error:"Username تلگرام معتبر نیست. فقط حروف، عدد و _ و بین ۵ تا ۳۲ کاراکتر."},400); const selected=await dynamicCastle(env,region,castle); if(!selected) return json({error:"قلمرو یا قلعه معتبر نیست."},400);
    if(await env.DB.prepare("SELECT id FROM players WHERE region=? AND castle=?").bind(region,castle).first()) return json({error:"این قلعه قبلاً توسط یک لرد انتخاب شده است."},409);
    if(await env.DB.prepare("SELECT id FROM players WHERE lower(username)=lower(?)").bind("@"+username).first()) return json({error:"این Telegram Username قبلاً ثبت شده است."},409);
    if(await env.DB.prepare("SELECT id FROM players WHERE account_id=?").bind(userSession.user_id).first()) return json({error:"این حساب قبلاً برای Kill The King یک قلعه انتخاب کرده است."},409);     const p={id:newId(),username:"@"+username,region,house:selected.house,castle,account_id:userSession.user_id,created_at:new Date().toISOString()};
     try{
       await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,p.account_id,p.created_at).run();
     }catch(e){
       if(String(e?.message||e).toLowerCase().includes("unique"))return json({error:"این قلعه یا نام کاربری همزمان توسط دیگری ثبت شد."},409);
       throw e;
     }
     await ensureEconomySchema(env); await env.DB.prepare("UPDATE castle_state SET owner_account_id=? WHERE castle=?").bind(p.account_id,p.castle).run(); return json({message:`ثبت شد لرد ${selected.house}`,player:p});
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
  if (method === "POST" && path === "/api/admin/logout") { if (!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); await deleteSession(request,env); return json({ok:true},200,{"set-cookie":clearCookie(SESSION_COOKIE_NAME)}); }
  if (method === "GET" && path === "/api/admin/status") return json({admin:!!session?.is_admin});
  if (path === "/api/admin/players" && method === "GET") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    const rows=(await env.DB.prepare("SELECT id,username,region,house,castle,account_id AS accountId,created_at AS createdAt FROM players ORDER BY created_at").all()).results;
    return json(rows);
  }
  if (path === "/api/admin/players" && method === "POST") {
    if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin) return json({error:"دسترسی مدیر لازم است."},401); const b=await body(request), username=normalizeUsername(b.username),region=String(b.region||"").trim(),castle=String(b.castle||"").trim(),selected=await dynamicCastle(env,region,castle); if(!validTelegramUsername(username)||!selected)return json({error:"اطلاعات واردشده معتبر نیست."},400);
    if(await env.DB.prepare("SELECT id FROM players WHERE region=? AND castle=?").bind(region,castle).first())return json({error:"این قلعه قبلاً رزرو شده است."},409); if(await env.DB.prepare("SELECT id FROM players WHERE lower(username)=lower(?)").bind("@"+username).first())return json({error:"این Username قبلاً ثبت شده است."},409);     const p={id:newId(),username:"@"+username,region,house:selected.house,castle,created_at:new Date().toISOString()};
     try{
       await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,null,p.created_at).run();
     }catch(e){
       if(String(e?.message||e).toLowerCase().includes("unique"))return json({error:"این قلعه یا نام کاربری همزمان توسط دیگری ثبت شد."},409);
       throw e;
     }
     await ensureEconomySchema(env); return json({player:p});
  }
  if(path.startsWith("/api/admin/players/")&&method==="DELETE"){ if(!sameOrigin(request)) return json({error:"درخواست نامعتبر است."},403); if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401); const id=decodeURIComponent(path.split("/").pop()); const old=await env.DB.prepare("SELECT castle FROM players WHERE id=?").bind(id).first(); const r=await env.DB.prepare("DELETE FROM players WHERE id=?").bind(id).run(); if(!r.meta.changes)return json({error:"پلیر پیدا نشد."},404); await ensureEconomySchema(env); if(old?.castle) await env.DB.prepare("UPDATE castle_state SET owner_account_id=NULL WHERE castle=?").bind(old.castle).run(); return json({ok:true}); }
  if(method==="GET"&&path.startsWith("/api/castles/")){const name=decodeURIComponent(path.slice("/api/castles/".length));const info=castleInfo[name];if(info)return json(info);await ensureEconomySchema(env);const row=await env.DB.prepare("SELECT region FROM castle_state WHERE castle=?").bind(name).first();if(!row)return json({error:"اطلاعات قلعه پیدا نشد."},404);return json({location:row.region,description:"این قلعه توسط مدیر قلمرو اضافه شده است."});}

  if (path.startsWith("/api/my-castle") || path.startsWith("/api/game/")) {
    await ensureEconomySchema(env);
  }
  if (method==="GET" && path==="/api/game/week") return json({week:gameWeekKey()});
  if (method==="GET" && path==="/api/my-castle/assets") {
    const castle=String(url.searchParams.get("castle")||"").trim();
    const state=await requireCastleOwner(request,env,castle); if(!state)return json({error:"این قلعه متعلق به حساب شما نیست."},403);
    return json(await loadCastleEconomy(env,state.castle));
  }
  if (method==="POST" && path==="/api/my-castle/production/upgrade") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const key=String(b.key||""); const def=GENERAL_PRODUCTIONS[key];
    if(!def)return json({error:"تولیدی معتبر نیست."},400);
    const result=await upgradeResourceBacked(env,state.castle,"castle_production",key,def,def.max);
    if(result.error)return json({error:result.error},result.status);
    return json(result);
  }
  if (method==="POST" && path==="/api/my-castle/camp/upgrade") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const key=String(b.key||""); const def=GENERAL_CAMPS[key];
    if(!def)return json({error:"کمپ معتبر نیست."},400);
    const result=await upgradeResourceBacked(env,state.castle,"castle_camps",key,def,def.max);
    if(result.error)return json({error:result.error},result.status);
    return json(result);
  }
  if (method==="POST" && path==="/api/my-castle/special-camp/upgrade") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const key=String(b.key||""), def=(SPECIAL_CAMPS[state.region]||[]).find(x=>x.key===key);
    if(!def)return json({error:"کمپ ویژه این اقلیم معتبر نیست."},400);
    const result=await upgradeResourceBacked(env,state.castle,"castle_special_camps",key,def,Number(def.max||20));
    if(result.error)return json({error:result.error},result.status);
    return json(result);
  }
  if (method==="POST" && path==="/api/my-castle/special-production/upgrade") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const sp=SPECIAL_PRODUCTIONS[state.region]; if(!sp)return json({error:"این اقلیم تولیدی ویژه ندارد."},400);
    const result=await upgradeResourceBacked(env,state.castle,"castle_production",sp.key,sp,sp.max);
    if(result.error)return json({error:result.error},result.status);
    return json(result);
  }
  if (method==="POST" && path==="/api/my-castle/workshop/upgrade") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    if(state.workshop_level>=5)return json({error:"کارگاه به حداکثر سطح رسیده است."},400);
    const oldCoins=Number(state.coins||0); if(oldCoins<EQUIPMENT_UPGRADE_COST)return json({error:"6000 سکه لازم است."},400);
    const nextLevel=Number(state.workshop_level)+1;
    const bres=await env.DB.batch([
      env.DB.prepare("UPDATE castle_state SET workshop_level=workshop_level+1 WHERE castle=? AND workshop_level=? AND coins>=?").bind(state.castle,state.workshop_level,EQUIPMENT_UPGRADE_COST),
      env.DB.prepare("UPDATE castle_state SET coins=coins-? WHERE castle=? AND coins=? AND workshop_level=?").bind(EQUIPMENT_UPGRADE_COST,state.castle,oldCoins,nextLevel)
    ]);
    if(!bres[0]?.meta?.changes||!bres[1]?.meta?.changes)return json({error:"منابع یا سطح همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    return json({ok:true,newLevel:nextLevel});
  }
  if (method==="POST" && path==="/api/my-castle/equipment/build") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    const key=String(b.key||""),def=EQUIPMENT[key]; if(!def)return json({error:"ادوات معتبر نیست."},400);
    if(Number(state.workshop_level)<def.level)return json({error:`برای ساخت ${def.label} کارگاه باید حداقل سطح ${def.level} باشد.`},400);
    const trackerKey=`${def.period}:${def.period==="day"?gameDayKey():gameWeekKey()}:${key}`;
    await env.DB.prepare("INSERT OR IGNORE INTO castle_equipment_limits(castle,tracker_key,used) VALUES (?,?,0)").bind(state.castle,trackerKey).run();
    const limitRow=await env.DB.prepare("SELECT used FROM castle_equipment_limits WHERE castle=? AND tracker_key=?").bind(state.castle,trackerKey).first();
    const itemRow=await env.DB.prepare("SELECT count FROM castle_equipment WHERE castle=? AND item_key=?").bind(state.castle,key).first();
    const used=Number(limitRow?.used||0),oldCount=Number(itemRow?.count||0);
    if(used>=def.limit)return json({error:`سقف ساخت ${def.label} برای این ${def.period==="day"?"روز":"هفته"} پر شده است.`},400);
    if(!addCostCheck(state,def.cost))return json({error:"منابع کافی نیست."},400);
    const cost=safeCost(def.cost),sets=Object.keys(cost).map(k=>`${k}=${k}-?`).join(","),availability=Object.keys(cost).map(k=>`${k}>=?`).join(" AND ");
    const original=Object.keys(cost).map(k=>`${k}=?`).join(" AND ");
    const q1=env.DB.prepare(`UPDATE castle_equipment SET count=count+1 WHERE castle=? AND item_key=? AND count=? AND EXISTS (SELECT 1 FROM castle_equipment_limits WHERE castle=? AND tracker_key=? AND used=? AND used<${def.limit}) AND EXISTS (SELECT 1 FROM castle_state WHERE castle=? AND workshop_level>=? AND ${availability})`)
      .bind(state.castle,key,oldCount,state.castle,trackerKey,used,state.castle,def.level,...Object.values(cost));
    const q2=env.DB.prepare(`UPDATE castle_state SET ${sets} WHERE castle=? AND ${original} AND EXISTS (SELECT 1 FROM castle_equipment WHERE castle=? AND item_key=? AND count=?) AND EXISTS (SELECT 1 FROM castle_equipment_limits WHERE castle=? AND tracker_key=? AND used=? )`)
      .bind(state.castle,...Object.keys(cost).map(k=>Number(state[k]||0)),state.castle,key,oldCount+1,state.castle,trackerKey,used);
    const post=Object.keys(cost).map(k=>`${k}=?`).join(" AND "),postValues=Object.keys(cost).map(k=>Number(state[k]||0)-Number(cost[k]||0));
    const q3=env.DB.prepare(`UPDATE castle_equipment_limits SET used=used+1 WHERE castle=? AND tracker_key=? AND used=? AND used<${def.limit} AND EXISTS (SELECT 1 FROM castle_equipment WHERE castle=? AND item_key=? AND count=?) AND EXISTS (SELECT 1 FROM castle_state WHERE castle=? AND workshop_level>=? AND ${post})`)
      .bind(state.castle,trackerKey,used,state.castle,key,oldCount+1,state.castle,def.level,...postValues);
    const bres=await env.DB.batch([q1,q2,q3]);
    if(!bres[0]?.meta?.changes||!bres[1]?.meta?.changes||!bres[2]?.meta?.changes)return json({error:"منابع، سهم ساخت یا تعداد همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    return json({ok:true});
  }
  if (method==="POST" && path==="/api/my-castle/port/upgrade") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    const b=await body(request), state=await requireCastleOwner(request,env,String(b.castle||"")); if(!state)return json({error:"قلعه‌ای برای این حساب پیدا نشد."},404);
    if(!Number(state.port_enabled))return json({error:"این قلعه فعلاً بندری تعریف نشده است."},400);
    if(Number(state.port_level)>=15)return json({error:"اسکله به حداکثر سطح 15 رسیده است."},400);
    const oldCoins=Number(state.coins||0),oldWood=Number(state.wood||0); if(oldCoins<1500||oldWood<1000)return json({error:"برای ارتقای اسکله 1500 سکه و 1000 چوب لازم است."},400);
    const nextLevel=Number(state.port_level)+1;
    const bres=await env.DB.batch([
      env.DB.prepare("UPDATE castle_state SET port_level=port_level+1 WHERE castle=? AND port_level=? AND coins>=1500 AND wood>=1000").bind(state.castle,state.port_level),
      env.DB.prepare("UPDATE castle_state SET coins=coins-1500,wood=wood-1000 WHERE castle=? AND coins=? AND wood=? AND port_level=?").bind(state.castle,oldCoins,oldWood,nextLevel)
    ]);
    if(!bres[0]?.meta?.changes||!bres[1]?.meta?.changes)return json({error:"منابع یا سطح همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    return json({ok:true,newLevel:nextLevel});
  }

  if (method==="GET" && path==="/api/war-expeditions/status") {
    await ensureWarLogSchema(env); await ensureWarRuntime(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const fake=await env.DB.prepare("SELECT id FROM war_logs WHERE attacker_account_id=? AND week_key=? AND is_fake=1 LIMIT 1").bind(session.user_id,gameWeekKey()).first();
    const rt=await warRuntime(env); return json({fakeAvailable:!fake,gameRunning:rt.running});
  }
  if (method==="GET" && path==="/api/war-logs") {
    await ensureWarLogSchema(env); const rows=(await env.DB.prepare("SELECT id,attacker_username AS attackerUsername,lord_name AS lordName,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,is_fake AS fake,created_at AS createdAt,cancelled,cancelled_at AS cancelledAt,command,command_at AS commandAt,outcome,lord_present AS lordPresent FROM war_logs ORDER BY created_at DESC").all()).results;
    return json({logs:rows});
  }
  if (method==="GET" && path==="/api/my-war-expeditions/active") {
    await ensureWarLogSchema(env); const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const rt=await warRuntime(env); const rows=(await env.DB.prepare("SELECT id,attacker_username AS attackerUsername,lord_name AS lordName,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,is_fake AS fake,created_at AS createdAt,assets_json AS assetsJson,cancelled,duration_minutes AS durationMinutes,elapsed_seconds AS elapsedSeconds,run_started_at AS runStartedAt,command,command_at AS commandAt,outcome,lord_present AS lordPresent FROM war_logs WHERE attacker_account_id=? AND cancelled=0 AND command IS NULL ORDER BY created_at DESC").bind(session.user_id).all()).results;
    return json({expeditions:rows.map(x=>({...x,active:warIsActive(x,rt),arrived:!warIsActive(x,rt)}))});
  }
  if (method==="GET" && path==="/api/my-war-expeditions/commands") {
    await ensureWarLogSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const castle=String(url.searchParams.get("castle")||"").trim();
    if(!castle)return json({error:"قلعه مبدا برای بررسی دستورات مشخص نشده است."},400);
    const state=await requireCastleOwner(request,env,castle);
    if(!state)return json({error:"این قلعه متعلق به حساب شما نیست."},403);
    const rt=await warRuntime(env);
    const rows=(await env.DB.prepare("SELECT id,attacker_username AS attackerUsername,source_castle AS sourceCastle,destination_castle AS destinationCastle,type,arrival_time AS arrivalTime,lord_present AS lordPresent,elapsed_seconds AS elapsedSeconds,duration_minutes AS durationMinutes FROM war_logs WHERE attacker_account_id=? AND source_castle=? AND cancelled=0 AND command IS NULL ORDER BY created_at DESC").bind(session.user_id,castle).all()).results;
    return json({commands:rows.filter(x=>!warIsActive(x,rt)).map(x=>({...x,arrived:true}))});
  }
  if (method==="POST" && path.match(/^\/api\/war-expeditions\/[^/]+\/cancel$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403); await ensureWarLogSchema(env);
    if(!(await rateLimit(request,env,"war-cancel",30)))return json({error:"تعداد درخواست‌های لغو لشکرکشی زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    const session=await requireUser(request,env); if(!session)return json({error:"دسترسی لازم است."},401);
    const id=decodeURIComponent(path.split("/")[3]), row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=? AND attacker_account_id=?").bind(id,session.user_id).first();
    if(!row)return json({error:"لشکرکشی پیدا نشد."},404); const rt=await warRuntime(env);
    if(Number(row.cancelled))return json({error:"این لشکرکشی قبلاً لغو شده است."},409);
    if(!warIsActive(row,rt))return json({error:"این لشکرکشی دیگر قابل لغو نیست."},409);
    const assets=JSON.parse(row.assets_json||"{}"),updates=[];
    if(!Number(row.is_fake))for(const kind of ["army","equipment","fleet"])for(const [key,raw] of Object.entries(assets[kind]||{})){const table=kind==="army"?"castle_army":kind==="equipment"?"castle_equipment":"castle_fleet";const field=kind==="army"?"unit_key":kind==="equipment"?"item_key":"ship_key";updates.push(env.DB.prepare(`UPDATE ${table} SET count=count+? WHERE castle=? AND ${field}=? AND EXISTS (SELECT 1 FROM war_logs WHERE id=? AND cancelled=0 AND command IS NULL)`).bind(Math.floor(Number(raw)||0),row.source_castle,key,id));}
    updates.push(env.DB.prepare("UPDATE war_logs SET cancelled=1,cancelled_at=?,cancelled_by=?,run_started_at=NULL WHERE id=? AND cancelled=0").bind(new Date().toISOString(),session.user_id,id));
    const result=await env.DB.batch(updates); if(!result[updates.length-1]?.meta?.changes)return json({error:"لغو همزمان انجام نشد؛ دوباره تلاش کن."},409); return json({ok:true});
  }
  if (method==="POST" && path==="/api/war-expeditions") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(await isGameControlLocked(env,"war"))return json({error:"لشکرکشی‌ها فعلاً توسط ادمین قفل شده‌اند."},423);
    if(!(await rateLimit(request,env,"war-create",30)))return json({error:"تعداد درخواست‌های لشکرکشی زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    await ensureWarLogSchema(env); const rt=await warRuntime(env); if(!rt.running)return json({error:"بازی فعلاً متوقف است؛ شروع بازی را از ادمین صبر کن."},423);
    const b=await body(request),type=String(b.type||""),source=String(b.source||"").trim(),destination=String(b.destination||"").trim(),arrivalTime=String(b.arrivalTime||"").trim(),isFake=!!b.fake,lordPresent=b.lordPresent!==false;
    const durationMinutes=Math.floor(Number(b.durationMinutes||0));
    const state=await requireCastleOwner(request,env,source); if(!state)return json({error:"قلعه مبدا متعلق به این حساب نیست."},403);
    if(!["land","sea"].includes(type))return json({error:"نوع لشکرکشی معتبر نیست."},400);
    const sourceRow=await env.DB.prepare("SELECT castle,region FROM castle_state WHERE castle=?").bind(source).first(),destRow=await env.DB.prepare("SELECT castle,region,owner_account_id AS ownerAccountId FROM castle_state WHERE castle=?").bind(destination).first();
    if(!sourceRow||!destRow)return json({error:"مبدا یا مقصد معتبر نیست."},400); if(source!==state.castle)return json({error:"مبدا باید قلعه ثبت‌شده خودت باشد."},403); if(destination===source)return json({error:"مقصد باید با مبدا متفاوت باشد."},400);
    if(type==="sea" && (!await isNavalCastle(env,source) || !await isNavalCastle(env,destination)))return json({error:"لشکرکشی دریایی فقط بین قلعه‌های دریایی امکان‌پذیر است."},400);
    if(!Number.isInteger(durationMinutes)||durationMinutes<1||durationMinutes>10080)return json({error:"مدت زمان لشکرکشی باید بین 1 دقیقه تا 7 روز باشد."},400);
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(arrivalTime))return json({error:"ساعت نمایش رسیدن باید به صورت HH:MM باشد."},400);
    const accountId=state.owner_account_id,user=await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(accountId).first();if(!user)return json({error:"حساب کاربری پیدا نشد."},404);
    const week=gameWeekKey();if(isFake){const used=await env.DB.prepare("SELECT id FROM war_logs WHERE attacker_account_id=? AND week_key=? AND is_fake=1 LIMIT 1").bind(accountId,week).first();if(used)return json({error:"لشکرکشی فیک این هفته قبلاً استفاده شده است."},409);}
    const selected=b.assets&&typeof b.assets==="object"?b.assets:{},allowed={army:["castle_army","unit_key"],equipment:["castle_equipment","item_key"],fleet:["castle_fleet","ship_key"]},deductions=[],sanitizedAssets={};let selectedTotal=0;
    if(!isFake){for(const kind of type==="sea"?["army","equipment","fleet"]:["army","equipment"]){const group=selected[kind]&&typeof selected[kind]==="object"?selected[kind]:{};for(const [key,raw] of Object.entries(group)){const n=Math.floor(Number(raw));if(!Number.isFinite(n)||n<0||n>1000000)return json({error:"تعداد واردشده معتبر نیست."},400);if(!n)continue;const def=allowed[kind],row=await env.DB.prepare(`SELECT count FROM ${def[0]} WHERE castle=? AND ${def[1]}=?`).bind(state.castle,key).first();const have=Number(row?.count||0);if(n>have)return json({error:`تعداد ${key} بیشتر از موجودی قلعه است.`},400);deductions.push({table:def[0],keyField:def[1],key,n});sanitizedAssets[kind]??={};sanitizedAssets[kind][key]=n;selectedTotal+=n;}}
      if(!selectedTotal)return json({error:"برای لشکرکشی واقعی حداقل یک نیرو، ادوات یا کشتی انتخاب کن."},400);
      if(type==="sea"){
        const fleet=selected.fleet&&typeof selected.fleet==="object"?selected.fleet:{};
        const transport=Math.floor(Number(fleet.transport||0)),warship=Math.floor(Number(fleet.warship||0));
        if(transport+warship<1)return json({error:"لشکرکشی دریایی حداقل به یک کشتی نیاز دارد."},400);
        const capacity=transport*SHIP_CAPACITY.transport+warship*SHIP_CAPACITY.warship;
        const army=selected.army&&typeof selected.army==="object"?selected.army:{};
        const required=Object.entries(army).reduce((sum,[key,raw])=>sum+(key==="cavalry"?2:1)*Math.floor(Number(raw)||0),0);
        if(required>capacity)return json({error:`ظرفیت ناوگان کافی نیست. ظرفیت ${capacity} و ظرفیت موردنیاز نیروها ${required} است.`},400);
      }
    }
    const statements=[];for(const d of deductions)statements.push(env.DB.prepare(`UPDATE ${d.table} SET count=count-? WHERE castle=? AND ${d.keyField}=? AND count>=?`).bind(d.n,state.castle,d.key,d.n));
    const id=newId(),createdAt=new Date().toISOString(),lordName=WAR_LORDS[source]||"";
    statements.push(env.DB.prepare("INSERT INTO war_logs(id,week_key,created_at,attacker_account_id,attacker_username,lord_name,type,source_castle,destination_castle,arrival_time,is_fake,assets_json,duration_minutes,elapsed_seconds,run_started_at,lord_present) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,week,createdAt,accountId,user.username,lordName,type,source,destination,arrivalTime,isFake?1:0,JSON.stringify(isFake?{}:sanitizedAssets),durationMinutes,0,createdAt,lordPresent?1:0));
    let result;
    try {
      result=await env.DB.batch(statements);
    } catch(e) {
      if(isFake && String(e?.message||e).toLowerCase().includes("unique"))return json({error:"لشکرکشی فیک این هفته قبلاً استفاده شده است."},409);
      throw e;
    }
    for(let i=0;i<deductions.length;i++)if(!result[i]?.meta?.changes)return json({error:"تغییر همزمان دارایی انجام نشد؛ دوباره تلاش کن."},409);return json({ok:true,id});
  }
  if (method==="POST" && path.match(/^\/api\/war-expeditions\/[^/]+\/command$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403); await ensureWarLogSchema(env);
    if(!(await rateLimit(request,env,"war-command",30)))return json({error:"تعداد درخواست‌های دستور جنگ زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const id=decodeURIComponent(path.split("/")[3]),b=await body(request),command=String(b.command||"");
    if(!["attack","deploy","siege"].includes(command))return json({error:"دستور معتبر نیست."},400);
    const war=await env.DB.prepare("SELECT * FROM war_logs WHERE id=? AND attacker_account_id=?").bind(id,session.user_id).first();
    if(!war)return json({error:"لشکرکشی پیدا نشد یا متعلق به این حساب نیست."},404);
    const rt=await warRuntime(env);
    if(Number(war.cancelled)||warIsActive(war,rt))return json({error:"این لشکرکشی هنوز به مقصد نرسیده است."},409);
    if(war.command)return json({error:"برای این لشکرکشی قبلاً دستور ثبت شده است."},409);
    let defenderAssets={};
    if(command==="attack"||command==="siege"){
      const rows=(await env.DB.prepare("SELECT unit_key,count FROM castle_army WHERE castle=?").bind(war.destination_castle).all()).results;
      defenderAssets=Object.fromEntries(rows.map(x=>[x.unit_key,Number(x.count)]));
    }
    const result=await env.DB.prepare("UPDATE war_logs SET command=?,command_at=?,defender_assets_json=? WHERE id=? AND attacker_account_id=? AND command IS NULL").bind(command,new Date().toISOString(),JSON.stringify(defenderAssets),id,session.user_id).run();
    if(!result.meta?.changes)return json({error:"این لشکرکشی قبلاً دستور گرفته است."},409);
    return json({ok:true,command});
  }
  if (method==="GET" && path==="/api/admin/game-runtime") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401); const rt=await warRuntime(env); return json({running:rt.running});
  }
  if (method==="POST" && path==="/api/admin/game-runtime") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    const action=String((await body(request)).action||""); if(action==="start"){await resumeWars(env);return json({ok:true,running:true});} if(action==="stop"){await freezeWars(env);return json({ok:true,running:false});} return json({error:"عملیات بازی معتبر نیست."},400);
  }
  if (method==="POST" && path==="/api/admin/castles") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);const b=await body(request),name=String(b.name||"").trim(),region=String(b.region||"").trim(),naval=!!b.naval;
    if(!name||name.length>100)return json({error:"نام قلعه معتبر نیست."},400);if(!GAME_REGIONS.includes(region))return json({error:"اقلیم معتبر نیست."},400);
    const exists=await env.DB.prepare("SELECT castle FROM castle_state WHERE lower(castle)=lower(?) UNION SELECT name FROM dynamic_castles WHERE lower(name)=lower(?)").bind(name,name).first();if(exists)return json({error:"این قلعه قبلاً ثبت شده است."},409);
    try{
      await env.DB.prepare("INSERT INTO dynamic_castles(name,region,naval,created_at) VALUES (?,?,?,?)").bind(name,region,naval?1:0,new Date().toISOString()).run();
    }catch(e){
      if(String(e?.message||e).toLowerCase().includes("unique"))return json({error:"این قلعه همزمان توسط دیگری ثبت شد."},409);
      throw e;
    }
    try{
      await initializeCastleEconomy(env,name,region,naval);
    }catch(e){
      await env.DB.batch([
        env.DB.prepare("DELETE FROM castle_production WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_camps WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_special_camps WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_army WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_equipment WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_fleet WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_week_state WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM castle_state WHERE castle=?").bind(name),
        env.DB.prepare("DELETE FROM dynamic_castles WHERE name=?").bind(name)
      ]);
      throw e;
    }
    return json({ok:true,castle:{name,region,naval}});
  }
  if (method==="POST" && path.match(/^\/api\/admin\/war-expeditions\/[^/]+\/outcome$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);await ensureWarLogSchema(env);
    const id=decodeURIComponent(path.split("/")[4]),outcome=String((await body(request)).outcome||"");if(!["attacker","defender"].includes(outcome))return json({error:"نتیجه معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT id,command,outcome FROM war_logs WHERE id=?").bind(id).first();if(!row||!["attack","siege"].includes(row.command))return json({error:"این گزارش برای ثبت نتیجه آماده نیست."},404);if(row.outcome)return json({error:"نتیجه این نبرد قبلاً ثبت شده است."},409);
    const result=await env.DB.prepare("UPDATE war_logs SET outcome=? WHERE id=? AND outcome IS NULL").bind(outcome,id).run();if(!result.meta?.changes)return json({error:"نتیجه همزمان تغییر کرده است."},409);return json({ok:true,outcome});
  }
  if (method==="POST" && path.match(/^\/api\/admin\/war-expeditions\/[^/]+\/casualties$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);await ensureWarLogSchema(env);
    const id=decodeURIComponent(path.split("/")[4]),row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=?").bind(id).first();if(!row||row.command!=="attack")return json({error:"این حمله برای ثبت تلفات آماده نیست."},404);if(row.casualties_json&&row.casualties_json!=="{}")return json({error:"تلفات این حمله قبلاً ثبت شده است."},409);
    let stored={},defender={};try{stored=JSON.parse(row.assets_json||"{}");defender=JSON.parse(row.defender_assets_json||"{}");}catch{}
    const b=await body(request),att=b.attacker&&typeof b.attacker==="object"?b.attacker:{},def=b.defender&&typeof b.defender==="object"?b.defender:{};
    const qs=[],saved={attacker:{army:{},equipment:{}},defender:{army:{}}};
    for(const kind of ["army","equipment"]){for(const [key,raw] of Object.entries(att[kind]||{})){if(!Object.prototype.hasOwnProperty.call(stored[kind]||{},key))return json({error:"واحد مهاجم نامعتبر است."},400);const n=Math.floor(Number(raw));const brought=Number(stored[kind]?.[key]||0);if(!Number.isFinite(n)||n<0||n>brought)return json({error:"مقدار تلفات مهاجم نامعتبر است."},400);const table=kind==="army"?"castle_army":"castle_equipment",field=kind==="army"?"unit_key":"item_key";qs.push(env.DB.prepare(`UPDATE ${table} SET count=count+? WHERE castle=? AND ${field}=?`).bind(n,row.source_castle,key));saved.attacker[kind][key]=n;}}
    for(const [key,raw] of Object.entries(def.army||{})){if(!Object.prototype.hasOwnProperty.call(defender,key))return json({error:"واحد مدافع نامعتبر است."},400);const n=Math.floor(Number(raw));if(!Number.isFinite(n)||n<0||n>1000000000)return json({error:"مقدار تلفات مدافع نامعتبر است."},400);qs.push(env.DB.prepare("UPDATE castle_army SET count=count+? WHERE castle=? AND unit_key=?").bind(n,row.destination_castle,key));saved.defender.army[key]=n;}
    if(!qs.length)return json({error:"حداقل یک مقدار وارد کن."},400);qs.push(env.DB.prepare("UPDATE war_logs SET casualties_json=? WHERE id=? AND (casualties_json IS NULL OR casualties_json='{}')").bind(JSON.stringify(saved),id));const result=await env.DB.batch(qs);if(!result[qs.length-1]?.meta?.changes)return json({error:"تلفات همزمان ثبت شده است."},409);return json({ok:true});
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
    if(!["war","trade","claim"].includes(key))return json({error:"قفل نامعتبر است."},400);
    await env.DB.prepare("UPDATE game_controls SET locked=? WHERE control_key=?").bind(locked?1:0,key).run();
    return json({ok:true,key,locked});
  }
  if (method==="POST" && path==="/api/admin/weekly-update") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const week=gameWeekKey();
    await runWeeklyUpdate(env,true);
    return json({ok:true,week,forced:true});
  }
  if (method==="GET" && path==="/api/admin/trades") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureTradeSchema(env);
    const rows=(await env.DB.prepare("SELECT t.*, su.username AS sender_username, ru.username AS receiver_username FROM trade_requests t LEFT JOIN users su ON su.id=t.sender_account_id LEFT JOIN users ru ON ru.id=t.receiver_account_id ORDER BY t.created_at DESC").all()).results;
    return json({trades:rows.map(x=>({...x,sendAssets:JSON.parse(x.send_assets_json||"{}"),receiveAssets:JSON.parse(x.receive_assets_json||"{}")}))});
  }
  if (method==="GET" && path==="/api/admin/castles") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env);
    const rows=(await env.DB.prepare("SELECT c.castle,c.region,p.house,c.owner_account_id AS ownerAccountId,COALESCE(u.username,p.username) AS username FROM castle_state c LEFT JOIN players p ON p.castle=c.castle AND p.account_id=c.owner_account_id LEFT JOIN users u ON u.id=c.owner_account_id ORDER BY c.region,c.castle").all()).results;
    return json({castles:rows});
  }
  if (method==="POST" && path.match(/^\/api\/admin\/players\/[^/]+\/castles$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    const playerId=decodeURIComponent(path.split("/")[4]), b=await body(request), region=String(b.region||"").trim(), castle=String(b.castle||"").trim(), selected=await dynamicCastle(env,region,castle);
    if(!selected)return json({error:"قلمرو یا قلعه معتبر نیست."},400);
    const player=await env.DB.prepare("SELECT id,account_id AS accountId FROM players WHERE id=?").bind(playerId).first();
    if(!player?.accountId)return json({error:"این پلیر حساب کاربری معتبر ندارد."},400);
    const taken=await env.DB.prepare("SELECT id FROM players WHERE castle=? LIMIT 1").bind(castle).first();
    if(taken)return json({error:"این قلعه قبلاً در اختیار یک پلیر است."},409);
    await ensureEconomySchema(env);
    const exists=await env.DB.prepare("SELECT id FROM players WHERE account_id=? AND castle=?").bind(player.accountId,castle).first();
    if(exists)return json({error:"این قلعه قبلاً برای این پلیر ثبت شده است."},409);
    const u=await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(player.accountId).first();     const p={id:newId(),username:u?.username||"",region,house:selected.house,castle,account_id:player.accountId,created_at:new Date().toISOString()};
     try{
       await env.DB.prepare("INSERT INTO players (id,username,region,house,castle,account_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.username,p.region,p.house,p.castle,p.account_id,p.created_at).run();
     }catch(e){
       if(String(e?.message||e).toLowerCase().includes("unique"))return json({error:"این قلعه همزمان توسط دیگری ثبت شد."},409);
       throw e;
     }
    await env.DB.prepare("UPDATE castle_state SET owner_account_id=? WHERE castle=?").bind(player.accountId,castle).run();
    return json({ok:true,player:p});
  }
  if (method==="DELETE" && path.startsWith("/api/admin/castles/")) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureEconomySchema(env); await ensureTradeSchema(env); await ensureNarrativeSchema(env); await ensureWarLogSchema(env);
    const castle=decodeURIComponent(path.slice("/api/admin/castles/".length)).trim();
    if(!castle)return json({error:"قلعه مشخص نشده است."},400);
    const state=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=?").bind(castle).first();
    if(!state)return json({error:"قلعه پیدا نشد."},404);
    const dynamic=await env.DB.prepare("SELECT name FROM dynamic_castles WHERE name=?").bind(castle).first();
    const now=new Date().toISOString();
    const activeWars=(await env.DB.prepare("SELECT id,source_castle AS sourceCastle,assets_json AS assetsJson FROM war_logs WHERE cancelled=0 AND command IS NULL AND (source_castle=? OR destination_castle=?)").bind(castle,castle).all()).results;
    const statements=[];
    for(const w of activeWars){
      if(w.sourceCastle!==castle){
        let assets={};try{assets=JSON.parse(w.assetsJson||"{}");}catch{}
        for(const kind of ["army","equipment","fleet"]){
          for(const [key,raw] of Object.entries(assets[kind]||{})){
            const table=kind==="army"?"castle_army":kind==="equipment"?"castle_equipment":"castle_fleet";
            const field=kind==="army"?"unit_key":kind==="equipment"?"item_key":"ship_key";
            const amount=Math.floor(Number(raw)||0);
            if(amount>0)statements.push(env.DB.prepare(`UPDATE ${table} SET count=count+? WHERE castle=? AND ${field}=?`).bind(amount,w.sourceCastle,key));
          }
        }
      }
      statements.push(env.DB.prepare("UPDATE war_logs SET cancelled=1,cancelled_at=?,cancelled_by='admin',run_started_at=NULL WHERE id=? AND cancelled=0 AND command IS NULL").bind(now,w.id));
    }
    statements.push(env.DB.prepare("UPDATE trade_requests SET status='rejected',responded_at=? WHERE status='pending' AND (sender_castle=? OR receiver_castle=?)").bind(now,castle,castle));
    statements.push(env.DB.prepare("DELETE FROM scenario_submissions WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM players WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_production WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_camps WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_special_camps WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_army WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_equipment WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_fleet WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_week_state WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_equipment_limits WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("DELETE FROM castle_state WHERE castle=?").bind(castle));
    statements.push(env.DB.prepare("INSERT OR REPLACE INTO deleted_castles(name,deleted_at) VALUES(?,?)").bind(castle,now));
    if(dynamic) statements.push(env.DB.prepare("DELETE FROM dynamic_castles WHERE name=?").bind(castle));
    await env.DB.batch(statements);
    return json({ok:true,castle,playerUnlinked:true});
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
     const naval=await isNavalCastle(env,castle);
     const oldFoodValues={grain:Number(state.grain||0),fish:Number(state.fish||0),meat:Number(state.meat||0)};
     if(changes.portEnabled!==undefined){
       if((changes.portEnabled?1:0)!==(naval?1:0))return json({error:naval?"قلعه بندری باید اسکله فعال داشته باشد.":"قلعه غیربندری نمی‌تواند اسکله فعال داشته باشد."},400);
     }
     if(changes.portLevel!==undefined){
       const n=Math.floor(Number(changes.portLevel));
       if(!Number.isFinite(n)||n<0||n>15)return json({error:"سطح اسکله باید بین 0 تا 15 باشد."},400);
       if(!naval&&n>0)return json({error:"قلعه غیربندری نمی‌تواند سطح اسکله داشته باشد."},400);
     }
     if(!naval&&changes.fleet&&Object.values(changes.fleet).some(v=>Number(v)>0))return json({error:"قلعه غیربندری نمی‌تواند کشتی داشته باشد."},400);
     const updates=[];
    const res=changes.resources&&typeof changes.resources==="object"?changes.resources:{};
    for(const k of RESOURCE_KEYS){
      if(Object.prototype.hasOwnProperty.call(res,k)){
        const n=Math.floor(Number(res[k])); if(!Number.isFinite(n)||n<0||n>1000000000)return json({error:"مقدار دارایی نامعتبر است."},400);
        updates.push(env.DB.prepare("UPDATE castle_state SET "+k+"=? WHERE castle=?").bind(n,castle));
      }
    }
    for(const pair of [["workshop_level",changes.workshopLevel],["port_level",changes.portLevel]]){
      if(pair[1]!==undefined){
        const n=Math.floor(Number(pair[1]));
        const max=pair[0]==="workshop_level"?5:15;
        if(!Number.isFinite(n)||n<0||n>max)return json({error:pair[0]==="workshop_level"?"سطح کارگاه باید بین 0 تا 5 باشد.":"سطح اسکله باید بین 0 تا 15 باشد."},400);
        updates.push(env.DB.prepare("UPDATE castle_state SET "+pair[0]+"=? WHERE castle=?").bind(n,castle));
      }
    }
    if(changes.portEnabled!==undefined)updates.push(env.DB.prepare("UPDATE castle_state SET port_enabled=? WHERE castle=?").bind(changes.portEnabled?1:0,castle));
    const updateRows=async(table,keyField,source)=>{
      if(!source||typeof source!=="object")return;
      for(const [k,raw] of Object.entries(source)){
        const n=Math.floor(Number(raw));
        if(!Number.isFinite(n)||n<0||n>1000000000)throw new Error("مقدار نامعتبر است.");
        let valid=true,maxLevel=null;
        if(table==="castle_production"){
          const def=GENERAL_PRODUCTIONS[k]||((SPECIAL_PRODUCTIONS[state.region]&&SPECIAL_PRODUCTIONS[state.region].key===k)?SPECIAL_PRODUCTIONS[state.region]:null);
          valid=!!def;maxLevel=def?.max??null;
        }else if(table==="castle_camps"){
          const def=GENERAL_CAMPS[k];valid=!!def;maxLevel=def?.max??null;
        }else if(table==="castle_special_camps"){
          const def=(SPECIAL_CAMPS[state.region]||[]).find(x=>x.key===k);valid=!!def;maxLevel=def?.max??null;
        }
        if(!valid&&table!=="castle_army"&&table!=="castle_equipment"&&table!=="castle_fleet")throw new Error("کلید نامعتبر است.");
        if(maxLevel!==null&&n>Number(maxLevel))throw new Error("سطح واردشده از حداکثر مجاز بیشتر است.");
        if(table==="castle_fleet"&&!naval&&n>0)throw new Error("قلعه غیربندری نمی‌تواند کشتی داشته باشد.");
        const valueField=(table==="castle_army"||table==="castle_equipment"||table==="castle_fleet")?"count":"level";
        if(table==="castle_army"){
          updates.push(env.DB.prepare("INSERT INTO castle_army(castle,unit_key,count) VALUES(?,?,?) ON CONFLICT(castle,unit_key) DO UPDATE SET count=excluded.count").bind(castle,k,n));
        }else{
          updates.push(env.DB.prepare("UPDATE "+table+" SET "+valueField+"=? WHERE castle=? AND "+keyField+"=?").bind(n,castle,k));
        }
      }
    };

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
    for(const resource of ["grain","fish","meat"]){
      const newValue=Object.prototype.hasOwnProperty.call(res,resource)?Math.floor(Number(res[resource])):oldFoodValues[resource];
      const delta=newValue-oldFoodValues[resource];
      if(delta>0)await consumeFoodDebtCredit(env,castle,resource,delta);
    }
    return json({ok:true});
  }
  if (method==="GET" && path==="/api/my-scenarios") {
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureNarrativeSchema(env); await ensureWarLogSchema(env); await ensureEconomySchema(env);
    const rows=(await env.DB.prepare(`SELECT w.id,w.attacker_username AS attackerUsername,w.source_castle AS sourceCastle,w.destination_castle AS destinationCastle,w.created_at AS createdAt,
      CASE WHEN w.attacker_account_id=? THEN 'attacker' ELSE 'defender' END AS side,
      CASE WHEN w.attacker_account_id=? THEN w.source_castle ELSE w.destination_castle END AS castle
      FROM war_logs w
      WHERE w.command='attack' AND w.cancelled=0
        AND (w.attacker_account_id=? OR EXISTS(SELECT 1 FROM castle_state cs WHERE cs.castle=w.destination_castle AND cs.owner_account_id=?))
      ORDER BY w.created_at DESC`).bind(session.user_id,session.user_id,session.user_id,session.user_id).all()).results;
    const submitted=(await env.DB.prepare("SELECT war_id,side FROM scenario_submissions WHERE submitter_account_id=?").bind(session.user_id).all()).results;
    const sent=new Set(submitted.map(x=>x.war_id+"|"+x.side));
    const items=rows.filter(x=>!sent.has(x.id+"|"+x.side)).map(x=>({
      warId:x.id,attackerUsername:x.attackerUsername,sourceCastle:x.sourceCastle,destinationCastle:x.destinationCastle,createdAt:x.createdAt,
      side:x.side,castle:x.castle,opponentCastle:x.side==="attacker"?x.destinationCastle:x.sourceCastle,lordName:WAR_LORDS[x.castle]||""
    }));
    return json({items});
  }
  if (method==="POST" && path==="/api/scenarios") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!(await rateLimit(request,env,"scenario-submit",20)))return json({error:"تعداد ارسال سناریو زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureNarrativeSchema(env); await ensureWarLogSchema(env); await ensureEconomySchema(env);
    const b=await body(request),warId=String(b.warId||"").trim(),side=String(b.side||"").trim(),castle=String(b.castle||"").trim(),textValue=String(b.text||"").trim();
    if(!warId||!["attacker","defender"].includes(side)||!castle||!textValue)return json({error:"اطلاعات سناریو کامل نیست."},400);
    if(textValue.length>8000)return json({error:"متن سناریو حداکثر ۸۰۰۰ کاراکتر است."},400);
    const war=await env.DB.prepare("SELECT * FROM war_logs WHERE id=? AND command='attack' AND cancelled=0").bind(warId).first();
    if(!war)return json({error:"این حمله برای ارسال سناریو معتبر نیست."},404);
    const castleState=await env.DB.prepare("SELECT owner_account_id FROM castle_state WHERE castle=?").bind(castle).first();
    const isAttacker=war.attacker_account_id===session.user_id&&war.source_castle===castle;
    const isDefender=castleState?.owner_account_id===session.user_id&&war.destination_castle===castle;
    if(side==="attacker"&&!isAttacker)return json({error:"این سناریو متعلق به قلعه مهاجم شما نیست."},403);
    if(side==="defender"&&!isDefender)return json({error:"این سناریو متعلق به قلعه مدافع شما نیست."},403);
    const usernameRow=await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(session.user_id).first();
    try{
      await env.DB.prepare("INSERT INTO scenario_submissions(id,war_id,submitter_account_id,submitter_username,lord_name,castle,side,text,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(newId(),warId,session.user_id,usernameRow?.username||"",WAR_LORDS[castle]||"",castle,side,textValue,new Date().toISOString()).run();
    }catch(e){
      if(String(e?.message||e).toLowerCase().includes("unique"))return json({error:"برای این حمله قبلاً سناریو ارسال کرده‌ای."},409);
      throw e;
    }
    return json({ok:true});
  }
  if (method==="GET" && path==="/api/roles/status") {
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureNarrativeSchema(env);
    const row=await env.DB.prepare("SELECT next_available_at AS nextAvailableAt FROM role_cooldowns WHERE account_id=?").bind(session.user_id).first();
    const next=row?.nextAvailableAt?Date.parse(row.nextAvailableAt):NaN,now=Date.now();
    return json({available:!Number.isFinite(next)||next<=now,nextAvailableAt:Number.isFinite(next)?new Date(next).toISOString():null,remainingSeconds:Number.isFinite(next)&&next>now?Math.ceil((next-now)/1000):0});
  }
  if (method==="POST" && path==="/api/roles") {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!(await rateLimit(request,env,"role-submit",5)))return json({error:"تعداد ارسال رول زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureNarrativeSchema(env); await ensureEconomySchema(env);
    const b=await body(request),castle=String(b.castle||"").trim(),textValue=String(b.text||"").trim();
    if(!castle||!textValue)return json({error:"قلعه و متن رول الزامی است."},400);
    if(textValue.length>8000)return json({error:"متن رول حداکثر ۸۰۰۰ کاراکتر است."},400);
    const state=await requireCastleOwner(request,env,castle); if(!state)return json({error:"این قلعه متعلق به حساب شما نیست."},403);
    const usernameRow=await env.DB.prepare("SELECT username FROM users WHERE id=?").bind(session.user_id).first();
    const now=Date.now(),createdAt=new Date(now).toISOString(),next=new Date(now+48*60*60*1000).toISOString();
    const reserve=env.DB.prepare(`INSERT INTO role_cooldowns(account_id,next_available_at) VALUES(?,?)
      ON CONFLICT(account_id) DO UPDATE SET next_available_at=excluded.next_available_at
      WHERE role_cooldowns.next_available_at<=?`).bind(session.user_id,next,createdAt);
    const insert=env.DB.prepare(`INSERT INTO role_submissions(id,account_id,username,lord_name,castle,text,created_at)
      SELECT ?,?,?,?,?,?,? WHERE EXISTS(
        SELECT 1 FROM role_cooldowns WHERE account_id=? AND next_available_at=?
      )`).bind(newId(),session.user_id,usernameRow?.username||"",WAR_LORDS[castle]||"",castle,textValue,createdAt,session.user_id,next);
    const result=await env.DB.batch([reserve,insert]);
    if(!result[0]?.meta?.changes||!result[1]?.meta?.changes)return json({error:"هر پلیر فقط هر ۴۸ ساعت یک رول می‌تواند ارسال کند.",nextAvailableAt:next},429);
    return json({ok:true,nextAvailableAt:next});
  }
  if (method==="GET" && path==="/api/admin/scenarios") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureNarrativeSchema(env);
    const rows=(await env.DB.prepare("SELECT id,war_id AS warId,submitter_username AS username,lord_name AS lordName,castle,side,text,created_at AS createdAt FROM scenario_submissions ORDER BY created_at DESC").all()).results;
    return json({items:rows});
  }
  if (method==="GET" && path==="/api/admin/roles") {
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureNarrativeSchema(env);
    const rows=(await env.DB.prepare("SELECT id,username,lord_name AS lordName,castle,text,created_at AS createdAt FROM role_submissions ORDER BY created_at DESC").all()).results;
    return json({items:rows});
  }

  if (method==="GET" && path==="/api/admin/war-expeditions") {
    await ensureWarLogSchema(env);if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);const rt=await warRuntime(env);
    const rows=(await env.DB.prepare("SELECT id,attacker_account_id AS attackerAccountId,attacker_username AS attackerUsername,lord_name AS lordName,type,source_castle AS sourceCastle,destination_castle AS destinationCastle,arrival_time AS arrivalTime,is_fake AS fake,created_at AS createdAt,assets_json AS assetsJson,defender_assets_json AS defenderAssetsJson,cancelled,cancelled_at AS cancelledAt,duration_minutes AS durationMinutes,elapsed_seconds AS elapsedSeconds,lord_present AS lordPresent,command,command_at AS commandAt,outcome,casualties_json AS casualtiesJson FROM war_logs ORDER BY created_at DESC").all()).results;
    return json({expeditions:rows.map(x=>({...x,active:warIsActive(x,rt),arrived:!warIsActive(x,rt)&&!x.command&&!Number(x.cancelled)}))});
  }
  if (method==="POST" && path.match(/^\/api\/admin\/war-expeditions\/[^/]+\/cancel$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(!session?.is_admin)return json({error:"دسترسی مدیر لازم است."},401);
    await ensureWarLogSchema(env);
    const id=decodeURIComponent(path.split("/")[4]);
    const row=await env.DB.prepare("SELECT * FROM war_logs WHERE id=?").bind(id).first();
    if(!row)return json({error:"لشکرکشی پیدا نشد."},404);
    if(Number(row.cancelled))return json({error:"این لشکرکشی قبلاً لغو شده است."},409);
    const rt=await warRuntime(env);
    if(!warIsActive(row,rt))return json({error:"زمان رسیدن این لشکرکشی گذشته است."},409);
    const assets=JSON.parse(row.assets_json||"{}"); const updates=[];
    if(!Number(row.is_fake)){
      for(const kind of ["army","equipment","fleet"]){
        for(const [key,raw] of Object.entries(assets[kind]||{})){
          const table=kind==="army"?"castle_army":kind==="equipment"?"castle_equipment":"castle_fleet";
          const field=kind==="army"?"unit_key":kind==="equipment"?"item_key":"ship_key";
          updates.push(env.DB.prepare(`UPDATE ${table} SET count=count+? WHERE castle=? AND ${field}=? AND EXISTS (SELECT 1 FROM war_logs WHERE id=? AND cancelled=0 AND command IS NULL)`).bind(Math.floor(Number(raw)||0),row.source_castle,key,id));
        }
      }
    }
    updates.push(env.DB.prepare("UPDATE war_logs SET cancelled=1,cancelled_at=?,cancelled_by=?,run_started_at=NULL WHERE id=? AND cancelled=0").bind(new Date().toISOString(),"admin",id));
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
  if (method==="GET" && path==="/api/trades/destinations") {
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    await ensureEconomySchema(env);
    const rows=(await env.DB.prepare("SELECT c.castle,c.region,p.house,p.username AS username FROM castle_state c JOIN players p ON p.castle=c.castle AND p.account_id=c.owner_account_id LEFT JOIN users u ON u.id=c.owner_account_id WHERE c.owner_account_id IS NOT NULL AND c.owner_account_id<>? ORDER BY c.region,c.castle").bind(session.user_id).all()).results;
    return json({castles:rows});
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
    if(!(await rateLimit(request,env,"trade-create",60)))return json({error:"تعداد درخواست‌های تجارت زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    await ensureTradeSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const b=await body(request), source=String(b.source||"").trim(), destination=String(b.destination||"").trim();
    const state=await requireCastleOwner(request,env,source); if(!state)return json({error:"قلعه مبدا متعلق به این حساب نیست."},403);
    const sourceRow=source?await env.DB.prepare("SELECT * FROM castle_state WHERE castle=? AND owner_account_id=?").bind(source,session.user_id).first():state;
    if(!sourceRow)return json({error:"قلعه مبدا متعلق به این حساب نیست."},403);
    const sendAssets=tradeAssets(b.sendAssets), receiveAssets=tradeAssets(b.receiveAssets);
    const pendingCount=await env.DB.prepare("SELECT COUNT(*) AS count FROM trade_requests WHERE sender_account_id=? AND status='pending'").bind(session.user_id).first();
    if(Number(pendingCount?.count||0)>=20)return json({error:"حداکثر ۲۰ درخواست تجارت همزمان برای این حساب مجاز است."},429);
    if(!destination || destination===sourceRow.castle)return json({error:"مقصد تجارت را انتخاب کن."},400);
    if(!hasAssets(sendAssets)||!hasAssets(receiveAssets))return json({error:"حداقل یک کالا برای ارسال و یک کالا برای دریافت انتخاب کن."},400);
    const dest=await env.DB.prepare("SELECT castle,owner_account_id AS accountId FROM castle_state WHERE castle=?").bind(destination).first();
    if(!dest?.accountId || dest.accountId===session.user_id)return json({error:"مقصد باید قلعه ثبت‌شده یک بازیکن دیگر باشد."},400);
    if(await castleTradeBlocked(env,sourceRow.castle) || await castleTradeBlocked(env,destination))return json({error:"این قلعه درگیر حمله یا محاصره است و امکان تجارت ندارد."},423);
    for(const [k,v] of Object.entries(sendAssets))if(Number(sourceRow[k]||0)<v)return json({error:"موجودی کافی برای کالاهای ارسالی نیست."},400);
    const id=newId();
    await env.DB.prepare("INSERT INTO trade_requests(id,sender_account_id,sender_castle,receiver_account_id,receiver_castle,send_assets_json,receive_assets_json,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,session.user_id,sourceRow.castle,dest.accountId,destination,JSON.stringify(sendAssets),JSON.stringify(receiveAssets),"pending",new Date().toISOString()).run();
    return json({ok:true,id});
  }
  if (method==="POST" && path.match(/^\/api\/trades\/[^/]+\/respond$/)) {
    if(!sameOrigin(request))return json({error:"درخواست نامعتبر است."},403);
    if(await isGameControlLocked(env,"trade"))return json({error:"تجارت فعلاً توسط ادمین قفل شده است."},423);
    if(!(await rateLimit(request,env,"trade-response",60)))return json({error:"تعداد درخواست‌های پاسخ تجارت زیاد است. کمی بعد دوباره تلاش کن."},429,{"retry-after":"900"});
    await ensureTradeSchema(env);
    const session=await requireUser(request,env); if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
    const id=decodeURIComponent(path.split("/")[3]), action=String((await body(request)).action||"");
    if(!["accept","reject"].includes(action))return json({error:"عملیات تجارت معتبر نیست."},400);
    const row=await env.DB.prepare("SELECT * FROM trade_requests WHERE id=? AND receiver_account_id=? AND status='pending'").bind(id,session.user_id).first();
    if(!row)return json({error:"درخواست تجارت پیدا نشد."},404);
    if(action==="reject"){const result=await env.DB.prepare("UPDATE trade_requests SET status='rejected',responded_at=? WHERE id=? AND status='pending'").bind(new Date().toISOString(),id).run();if(!result.meta?.changes)return json({error:"درخواست تجارت قبلاً پاسخ داده شده است."},409);return json({ok:true});}
    const sendAssets=JSON.parse(row.send_assets_json||"{}"), receiveAssets=JSON.parse(row.receive_assets_json||"{}");
    const sender=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=? AND owner_account_id=?").bind(row.sender_castle,row.sender_account_id).first();
    const receiver=await env.DB.prepare("SELECT * FROM castle_state WHERE castle=? AND owner_account_id=?").bind(row.receiver_castle,row.receiver_account_id).first();
    if(!sender||!receiver)return json({error:"یکی از قلعه‌های این تجارت دیگر معتبر نیست."},409);
    if(await castleTradeBlocked(env,row.sender_castle) || await castleTradeBlocked(env,row.receiver_castle))return json({error:"این تجارت به دلیل حمله یا محاصره قلعه مقصد/مبدا قابل انجام نیست."},423);
    for(const [k,v] of Object.entries(sendAssets))if(Number(sender[k]||0)<v)return json({error:"موجودی فرستنده برای این تجارت کافی نیست."},409);
    for(const [k,v] of Object.entries(receiveAssets))if(Number(receiver[k]||0)<v)return json({error:"موجودی گیرنده برای کالای پیشنهادی کافی نیست."},409);
    const keys=[...new Set([...Object.keys(sendAssets),...Object.keys(receiveAssets)])];
    const senderSets=[],receiverSets=[],senderBinds=[],receiverBinds=[],senderPost=[],receiverPost=[];
    for(const k of keys){
      const s=Number(sendAssets[k]||0),r=Number(receiveAssets[k]||0);
      senderSets.push(k+"="+k+"-?");senderBinds.push(s-r);
      receiverSets.push(k+"="+k+"-?");receiverBinds.push(r-s);
      senderPost.push(k+"=?");receiverPost.push(k+"=?");
    }
    const senderWhere=keys.map(k=>k+">=?").join(" AND "), receiverWhere=keys.map(k=>k+">=?").join(" AND ");
    const pending="EXISTS (SELECT 1 FROM trade_requests WHERE id=? AND status='pending')";
    const q1=env.DB.prepare(`UPDATE castle_state SET ${senderSets.join(",")} WHERE castle=? AND ${senderWhere} AND ${pending}`).bind(...senderBinds,row.sender_castle,...keys.map(k=>Number(sendAssets[k]||0)),id);
    const q2=env.DB.prepare(`UPDATE castle_state SET ${receiverSets.join(",")} WHERE castle=? AND ${receiverWhere} AND ${pending}`).bind(...receiverBinds,row.receiver_castle,...keys.map(k=>Number(receiveAssets[k]||0)),id);
    const senderExpected=keys.map(k=>Number(sender[k]||0)-Number(sendAssets[k]||0)+Number(receiveAssets[k]||0)),receiverExpected=keys.map(k=>Number(receiver[k]||0)-Number(receiveAssets[k]||0)+Number(sendAssets[k]||0));
    const q3=env.DB.prepare(`UPDATE trade_requests SET status='accepted',responded_at=? WHERE id=? AND status='pending' AND EXISTS (SELECT 1 FROM castle_state WHERE castle=? AND ${senderPost.join(" AND ")}) AND EXISTS (SELECT 1 FROM castle_state WHERE castle=? AND ${receiverPost.join(" AND ")})`).bind(new Date().toISOString(),id,row.sender_castle,...senderExpected,row.receiver_castle,...receiverExpected);
    const result=await env.DB.batch([q1,q2,q3]);
    if(!result[0]?.meta?.changes||!result[1]?.meta?.changes||!result[2]?.meta?.changes)return json({error:"تجارت همزمان تغییر کرده؛ دوباره تلاش کن."},409);
    for(const [resource,amount] of Object.entries(receiveAssets))if(["grain","fish","meat"].includes(resource)&&Number(amount)>0)await consumeFoodDebtCredit(env,row.sender_castle,resource,amount);
    for(const [resource,amount] of Object.entries(sendAssets))if(["grain","fish","meat"].includes(resource)&&Number(amount)>0)await consumeFoodDebtCredit(env,row.receiver_castle,resource,amount);
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
  async fetch(request, env, ctx) {
    const url=new URL(request.url);
    try {
      if(url.pathname==="/api/realtime"){
        if(request.method!=="GET")return json({error:"Method Not Allowed"},405);
        if(request.headers.get("Upgrade")!=="websocket")return json({error:"WebSocket لازم است."},426);
        const session=await requireUser(request,env);
        if(!session)return json({error:"ابتدا وارد حساب شوید."},401);
        const id=env.REALTIME.idFromName("global");
        return env.REALTIME.get(id).fetch(new Request("https://realtime/connect",{method:"GET",headers:request.headers}));
      }
      if(url.pathname.startsWith("/api/")){
        if(url.pathname==="/api/auth/status"||url.pathname==="/api/auth/login"||url.pathname==="/api/auth/register")await cleanupExpiredSessions(env);
        const response=await handleApi(request,env,url);
        if(request.method!=="GET" && response.ok && shouldBroadcastRealtime(url.pathname))ctx.waitUntil(broadcastRealtime(env,{type:"game_update",path:url.pathname,at:Date.now()}));
        return response;
      }
      const characterImage = await serveCharacterImage(request, env, url);
      if(characterImage) return characterImage;
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch(e) { console.error(e); return json({error:e?.status ? e.message : "خطای داخلی سرور رخ داد."},e?.status || 500); }
  }
};