# Tenant Management Test Suite

This suite tests multi-tenant administration, member lifecycle, and access control.

## Flow Overview

```
1. Admin signs in
2. Clicks account button (bottom-left)
3. Clicks "Admin" menu item
4. → Switches to Admin workspace (/admin)
5. Finds "seismic" tenant
6. Clicks cog/manage button
7. Adds test-user@astromind.com as member
8. Signs out

9. test-user signs in
10. Verifies access to seismic tenant
11. Signs out

12. Admin signs in
13. Switches to Admin workspace
14. Finds "seismic" tenant
15. Removes test-user@astromind.com
16. Signs out

17. test-user signs in
18. Stuck at /beta (no tenant access)
```

## Tests

### `member-lifecycle.spec.ts`

Complete user lifecycle test covering:

- Admin adds user to tenant
- User verifies access
- Admin removes user from tenant
- User verifies access revoked

**Status:** ✅ WORKING - All selectors verified and test passing

### `discover-ui.spec.ts.skip`

UI discovery helper to find correct selectors.

## Running the Discovery Test

1. Rename `discover-ui.spec.ts.skip` to `discover-ui.spec.ts`
2. Run: `make test-syn-tenant-management`
3. Check console output and `test-results/ui-discovery-admin-page.png`
4. Update selectors in `member-lifecycle.spec.ts` based on findings
5. Rename back to `.skip` when done

## Adjusting Selectors

The test needs these UI elements:

### Step 1: Switch to Admin Workspace

1. **Account button** - In bottom-left corner to open account menu
2. **Admin menu item** - In account menu to switch to admin workspace

### Step 2: Manage Tenant on `/admin`

3. **Tenant row/card** - Shows tenant name (e.g., "seismic")
4. **Manage button** - Opens tenant management (cog icon or button)

### Step 3: Add/Remove Members

5. **Add member button** - Opens form to add new member
6. **Email input** - For entering new member email
7. **Role selector** - Dropdown to select member role (optional)
8. **Submit button** - Confirms adding member
9. **Remove button** - Removes a member from tenant

### Current Selectors (may need adjustment)

```typescript
// Account button (bottom-left)
const accountButton = adminPage.locator('button:has-text("account")').last();

// Admin menu item
const adminMenuItem = adminPage.locator("text=/^Admin$/i").first();

// Tenant row
const tenantRow = adminPage.locator("text=/.*seismic.*/i").first();

// Manage button (tries multiple approaches)
const cogButton = adminPage.locator('button[aria-label*="manage" i]').first();

// Add member
const addMemberButton = adminPage.locator('button:has-text("Add")').first();

// Email input
const emailInput = adminPage.locator('input[type="email"]').first();

// Role selector
const roleSelector = adminPage.locator('select[name*="role"]').first();

// Submit
const submitButton = adminPage.locator('button[type="submit"]').first();

// Remove
const removeButton = adminPage.locator('button:has-text("Remove")').first();
```

## Tips

- Run the discovery test first to see actual UI structure
- Check screenshots in `test-results/` for visual debugging
- Use browser DevTools to inspect element attributes
- Start with simplified version focusing on one step at a time
- Consider using test IDs (`data-testid`) in your app for reliable selectors
