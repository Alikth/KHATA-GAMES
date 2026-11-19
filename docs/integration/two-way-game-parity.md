# Two-way game parity: architecture and data mapping

Status: implementation in progress. The Worker now exposes a private bot service API, assignment mirror, castle snapshots, durable D1 change capture and idempotent building/camp upgrades. No live data has been migrated, overwritten, or deleted.

## Non-negotiable constraints

- Cloudflare D1 (website) and PostgreSQL (bot) remain separate databases.
- The website and Telegram bot must expose the same player/admin game capabilities and enforce the same rules.
- No bot account-registration or website-account-linking flow is introduced.
- The superuser continues assigning a Telegram numeric user ID to a castle through `set lord`.
- Existing website accounts and their ownership data are not rewritten by this integration.
- A bot action must be visible on the website, and a website action must be visible in the bot after synchronization.
- Battle outcomes remain admin-adjudicated; no automatic winner selection is introduced.

## Verified current state

### Website (Cloudflare D1)

The website Worker is in `src/worker/index.js`; rules are in `src/worker/data/game-rules.js`. The Worker uses session-based website authentication (`requireUser`) for player routes. Economy schema in `migrations/0002_castle_economy.sql` includes:

- `castle_state`: castle identity, region, owner account and economic balances, workshop/port and special item fields.
- `castle_production`, `castle_camps`, `castle_special_camps`.
- `castle_army`, `castle_equipment`, `castle_fleet`.
- `castle_week_state`, `game_week_runs`, `castle_equipment_limits`.

Other Worker-managed domains include trade requests, war logs/expeditions, garrisons, alliances, scenarios, runtime controls and notifications. The Worker broadcasts realtime UI updates, but this is not a durable cross-database synchronization mechanism.

### Telegram bot (PostgreSQL)

The bot has `lords`, `castles`, `group_registrations`, `resource_balances`, `castle_production`, `castle_camps`, `castle_special_camps`, `castle_army`, `castle_equipment`, `castle_fleet`, `castle_economy_state`, `trade_offers`, `war_expeditions`, `military_alliances`, `garrison_assets`, `war_scenarios`, `troop_transfer_requests`, `game_events`, and `admin_audit_logs`.

Current `create_lord` seeds a second starting inventory in PostgreSQL. The bot's engine contains a static `site_catalog.json` snapshot and its own economy/war/trade logic. This is a source of drift unless every mutation is synchronized and rule versions are controlled.

### Confirmed parity defects

1. Bot `menu:assets` reads only `ResourceBalance`; it does not provide the website's complete castle inventory view.
2. Bot upgrade logic operates on PostgreSQL and has no website-equivalent complete interactive upgrade flow.
3. Bot `weekly_settlement` processes the first active Lord for a castle, while website settlement is castle-state based. The bot's food-debt casualty helper exists but is not called by the normal overdue-debt settlement cycle.
4. Bot `_is_admin_actor` requires owner ID + exact admin group ID + group chat. The owner is therefore not treated as admin in private chat or another player group.
5. Website player APIs require website sessions; the bot has no service-to-service API authentication yet.
6. Website and bot trade/war records are separate and have no durable cross-database event stream.
7. Website ownership currently uses `owner_account_id`; bot ownership uses `telegram_user_id -> Lord -> Castle`. The integration must not silently equate website account IDs with Telegram IDs.

## Data mapping (logical aggregates)

| Game aggregate | D1 website storage | PostgreSQL bot storage | Integration treatment |
|---|---|---|---|
| Castle identity/catalog | `castle_state`, game catalog, dynamic castle tables | `castles` | Match by exact canonical castle name; validate region/catalog; retain each DB's local PK |
| Telegram lord assignment | No native Telegram numeric identity in current player ownership model | `lords.telegram_user_id`, `lords.castle_id` | Keep assignment in bot; send signed castle + Telegram actor context to Worker; no account-link flow |
| Group-to-castle | Website group features/account model | `group_registrations` | Bot-only Telegram metadata; not a game-state aggregate |
| Resources and food debt | `castle_state` plus food-debt fields/schema | `resource_balances`, `castle_economy_state` | Same castle/resource keys; D1 and PG each keep local copies; versioned event replication |
| Production | `castle_production` | `castle_production` | Same key/level; rules version and mutation event |
| General/special camps | `castle_camps`, `castle_special_camps` | `castle_camps`, `castle_special_camps` | Same key/level; rules version and mutation event |
| Army | `castle_army` | `castle_army` | Same unit key/count; preserve garrison/expedition reservations separately |
| Equipment/fleet | `castle_equipment`, `castle_fleet` | `castle_equipment`, `castle_fleet` | Same item/ship key/count; equipment limits and port/workshop state also replicated |
| Workshop/port/special assets | `castle_state` and related tables | `castle_economy_state`, `castle_assets` | Explicit field mapping required; no implicit defaults |
| Trade | `trade_requests` and related D1 trade state | `trade_offers` | Map by immutable external operation ID; preserve each DB's local numeric ID |
| War/expedition | `war_logs` and related D1 war tables | `war_expeditions`, `war_scenarios`, `troop_transfer_requests` | Map by immutable external operation ID; preserve admin adjudication |
| Alliance/garrison | D1 alliance/garrison tables | `military_alliances`, `garrison_assets` | Map by canonical castle and external operation IDs |
| Admin audit | Website admin/audit records | `admin_audit_logs` | Keep local audit records and share correlation ID |
| Telegram settings | Not applicable | `game_settings`, `game_state` | Remain bot-specific unless a setting is explicitly shared |

## Synchronization design

Use a durable, at-least-once event/outbox pattern; do not attempt a distributed SQL transaction across D1 and PostgreSQL.

1. Each logical game mutation receives a globally unique `operation_id`, a `correlation_id`, actor identity, castle key, aggregate type, payload schema version, rules version and expected aggregate version.
2. The system accepting the mutation validates ownership/role, game rules, siege/lock state, available assets and concurrency version before applying it.
3. The mutation and its local outbox record are committed together in the source database.
4. The other application pulls pending events, applies each event in a local transaction with an inbox uniqueness constraint on `operation_id`, and acknowledges only after commit.
5. Retries are safe: the same operation ID never applies twice.
6. Per-castle aggregate versions and compare-and-swap checks prevent stale snapshots from overwriting newer state.
7. Reconciliation compares canonical aggregate snapshots and event positions. It reports conflicts; it does not silently choose a winner or overwrite either DB.
8. On prolonged outage, the outbox remains pending and resumes from the last acknowledged cursor.

### Direction and ownership of mutations

- Website-originated actions: D1 validates and commits the game operation; its outbox is consumed by the bot to update PostgreSQL.
- Bot-originated actions: the bot authenticates the Telegram actor using its existing `set lord` assignment, calls a private Worker service endpoint, and the Worker validates the assignment context and game rules before committing to D1. The resulting outbox event updates PostgreSQL.
- PostgreSQL remains an independent persistent bot-side game replica and Telegram metadata store. It is not deleted or merged into D1.
- D1 remains an independent persistent website-side game store. It is not deleted or merged into PostgreSQL.
- The Worker is the shared validation/command boundary for bot-originated game writes; website routes must be refactored to use the same domain rule functions or equivalent versioned rule definitions. Do not maintain two divergent implementations.

## Required schema additions (planned, not yet applied)

### D1
- `integration_outbox`: operation ID, event type, aggregate key/version, payload, rules/schema version, created/delivered timestamps.
- `integration_bot_assignments`: Telegram numeric ID, canonical castle name, active/revoked state, assignment metadata. This mirrors the superuser's `set lord` assignment; it is not a website login or account-link table.
- `integration_sync_cursors` / consumer acknowledgements.
- Unique operation/inbox constraints for idempotent bot-originated commands.

### PostgreSQL
- `integration_outbox` for bot-originated metadata/commands where required.
- `integration_inbox` with unique `operation_id`.
- `integration_sync_state` for D1 event cursor and schema/rules compatibility.
- External operation IDs on trade/war records, added nullable first and backfilled only after a reconciliation report.
- Aggregate version tracking for mirrored castle state.

No live schema migration or data copy is part of this audit document.

## Safe rollout sequence

1. Finish full schema and route inventory for both repositories.
2. Produce read-only reconciliation report for all castles and all shared aggregates.
3. Add integration schema and service authentication behind disabled feature flags.
4. Implement read-only snapshot APIs and verify mapping without changing player data.
5. Implement durable event delivery and idempotent inbox/outbox processing.
6. Enable one low-risk read path and verify both databases remain consistent.
7. Enable bot-originated mutations by domain, then website-originated event replication.
8. Migrate assets/buildings/camps/economy, then trade, then war.
9. Run concurrency, retry, outage/recovery, and reconciliation tests.
10. Enable production sync only after parity tests pass.

## Safety rules

- Never fetch, print, commit, or replace `.env` or live credentials.
- Never overwrite existing castle balances with starting defaults during `set lord`.
- Never auto-resolve conflicting snapshots by last-write-wins.
- Never merge either repository's branch into `main` without explicit approval.
- Keep the existing Telegram proxy PR separate from game-parity changes; verify its current status before merging.


## Implemented on the feature branch

- Added private `/api/integration/v1/*` routes authenticated by the Cloudflare `BOT_API_SECRET`.
- Added superuser-managed Telegram-to-castle assignment mirror; this is not website account linking.
- Added assigned-lord castle snapshot reads.
- Added D1 outbox table and triggers for resource, production, camp, army, equipment, fleet and food-debt mutations.
- Added event cursor, event acknowledgement (automatic deletion is intentionally disabled until backup/reconciliation cursors are implemented).
- Added bot-originated production/camp upgrade endpoint with siege checks and idempotent operation IDs.
- Strengthened the shared upgrade helper so the resource deduction and level increment are conditional on the same expected state.
- Added D1 migration `0006_bot_integration.sql`.
- Latest Wrangler dry-run bundle validation passed.

## Required before deployment

- Set `BOT_API_SECRET` as a Cloudflare Worker secret.
- Configure the same secret in the bot's private `.env` as `SITE_API_SECRET`, and set `SITE_API_URL`.
- Apply D1 migration after a verified D1 backup; PostgreSQL migration is separately maintained in the bot repository.
- Verify a test lord assignment, full snapshot, website-side change propagation and bot-side upgrade using a non-production test castle.

## Remaining parity work

- Trade operations, warfare, alliances, garrisons, scenarios and troop transfers are not yet routed through the service API.
- Workshop, port, equipment construction and administrative asset mutations still need bot service commands.
- Full castle reconciliation and explicit conflict resolution are still required before any bulk synchronization.
- Live D1/PostgreSQL end-to-end tests and production deployment have not been performed.
