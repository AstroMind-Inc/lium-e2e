# Storage Tests

Auto-discoverable file upload, preview, and delete tests.

## How It Works

The test suite automatically discovers and tests **all files** in `fixtures/upload-test/`.

**Add a file → Get a test!**

## Adding Test Files

1. **Drop any file into `fixtures/upload-test/`**:
   ```bash
   cp ~/my-test-image.jpg synthetic/tests/storage/fixtures/upload-test/
   ```

2. **Run the tests**:
   ```bash
   make test-syn-storage
   ```

3. **Each file gets tested automatically**:
   - ✅ Upload the file
   - ✅ Preview the file
   - ✅ Delete the file

## Recommended Test Files

**Keep files small for fast tests:**

```
fixtures/upload-test/
├── small-image.jpg          (~50-200 KB)
├── test-document.pdf        (~100-500 KB)
├── sample-spreadsheet.xlsx  (~50-200 KB)
├── test-video.mp4           (~1-5 MB max)
└── sample-text.txt          (<10 KB)
```

## File Naming Convention

Use descriptive names that indicate what's being tested:

- `small-image.jpg` - Tests basic image upload
- `large-pdf.pdf` - Tests larger file handling
- `special-chars-héllo.txt` - Tests Unicode filenames
- `very-long-filename-with-many-characters.jpg` - Tests long names

## What Gets Tested

For each file in `fixtures/upload-test/`:

1. **Upload**
   - Navigates to `/admin/storage`
   - Uploads the file via file input
   - Waits for upload completion

2. **Preview**
   - Verifies file appears in the list
   - Opens preview (if applicable)
   - Checks preview displays correctly

3. **Delete**
   - Clicks delete button
   - Confirms deletion
   - Verifies file is removed from list

## Updating Selectors

The test file uses placeholder selectors (marked with `// TODO`). Update these in `storage.spec.ts` to match your actual app:

```typescript
// Example: Update these in storage.spec.ts
const fileInput = adminPage.locator('input[type="file"]').first();
await adminPage.click('[data-testid="preview-button"]');
await adminPage.click('[data-testid="delete-button"]');
```

## Running Tests

```bash
# Run storage tests
make test-syn-storage

# Run with headed browser (see what's happening)
npx playwright test synthetic/tests/storage/ --headed --project=chromium

# Run specific browser
npx playwright test synthetic/tests/storage/ --project=firefox
```

## Troubleshooting

**"No test files found"**
- Check that files exist in `fixtures/upload-test/`
- Don't put files in subdirectories (they won't be discovered)

**Tests timing out**
- Large files take longer to upload
- Increase timeout in test if needed: `test.setTimeout(60000)`

**Upload fails**
- Verify file input selector is correct
- Check file size limits in your app
- Ensure storage service is running

## Git

Test fixtures should be committed:
```bash
git add synthetic/tests/storage/fixtures/upload-test/
git commit -m "Add storage test fixtures"
```

Add to `.gitattributes` to prevent binary file issues:
```
synthetic/tests/storage/fixtures/**/*.jpg binary
synthetic/tests/storage/fixtures/**/*.pdf binary
synthetic/tests/storage/fixtures/**/*.mp4 binary
```

## Example Output

```
Storage - File Management
  ✓ upload, preview, and delete: test-image.jpg (5.2s)
  ✓ upload, preview, and delete: sample.pdf (4.8s)
  ✓ upload, preview, and delete: data.txt (3.1s)
  ✓ storage test summary (0.1s)

📊 Storage Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tested 3 files:
   1. test-image.jpg (156.24 KB)
   2. sample.pdf (342.18 KB)
   3. data.txt (2.45 KB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4 passed (13.2s)
```

## Next Steps

1. Add test files to `fixtures/upload-test/`
2. Update selectors in `storage.spec.ts` to match your app
3. Run tests: `make test-syn-storage`
4. Iterate until all tests pass! ✅
