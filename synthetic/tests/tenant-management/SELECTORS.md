# Verified UI Selectors

This document contains all the verified selectors discovered through automated UI exploration.

## Navigation Selectors

### Account Menu

```typescript
// Account button (opens menu)
await page.locator('[aria-label="Account menu"]').click();

// Admin workspace link
await page.locator('a:has-text("Admin")').click();
```

## Tenant Management Selectors

### Tenant List

```typescript
// Find specific tenant row
const tenantRow = page.locator('tr:has-text("Seismic")');

// Actions menu button (three dots)
await tenantRow.locator('button[aria-label*="more" i]').click();

// Manage option in menu
await page.locator("text=/^Manage$/i").click();
```

## Member Management Selectors

### Add Member

```typescript
// Email input in "Add Invitee" section
const emailInput = page.locator('input[placeholder="Email"]');
await emailInput.fill("test-user@astromind.com");

// Invite button
await page.locator('button:has-text("Invite user to tenant")').click();
```

### Remove Member

```typescript
// Remove button (trash icon) for specific user
await page
  .locator('button[aria-label="Remove test-user@astromind.com"]')
  .click();
```

### Close Modal

```typescript
// Close button (use .first() as there may be multiple)
await page.locator('button:has-text("Close")').first().click();
```

## Helper Functions

```typescript
/**
 * Navigate to Admin workspace
 */
async function switchToAdminWorkspace(page, baseUrl) {
  await page.goto(baseUrl);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  await page.locator('[aria-label="Account menu"]').click();
  await page.waitForTimeout(500);

  await page.locator('a:has-text("Admin")').click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}

/**
 * Open Seismic tenant management
 */
async function openSeismicTenantManagement(page) {
  const seismicRow = page.locator('tr:has-text("Seismic")');
  await seismicRow.locator('button[aria-label*="more" i]').click();
  await page.waitForTimeout(500);

  await page.locator("text=/^Manage$/i").click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
}
```

## Discovery Process

These selectors were discovered using automated Playwright tests that:

1. Explored the UI structure
2. Logged all buttons, links, and interactive elements
3. Captured screenshots at each step
4. Tested multiple selector strategies
5. Verified each selector works reliably

See the discovery test files (\*.spec.ts.skip) for the full exploration code.
