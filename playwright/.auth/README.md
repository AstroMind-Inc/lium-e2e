# Saved Browser Sessions

This directory holds saved Playwright browser sessions for each role and environment.
All files are **gitignored** — they live only on your machine.

## Naming convention

```
{role}-{environment}.json

admin-local.json       ← admin session for local Docker
user-local.json        ← user session for local Docker
admin-staging.json     ← admin session for staging
user-staging.json      ← user session for staging
```

## Managing sessions

```bash
make auth-setup-all              # Set up local sessions (Google OAuth works)
make auth-setup-all env=staging  # Set up staging sessions
make auth-status                 # Check what sessions you have
make auth-status env=staging
make auth-clear                  # Remove local sessions
make auth-clear env=staging      # Remove staging sessions only
```

Sessions are validated automatically before every test run. If a session is expired and
email+password credentials are available (ENV vars or `credentials/{env}.json`), it is
refreshed headlessly. Otherwise, `make auth-setup-{role}` is printed as the next step.

## Old files

If you see `admin.json` or `user.json` (without an environment suffix), they are from
a previous version and are no longer used. You can delete them.
