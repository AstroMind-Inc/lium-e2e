# Credentials Directory

Stores **email+password credentials** for headless authentication. Files are **gitignored**
and never committed to the repository.

## When you need this

This directory is **optional for most developers**. You only need it if you want the
framework to silently refresh expired sessions without opening a browser window.

If you sign in with **Google OAuth**, skip this entirely — use `make auth-setup-all` instead.
See the main [README](../README.md#authentication) for the full auth explanation.

## Setup

```bash
make creds-setup                # Current environment (default: local)
make creds-setup env=staging    # Specific environment
```

## File structure

```
credentials/
├── local.json       # Local Docker credentials
├── dev.json         # Dev environment credentials
├── sandbox.json     # Sandbox credentials
├── staging.json     # Staging credentials
└── production.json  # Production credentials
```

## File format

```json
{
  "regular": {
    "username": "test-user@astromind.com",
    "password": "..."
  },
  "elevated": {
    "username": "admin@astromind.com",
    "password": "..."
  },
  "lastUpdated": "2026-02-27T00:00:00Z"
}
```

`regular` = regular user account, `elevated` = admin account.

## Security

- All `*.json` files in this directory are gitignored
- Credentials stay on your local machine only
- Never share credential files — use `make auth-setup-all` on each machine instead
- Directory permissions: `chmod 700` (set during `make setup`)
