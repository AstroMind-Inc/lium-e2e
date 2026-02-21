# Lium E2E Testing Framework - Roadmap

> **Status**: 🟢 Active Development
> **Last Updated**: 2026-02-20

This roadmap outlines the next big features and enhancements for the Lium E2E testing framework.

---

## ✅ Completed (v1.0 - POC)

- [x] **Auto-discoverable test modules** - Add folder → command works
- [x] **Three-pillar architecture** - Synthetic, Integration, Performance
- [x] **Saved authentication sessions** - One-time login, reused forever
- [x] **Auto-discovery system** - ModuleScanner + pattern rules
- [x] **Pre-flight checks** - Server health + token validation
- [x] **Automatic token refresh** - Detects expired tokens, prompts re-auth
- [x] **Interactive CLI** - `make test` menu for easy test selection
- [x] **k6 performance testing** - Basic homepage load test POC
- [x] **Consolidated HTML reports** - All tests in single report
- [x] **Internal framework tests** - 80%+ coverage for critical utilities
- [x] **Turn-key operation** - `make setup` → `make test` → done

---

## 🚧 In Progress

### 1. **JSONL Result Persistence**
**Status**: 🟡 Infrastructure Ready, Integration Blocked
**Priority**: Medium
**Assignee**: TBD

**Goal**: Historical test result tracking via JSONL files

**What's Done:**
- ✅ ResultWriter/ResultReader classes implemented
- ✅ ResultsViewer CLI (nice tables, summaries)
- ✅ JSONL file format defined
- ✅ Flaky test detection logic

**What's Blocked:**
- ❌ Playwright reporter integration (TypeScript module loading issue)
- ❌ Global setup not loading (same TS module issue)

**Next Steps:**
1. Compile reporters to JavaScript (workaround)
2. Or use different integration point (test fixtures)
3. Enable `make results` CLI command

**Estimated Effort**: 2-4 hours

---

### 2. **Screenshot Visibility in Reports**
**Status**: 🔴 Not Working
**Priority**: **HIGH** ⚠️
**Assignee**: **URGENT**

**Problem**: Screenshots not visible in HTML reports

**Current Behavior:**
- Screenshots taken (`screenshot: 'on'` in config)
- But only kept for FAILED tests (Playwright default)
- Passing tests → artifacts cleaned up → no screenshots in report
- Report shows tests but no visual artifacts

**Goal**: See screenshots for ALL tests (passed + failed)

**Options:**
1. **Custom reporter** - Attach screenshots as base64 to HTML
2. **Force artifact retention** - Configure Playwright to keep all artifacts
3. **Manual attachment** - Use `test.info().attach()` in tests

**Next Steps:**
1. Investigate Playwright artifact retention settings
2. Implement custom attachment strategy
3. Test with passing AND failing tests

**Estimated Effort**: 2-3 hours

---

## 📋 Planned Features

### 3. **Slack Integration**
**Status**: 🔵 Not Started
**Priority**: High
**Assignee**: _Another engineer (per user request)_

**Goal**: Post test results to Slack channel

**Features:**
- Slack webhook integration
- Formatted messages with pass/fail counts
- Link to HTML report
- Threshold-based alerts (only notify if >10% fail)
- Per-environment channels

**Implementation:**
- Stub exists: `shared/reporting/slack-reporter.ts`
- Needs: Webhook URL config, message formatting, integration into test runs

**Estimated Effort**: 3-4 hours

---

### 4. **Performance Testing - Expand Coverage**
**Status**: 🔵 POC Complete, Needs Expansion
**Priority**: Medium
**Assignee**: TBD

**Current State:**
- ✅ k6 installed and working
- ✅ Simple homepage load test exists
- ✅ Auto-discovery pattern rule works

**Goal**: Comprehensive performance test suite

**Planned Tests:**
- API baseline performance (CRUD operations)
- Stress testing (breaking points)
- Spike testing (sudden traffic)
- Endurance testing (sustained load)
- Scalability validation (concurrent users)

**Scenarios:**
```
performance/tests/
├── load/
│   ├── homepage.js       ← Exists
│   ├── api-baseline.js   ← TODO
│   └── concurrent-users.js
├── stress/
│   ├── api-stress.js
│   └── database-stress.js
└── spike/
    └── traffic-spike.js
```

**Estimated Effort**: 1-2 days

---

### 5. **Module Metadata (manifest.yml)**
**Status**: 🔵 Not Started
**Priority**: Low
**Assignee**: TBD

**Goal**: Customizable module metadata via optional config file

**Problem**: Icons, descriptions, tags are hard-coded in `module-scanner.ts`

**Solution**: Read from optional `manifest.yml` in each module directory

**Example:**
```yaml
# synthetic/tests/workflows/manifest.yml
name: Workflows
description: Complex multi-step user workflows
icon: 🔄
tags: [end-to-end, critical, slow]
estimatedDuration: 2m
```

**Benefits:**
- Self-documenting tests
- Customizable display in CLI
- Tags for test organization
- Duration estimates

**Estimated Effort**: 2-3 hours

---

### 6. **CI/CD Integration (GitHub Actions)**
**Status**: 🔵 Not Started
**Priority**: Medium
**Assignee**: TBD

**Goal**: Automated test runs on PR/merge

**Features:**
- Run tests on every PR
- Post results as PR comment
- Block merge if tests fail
- Scheduled nightly runs
- Upload artifacts (reports, screenshots)

**Workflow:**
```yaml
name: E2E Tests
on: [pull_request, schedule]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: make setup
      - run: make test-synthetic
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: playwright-report/
```

**Estimated Effort**: 4-6 hours

---

### 7. **Visual Regression Testing**
**Status**: 🔵 Not Started
**Priority**: Low
**Assignee**: TBD

**Goal**: Detect unintended UI changes

**Implementation:**
- Use Playwright's visual comparison
- Store baseline screenshots
- Diff on each run
- Threshold for acceptable changes

**Example:**
```typescript
test('homepage looks correct', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,
  });
});
```

**Estimated Effort**: 1-2 days

---

### 8. **Test Data Management**
**Status**: 🔵 Not Started
**Priority**: Low
**Assignee**: TBD

**Goal**: Factories for creating test data

**Problem**: Tests hardcode data, hard to maintain

**Solution**: Test data factories

**Example:**
```typescript
// shared/factories/user-factory.ts
export const createTestUser = (overrides) => ({
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'user',
  ...overrides,
});

// In test:
const user = await createTestUser({ role: 'admin' });
```

**Estimated Effort**: 2-3 hours

---

### 9. **Mobile Testing (BrowserStack)**
**Status**: 🔵 Not Started
**Priority**: Low
**Assignee**: TBD

**Goal**: Test on real mobile devices

**Integration:**
- BrowserStack or Sauce Labs
- iOS and Android devices
- Mobile viewports already supported in Playwright

**Estimated Effort**: 4-6 hours (setup + config)

---

### 10. **AI-Powered Analysis**
**Status**: 🔵 Not Started
**Priority**: Low (Future)
**Assignee**: TBD

**Goal**: Intelligent test insights

**Features:**
- Flaky test identification (ML-based)
- Suggested fixes for failures
- Test optimization recommendations
- Anomaly detection in performance metrics

**Estimated Effort**: 1-2 weeks

---

## 🔥 Critical Bugs / Issues

### Issue #1: Screenshot Visibility
**Status**: 🔴 **URGENT**
**Severity**: High
**Impact**: User cannot verify test behavior visually

See "In Progress #2" above for details.

### Issue #2: Report Showing Random Tests
**Status**: 🔴 **URGENT**
**Severity**: High
**Impact**: User cannot see full test results

**Problem**: Report seems to show random subset of tests

**Investigation Needed:**
- Check if reports are being overwritten
- Verify test-results directory retention
- Ensure all test runs append to same report

**Next Steps:**
1. Reproduce issue
2. Check Playwright reporter configuration
3. Verify test execution logs

---

## 📊 Prioritization

**Immediate (This Week):**
1. 🔴 Fix screenshot visibility (#2)
2. 🔴 Fix report showing all tests (Issue #2)

**Short-term (Next 2 Weeks):**
1. 🟡 JSONL result persistence (#1)
2. 🔵 Slack integration (#3)
3. 🔵 Performance test expansion (#4)

**Medium-term (Next Month):**
1. 🔵 Module metadata manifest.yml (#5)
2. 🔵 CI/CD integration (#6)

**Long-term (Future):**
1. 🔵 Visual regression (#7)
2. 🔵 Test data factories (#8)
3. 🔵 Mobile testing (#9)
4. 🔵 AI-powered analysis (#10)

---

## 🎯 Success Metrics

**Current State (v1.0):**
- ✅ 10+ test modules across 3 pillars
- ✅ Auto-discovery system working
- ✅ Saved auth sessions (headless tests)
- ✅ Pre-flight checks (server health + tokens)
- ✅ 80%+ internal framework test coverage

**Goals (v1.5):**
- 📊 JSONL historical tracking working
- 📸 Screenshots visible for all tests
- 💬 Slack integration active
- 🚀 10+ performance test scenarios
- 🔄 CI/CD pipeline running

**Goals (v2.0):**
- 📈 Visual regression testing
- 🤖 AI-powered flaky test detection
- 📱 Mobile device testing
- 🏭 Test data factories

---

## 🤝 Contributing

Want to pick up a task?

1. Check "Planned Features" above
2. Assign yourself to a task (edit this file)
3. Move to "In Progress" section
4. Create PR when done
5. Update roadmap status

**Questions?** Ask in #e2e-testing Slack channel

---

**Last Updated**: 2026-02-20
**Maintainer**: Engineering Team
**Status Legend**:
🔴 Blocked/Urgent | 🟡 In Progress | 🔵 Planned | 🟢 Complete
