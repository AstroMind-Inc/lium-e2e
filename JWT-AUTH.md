# Authentication

> This file is superseded. See [README.md — Authentication](README.md#authentication) for
> the current, accurate documentation.

## Summary

The framework uses **saved browser sessions** (not direct JWT injection). The app uses
Auth0 with HTTP-only encrypted cookies, so tokens cannot be injected into localStorage.
Instead, Playwright saves a complete browser context after a real login and reuses it.

**For most developers (Google OAuth):**
```bash
make auth-setup-all [env=<env>]   # Opens browser, sign in with Google
```

**For CI (email+password):**
```bash
export E2E_ADMIN_EMAIL=...
export E2E_ADMIN_PASSWORD=...
make test-syn-all
```

See [README.md](README.md) for the full three-layer fallback chain and per-environment
session management.
