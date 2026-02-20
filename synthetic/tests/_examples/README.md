# Example Tests

This directory contains example and reference tests that are not part of the main test suite.

## Files

### `manual-login-poc.spec.ts`
Original proof-of-concept for manual OAuth login.

**Note:** This is now superseded by the auth setup system:
- Use `make auth-setup-admin` or `make auth-setup-user` instead
- Those commands save your session for reuse (faster tests)
- This file is kept as a reference for understanding the OAuth flow

## Running Examples

To run these examples manually:
```bash
npx playwright test synthetic/tests/_examples/manual-login-poc.spec.ts --headed
```
