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

# Testing
test: ## Run tests
	@echo "Running Claude upgrade test..."
	@yarn test:claude

test-claude: ## Test Claude models and configuration
	@yarn test:claude

test-monica: ## Test Monica agent and interface
	@echo "Testing Monica agent..."
	@node test-monica-system.js

test-monica-tarot: ## Test Monica tarot expertise
	@echo "Testing Monica tarot system..."
	@node test-monica-tarot.js

test-monica-constant: ## Test Monica Constant calculations
	@echo "Testing Monica Constant..."
	@node test-monica-constant.js

# Development setup
setup: install ## Initial project setup
	@echo "Setting up Planetary Agents development environment..."
	@if [ ! -f .env.local ]; then \
		echo "Creating .env.local template..."; \
		echo "OPENAI_API_KEY=your_openai_key_here" > .env.local; \
		echo "ANTHROPIC_API_KEY=your_anthropic_key_here" >> .env.local; \
		echo "CLAUDE_DEFAULT_MODEL=claude-3-5-sonnet-20241022" >> .env.local; \
		echo "CLAUDE_FAST_MODEL=claude-3-5-haiku-20241022" >> .env.local; \
		echo "Please update .env.local with your API keys"; \
	fi
	@echo "Setup complete! Run 'make dev' to start development."

# Utility commands
clean: ## Clean build artifacts and dependencies
	rm -rf .next
	rm -rf node_modules
	rm -rf dist

fresh: clean install ## Clean reinstall of dependencies

# Project maintenance
update: ## Update dependencies
	yarn upgrade

# Git helpers
commit-ready: check ## Prepare for commit (run checks)
	@echo "Code is ready for commit!"

# Monica-specific commands
monica-dev: ## Start dev server for Monica development
	@echo "Starting development server for Monica..."
	@yarn dev

monica-guide: ## Open Monica guide page
	@echo "Monica guide available at: http://localhost:3000/monica-guide"

# Development shortcuts
d: dev ## Shortcut for dev
b: build ## Shortcut for build
l: lint ## Shortcut for lint
t: type-check ## Shortcut for type-check
m: test-monica ## Shortcut for Monica tests