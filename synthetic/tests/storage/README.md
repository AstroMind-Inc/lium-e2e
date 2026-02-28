# Storage Tests

Browser tests for the Lium file storage feature, covering the full user lifecycle and admin read-only access.

## Test Files

### `storage-user-lifecycle.spec.ts`

Full lifecycle test run as a regular user. Auto-discovers files from `fixtures/upload-test/` and exercises every operation for each file.

**Flow (single test, ~3 minutes):**

1. Navigate to `/storage`
2. Create a dated folder: `test-{browserName}-{YYYY-MM-DD}`
3. Enter the folder
4. Upload all files from `fixtures/upload-test/`
5. Dismiss the upload notification panel
6. For each file: preview (via Radix Dialog), download, delete
7. Navigate back to root (direct navigation to `/storage`)
8. Delete the test folder

The folder name includes `browserName` so parallel browser runs (chromium-user, firefox, webkit) do not share or collide on the same folder.

### `storage-admin-readonly.spec.ts`

Admin access verification. Navigates to `/admin/storage`, selects a tenant if required, and asserts:

- No upload button is present (read-only confirmed)
- Existing files are visible and browseable
- File preview opens and closes via Radix Dialog
- Folder navigation works (enter subfolder, navigate back to Root)

Admin cannot upload or delete — the test verifies this constraint.

## Current Test Fixtures

```
fixtures/upload-test/
├── large-pdf.pdf
├── sample-3d-duck.glb
├── sample-image.jpeg
└── sample-npy.npy
```

Every file in this directory is automatically included in the lifecycle test. Files starting with `.` and `README.md` are excluded.

## Adding Test Files

1. Drop any file into `fixtures/upload-test/`:

   ```bash
   cp ~/my-test-image.jpg synthetic/tests/storage/fixtures/upload-test/
   ```

2. Run the tests — the new file is picked up automatically:

   ```bash
   make test-syn-storage
   ```

Keep files small where possible (the large PDF is intentional — it tests a "Continue" confirmation prompt for large previews).

## Running Tests

```bash
# Run storage tests (all browsers)
make test-syn-storage

# Run with headed browser
npx playwright test synthetic/tests/storage/ --headed --project=chromium-user

# Run a specific browser project
npx playwright test synthetic/tests/storage/ --project=firefox
```

## Browser Compatibility Notes

**Webkit (Safari):** Some downloads are handled natively by the browser without emitting a Playwright `download` event. The lifecycle test wraps `waitForEvent("download")` in a try/catch — if the event times out, the click is treated as successful (the browser handled the download natively). Do not re-click after the timeout; doing so can dispatch spurious keyboard events (e.g. CMD-K).

**Overlay handling:** The test uses `force: true` on trigger button clicks when Radix Dialog overlays are still animating out (`data-state="closed"` but not yet removed from the DOM). This is correct behavior — Radix overlays block pointer events during the exit animation.

## Troubleshooting

**"No test files found in fixtures/upload-test/"**

- Confirm files exist in `fixtures/upload-test/` (not in a subdirectory)

**Test times out during upload**

- `large-pdf.pdf` is intentionally large; the test allows 3 minutes total
- Increase `test.setTimeout(...)` if your environment is slower

**Folder not found during cleanup**

- If the test fails mid-run, the dated folder may be left in storage
- Delete it manually from the UI or re-run the test (it will create a new folder for today's date)

## Git

Test fixtures are committed:

```bash
git add synthetic/tests/storage/fixtures/upload-test/
git commit -m "Add storage test fixtures"
```

Add to `.gitattributes` to prevent binary diff noise:

```
synthetic/tests/storage/fixtures/**/*.jpg binary
synthetic/tests/storage/fixtures/**/*.jpeg binary
synthetic/tests/storage/fixtures/**/*.pdf binary
synthetic/tests/storage/fixtures/**/*.glb binary
synthetic/tests/storage/fixtures/**/*.npy binary
```
