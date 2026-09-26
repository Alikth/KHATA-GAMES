// Cloudflare Worker entry point
// The application implementation lives in src/worker/index.js.
// Keeping this small root entry preserves the existing Wrangler configuration.
import app, { RealtimeHub } from "./src/worker/index.js";

const COMMAND_WINDOW_MS = 90 * 60 * 1000;

function legacyArrivalMs(createdAt, arrivalTime) {
  const base = new Date(createdAt || 0);
  const m = /^(\d{2}):(\d{2})$/.exec(String(arrivalTime || ""));
  if (!m || Number.isNaN(base.getTime())) return null;
  const d = new Date(base);
  d.setUTCHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() <= base.getTime()) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}

function arrivalMs(row, now = Date.now()) {
  const duration = Number(row.duration_minutes ?? row.durationMinutes ?? 0) * 60;
  if (duration > 0) {
    const elapsed = Number(row.elapsed_seconds ?? row.elapsedSeconds ?? 0);
    const runStarted = Date.parse(row.run_started_at ?? row.runStartedAt ?? "");
    if (elapsed >= duration) {
      if (Number.isFinite(runStarted)) return runStarted + (duration - elapsed) * 1000;
      const created = Date.parse(row.created_at ?? row.createdAt ?? "");
      return Number.isFinite(created) ? created + duration * 1000 : null;
    }
    if (Number.isFinite(runStarted)) return now + (duration - elapsed) * 1000;
    return null;
  }
  return legacyArrivalMs(row.created_at ?? row.createdAt, row.arrival_time ?? row.arrivalTime);
}

function commandExpiresAt(row, now = Date.now()) {
  const arrival = arrivalMs(row, now);
  return arrival == null ? null : arrival + COMMAND_WINDOW_MS;
}

async function getWarRow(env, id) {
  try {
    return await env.DB.prepare("SELECT id,created_at,duration_minutes,elapsed_seconds,run_started_at,arrival_time,cancelled,command FROM war_logs WHERE id=?").bind(id).first();
  } catch {
    return null;
  }
}

async function guardCommandWindow(env, id) {
  const row = await getWarRow(env, id);
  if (!row || Number(row.cancelled) || row.command) return null;
  const expires = commandExpiresAt(row);
  if (expires != null && Date.now() >= expires) {
    return new Response(JSON.stringify({error:"مهلت ۹۰ دقیقه‌ای ارسال دستور این لشکرکشی تمام شده است."}), {
      status: 410,
      headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
    });
  }
  return null;
}

async function augmentActiveResponse(response) {
  try {
    if (!response.ok) return response;
    const data = await response.clone().json();
    if (!Array.isArray(data.expeditions)) return response;
    const now = Date.now();
    const expeditions = data.expeditions.map(row => {
      const expires = commandExpiresAt(row, now);
      return {
        ...row,
        commandExpiresAt: expires ? new Date(expires).toISOString() : null,
        commandExpired: !!(expires && now >= expires)
      };
    });
    const headers = new Headers(response.headers);
    headers.set("cache-control", "no-store");
    return new Response(JSON.stringify({...data, expeditions}), {status:response.status, headers});
  } catch {
    return response;
  }
}

const wrapped = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const commandMatch = url.pathname.match(/^\/api\/war-expeditions\/([^/]+)\/command$/);
    if (request.method === "POST" && commandMatch) {
      const blocked = await guardCommandWindow(env, decodeURIComponent(commandMatch[1]));
      if (blocked) return blocked;
    }

    const response = await app.fetch(request, env, ctx);
    if (request.method === "GET" && url.pathname === "/api/my-war-expeditions/active") {
      return augmentActiveResponse(response);
    }
    return response;
  }
};

export { RealtimeHub };
export default wrapped;
