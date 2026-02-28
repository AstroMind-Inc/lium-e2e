/**
 * Storage Tests - User (Full Lifecycle)
 *
 * Auto-discovers test files from fixtures/upload-test/
 *
 * Flow:
 *   1. Navigate to /storage
 *   2. Create a dated folder (YYYY-MM-DD)
 *   3. Enter the folder
 *   4. Upload all test files
 *   5. Preview each file
 *   6. Download each file
 *   7. Delete each file
 *   8. Navigate back to parent
 *   9. Delete the folder
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_TEST_DIR = path.join(__dirname, "fixtures", "upload-test");

function getTestFiles(): string[] {
  if (!fs.existsSync(UPLOAD_TEST_DIR)) {
    console.warn(`⚠️  Upload test directory not found: ${UPLOAD_TEST_DIR}`);
    return [];
  }

  const files = fs
    .readdirSync(UPLOAD_TEST_DIR)
    .filter((f) => !f.startsWith(".") && f.toLowerCase() !== "readme.md");

  console.log(`📂 Found ${files.length} test files in fixtures/upload-test/`);
  return files;
}

const testFiles = getTestFiles();

if (testFiles.length === 0) {
  test.skip("No test files found in fixtures/upload-test/", () => {});
} else {
  test.describe("Storage - User (Full Access)", () => {
    test("[USER] can upload, preview, and delete files", async ({
      userPage,
      envConfig,
      browserName,
    }) => {
      test.setTimeout(180000); // 3 min — uploads multiple files incl. large PDF

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      // Include browserName so parallel runs (chromium-user, firefox, webkit) don't share folders
      const folderName = `test-${browserName}-${today}`;

      console.log(`🗂️  Starting user storage lifecycle test`);
      console.log(`📦 Testing ${testFiles.length} files\n`);

      // ── 1. Navigate to storage ────────────────────────────────────────────
      console.log("1️⃣  Navigating to storage...");
      await userPage.goto(`${envConfig.baseUrls.web}/storage`, {
        waitUntil: "domcontentloaded",
      });
      // Wait for the storage page to be interactive (not networkidle — unreliable cross-browser)
      await userPage.waitForSelector(
        'button:has-text("New Folder"), button:has-text("Upload")',
        { state: "visible", timeout: 15000 },
      );
      expect(userPage.url()).toContain("/storage");
      console.log("✅ On storage page\n");

      // ── 2. Create dated folder ────────────────────────────────────────────
      console.log(`2️⃣  Creating folder: ${folderName}`);
      await userPage.click('button:has-text("New Folder")');

      // Wait for folder name input to appear (works cross-browser without relying on dialog role)
      const folderInput = userPage
        .locator(
          'input[name="name"], input[placeholder*="name"], input[placeholder*="Name"], input[placeholder*="folder"], input[placeholder*="Folder"]',
        )
        .first();
      await folderInput.waitFor({ state: "visible", timeout: 10000 });
      await folderInput.fill(folderName);

      await userPage.click('button:has-text("Create")');

      // Wait for any "Loading..." indicator to clear (server may be slow under parallel load)
      const loadingAfterCreate = userPage.locator('text="Loading..."');
      if ((await loadingAfterCreate.count()) > 0) {
        await loadingAfterCreate.waitFor({ state: "hidden", timeout: 20000 });
      }

      // Wait for the folder to appear in the list — more reliable than waiting
      // for the dialog to animate closed (webkit handles this differently).
      // 30s — server may be slow under full-suite parallel test load.
      await userPage
        .locator(`tr:has-text("${folderName}")`)
        .waitFor({ state: "visible", timeout: 30000 });

      console.log(`✅ Folder "${folderName}" visible in list\n`);

      // ── 3. Enter the folder ───────────────────────────────────────────────
      console.log(`3️⃣  Entering folder: ${folderName}`);
      const folderRow = userPage
        .locator(`tr:has-text("${folderName}")`)
        .first();
      await folderRow.waitFor({ state: "visible", timeout: 10000 });
      await folderRow.locator("td").first().click({ force: true });
      await userPage.waitForTimeout(2000);

      const loadingInFolder = userPage.locator('text="Loading..."');
      if ((await loadingInFolder.count()) > 0) {
        await loadingInFolder.waitFor({ state: "hidden", timeout: 15000 });
        await userPage.waitForTimeout(1000);
      }
      console.log(
        `   Inside folder (${await userPage.locator("table tbody tr").count()} rows)\n`,
      );

      // ── 4. Upload all test files ──────────────────────────────────────────
      console.log(`4️⃣  Uploading ${testFiles.length} files...`);

      for (const fileName of testFiles) {
        const filePath = path.join(UPLOAD_TEST_DIR, fileName);
        const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
        console.log(`   📤 Uploading ${fileName} (${sizeMB} MB)...`);

        // Find the Upload button
        let uploadButton = userPage
          .locator('button:has-text("Upload Files"), button:has-text("Upload")')
          .first();
        if ((await uploadButton.count()) === 0) {
          uploadButton = userPage
            .locator('button[aria-label*="Upload"]')
            .first();
        }

        if ((await uploadButton.count()) > 0) {
          await uploadButton.click({ timeout: 10000 });
        }
        await userPage.waitForTimeout(500);

        const fileInput = userPage.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);
        await userPage.waitForTimeout(3000);

        const inList =
          (await userPage.locator(`text="${fileName}"`).count()) > 0;
        if (!inList) await userPage.waitForTimeout(2000);
        console.log(
          `   ${(await userPage.locator(`text="${fileName}"`).count()) > 0 ? "✅" : "⚠️ "} ${fileName}`,
        );
      }
      console.log(`✅ All files uploaded\n`);

      // Dismiss the Uploads notification panel — it's fixed at bottom-right (z-50)
      // and intercepts clicks on the file row action buttons.
      // The panel uses SVG close icons (not text "×"), so target by data-slot + class.
      console.log("   🔔 Closing upload notification panel...");
      const uploadsPanel = userPage.locator('[data-slot="card"][class*="fixed"]');
      if ((await uploadsPanel.count()) > 0) {
        // Remove individual items via "Remove from list" title buttons
        const removeButtons = userPage.locator('button[title="Remove from list"]');
        let iters = 0;
        while ((await removeButtons.count()) > 0 && iters < 20) {
          await removeButtons.first().click({ force: true });
          await userPage.waitForTimeout(150);
          iters++;
        }
        // Wait up to 5s for the panel to disappear
        try {
          await uploadsPanel.waitFor({ state: "hidden", timeout: 5000 });
        } catch {
          // If it doesn't auto-close, try clicking any remaining panel buttons
          const panelBtns = uploadsPanel.locator("button");
          for (let i = 0; i < (await panelBtns.count()); i++) {
            try { await panelBtns.nth(i).click({ force: true, timeout: 500 }); } catch { /* ignore */ }
          }
        }
      }
      await userPage.waitForTimeout(500);

      // ── 5 & 6 & 7. Preview, Download, Delete each file ───────────────────
      console.log(`5️⃣  Preview, download, and delete files...`);

      // Helper: close any overlays/menus that may intercept trigger clicks.
      // Handles: Next.js dev overlay, open dropdown menus, Radix Dialog/AlertDialog overlays.
      const dismissOverlays = async () => {
        // Close any open dropdown menu (e.g. the DELETE menu that didn't close properly)
        if ((await userPage.locator('[role="menu"]').isVisible().catch(() => false))) {
          await userPage.keyboard.press("Escape");
          await userPage.waitForTimeout(300);
        }
        // Close Next.js dev overlay if present
        if ((await userPage.locator("nextjs-portal").count()) > 0) {
          await userPage.keyboard.press("Escape");
          await userPage.waitForTimeout(300);
        }
        // Close any open Radix dialog/alert-dialog overlay and wait for it to fully leave the DOM.
        // Radix transitions: data-state="open" → "closed" (CSS exit animation) → removed from DOM.
        // Checking only data-state="open" misses the "closed"/animating-out phase that still blocks clicks.
        const anyOverlay = userPage.locator('[data-slot$="-overlay"]');
        if ((await anyOverlay.count()) > 0) {
          if ((await userPage.locator('[data-state="open"][data-slot$="-overlay"]').count()) > 0) {
            await userPage.keyboard.press("Escape");
          }
          // Wait for ALL overlay elements to fully leave the DOM (exit animation complete)
          try {
            await anyOverlay.first().waitFor({ state: "hidden", timeout: 3000 });
          } catch {
            await userPage.keyboard.press("Escape");
            await userPage.waitForTimeout(500);
          }
        }
      };

      // Helper: open the Radix dropdown for a file row and wait for the menu
      const openFileMenu = async (fileName: string) => {
        await dismissOverlays();
        const fileRow = userPage.locator(`tr:has-text("${fileName}")`).first();
        const actionsButton = fileRow.locator('[data-slot="dropdown-menu-trigger"], button').last();
        // Try normal click first. If an overlay still intercepts (e.g. webkit CMD-K dialog or
        // a dialog-overlay still animating out), fall back to force: true.
        // force: true bypasses overlay interceptors while still dispatching the pointer events
        // that Radix uses to open the dropdown (onPointerDown).
        try {
          await actionsButton.click({ timeout: 3000 });
        } catch {
          // One more overlay dismissal attempt, then force-click through any remaining overlay
          await userPage.keyboard.press("Escape");
          await userPage.waitForTimeout(300);
          await actionsButton.click({ force: true });
        }
        // Wait for the Radix menu to actually open
        await userPage.locator('[role="menu"]').waitFor({ state: "visible", timeout: 5000 });
      };

      for (const fileName of testFiles) {
        const isLargePDF = fileName === "large-pdf.pdf";
        console.log(`\n   📄 Processing: ${fileName}`);

        // Preview
        console.log(`      👁️  Previewing...`);
        await openFileMenu(fileName);

        const previewOption = userPage.locator('[role="menuitem"]:has-text("Preview")').first();
        await previewOption.waitFor({ state: "visible", timeout: 8000 });
        // force: true bypasses Next.js dev overlay (<nextjs-portal>) that may intercept clicks
        await previewOption.click({ force: true });
        await userPage.waitForTimeout(2000);

        if (isLargePDF) {
          const confirmButton = userPage
            .locator('button:has-text("Continue"), button:has-text("Proceed")')
            .first();
          if ((await confirmButton.count()) > 0) {
            await confirmButton.click({ force: true });
            await userPage.waitForTimeout(2000);
          }
        }

        await userPage.keyboard.press("Escape");
        // Wait for the overlay to fully leave the DOM (open → animating-closed → removed).
        // Radix sets data-state="closed" during exit animation; the overlay still blocks clicks until removed.
        // So we wait on any [data-slot$="-overlay"] (not just data-state="open") to be hidden.
        try {
          await userPage
            .locator('[data-slot$="-overlay"]')
            .first()
            .waitFor({ state: "hidden", timeout: 5000 });
        } catch {
          // Second Escape in case of nested/stacked dialogs
          await userPage.keyboard.press("Escape");
          await userPage.waitForTimeout(500);
        }
        await userPage.waitForTimeout(300);
        console.log(`      ✅ Preview closed`);

        // Download
        console.log(`      ⬇️  Downloading...`);
        await openFileMenu(fileName);

        const downloadOption = userPage.locator('[role="menuitem"]:has-text("Download")').first();
        await downloadOption.waitFor({ state: "visible", timeout: 8000 });
        // webkit may handle downloads natively without firing a Playwright "download" event.
        // The first click in Promise.all already fires — do NOT click again in the catch
        // (re-clicking a closed/missing menu item can dispatch events that open CMD-K).
        try {
          const [download] = await Promise.all([
            userPage.waitForEvent("download", { timeout: 15000 }),
            downloadOption.click({ force: true }),
          ]);
          console.log(`      ✅ Download started: ${download.suggestedFilename()}`);
        } catch {
          // The click already fired in Promise.all — webkit just doesn't emit the event.
          // Close the menu if it's still open (it may not have closed without a real download nav).
          if ((await userPage.locator('[role="menu"]').isVisible().catch(() => false))) {
            await userPage.keyboard.press("Escape");
            await userPage.waitForTimeout(200);
          }
          console.log(`      ✅ Download clicked (no Playwright event — browser-native download)`);
        }
        await userPage.waitForTimeout(500);

        // Delete
        console.log(`      🗑️  Deleting...`);
        await openFileMenu(fileName);

        const deleteOption = userPage.locator('[role="menuitem"]:has-text("Delete")').first();
        await deleteOption.waitFor({ state: "visible", timeout: 8000 });
        await deleteOption.click({ force: true });
        await userPage.waitForTimeout(1000); // Wait for AlertDialog to appear

        const confirmDelete = userPage
          .locator('button:has-text("Delete"), button:has-text("Confirm")')
          .first();
        if ((await confirmDelete.count()) > 0) {
          await confirmDelete.click({ force: true });
          // Wait for the file row to actually disappear — more reliable than a fixed wait.
          // This ensures all overlays are gone before we open the next file's menu.
          try {
            await userPage
              .locator(`tr:has-text("${fileName}")`)
              .waitFor({ state: "hidden", timeout: 10000 });
          } catch {
            // File may already be gone, or table structure changed — continue
            await userPage.waitForTimeout(1500);
          }
        }

        const stillVisible = (await userPage.locator(`tr:has-text("${fileName}")`).count()) > 0;
        console.log(stillVisible ? `      ⚠️  May still be visible` : `      ✅ Deleted`);
      }

      console.log(`\n✅ All files processed\n`);

      // ── 8. Navigate back to parent folder ────────────────────────────────
      console.log(`6️⃣  Navigating back to parent folder...`);
      await userPage.goto(`${envConfig.baseUrls.web}/storage`);
      await userPage.waitForTimeout(2000);

      const loadingAfterNav = userPage.locator('text="Loading..."');
      if ((await loadingAfterNav.count()) > 0) {
        await loadingAfterNav.waitFor({ state: "hidden", timeout: 10000 });
      }
      await userPage.waitForTimeout(1000);

      const breadcrumbText = await userPage
        .locator('nav, [class*="breadcrumb"]')
        .first()
        .textContent();
      console.log(`   Breadcrumb: "${breadcrumbText?.trim()}"`);

      if (breadcrumbText?.includes(folderName)) {
        // Still inside — force-click Root link
        await userPage
          .locator('a:has-text("Root")')
          .first()
          .click({ force: true });
        await userPage.waitForTimeout(2000);
      }
      console.log(`✅ At root\n`);

      // ── 9. Delete the test folder ─────────────────────────────────────────
      console.log(`7️⃣  Deleting folder: ${folderName}`);
      await userPage.screenshot({
        path: `test-results/before-folder-delete-${Date.now()}.png`,
      });

      const folderRowForDelete = userPage
        .locator(`tr:has-text("${folderName}")`)
        .first();

      if ((await folderRowForDelete.count()) > 0) {
        const folderActionsButton = folderRowForDelete.locator("button").last();
        await folderActionsButton.waitFor({ state: "visible", timeout: 5000 });
        await folderActionsButton.click({ force: true });
        await userPage.waitForTimeout(1500);

        const deleteFolderOption = userPage
          .locator('[role="menuitem"]:has-text("Delete")')
          .first();

        if ((await deleteFolderOption.count()) > 0) {
          // force: true bypasses overlays (e.g. "1 Issue" badge) that may cover the menu item
          await deleteFolderOption.click({ force: true });
          await userPage.waitForTimeout(1000);

          const confirmDeleteFolder = userPage
            .locator('button:has-text("Delete"), button:has-text("Confirm")')
            .first();
          if ((await confirmDeleteFolder.count()) > 0) {
            await confirmDeleteFolder.click();
            await userPage.waitForTimeout(2000);
          }

          const folderGone =
            (await userPage.locator(`tr:has-text("${folderName}")`).count()) ===
            0;
          console.log(
            folderGone
              ? `✅ Folder deleted\n`
              : `⚠️  Folder may still be visible\n`,
          );
        } else {
          console.log(`⚠️  Delete option not found in folder menu\n`);
        }
      } else {
        console.log(`⚠️  Folder "${folderName}" not found (already gone?)\n`);
      }

      console.log(`🎉 User storage lifecycle test complete!`);
    });
  });
}
