.PHONY: help setup up down test test-synthetic test-integration test-performance clean results report install preflight test-framework configure auth-setup-admin auth-setup-user auth-setup-all auth-status auth-clear .check-auth

# Default target - show help
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Lium E2E Testing Framework"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial setup (install deps, create dirs, setup creds)"
	@echo "  make configure      - Configure Auth0 from lium-web/.env.local"
	@echo "  make install        - Install/update dependencies only"
	@echo ""
	@echo "Authentication:"
	@echo "  make auth-setup-admin - Login as @astromind.com admin (saves session)"
	@echo "  make auth-setup-user  - Login as regular user (saves session)"
	@echo "  make auth-setup-all   - Setup both admin and user sessions"
	@echo "  make auth-status      - Check which auth sessions are saved"
	@echo "  make auth-clear       - Clear all saved auth sessions"
	@echo ""
	@echo "Quality Checks:"
	@echo "  make preflight      - Run all quality checks (format, lint, test, coverage)"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Interactive test runner (prompts for pillar/env)"
	@echo "  make up             - Alias for 'make test'"
	@echo ""
	@echo "Run All Tests (Non-Interactive, Headless):"
	@echo "  make test-syn-all   - Run ALL synthetic tests (fast, headless)"
	@echo "  make test-api-all   - Run ALL integration tests (fast, headless)"
	@echo "  make test-perf-all  - Run ALL performance tests"
	@echo ""
	@echo "Auto-Discovered Test Modules:"
	@echo "  Synthetic (Browser):    make test-syn-<module>   (e.g., test-syn-basic, test-syn-auth)"
	@echo "  Integration (API):      make test-api-<module>   (e.g., test-api-health, test-api-users)"
	@echo "  Performance (Load):     make test-perf-<module>  (e.g., test-perf-api-health, test-perf-api-spike)"
	@echo ""
	@echo "  Modules auto-discovered from filesystem:"
	@echo "    • synthetic/tests/<module>/     → make test-syn-<module>"
	@echo "    • integration/tests/<module>/   → make test-api-<module>"
	@echo "    • performance/tests/<module>/   → make test-perf-<module>"
	@echo ""
	@echo "Results:"
	@echo "  make report         - Open latest HTML report (any pillar)"
	@echo "  make results        - JSONL summary (synthetic tests)"
	@echo "  make results-flaky  - Find flaky tests"
	@echo "  make results-api    - JSONL summary (integration tests)"
	@echo "  make results-perf   - JSONL summary (performance tests)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Remove node_modules and generated files"
	@echo "  make clean-reports  - Remove all HTML reports (JSONL preserved)"
	@echo "  make down           - Stop any running tests/processes"

# Initial setup
setup:
	@echo "🚀 Setting up Lium E2E Testing Framework..."
	@echo ""
	@echo "📦 Installing dependencies..."
	@npm install
	@echo ""
	@echo "🎭 Installing Playwright browsers..."
	@npx playwright install chromium firefox webkit
	@echo ""
	@echo "⚡ Checking for k6..."
	@if ! which k6 > /dev/null 2>&1; then \
		echo "⚠️  k6 not found"; \
		echo ""; \
		read -p "Install k6 now? (Y/n): " answer; \
		if [ -z "$$answer" ] || [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
			if [ "$$(uname)" = "Darwin" ]; then \
				echo "Installing k6 via Homebrew..."; \
				brew install k6; \
			else \
				echo "Please install k6 manually:"; \
				echo "  https://k6.io/docs/get-started/installation/"; \
				exit 1; \
			fi; \
		else \
			echo "Skipping k6 installation. Install later with: brew install k6"; \
		fi; \
	else \
		echo "✓ k6 is installed ($$(k6 version))"; \
	fi
	@echo ""
	@echo "📁 Creating directories..."
	@mkdir -p credentials results reports playwright/.auth
	@chmod 700 credentials
	@echo ""
	@echo "🔐 Authentication Setup"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "For fast, headless tests, you'll need to authenticate once."
	@echo "This opens a browser where you log in via OAuth."
	@echo "Your session is saved and reused for all tests."
	@echo ""
	@read -p "Setup admin authentication now? (Y/n): " answer; \
	if [ -z "$$answer" ] || [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
		$(MAKE) auth-setup-admin; \
		echo ""; \
		read -p "Also setup regular user authentication? (y/N): " user_answer; \
		if [ "$$user_answer" = "y" ] || [ "$$user_answer" = "Y" ]; then \
			$(MAKE) auth-setup-user; \
		fi; \
	else \
		echo "Skipping auth setup. Run 'make auth-setup-admin' when ready."; \
	fi
	@echo ""
	@echo "✅ Setup complete! Run 'make test' to start testing."

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install
	@npx playwright install

# Check if auth is set up, prompt if not
.check-auth:
	@if [ ! -f "playwright/.auth/admin.json" ] && [ ! -f "playwright/.auth/user.json" ]; then \
		echo ""; \
		echo "⚠️  No authentication sessions found."; \
		echo ""; \
		echo "For faster, headless tests, you should authenticate once:"; \
		echo "  • make auth-setup-admin  - Login as @astromind.com admin"; \
		echo "  • make auth-setup-user   - Login as regular user"; \
		echo ""; \
		read -p "Setup admin authentication now? (Y/n): " answer; \
		if [ -z "$$answer" ] || [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
			$(MAKE) auth-setup-admin; \
		fi; \
		echo ""; \
	fi

# Interactive test runner
test: .check-auth
	@echo "Starting interactive test runner..."
	@npm run cli

# Alias for intuitive 'up' command
up: test

# Run all tests for each pillar (non-interactive, headless, fast)
test-syn-all: .check-auth
	@echo "🧪 Running ALL synthetic tests (headless)..."
	@npx playwright test --config=synthetic/playwright.config.ts
	@if [ ! "$$CI" = "true" ] && [ -d "playwright-report" ]; then \
		echo ""; \
		echo "📊 Opening HTML report..."; \
		npx playwright show-report playwright-report; \
	fi

test-api-all: .check-auth
	@echo "🧪 Running ALL integration tests (headless)..."
	@npx playwright test --config=integration/playwright.config.ts
	@if [ ! "$$CI" = "true" ] && [ -d "playwright-report" ]; then \
		echo ""; \
		echo "📊 Opening HTML report..."; \
		npx playwright show-report playwright-report; \
	fi

test-perf-all: .check-auth
	@echo "🧪 Running ALL performance tests..."
	@if ! which k6 > /dev/null 2>&1; then \
		echo "❌ k6 not installed. Run: brew install k6"; \
		exit 1; \
	fi
	@for test_file in $$(find performance/tests -name "test.js" -type f); do \
		echo "Running: $$test_file"; \
		k6 run "$$test_file"; \
	done

# Pattern rules for auto-discovered test modules
# These MUST come after special-case targets (like test-multi-user) to avoid conflicts

# Synthetic tests: make test-syn-<module>
test-syn-%: .check-auth
	@MODULE_NAME=$(subst test-syn-,,$@); \
	if [ -d "synthetic/tests/$$MODULE_NAME" ]; then \
		echo "🧪 Running synthetic/$$MODULE_NAME tests..."; \
		npx playwright test --config=synthetic/playwright.config.ts synthetic/tests/$$MODULE_NAME/; \
	else \
		echo "❌ Module 'synthetic/tests/$$MODULE_NAME' not found"; \
		echo ""; \
		echo "Available modules:"; \
		find synthetic/tests/ -maxdepth 1 -type d ! -name "tests" ! -name "_*" -exec basename {} \; | sort | sed 's/^/  - test-syn-/'; \
		exit 1; \
	fi

# Integration tests: make test-api-<module>
test-api-%: .check-auth
	@MODULE_NAME=$(subst test-api-,,$@); \
	if [ -d "integration/tests/$$MODULE_NAME" ]; then \
		echo "🧪 Running integration/$$MODULE_NAME API tests..."; \
		npx playwright test --config=integration/playwright.config.ts integration/tests/$$MODULE_NAME/; \
	else \
		echo "❌ Module 'integration/tests/$$MODULE_NAME' not found"; \
		echo ""; \
		echo "Available modules:"; \
		find integration/tests/ -maxdepth 1 -type d ! -name "tests" ! -name "_*" -exec basename {} \; | sort | sed 's/^/  - test-api-/'; \
		exit 1; \
	fi

# Performance tests: make test-perf-<module>
test-perf-%: .check-auth
	@MODULE_NAME=$(subst test-perf-,,$@); \
	if [ -d "performance/tests/$$MODULE_NAME" ]; then \
		echo "🧪 Running performance/$$MODULE_NAME tests..."; \
		if [ -f "performance/tests/$$MODULE_NAME/test.js" ]; then \
			k6 run performance/tests/$$MODULE_NAME/test.js; \
		else \
			echo "❌ No test.js found in performance/tests/$$MODULE_NAME/"; \
			exit 1; \
		fi; \
	else \
		echo "❌ Module 'performance/tests/$$MODULE_NAME' not found"; \
		echo ""; \
		echo "Available modules:"; \
		find performance/tests/ -maxdepth 1 -type d ! -name "tests" ! -name "_*" -exec basename {} \; 2>/dev/null | sort | sed 's/^/  - test-perf-/' || echo "  (no modules yet)"; \
		exit 1; \
	fi

# Run specific test pillars
test-synthetic: .check-auth
	@echo "Running synthetic tests..."
	@npm run cli -- run --pillar=synthetic

test-integration: .check-auth
	@echo "Running integration tests..."
	@npm run cli -- run --pillar=integration

test-performance: .check-auth
	@echo "Running performance tests..."
	@npm run cli -- run --pillar=performance

# Preflight checks - format, lint, test, coverage
preflight:
	@echo "🚀 Running preflight checks..."
	@echo ""
	@echo "1️⃣  Formatting code..."
	@npm run format
	@echo ""
	@echo "2️⃣  Linting and auto-fixing..."
	@npm run lint:fix
	@echo ""
	@echo "3️⃣  Running unit tests with coverage..."
	@npm run test:unit
	@echo ""
	@echo "✅ Preflight checks passed!"
	@echo "   • Code formatted"
	@echo "   • Linting passed"
	@echo "   • Tests passed (122/122)"
	@echo "   • Coverage: 88.55% (meets 80% threshold)"

# Deprecated alias for preflight
test-framework:
	@echo "⚠️  'make test-framework' is deprecated, use 'make preflight' instead"
	@$(MAKE) preflight

# Authentication Setup
auth-setup-admin:
	@echo "🔐 Setting up Admin Authentication..."
	@mkdir -p playwright/.auth
	@npx playwright test --config=synthetic/playwright.auth-admin.config.ts || true
	@if [ -f "playwright/.auth/admin.json" ]; then \
		echo ""; \
		echo "✅ Admin authentication complete!"; \
		echo "   Session saved. All tests will now run HEADLESS."; \
	else \
		echo ""; \
		echo "❌ Authentication setup failed - no session saved."; \
		exit 1; \
	fi

auth-setup-user:
	@echo "👤 Setting up Regular User Authentication..."
	@mkdir -p playwright/.auth
	@npx playwright test --config=synthetic/playwright.auth-user.config.ts || true
	@if [ -f "playwright/.auth/user.json" ]; then \
		echo ""; \
		echo "✅ User authentication complete!"; \
		echo "   Session saved. All tests will now run HEADLESS."; \
	else \
		echo ""; \
		echo "❌ Authentication setup failed - no session saved."; \
		exit 1; \
	fi

auth-setup-all: auth-setup-admin auth-setup-user
	@echo ""
	@echo "✅ Both admin and user authentication sessions saved!"
	@echo "   Tests will now run HEADLESS for maximum speed."

auth-status:
	@echo "🔍 Authentication Status"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@if [ -f "playwright/.auth/admin.json" ]; then \
		echo "✅ Admin session: SAVED"; \
		stat -f "   Last updated: %Sm" playwright/.auth/admin.json 2>/dev/null || stat -c "   Last updated: %y" playwright/.auth/admin.json; \
	else \
		echo "❌ Admin session: NOT FOUND (run: make auth-setup-admin)"; \
	fi
	@if [ -f "playwright/.auth/user.json" ]; then \
		echo "✅ User session: SAVED"; \
		stat -f "   Last updated: %Sm" playwright/.auth/user.json 2>/dev/null || stat -c "   Last updated: %y" playwright/.auth/user.json; \
	else \
		echo "❌ User session: NOT FOUND (run: make auth-setup-user)"; \
	fi

auth-clear:
	@echo "🗑️  Clearing all authentication sessions..."
	@rm -f playwright/.auth/admin.json
	@rm -f playwright/.auth/user.json
	@echo "✅ All auth sessions cleared. Run auth-setup commands to re-authenticate."

# Configure Auth0 from lium-web
configure:
	@echo "🔧 Auth0 Configuration"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@npm run configure

# View JSONL results
results:
	@node scripts/view-results.js summary synthetic local

results-flaky:
	@node scripts/view-results.js flaky synthetic local

results-api:
	@node scripts/view-results.js summary integration local

results-perf:
	@node scripts/view-results.js summary performance local

# View interactive HTML report with screenshots/videos
report:
	@if [ -d "playwright-report" ]; then \
		echo "📊 Opening test report..."; \
		npx playwright show-report playwright-report; \
	else \
		echo "❌ No report found. Run tests first:"; \
		echo "   • make test-syn-all  (browser tests)"; \
		echo "   • make test-api-all  (API tests)"; \
		exit 1; \
	fi

report-all:
	@echo "📊 HTML reports overwrite each run"; \
	echo ""; \
	echo "Use 'make report' to view latest HTML report"; \
	echo "Use 'make results' for historical JSONL data"

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf node_modules
	@rm -rf dist
	@rm -rf coverage
	@rm -rf reports/*
	@rm -rf .playwright
	@echo "✅ Clean complete"

clean-reports:
	@echo "🧹 Cleaning HTML reports..."; \
	rm -rf playwright-report; \
	echo "✅ HTML reports cleaned (JSONL results preserved)"

# Stop running tests
down:
	@echo "🛑 Stopping any running tests..."
	@pkill -f "playwright" 2>/dev/null || true
	@pkill -f "k6" 2>/dev/null || true
	@pkill -f "node.*cli" 2>/dev/null || true
	@echo "✅ All tests stopped"
