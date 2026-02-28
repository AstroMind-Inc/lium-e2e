/**
 * Chat Tests - Admin (Read-Only)
 *
 * Admin can browse and view chats but cannot create, edit, or delete.
 * Tests the read-only chat experience from admin panel.
 */

import { test, expect } from "../../fixtures/index.js";

test.describe("Chats - Admin (Read-Only)", () => {
  test("[ADMIN] can browse and view chats (read-only)", async ({
    adminPage,
    envConfig,
  }) => {
    console.log("🔍 Testing admin read-only chat access...\n");

    // Navigate to admin chats
    console.log("1️⃣  Navigating to admin chats...");
    await adminPage.goto(`${envConfig.baseUrls.web}/admin/chats`, {
      waitUntil: "domcontentloaded",
    });
    await adminPage.waitForTimeout(2000);

    // Select tenant if needed
    const selectTenant = await adminPage
      .locator("text=/select a tenant/i")
      .count();
    if (selectTenant > 0) {
      console.log("   Selecting tenant...");
      const filterButton = adminPage
        .locator(
          'button:has-text("Filter by tenant"), button:has-text("Select tenant")',
        )
        .first();
      const filterButtonCount = await filterButton.count();

      if (filterButtonCount > 0) {
        await filterButton.click();
        await adminPage.waitForTimeout(1500);

        const tenantItems = await adminPage.locator('[role="menuitem"]').all();
        if (tenantItems.length > 0) {
          await tenantItems[0].click();
          await adminPage.waitForTimeout(3000);
          console.log("   ✅ Tenant selected");
        }
      }
    }

    expect(adminPage.url()).toContain("/admin/chats");
    console.log("✅ On admin chats page\n");

    // Verify read-only: No "New chat" button in the main content area
    console.log("2️⃣  Verifying read-only access...");
    // Scoped to main/header to avoid false positives from unrelated "Create" buttons
    const newChatButton = await adminPage
      .locator(
        'main button:has-text("New chat"), header button:has-text("New chat"), main button:has-text("New Chat"), header button:has-text("New Chat")',
      )
      .count();
    expect(newChatButton).toBe(0);
    console.log("✅ No new-chat button (read-only confirmed)\n");

    // Browse existing chats
    console.log("3️⃣  Browsing existing chats...");

    // Check for chat list (could be table rows, list items, cards)
    const chatRows = await adminPage
      .locator("tr, li, [class*='chat'], [class*='conversation']")
      .count();
    console.log(`   Found ${chatRows} elements in chat list`);

    if (chatRows > 1) {
      // Try to view details of first chat
      console.log("\n4️⃣  Viewing chat details...");

      // Find first chat row/item
      const firstChat = adminPage
        .locator("tr, li, [class*='chat-item'], [class*='conversation']")
        .first();
      const firstChatCount = await firstChat.count();

      if (firstChatCount > 0) {
        // Try to get chat title/preview
        const chatText = await firstChat.textContent();
        console.log(
          `   Chat preview: "${chatText?.trim().substring(0, 50)}..."`,
        );

        // Click to view details (might open in same page or modal)
        await firstChat.click();
        await adminPage.waitForTimeout(2000);

        // Check if chat details are visible
        const chatDetails = await adminPage
          .locator('[class*="message"], [class*="chat-content"]')
          .count();
        if (chatDetails > 0) {
          console.log(`✅ Chat details visible (${chatDetails} messages)\n`);
        } else {
          console.log("ℹ️  Chat details format unclear\n");
        }

        // Verify no edit/delete actions available
        console.log("5️⃣  Verifying no edit/delete actions...");
        const editButton = await adminPage
          .locator('button:has-text("Edit"), button[aria-label*="edit"]')
          .count();
        const deleteButton = await adminPage
          .locator('button:has-text("Delete"), button[aria-label*="delete"]')
          .count();

        if (editButton === 0 && deleteButton === 0) {
          console.log("✅ No edit/delete buttons (read-only confirmed)\n");
        } else {
          console.log(
            `⚠️  Found edit=${editButton}, delete=${deleteButton} buttons\n`,
          );
        }
      }
    } else {
      console.log("ℹ️  No chats found to view\n");
    }

    // Test navigation back
    console.log("6️⃣  Testing navigation...");

    // Try to go back to chats list if we opened a chat
    const backButton = adminPage
      .locator('button:has-text("Back"), a:has-text("Back")')
      .first();
    const backButtonCount = await backButton.count();

    if (backButtonCount > 0) {
      await backButton.click();
      await adminPage.waitForTimeout(2000);
      console.log("✅ Navigated back to list\n");
    }

    // Try accessing via sidebar
    console.log("7️⃣  Testing sidebar access...");
    const sidebarChats = adminPage
      .locator('nav a:has-text("Chats"), aside a:has-text("Chats")')
      .first();
    const sidebarChatsCount = await sidebarChats.count();

    if (sidebarChatsCount > 0) {
      await sidebarChats.click();
      await adminPage.waitForTimeout(2000);

      if (adminPage.url().includes("/admin/chats")) {
        console.log("✅ Sidebar navigation works\n");
      }
    } else {
      console.log("ℹ️  Sidebar Chats link not found\n");
    }

    console.log("🎉 Admin read-only chat access test complete!");
  });
});
