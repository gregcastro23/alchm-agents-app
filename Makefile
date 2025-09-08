# Planetary Agents - Development Makefile

.PHONY: help install dev build start lint type-check clean test setup

# Default target
help: ## Show this help message
	@echo "Planetary Agents - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development commands
install: ## Install dependencies
	yarn install

dev: ## Start development server
	yarn dev

build: ## Build for production
	yarn build

start: ## Start production server
	yarn start

# Code quality
lint: ## Run linter
	yarn lint

type-check: ## Run TypeScript type checking
	yarn tsc --noEmit

check: lint type-check ## Run all checks (lint + type-check)

# Testing - Core
test: ## Run all tests
	@echo "Running all tests..."
	@make test-alchemical
	@make test-monica
	@make test-claude

test-all: test ## Run complete test suite

# Testing - Claude Integration
test-claude: ## Test Claude models and configuration
	@echo "Testing Claude models..."
	@yarn test:claude

# Testing - Monica Agent System
test-monica: ## Test Monica agent and interface
	@echo "Testing Monica agent..."
	@node test-monica-system.js

test-monica-tarot: ## Test Monica tarot expertise
	@echo "Testing Monica tarot system..."
	@node test-monica-tarot.js

test-monica-constant: ## Test Monica Constant calculations
	@echo "Testing Monica Constant..."
	@node test-monica-constant.js

test-monica-advanced: ## Test Monica advanced features
	@echo "Testing Monica advanced system..."
	@node test-monica-advanced-system.js

# Testing - Alchemical Trainer
test-alchemical: ## Run comprehensive alchemical tests
	@echo "Testing Alchemical Trainer..."
	@node test-alchemical-comprehensive.js

test-alchemical-edge: ## Test edge cases for alchemical trainer
	@echo "Testing Alchemical Trainer edge cases..."
	@node test-alchemical-edge-cases.js

test-alchemical-api: ## Test alchemical API endpoints
	@echo "Testing Alchemical API..."
	@curl -s http://localhost:3000/api/monica-agent/train-alchemical?mode=info | jq '.'

# Monica Alchemical Training
train-alchemical: ## Run alchemical training (standard mode)
	@echo "Running alchemical training..."
	@curl -X POST http://localhost:3000/api/monica-agent/train-alchemical \
		-H "Content-Type: application/json" \
		-d '{"mode":"standard","numSamples":10}' | jq '.'

train-hourly: ## Run hourly alchemical analysis
	@echo "Running hourly alchemical analysis..."
	@curl -X POST http://localhost:3000/api/monica-agent/train-alchemical \
		-H "Content-Type: application/json" \
		-d '{"mode":"hourly"}' | jq '.'

train-retrograde: ## Run retrograde impact analysis
	@echo "Running retrograde analysis..."
	@curl -X POST http://localhost:3000/api/monica-agent/train-alchemical \
		-H "Content-Type: application/json" \
		-d '{"mode":"retrograde","numSamples":5}' | jq '.'

# Development setup
setup: install ## Initial project setup
	@echo "Setting up Planetary Agents development environment..."
	@if [ ! -f .env.local ]; then \
		echo "Creating .env.local template..."; \
		echo "OPENAI_API_KEY=your_openai_key_here" > .env.local; \
		echo "ANTHROPIC_API_KEY=your_anthropic_key_here" >> .env.local; \
		echo "CLAUDE_DEFAULT_MODEL=claude-3-5-sonnet-20241022" >> .env.local; \
		echo "CLAUDE_FAST_MODEL=claude-3-5-haiku-20241022" >> .env.local; \
		echo "DATABASE_URL=postgresql://username:password@localhost:5432/planetary_agents" >> .env.local; \
		echo "REDIS_URL=redis://localhost:6379" >> .env.local; \
		echo "Please update .env.local with your API keys and database credentials"; \
	fi
	@echo "Setup complete! Run 'make dev' to start development."

# Database commands
db-push: ## Push database schema changes
	yarn prisma db push

db-studio: ## Open Prisma Studio
	yarn prisma studio

db-generate: ## Generate Prisma client
	yarn prisma generate

db-migrate: ## Run database migrations
	yarn prisma migrate dev

# Utility commands
clean: ## Clean build artifacts and dependencies
	rm -rf .next
	rm -rf node_modules
	rm -rf dist
	rm -rf dev.log

clean-cache: ## Clean Next.js cache
	rm -rf .next/cache

fresh: clean install ## Clean reinstall of dependencies

restart: ## Restart dev server
	@echo "Restarting development server..."
	@pkill -f "next dev" || true
	@sleep 2
	@make dev

# Project maintenance
update: ## Update dependencies
	yarn upgrade

update-types: ## Update TypeScript type definitions
	yarn add -D @types/node@latest @types/react@latest @types/react-dom@latest

# Git helpers
commit-ready: check test ## Prepare for commit (run checks and tests)
	@echo "Code is ready for commit!"

status: ## Show git status
	@git status

# Monica-specific commands
monica-dev: ## Start dev server for Monica development
	@echo "Starting development server for Monica..."
	@yarn dev

monica-guide: ## Open Monica guide page
	@echo "Monica guide available at: http://localhost:3000/monica-guide"
	@open http://localhost:3000/monica-guide 2>/dev/null || echo "Please open manually"

monica-chat: ## Open Monica chat interface
	@echo "Monica chat available at: http://localhost:3000/monica"
	@open http://localhost:3000/monica 2>/dev/null || echo "Please open manually"

# Monitoring and Debugging
logs: ## Tail development logs
	@tail -f dev.log

logs-errors: ## Show only errors in logs
	@grep -i "error\|fail\|warn" dev.log | tail -50

server-status: ## Check if dev server is running
	@ps aux | grep "next dev" | grep -v grep || echo "Server not running"

port-check: ## Check if port 3000 is in use
	@lsof -i :3000 || echo "Port 3000 is free"

# Performance monitoring
perf-check: ## Check bundle size
	@yarn build
	@echo "Bundle analysis complete. Check .next/analyze/ for details"

# Development shortcuts
d: dev ## Shortcut for dev
b: build ## Shortcut for build
l: lint ## Shortcut for lint
t: type-check ## Shortcut for type-check
m: test-monica ## Shortcut for Monica tests
a: test-alchemical ## Shortcut for alchemical tests
r: restart ## Shortcut for restart
s: server-status ## Shortcut for server status

# Quick test commands
qt: ## Quick test - runs fast tests only
	@make test-alchemical-api
	@make server-status

full-test: check test-all ## Run all checks and tests

# Production deployment helpers
prod-ready: clean install build test-all ## Prepare for production deployment
	@echo "Application is ready for production deployment!"

# Docker commands (if using Docker)
docker-build: ## Build Docker image
	docker build -t planetary-agents .

docker-run: ## Run Docker container
	docker run -p 3000:3000 planetary-agents

# Help aliases
h: help ## Alias for help
?: help ## Alias for help

# Color output helpers
define ANNOUNCE
	@echo "\033[1;36m===> $(1)\033[0m"
endef

# Monica Constant specific
test-mc: test-monica-constant ## Shortcut for Monica Constant test
calc-mc: ## Calculate Monica Constant for sample data
	@echo "Calculating Monica Constant for sample data..."
	@curl -X POST http://localhost:3000/api/monica-agent \
		-H "Content-Type: application/json" \
		-d '{"message":"Calculate the Monica Constant for Spirit: 5, Essence: 7, Matter: 3, Substance: 2","includeAlchm":true}' | jq '.response'

# Performance monitoring
perf-stats: ## Show performance cache statistics
	@echo "Fetching performance statistics..."
	@curl -s "http://localhost:3000/api/performance?action=stats" | jq '.'

perf-clear: ## Clear all performance cache
	@echo "Clearing all performance cache..."
	@curl -s "http://localhost:3000/api/performance?action=clear" | jq '.'

perf-clear-planetary: ## Clear planetary position cache
	@echo "Clearing planetary position cache..."
	@curl -s "http://localhost:3000/api/performance?action=clear&type=planetary" | jq '.'

perf-clear-alchemical: ## Clear alchemical calculation cache
	@echo "Clearing alchemical calculation cache..."
	@curl -s "http://localhost:3000/api/performance?action=clear&type=alchemical" | jq '.'

perf-benchmark: ## Run performance benchmark
	@echo "Running performance benchmark..."
	@curl -X POST "http://localhost:3000/api/performance" \
		-H "Content-Type: application/json" \
		-d '{"action":"benchmark"}' | jq '.'

# Environment info
env-check: ## Check environment setup
	@echo "Checking environment..."
	@[ -f .env.local ] && echo "✅ .env.local exists" || echo "❌ .env.local missing"
	@[ -f node_modules/.bin/next ] && echo "✅ Dependencies installed" || echo "❌ Dependencies not installed"
	@[ -d .next ] && echo "✅ Build artifacts exist" || echo "⚠️  No build artifacts"
	@make server-status