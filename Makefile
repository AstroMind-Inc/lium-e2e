.PHONY: help setup up down test test-synthetic test-integration test-performance test-basic test-auth test-chats test-storage test-agents test-tools test-tenants test-multi-user test-api-health test-api-users test-api-tenants test-api-chats test-api-agents test-api-tools clean credentials results report install test-framework configure auth-setup-admin auth-setup-user auth-setup-all auth-status auth-clear .check-auth

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
	@echo "Testing:"
	@echo "  make test           - Interactive test runner (prompts for pillar/env)"
	@echo "  make up             - Alias for 'make test'"
	@echo ""
	@echo "Synthetic Test Modules (fast, focused browser tests):"
	@echo "  make test-basic     - Basic health checks & smoke tests"
	@echo "  make test-auth      - Authentication & session tests"
	@echo "  make test-chats     - Chat functionality tests"
	@echo "  make test-storage   - Storage & file upload tests"
	@echo "  make test-agents    - AI agent tests"
	@echo "  make test-tools     - Tool functionality tests"
	@echo "  make test-tenants   - Multi-tenancy tests"
	@echo ""
	@echo "Integration Test Modules (fast, focused API tests):"
	@echo "  make test-api-health   - API health checks"
	@echo "  make test-api-users    - User API endpoints"
	@echo "  make test-api-tenants  - Tenant API endpoints"
	@echo "  make test-api-chats    - Chat API endpoints"
	@echo "  make test-api-agents   - Agent API endpoints"
	@echo "  make test-api-tools    - Tool API endpoints"
	@echo ""
	@echo "Full Test Suites:"
	@echo "  make test-synthetic - Run ALL synthetic tests"
	@echo "  make test-integration - Run ALL integration tests"
	@echo "  make test-performance - Run performance tests"
	@echo "  make test-framework - Run internal unit tests"
	@echo ""
	@echo "Special:"
	@echo "  make test-multi-user - Run multi-user flow (admin + regular user)"
	@echo ""
	@echo "Credentials:"
	@echo "  make credentials    - Setup credentials for an environment"
	@echo ""
	@echo "Results:"
	@echo "  make report         - Open interactive HTML report (recommended!)"
	@echo "  make results        - CLI summary (requires JSONL - not yet implemented)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean          - Remove node_modules and generated files"
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
	@which k6 > /dev/null || (echo "⚠️  k6 not found. Install from https://k6.io/docs/get-started/installation/" && echo "   For macOS: brew install k6" && echo "   For Linux: sudo gpg -k && sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 && echo \"deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main\" | sudo tee /etc/apt/sources.list.d/k6.list && sudo apt-get update && sudo apt-get install k6")
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

# Run module-specific tests
test-basic: .check-auth
	@echo "🔍 Running basic tests (health checks)..."
	@npx playwright test synthetic/tests/basic/

test-auth: .check-auth
	@echo "🔐 Running authentication tests..."
	@npx playwright test synthetic/tests/auth/

test-chats: .check-auth
	@echo "💬 Running chat tests..."
	@npx playwright test synthetic/tests/chats/

test-storage: .check-auth
	@echo "📁 Running storage tests..."
	@npx playwright test synthetic/tests/storage/

test-agents: .check-auth
	@echo "🤖 Running agent tests..."
	@npx playwright test synthetic/tests/agents/

test-tools: .check-auth
	@echo "🔧 Running tool tests..."
	@npx playwright test synthetic/tests/tools/

test-tenants: .check-auth
	@echo "🏢 Running tenant tests..."
	@npx playwright test synthetic/tests/tenants/

# Run integration module-specific tests
test-api-health: .check-auth
	@echo "🔍 Running API health checks..."
	@npx playwright test integration/tests/health/

test-api-users: .check-auth
	@echo "👥 Running user API tests..."
	@npx playwright test integration/tests/users/

test-api-tenants: .check-auth
	@echo "🏢 Running tenant API tests..."
	@npx playwright test integration/tests/tenants/

test-api-chats: .check-auth
	@echo "💬 Running chat API tests..."
	@npx playwright test integration/tests/chats/

test-api-agents: .check-auth
	@echo "🤖 Running agent API tests..."
	@npx playwright test integration/tests/agents/

test-api-tools: .check-auth
	@echo "🔧 Running tool API tests..."
	@npx playwright test integration/tests/tools/

# Run multi-user flow test (admin + regular user) - HEADLESS
test-multi-user: .check-auth
	@echo "👥 Running multi-user flow test (headless)..."
	@npx playwright test synthetic/tests/user-flows/multi-user-flow-headless.spec.ts

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

# Run internal framework tests
test-framework:
	@echo "🧪 Testing the testing framework..."
	@npm run test:unit
	@echo "✅ Framework tests passed"

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

# Setup credentials
credentials:
	@echo "🔐 Credential Setup"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@npm run cli -- setup-credentials

# View results
results:
	@echo "📊 Recent Test Results"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@npm run cli -- view-results

# View interactive HTML report with screenshots/videos
report:
	@echo "📊 Opening interactive test report..."
	@npx playwright show-report playwright-report

# Cleanup
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf node_modules
	@rm -rf dist
	@rm -rf coverage
	@rm -rf reports/*
	@rm -rf .playwright
	@echo "✅ Clean complete"

# Stop running tests
down:
	@echo "🛑 Stopping any running tests..."
	@pkill -f "playwright" 2>/dev/null || true
	@pkill -f "k6" 2>/dev/null || true
	@pkill -f "node.*cli" 2>/dev/null || true
	@echo "✅ All tests stopped"
