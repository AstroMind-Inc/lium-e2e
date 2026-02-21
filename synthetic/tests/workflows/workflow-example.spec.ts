/**
 * Workflow Tests - Example
 * Tests for end-to-end workflows
 */

import { test, expect } from "../../fixtures/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("Workflow Examples", () => {
  test.use({
    storageState: path.resolve(
      __dirname,
      "../../../playwright/.auth/admin.json",
    ),
  });

  test("example workflow test", async ({ page, envConfig }) => {
    await page.goto(envConfig.baseUrls.web);
    await page.waitForLoadState("networkidle");

    const url = page.url();
    expect(url).toContain("lium");

    console.log("✓ Workflow test passed - auto-discovered!");
  });
});
