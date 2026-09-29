import { DurableObject } from "cloudflare:workers";

/**
 * Global realtime Durable Object.
 * Keep transport concerns here; application code should call broadcastRealtime().
 */
export class RealtimeHub extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/broadcast") {
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
      const message = await request.text();
      for (const ws of this.ctx.getWebSockets()) {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(message); } catch {}
        }
      }
      return new Response("ok");
    }

    if (url.pathname === "/connect") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ connectedAt: Date.now() });
      server.send(JSON.stringify({ type: "connected" }));
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Not found", { status: 404 });
  }

  webSocketMessage(ws, message) {
    if (typeof message === "string" && message === "ping") ws.send("pong");
  }

  webSocketClose(ws, code, reason) {
    try { ws.close(code, reason); } catch {}
  }

  webSocketError(ws, error) {
    console.error("realtime websocket error", error);
  }
}

export function shouldBroadcastRealtime(path) {
  return path === "/api/register" ||
    path === "/api/scenarios" ||
    path === "/api/roles" ||
    path === "/api/trades" ||
    /^\/api\/trades\/[^/]+\/respond$/.test(path) ||
    path === "/api/war-expeditions" ||
    /^\/api\/war-expeditions\/[^/]+\/cancel$/.test(path) ||
    path.startsWith("/api/my-castle/") ||
    path === "/api/admin/weekly-update" ||
    path === "/api/admin/controls" ||
    path === "/api/admin/game-runtime" ||
    path === "/api/admin/castle-assets" ||
    path.startsWith("/api/admin/war-expeditions/") ||
    /^\/api\/admin\/players(?:\/[^/]+)?$/.test(path) ||
    /^\/api\/admin\/castles(?:\/[^/]+)?$/.test(path);
}

export async function broadcastRealtime(env, payload) {
  try {
    if (!env.REALTIME) return;
    const id = env.REALTIME.idFromName("global");
    await env.REALTIME.get(id).fetch("https://realtime/broadcast", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("realtime broadcast failed", error);
  }
}
