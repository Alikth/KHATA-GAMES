# Worker modules

This directory is the target boundary for the incremental worker refactor.

Refactor rule: preserve API behavior and game rules first; move code without changing semantics. Each extracted module should receive its dependencies explicitly and must not access global request state implicitly.

Planned boundaries:
- auth: authentication/session handlers
- economy: castle/resources/production
- war: expedition/combat/runtime
- trade: trade lifecycle
- admin: admin handlers and controls
- game: scenarios/roles/player-facing game flows
- db: schema and database helpers
- realtime: Durable Object and broadcast helpers

The first refactor commits may add boundaries before moving behavior. This keeps each step reviewable and reversible.
