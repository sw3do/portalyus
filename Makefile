.PHONY: help install build test clean dev prod docker-build docker-up docker-down docker-logs format lint audit migrate

# Default target
help:
	@echo "Portalyus Development Commands"
	@echo ""
	@echo "Setup:"
	@echo "  install     Install all dependencies"
	@echo "  migrate     Run database migrations"
	@echo ""
	@echo "Development:"
	@echo "  dev         Start development servers"
	@echo "  dev-db      Start development database only"
	@echo "  format      Format all code"
	@echo "  lint        Lint all code"
	@echo "  test        Run all tests"
	@echo ""
	@echo "Building:"
	@echo "  build       Build for production"
	@echo "  clean       Clean build artifacts"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build    Build Docker images"
	@echo "  docker-up       Start all services with Docker"
	@echo "  docker-down     Stop all Docker services"
	@echo "  docker-logs     Show Docker logs"
	@echo "  docker-dev      Start development services with Docker"
	@echo ""
	@echo "Security:"
	@echo "  audit       Run security audits"

# Installation
install: install-backend install-frontend

install-backend:
	@echo "Installing Rust dependencies..."
	cd backend && cargo build
	@echo "Installing sqlx-cli..."
	cargo install sqlx-cli --no-default-features --features postgres

install-frontend:
	@echo "Installing Node.js dependencies..."
	cd frontend && npm install

# Database
migrate:
	@echo "Running database migrations..."
	cd backend && sqlx migrate run

# Development
dev:
	@echo "Starting development servers..."
	@echo "Backend will be available at http://localhost:8000"
	@echo "Frontend will be available at http://localhost:3000"
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && cargo run

dev-frontend:
	cd frontend && npm run dev

dev-db:
	@echo "Starting development database..."
	docker-compose -f docker-compose.dev.yml up postgres-dev redis-dev

# Building
build: build-backend build-frontend

build-backend:
	@echo "Building backend for production..."
	cd backend && cargo build --release

build-frontend:
	@echo "Building frontend for production..."
	cd frontend && npm run build

# Testing
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd backend && cargo test

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm test

# Code Quality
format: format-backend format-frontend

format-backend:
	@echo "Formatting Rust code..."
	cd backend && cargo fmt

format-frontend:
	@echo "Formatting frontend code..."
	cd frontend && npm run format || true

lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting Rust code..."
	cd backend && cargo clippy -- -D warnings

lint-frontend:
	@echo "Linting frontend code..."
	cd frontend && npm run lint || true

# Security
audit: audit-backend audit-frontend

audit-backend:
	@echo "Running Rust security audit..."
	cargo install cargo-audit
	cd backend && cargo audit

audit-frontend:
	@echo "Running Node.js security audit..."
	cd frontend && npm audit

# Cleaning
clean: clean-backend clean-frontend

clean-backend:
	@echo "Cleaning backend build artifacts..."
	cd backend && cargo clean

clean-frontend:
	@echo "Cleaning frontend build artifacts..."
	cd frontend && rm -rf dist node_modules/.cache .astro

# Docker Commands
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting all services with Docker..."
	docker-compose up -d
	@echo "Services started:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:8000"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis: localhost:6379"

docker-down:
	@echo "Stopping all Docker services..."
	docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

docker-dev:
	@echo "Starting development services with Docker..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development services started:"
	@echo "  PostgreSQL: localhost:5433"
	@echo "  Redis: localhost:6380"
	@echo "  pgAdmin: http://localhost:5050"
	@echo "  Redis Commander: http://localhost:8081"

docker-dev-down:
	@echo "Stopping development Docker services..."
	docker-compose -f docker-compose.dev.yml down

# Production deployment
prod: build
	@echo "Production build completed!"
	@echo "Backend binary: backend/target/release/portalyus"
	@echo "Frontend assets: frontend/dist/"

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/health || echo "Backend not responding"
	@curl -f http://localhost:3000/health || echo "Frontend not responding"

# Database operations
db-reset:
	@echo "Resetting database..."
	cd backend && sqlx database drop -y && sqlx database create && sqlx migrate run

db-seed:
	@echo "Seeding database..."
	@echo "Add your seed commands here"

# Git hooks setup
setup-hooks:
	@echo "Setting up git hooks..."
	@echo "#!/bin/sh" > .git/hooks/pre-commit
	@echo "make format lint" >> .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "Git hooks installed!"

# Quick start for new developers
quickstart:
	@echo "Quick start setup for new developers..."
	make install
	make dev-db
	sleep 5
	make migrate
	@echo "Setup complete! Run 'make dev' to start development servers."