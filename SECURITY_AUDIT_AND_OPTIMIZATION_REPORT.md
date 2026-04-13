# Security Audit and Optimization Report

Date: 2026-04-13
Project: PlanYt SaaS (Next.js App Router + Clerk + Prisma/PostgreSQL)

## Scope
This audit reviewed authentication, authorization, API safety, database access patterns, input validation, XSS/CSRF risks, abuse prevention, YouTube embed safety, headers/CSP, secret handling, and deployment readiness.

## Executive Summary
The app already had strong ownership checks in most API routes and relied on Prisma (which is SQL-injection safe when used as in this codebase). However, there were critical and medium-risk gaps in CSRF protection, request abuse control, and one authorization ordering issue in the playlist page.

All fixes were applied without changing product behavior.

---

## Vulnerabilities Found and Fixes Applied

### 1) Authorization Ordering Issue in Playlist Page (High)
Risk:
- The page logic for /playlists/[playlistId] ran sync and metadata update operations before confirming the playlist belongs to the logged-in user.
- A guessed playlist id could trigger background work for another user’s playlist.

Fix:
- Added ownership validation first, then execute sync/update logic only for owned playlists.

File changed:
- src/app/(dashboard)/playlists/[playlistId]/page.tsx

Effect:
- Prevents unauthorized data touching while keeping same UI/UX behavior.

---

### 2) Missing CSRF Protection on Mutating API Routes (High)
Risk:
- State-changing endpoints accepted cross-site requests without origin verification.

Fix:
- Added same-origin validation helper and enforced it on all POST/PATCH/PUT/DELETE routes.

Files changed:
- src/lib/security.ts
- src/app/api/playlists/route.ts
- src/app/api/playlists/[playlistId]/route.ts
- src/app/api/playlists/[playlistId]/goal/route.ts
- src/app/api/playlists/[playlistId]/videos/route.ts
- src/app/api/playlists/[playlistId]/videos/reorder/route.ts
- src/app/api/playlists/[playlistId]/videos/[videoId]/route.ts
- src/app/api/playlists/[playlistId]/videos/[videoId]/position/route.ts

Effect:
- Blocks cross-site mutation attempts while preserving normal browser app requests.

---

### 3) No Rate Limiting on Sensitive Endpoints (Medium)
Risk:
- Endpoints for creating/updating/deleting/reordering/progress tracking could be spammed.

Fix:
- Added in-memory rate limiter utility with per-endpoint keying and Retry-After handling.
- Applied tailored limits for create/update/delete/reorder/progress events.

Files changed:
- src/lib/security.ts
- All mutating API route files listed above

Effect:
- Reduces abuse and accidental floods; normal user behavior remains unaffected.

Note:
- In-memory limiter is a baseline protection. For multi-instance production, use Redis/KV-backed global limiting.

---

### 4) Unsafe JSON Parsing and Internal Error Leakage Risk (Medium)
Risk:
- request.json() could throw and bubble to framework-level errors.
- Some routes lacked final safe error responses.

Fix:
- Added safe JSON parsing helper and explicit invalid JSON handling.
- Wrapped DB mutation blocks with stable non-sensitive error responses.

Files changed:
- src/lib/security.ts
- Mutating API route files

Effect:
- Fewer uncaught runtime failures and less internal detail exposure to clients.

---

### 5) Insufficient Input Hardening for User Text Fields (Medium)
Risk:
- Title and notes accepted raw text (including control chars).
- React escapes output, but sanitizing input is still recommended defense-in-depth.

Fix:
- Added sanitizePlainText and integrated into Zod schemas for playlist title and notes.
- Added dedicated updatePlaylistSchema for PATCH /api/playlists/[playlistId].

Files changed:
- src/lib/security.ts
- src/lib/validators.ts
- src/app/api/playlists/[playlistId]/route.ts

Effect:
- Cleaner stored content and reduced injection surface without changing UX.

---

### 6) Missing Baseline Security Headers and CSP (Medium)
Risk:
- Security headers were not explicitly configured.

Fix:
- Added security headers in Next config:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
  - Strict-Transport-Security (production only)
- Disabled x-powered-by via poweredByHeader: false.

File changed:
- next.config.ts

Effect:
- Better browser-enforced hardening against clickjacking, MIME sniffing, and unsafe resource loading.

---

### 7) Secret Hygiene in Example Environment File (Low)
Risk:
- .env.example contained a realistic-looking API key value.

Fix:
- Replaced with explicit placeholder value.

File changed:
- .env.example

Effect:
- Prevents accidental secret leakage patterns.

---

## Existing Security Strengths Confirmed

1. Authentication and authorization:
- Clerk auth is used and protected routes are enforced in middleware.
- API routes consistently require authenticated users.
- Ownership checks are present across playlist/video API operations.

2. Database injection safety:
- Prisma query builder is used (no raw SQL in audited paths).

3. YouTube URL handling:
- Video ids are extracted/validated against known YouTube patterns.
- Embed and metadata flows are constrained to YouTube ids.

---

## Production Readiness Checks

Lint result:
- No security-related lint errors.
- One unrelated warning remains in src/app/page.tsx (unused variable: testimonials).

Build result:
- Production build succeeds.

Status:
- Security hardening is production-ready for a single-instance baseline.
- Recommended next step for scale: distributed rate limiter (Redis/KV) and central audit logging sink.

---

## What Was Not Changed (By Design)

- Core business logic and UX flows were kept intact:
  - Clerk auth flow
  - Playlist create/edit/delete
  - YouTube embed and metadata flow
  - Mark watched (manual + automatic)
  - Progress tracking
  - Goal setting
  - Dashboard behavior

- No feature-level behavior changes were introduced.

---

## Best Practices Added

1. Defense-in-depth request handling:
- CSRF origin checks
- Rate limiting
- Safe JSON parsing
- Stable error responses

2. Input lifecycle hardening:
- Schema-level sanitization for user text inputs

3. Browser policy hardening:
- CSP and security headers

4. Secret hygiene:
- Placeholder-only example env values

---

## Final Checklist

- [x] Authentication verified
- [x] Authorization and ownership checks enforced
- [x] Mutating APIs protected against CSRF
- [x] Input validation and sanitization strengthened
- [x] SQL injection risk checked (safe Prisma usage)
- [x] Basic rate limiting added
- [x] YouTube id/url handling constrained
- [x] Security headers and CSP added
- [x] Env example key hygiene improved
- [x] Build passes for deployment

---

## Recommended Follow-up (Scaling)

1. Replace in-memory limiter with Redis/KV global limiter.
2. Add centralized security audit logs for blocked CSRF/rate-limit events.
3. Add automated security tests for API authz/CSRF/rate-limit scenarios.
4. Rotate all real environment secrets and ensure production secrets are stored in Vercel project settings only.
