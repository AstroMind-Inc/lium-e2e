# Test Modules

Test modules are **automatically discovered** from this directory structure. No code changes needed!

## Adding a New Test Module

Just create a folder and add test files:

```bash
# 1. Create new module directory
mkdir synthetic/tests/my-module

# 2. Add description (optional)
echo "# My Module Description" > synthetic/tests/my-module/.gitkeep

# 3. Add test files
touch synthetic/tests/my-module/my-test.spec.ts

# ✅ Done! Auto-discovered in `make test` menu
```

## Module Discovery Rules

**Included:**
- Any directory with `*.spec.ts` files
- Directories without special prefixes

**Excluded:**
- Directories starting with `_` (e.g., `_examples`, `_future`)
- Special directories: `user-flows`, `helpers`, `fixtures`, `utils`
- Empty directories (no test files)

## Benefits

✅ **Zero Configuration** - Just add files, tests auto-discovered
✅ **Scalable** - Add unlimited modules without code changes  
✅ **Clean UI** - Empty modules automatically hidden
✅ **Self-Documenting** - Description from `.gitkeep` file
