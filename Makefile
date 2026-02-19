.PHONY: help setup up down test test-synthetic test-integration test-performance clean credentials results install test-framework

# Default target - show help
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Lium E2E Testing Framework"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Initial setup (install deps, create dirs, setup creds)"
	@echo "  make install        - Install/update dependencies only"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Interactive test runner (prompts for pillar/env)"
	@echo "  make up             - Alias for 'make test'"
	@echo "  make test-synthetic - Run synthetic tests (will prompt for environment)"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-performance - Run performance tests"
	@echo "  make test-framework - Run internal unit tests"
	@echo ""
	@echo "Credentials:"
	@echo "  make credentials    - Setup credentials for an environment"
	@echo ""
	@echo "Results:"
	@echo "  make results        - View recent test results"
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
	@mkdir -p credentials results reports
	@chmod 700 credentials
	@echo ""
	@echo "🔐 Credential Setup"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "Credentials will be stored locally in ./credentials/"
	@echo "These files are gitignored and never committed."
	@echo ""
	@echo "You can setup credentials now or later with 'make credentials'"
	@echo ""
	@read -p "Setup credentials now? (y/N): " answer; \
	if [ "$$answer" = "y" ] || [ "$$answer" = "Y" ]; then \
		$(MAKE) credentials; \
	else \
		echo "Skipping credential setup. Run 'make credentials' when ready."; \
	fi
	@echo ""
	@echo "✅ Setup complete! Run 'make test' to start testing."

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@npm install
	@npx playwright install

# Interactive test runner
test:
	@echo "Starting interactive test runner..."
	@npm run cli

# Alias for intuitive 'up' command
up: test

# Run specific test pillars
test-synthetic:
	@echo "Running synthetic tests..."
	@npm run cli -- run --pillar=synthetic

test-integration:
	@echo "Running integration tests..."
	@npm run cli -- run --pillar=integration

test-performance:
	@echo "Running performance tests..."
	@npm run cli -- run --pillar=performance

# Run internal framework tests
test-framework:
	@echo "🧪 Testing the testing framework..."
	@npm run test:unit
	@echo "✅ Framework tests passed"

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
