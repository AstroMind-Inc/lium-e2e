# Credentials Directory

This directory stores your **local credentials** for each environment. These files are **gitignored** and will never be committed to the repository.

## Security

- ✅ All `*.json` files in this directory are gitignored
- ✅ Credentials are stored locally on your machine only
- ✅ Directory permissions are restricted (`chmod 700`)
- ❌ Never manually commit credential files
- ❌ Never share credential files via insecure channels

## File Structure

Each environment has its own credentials file:

```
credentials/
├── local.json     # Local development credentials
├── dev.json       # Dev environment credentials
├── sandbox.json   # Sandbox environment credentials
└── staging.json   # Staging environment credentials
```

## File Format

Each credential file follows this structure:

```json
{
  "regular": {
    "username": "user@lium.com",
    "password": "your_password",
    "auth0ClientId": "optional_client_id"
  },
  "elevated": {
    "username": "admin@lium.com",
    "password": "admin_password"
  },
  "lastUpdated": "2026-02-18T10:00:00Z"
}
```

## Setup

Run `make credentials` to interactively setup credentials for an environment.

Or run `make setup` during initial setup to configure credentials.

## Manual Setup (Advanced)

If you need to manually create credential files:

1. Copy the template above
2. Replace with your actual credentials
3. Save as `{environment}.json` in this directory
4. Ensure file permissions are restrictive: `chmod 600 credentials/{environment}.json`

## Troubleshooting

**Problem**: Tests fail with authentication errors
**Solution**: Verify credentials are correct and file exists for the environment

**Problem**: Credentials not found
**Solution**: Run `make credentials` to setup credentials

**Problem**: Permission denied errors
**Solution**: Check directory permissions with `ls -la credentials/`
