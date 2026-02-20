# Future Tests

Tests in this directory are **not run** as part of the test suite. They're here for future development or reference.

## Why These Tests Are Disabled

For the POC phase, we don't need:
- Detailed auth flow testing (programmatic login)
- Error case testing
- Session management edge cases
- Logout functionality testing

## What We Use Instead

Simple POC tests in `tests/auth/auth-poc.spec.ts`:
- ✅ Verify saved auth works
- ✅ Can access protected routes
- ✅ Take screenshots for visual verification

## When To Enable These

When the framework is mature and you need:
- Comprehensive auth testing
- CI/CD integration
- Regression testing
- Full coverage of edge cases

## How To Run These

If you want to test these:
```bash
npx playwright test synthetic/tests/_future/login.spec.ts
```
