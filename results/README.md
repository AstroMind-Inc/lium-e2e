# Results Directory

This directory stores **test results** in JSONL (JSON Lines) format. These files are **gitignored** to keep the repository clean.

## Why JSONL?

- **Append-only**: Safe for concurrent writes from multiple users
- **Line-based**: Each line is a valid JSON object
- **Git-friendly**: Line-based diffs (if tracked)
- **Lightweight**: No database overhead
- **Human-readable**: Easy to inspect and debug
- **Tool-friendly**: Works with `grep`, `jq`, and other standard tools

## File Structure

Results are organized by pillar and environment:

```
results/
├── synthetic-dev-2026-02-18.jsonl
├── synthetic-staging-2026-02-18.jsonl
├── integration-dev-2026-02-18.jsonl
├── performance-dev-2026-02-18.jsonl
└── index.json  # Metadata index for quick lookups
```

## File Format

Each line in a `.jsonl` file represents a single test result:

```jsonl
{"timestamp":"2026-02-18T10:30:00Z","pillar":"synthetic","environment":"dev","test":"auth/login.spec.ts","status":"passed","duration":1234,"user":"alice@lium.com"}
{"timestamp":"2026-02-18T10:30:05Z","pillar":"synthetic","environment":"dev","test":"user-flows/checkout.spec.ts","status":"failed","duration":5678,"user":"alice@lium.com","error":"Payment timeout","screenshot":"./reports/screenshot-abc123.png"}
```

## Fields

- `timestamp`: ISO 8601 timestamp when test ran
- `pillar`: Test pillar (`synthetic`, `integration`, or `performance`)
- `environment`: Environment tested (`local`, `dev`, `sandbox`, `staging`)
- `test`: Test file path or name
- `status`: Test status (`passed`, `failed`, or `skipped`)
- `duration`: Test duration in milliseconds
- `user`: Email/username of who ran the test
- `error`: Error message (if failed)
- `screenshot`: Path to screenshot (if captured)
- `trace`: Path to trace file (if captured)
- `metadata`: Additional custom metadata

## Viewing Results

Use `make results` to view a summary of recent test results.

Or query manually with command-line tools:

```bash
# View last 10 results
tail -10 results/synthetic-dev-2026-02-18.jsonl | jq .

# Find all failures
grep '"status":"failed"' results/*.jsonl | jq .

# Count passes vs failures
grep -c '"status":"passed"' results/synthetic-dev-*.jsonl
grep -c '"status":"failed"' results/synthetic-dev-*.jsonl

# Get test durations
cat results/synthetic-dev-*.jsonl | jq '.duration' | sort -n

# Find tests by user
grep '"user":"alice@lium.com"' results/*.jsonl | jq .
```

## Multi-User Safety

Since JSONL is append-only, multiple users can safely write to the same files:

- Each user's results are appended to the daily file
- No merge conflicts or race conditions
- User field tracks who ran each test
- Timestamp ensures proper ordering

## Cleanup

Result files are gitignored but accumulate locally. Periodically clean up old results:

```bash
# Remove results older than 30 days
find results/ -name "*.jsonl" -mtime +30 -delete
```

Or include this in your regular cleanup routine.

## Sharing Results

If you want to share results with the team:

1. **Slack**: Results are automatically posted to Slack (if configured)
2. **HTML Reports**: Check the `reports/` directory for HTML reports
3. **Manual Export**: Copy JSONL files to a shared location

## Advanced Queries

Use `jq` for complex queries:

```bash
# Get average test duration by test name
cat results/synthetic-dev-*.jsonl | jq -s 'group_by(.test) | map({test: .[0].test, avg_duration: (map(.duration) | add / length)})'

# Find flaky tests (tests that sometimes pass, sometimes fail)
cat results/synthetic-dev-*.jsonl | jq -s 'group_by(.test) | map(select(map(.status) | unique | length > 1)) | map({test: .[0].test, statuses: (map(.status) | unique)})'

# Get pass rate by environment
for env in local dev sandbox staging; do
  echo "$env: $(grep -c '"status":"passed"' results/*-$env-*.jsonl) passed, $(grep -c '"status":"failed"' results/*-$env-*.jsonl) failed"
done
```
