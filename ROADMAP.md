# Lium E2E Testing Framework - Roadmap

> **Status**: 🟢 Active Development
> **Last Updated**: 2026-02-20

This roadmap outlines the next big features and enhancements for the Lium E2E testing framework.

---

## ✅ Completed (v1.0 - POC)

- [x] **Auto-discoverable test modules** - Add folder → command works
- [x] **Three-pillar architecture** - Synthetic, Integration, Performance
- [x] **Saved authentication sessions** - One-time login, reused forever
- [x] **Unified authentication** - Synthetic and integration tests share auth cookies
- [x] **Auto-discovery system** - ModuleScanner + pattern rules
- [x] **Pre-flight checks** - Server health (fail fast) + token validation
- [x] **Automatic token refresh** - Detects expired tokens, auto-refreshes when possible
- [x] **Auto-opening HTML reports** - Reports open automatically after test runs
- [x] **Interactive CLI** - `make test` menu for easy test selection
- [x] **k6 performance testing** - Advanced scenarios (baseline, spike, stress)
- [x] **Module metadata (manifest.yml)** - Optional customization for test modules
- [x] **Tenant management test suite** - Complete member lifecycle testing
- [x] **UI discovery methodology** - Automated selector discovery and documentation
- [x] **Consolidated HTML reports** - All tests in single report with screenshots
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

### 2. **Performance Testing - Expand Coverage**

**Status**: 🟢 POC Complete, Ready for Expansion
**Priority**: Medium
**Assignee**: TBD

**Current State:**

- ✅ k6 installed and working
- ✅ Advanced API load testing POC complete
- ✅ Three scenarios implemented: baseline, spike, stress
- ✅ Custom metrics: error rate, API latency, auth failures
- ✅ User behavior simulation (read-heavy, balanced, write-heavy)
- ✅ Auto-discovery pattern rule works

**Completed Tests:**

```
performance/tests/api-load/
├── simple-baseline.js   ✅ 3-min POC without auth
├── api-baseline.js      ✅ 8-min production-ready test
├── manifest.yml         ✅ Module metadata
├── README.md            ✅ Full documentation
└── POC-SUMMARY.md       ✅ Performance summary
```

**Next Expansion Opportunities:**

- Database query performance tests
- Service-to-service latency tests
- WebSocket/real-time performance
- File upload/download performance
- Search and filtering performance

**Estimated Effort for Expansion**: 1-2 days

---

### 3. **CI/CD Integration (GitHub Actions)**

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

### 4. **Visual Regression Testing**

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
test("homepage looks correct", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png", {
    maxDiffPixels: 100,
  });
});
```

**Estimated Effort**: 1-2 days

---

### 5. **Test Data Management**

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
  role: "user",
  ...overrides,
});

// In test:
const user = await createTestUser({ role: "admin" });
```

**Estimated Effort**: 2-3 hours

---

### 6. **Mobile Testing (BrowserStack)**

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

### 7. **AI-Powered Analysis**

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

_No critical bugs at this time._

---

## 📊 Prioritization

**Immediate (This Week):**

1. 🟡 JSONL result persistence (#1)

**Short-term (Next 2 Weeks):**

1. 🔵 Performance test expansion (#2)
2. 🔵 Slack integration (moved from #3)
3. 🔵 CI/CD integration (#3)

**Medium-term (Next Month):**

1. 🔵 Visual regression (#4)
2. 🔵 Test data factories (#5)

**Long-term (Future):**

1. 🔵 Mobile testing (#6)
2. 🔵 AI-powered analysis (#7)

---

## 🎯 Success Metrics

**Current State (v1.0):**

- ✅ 10+ test modules across 3 pillars
- ✅ Auto-discovery system working
- ✅ Saved auth sessions (headless tests)
- ✅ Unified authentication (browser + API tests)
- ✅ Pre-flight checks (server health + token auto-refresh)
- ✅ Auto-opening HTML reports
- ✅ 80%+ internal framework test coverage
- ✅ Module metadata via manifest.yml
- ✅ Advanced performance testing (baseline, spike, stress)
- ✅ Tenant management test suite
- ✅ UI discovery methodology
- ✅ All integration tests passing (8/8 health checks)

**Goals (v1.5):**

- 📊 JSONL historical tracking working
- 💬 Slack integration active
- 🚀 15+ performance test scenarios
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
