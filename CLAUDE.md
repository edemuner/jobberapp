## Project Description

**Jobberapp** is a personal study project (microservices/Node.js learning path) implementing a Fiverr-style gig marketplace: sellers list gigs, buyers purchase them.

### Intended architecture
- An API gateway in front of independently deployable services, communicating cross-service via RabbitMQ events (e.g. order placed → notification service emails the buyer) and via direct HTTP for gateway-to-service calls.
- Services follow a numbered directory convention (`2-notification-service`, `9-jobber-shared`, ...), implying slots for: gateway, authentication, users/buyer, gig, order, review, notification, and a shared library — numbers 1 and 3-8 are reserved for services not yet started.
- **Currently implemented**: `2-notification-service` and `9-jobber-shared` have code; `1-gateway-service` now has a working entrypoint — `app.ts` creates an Express app and starts a `GatewayServer` (mirrors notification-service's `app.ts`/`start()` pattern). `config.ts`/`logger.ts` follow notification-service's pattern (`jobberConfig` singleton, `Logger` from jobber-shared). `server.ts`'s `GatewayServer.start()` orchestrates security middleware (`cookie-session`, `hpp`, `helmet`, `cors`), standard middleware (`compression`, JSON/urlencoded body parsing), a 404 + `CustomError`-aware error handler, and now actually binds an `http.Server` to `SERVER_PORT` (4000) via `startServer`/`startHttpServer`. Still unimplemented in gateway: routes (`routesMiddleware` is a stub) and the Elasticsearch health check (`startElasticSearch` is a stub). Everything else beyond these three services is inferred intent — from `jobber-shared`'s domain interfaces (`auth`, `buyer`, `seller`, `gig`, `order`, `review`, `chat`, `search`) and the `verifyGatewayRequest` service whitelist (`auth`, `seller`, `gig`, `search`, `order`, `buyer`, `message`, `review`).

### Shared library — `9-jobber-shared` (published as `@edemuner/jobber-shared`)
- Published to GitHub Packages via CI on push to `main` (patch-bumped automatically); consumed by services as a real npm dependency, not a workspace symlink — so a change here doesn't reach other services until it's published and their `package.json` is bumped.
- Flat `src/`, exporting: per-entity domain interfaces (auth/buyer/seller/gig/order/review/chat/search/email), a `CustomError` class hierarchy (`BadRequestError`, `NotFoundError`, `NotAuthorizedError`, `FileTooLargeError`, `ServerError`) built on `http-status-codes`, a `verifyGatewayRequest` Express middleware (JWT-based gateway token check), a `Logger` class (`new Logger(elasticSearchNode, serviceName, level)`, Winston + Elasticsearch transport) whose `.for(moduleName)` returns a winston child logger, generic string helpers, and Cloudinary upload helpers.

### Tech stack
- TypeScript on Node.js; Express for HTTP (v4 in notification-service, though jobber-shared's typings target Express v5 — worth reconciling later).
- Messaging: RabbitMQ via `amqplib` — direct exchanges, durable queues, routing-key bindings per event type (e.g. `jobber-email-notification`/`auth-email`, `jobber-order-notification`/`order-email`).
- Datastores (via Docker Compose): MongoDB, MySQL, PostgreSQL, Redis — polyglot persistence, presumably one store per future service.
- Observability: Elasticsearch + Kibana, fed by Winston's Elasticsearch transport.
- Email (scaffolded, not yet wired up): `nodemailer` + `email-templates` (ejs templating).
- Media uploads: Cloudinary, via jobber-shared helpers.
- Local dev infra: root `docker-compose.yaml` runs all datastores/messaging/observability; each service has its own `dev` script (nodemon + ts-node path registration).

### Patterns observed in the code
- Config: `dotenv` + a singleton `Config` class instance exported once (`export const jobberConfig = new Config()`) — not raw `process.env` access scattered through the code.
- Logging: each service constructs one `Logger` instance in its own `src/logger.ts` (composition root, using that service's `jobberConfig`), exported and imported by every other module. Individual modules call `logger.for('moduleName')` to get a winston child logger — this tags logs with both `service` (the actual service name, set once at construction) and `module` (per call site) as separate structured Elasticsearch fields, instead of one file per module each opening its own Elasticsearch transport connection.
- RabbitMQ consumers: assert exchange → assert durable queue → bind with routing key → `channel.consume(...)`, repeated per event type.
- TypeScript path aliases (e.g. `@notifications/*`) via `typescript-transform-paths`/`tsc-alias`, used inconsistently alongside relative imports — check which style a given file already uses before adding new imports.

## RULES

1. This entire project (jobberapp — every subdirectory, including `2-notification-service`, `9-jobber-shared`, and any future numbered service) is exempt from the global feat/[ticketID] / fix/[ticketID] branch requirement, since it's a personal study project with no ticket tracking — commits can be made directly to `main`.
2. Keep the "Project Description" section above current — after any significant change (new service started, new dependency/technology adopted, architecture or pattern shift), the responsible agent must update it to reflect the new state, rather than letting it drift from the code.
3. Commit messages must follow Conventional Commits (`<type>[optional scope]: <description>`, e.g. `feat(notification-service): wire auth-email consumer to sendEmail`) — types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`, `perf`, `style`.

## Teaching style

This is a personal study project (part of a microservices/Node.js learning path). When working here, prioritize helping the user learn over just shipping code:

2. Explain the "why" — when writing or changing code, briefly explain the reasoning behind non-obvious choices (design patterns, TypeScript quirks, Express/Node idioms), not just what the code does.
3. Flag teachable moments — if a change touches a concept worth understanding (e.g. middleware chaining, type narrowing, error class hierarchies), call it out even if not asked directly.
4. Prefer explaining over silently fixing — for bugs or design issues, explain the root cause and trade-offs of possible fixes before applying one, unless told to just fix it.
5. Encourage questions — invite the user to ask "why" or "how" about anything unclear, and answer at a level assuming they're building foundational knowledge, not just senior-level shorthand.
6. Still be concise — teaching doesn't mean lecturing; keep explanations tight and relevant to the change at hand.
