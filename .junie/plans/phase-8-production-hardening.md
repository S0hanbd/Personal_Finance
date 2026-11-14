# Requirements

### Overview
Build **Phase 8 — Production Hardening, Security Audit & Closed-Loop QA**: Harden the app for production deployment, fix security gaps, and ensure all existing tests pass with comprehensive coverage.

### Scope

**In Scope:**
- **Security hardening** — Fix ALLOWED_HOSTS wildcard, add rate limiting on auth endpoints, strengthen production settings (HSTS, CSP headers), add `.env.example` with proper placeholders.
- **Production Docker setup** — Replace `runserver` with gunicorn, add proper static file serving, health checks.
- **API security** — Add throttling to DRF, validate all ViewSets enforce user ownership (no data leakage between users).
- **Closed-loop QA** — Run all existing tests, fix any failures, add security-focused tests for auth and ownership.
- **Frontend security** — Add token refresh interceptor, handle 401 gracefully with redirect.

**Out of Scope:**
- HTTP-only cookies (requires session backend changes).
- OAuth/social login.
- Multi-tenancy.
- Load testing.

# Technical Design

### Key Decisions
- **DRF Throttling** — Use built-in `UserRateThrottle` and `AnonRateThrottle`.
- **gunicorn for production** — Replace `runserver` in Docker with gunicorn.
- **Token refresh in frontend** — Add retry logic in `api.ts` interceptor.
- **`.env.example`** — Create proper template with comments.

# Delivery Steps

### ✓ Step 1: Backend security hardening and production settings
Fix security gaps in Django settings, add rate limiting, and create production-ready configuration.
- `config/settings/production.py`: Add `SECURE_HSTS_SECONDS=31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS=True`, `SECURE_PROXY_SSL_HEADER`.
- `config/settings/development.py`: Remove `'*'` from `ALLOWED_HOSTS`.
- `config/settings/base.py`: Add DRF throttling classes and rates.
- `apps/authentication/throttling.py` (new): `LoginThrottle` class.
- `apps/authentication/views.py`: Apply throttle to login/register.
- `.env.example` (new): Template with all vars and comments.
- `requirements.txt`: Add `gunicorn` and `whitenoise`.
- `config/settings/base.py`: Add whitenoise middleware and static files storage.
- Run `python manage.py check` and `ruff check .` to verify.

### ✓ Step 2: Docker production setup and frontend token refresh
Create production Docker configuration and add token refresh to the frontend.
- `backend/Dockerfile` (new): Multi-stage build with gunicorn entrypoint.
- `docker-compose.yml`: Add `backend-prod` service with gunicorn and health check.
- `frontend/src/lib/api.ts`: Add token refresh interceptor on 401.
- `frontend/src/store/authStore.ts`: Add `refreshAccessToken()` action.
- Run `npm run typecheck` and `npm run lint` to verify.

### ✓ Step 3: Security tests and closed-loop QA validation
Add security-focused tests for data ownership and rate limiting, then run all tests.
- `apps/accounts/tests.py`: Add ownership test.
- `apps/transactions/tests.py`: Add ownership test.
- `apps/lending/tests.py`: Add ownership tests.
- `apps/projects/tests.py`: Add ownership test.
- `apps/authentication/tests.py`: Add login rate limiting test.
- Run `pytest`, `npm run typecheck`, and `npm run lint`.
- Update STATE.md, commit and push.
