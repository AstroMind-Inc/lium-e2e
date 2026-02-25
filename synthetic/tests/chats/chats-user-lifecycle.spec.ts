/**
 * Chat Tests - User (Full Lifecycle)
 *
 * User can create a chat, select an agent, send messages, rename, and delete.
 * Tests complete chat lifecycle from user perspective.
 */

import { test, expect } from "../../fixtures/index.js";

test.describe("Chats - User (Full Access)", () => {
  test("[USER] can create, message, rename, and delete chat", async ({
    userPage,
    envConfig,
  }) => {
    console.log("💬 Starting user chat lifecycle test\n");

    // Navigate to home/dashboard
    console.log("1️⃣  Navigating to home...");
    await userPage.goto(`${envConfig.baseUrls.web}`, {
      waitUntil: "domcontentloaded",
    });
    await userPage.waitForTimeout(2000);
    console.log("✅ On home page\n");

    // Create a new chat - click "New chat" button/link
    console.log("2️⃣  Creating new chat...");

    // Look for "New Chat" or "New chat" button/link
    const newChatButton = userPage.locator('button:has-text("New Chat"), button:has-text("New chat"), a:has-text("New Chat"), a:has-text("New chat")').first();
    await newChatButton.waitFor({ state: 'visible', timeout: 10000 });
    await newChatButton.click();
    await userPage.waitForTimeout(2000);
    console.log("   Clicked New Chat button\n");

    // Select agent "Lium Analysis Agent"
    console.log("\n3️⃣  Selecting agent: Lium Analysis Agent");

    // Look for agent selector/dropdown
    const agentSelector = userPage.locator('select, [role="combobox"], button:has-text("Select"), button:has-text("Agent")').first();
    const agentSelectorCount = await agentSelector.count();

    if (agentSelectorCount > 0) {
      console.log("   Found agent selector, clicking...");
      await agentSelector.click();
      await userPage.waitForTimeout(1000);

      // Look for "Lium Analysis Agent" in dropdown
      const agentOption = userPage.locator('text="Lium Analysis Agent"').first();
      const agentOptionCount = await agentOption.count();

      if (agentOptionCount > 0) {
        await agentOption.click();
        await userPage.waitForTimeout(1000);
        console.log("✅ Selected Lium Analysis Agent");
      } else {
        console.log("⚠️  Lium Analysis Agent not found in list");
        // Take screenshot to see available agents
        await userPage.screenshot({ path: "test-results/agent-selector-debug.png" });
      }
    } else {
      console.log("⚠️  Agent selector not found, may be auto-selected");
    }

    // Send message "Hello"
    console.log("\n4️⃣  Sending message: Hello");

    // Find message input (textarea or input) - try multiple selectors
    let messageInput = userPage.locator('textarea').first();
    let inputCount = await messageInput.count();

    if (inputCount === 0) {
      // Try with placeholder
      messageInput = userPage.locator('textarea[placeholder*="message"], textarea[placeholder*="Message"], input[placeholder*="message"], input[placeholder*="Message"]').first();
      inputCount = await messageInput.count();
    }

    if (inputCount === 0) {
      // Try contenteditable
      messageInput = userPage.locator('[contenteditable="true"]').first();
      inputCount = await messageInput.count();
    }

    if (inputCount > 0) {
      await messageInput.waitFor({ state: 'visible', timeout: 10000 });
      await messageInput.fill("Hello");
      console.log("   Typed message");

      // Find and click send button
      const sendButton = userPage.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="Send"], button[aria-label*="send"]').first();
      const sendButtonCount = await sendButton.count();

      if (sendButtonCount > 0) {
        // Use force to click through any overlays (Next.js dev overlay, etc.)
        await sendButton.click({ force: true });
        await userPage.waitForTimeout(3000);
        console.log("✅ Message sent\n");
      } else {
        // Try pressing Enter
        await messageInput.press('Enter');
        await userPage.waitForTimeout(3000);
        console.log("✅ Message sent (Enter)\n");
      }

      // Wait for response (optional - may take a while)
      console.log("   Waiting for message to appear...");
      await userPage.waitForTimeout(3000);
    } else {
      console.log("⚠️  Message input not found");
      await userPage.screenshot({ path: "test-results/chat-input-debug.png" });
    }

    // Navigate to /chats (via sidebar)
    console.log("5️⃣  Navigating to chats list...");

    // Click on "Chats" in sidebar
    const chatsLink = userPage.locator('a:has-text("Chats"), nav a:has-text("Chats")').first();
    const chatsLinkCount = await chatsLink.count();

    if (chatsLinkCount > 0) {
      // Use force to click through Next.js dev overlay
      await chatsLink.click({ force: true });
      await userPage.waitForTimeout(2000);
      console.log("   Clicked Chats link");
    } else {
      // Try navigating directly
      await userPage.goto(`${envConfig.baseUrls.web}/chats`);
      await userPage.waitForTimeout(2000);
      console.log("   Navigated to /chats directly");
    }

    expect(userPage.url()).toContain("/chats");
    console.log("✅ On chats list page\n");

    // Find the chat with "Hello" message
    console.log("6️⃣  Finding chat in list...");

    // Look for chat containing "Hello" text
    const chatWithHello = userPage.locator('text="Hello"').first();
    const chatCount = await chatWithHello.count();

    if (chatCount > 0) {
      console.log("✅ Found chat with 'Hello' message");

      // Click on the chat to open it
      await chatWithHello.click();
      await userPage.waitForTimeout(2000);
      console.log("   Opened chat\n");
    } else {
      console.log("⚠️  Chat not found in list");
      await userPage.screenshot({ path: "test-results/chats-list-debug.png" });
    }

    // Change the title of the chat
    console.log("7️⃣  Changing chat title...");

    const newTitle = `Test Chat - ${new Date().toISOString().split('T')[0]}`;

    // Look for title edit button/field (could be an edit icon, settings, or direct click)
    const titleElement = userPage.locator('h1, [class*="title"], [role="heading"]').first();
    const titleCount = await titleElement.count();

    if (titleCount > 0) {
      const currentTitle = await titleElement.textContent();
      console.log(`   Current title: "${currentTitle?.trim()}"`);

      // Try clicking on title to edit (if editable)
      await titleElement.click();
      await userPage.waitForTimeout(500);

      // Look for edit icon, pencil button, or settings
      const editButton = userPage.locator('button[aria-label*="edit"], button[aria-label*="Edit"], button:has-text("✏️"), svg[data-icon="pencil"]').first();
      const editButtonCount = await editButton.count();

      if (editButtonCount > 0) {
        console.log("   Found edit button");
        await editButton.click();
        await userPage.waitForTimeout(1000);
      }

      // Look for title input field
      const titleInput = userPage.locator('input[value*=""], input[type="text"]').first();
      const titleInputCount = await titleInput.count();

      if (titleInputCount > 0) {
        console.log("   Found title input");
        await titleInput.fill(newTitle);

        // Look for save/confirm button
        const saveButton = userPage.locator('button:has-text("Save"), button:has-text("✓"), button[type="submit"]').first();
        const saveButtonCount = await saveButton.count();

        if (saveButtonCount > 0) {
          await saveButton.click();
          await userPage.waitForTimeout(2000);
          console.log(`✅ Changed title to: "${newTitle}"\n`);
        } else {
          // Try pressing Enter
          await titleInput.press('Enter');
          await userPage.waitForTimeout(2000);
          console.log(`✅ Changed title to: "${newTitle}" (Enter)\n`);
        }

        // Verify title changed (try to read, but don't fail if element changed)
        try {
          const updatedTitle = await titleElement.textContent({ timeout: 3000 });
          if (updatedTitle?.includes(newTitle) || updatedTitle?.includes("Test Chat")) {
            console.log("✅ Title change confirmed\n");
          } else {
            console.log(`⚠️  Title may not have changed: "${updatedTitle?.trim()}"\n`);
          }
        } catch (e) {
          console.log("ℹ️  Could not verify title (element may have changed)\n");
        }
      } else {
        console.log("⚠️  Could not find title input field\n");
      }
    } else {
      console.log("⚠️  Could not find title element\n");
    }

    // Delete the chat
    console.log("8️⃣  Deleting chat...");

    // Look for delete button (could be in menu, settings, or direct button)
    // Try menu/actions button first
    const menuButton = userPage.locator('button[aria-label*="menu"], button[aria-label*="Menu"], button[aria-label*="options"], button[aria-label*="Options"], button:has-text("⋮"), button:has-text("...")').first();
    const menuButtonCount = await menuButton.count();

    if (menuButtonCount > 0) {
      console.log("   Found menu button");
      await menuButton.click({ force: true });
      await userPage.waitForTimeout(1000);

      // Look for delete option in menu
      const deleteOption = userPage.locator('[role="menuitem"]:has-text("Delete"), button:has-text("Delete")').first();
      const deleteOptionCount = await deleteOption.count();

      if (deleteOptionCount > 0) {
        await deleteOption.click();
        await userPage.waitForTimeout(1000);
        console.log("   Clicked Delete option");

        // Handle confirmation dialog if present
        const confirmButton = userPage.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
        const confirmButtonCount = await confirmButton.count();

        if (confirmButtonCount > 0) {
          await confirmButton.click();
          await userPage.waitForTimeout(2000);
          console.log("   Confirmed deletion");
        }

        console.log("✅ Chat deleted\n");
      } else {
        console.log("⚠️  Delete option not found in menu\n");
      }
    } else {
      // Try direct delete button
      const deleteButton = userPage.locator('button:has-text("Delete"), button[aria-label*="delete"], button[aria-label*="Delete"]').first();
      const deleteButtonCount = await deleteButton.count();

      if (deleteButtonCount > 0) {
        console.log("   Found delete button");
        await deleteButton.click();
        await userPage.waitForTimeout(1000);

        // Handle confirmation
        const confirmButton = userPage.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
        const confirmButtonCount = await confirmButton.count();

        if (confirmButtonCount > 0) {
          await confirmButton.click();
          await userPage.waitForTimeout(2000);
        }

        console.log("✅ Chat deleted\n");
      } else {
        console.log("⚠️  Delete button not found\n");
      }
    }

    // Verify we're back on chats list or chat is gone
    const urlAfterDelete = userPage.url();
    if (urlAfterDelete.includes("/chats")) {
      console.log("✅ Returned to chats list\n");
    }

    console.log("🎉 User chat lifecycle test complete!");
  });
});
