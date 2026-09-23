// Cloudflare Worker entry point
// The application implementation lives in src/worker/index.js.
// Keeping this small root entry preserves the existing Wrangler configuration.

export { default } from "./src/worker/index.js";
