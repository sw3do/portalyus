# Build stage
FROM rust:1.75 as builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this will be cached)
RUN cargo build --release
RUN rm src/main.rs

# Copy source code
COPY src ./src
COPY migrations ./migrations

# Build the application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1001 appuser

WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/portalyus /app/portalyus
COPY --from=builder /app/migrations /app/migrations

# Create uploads directory
RUN mkdir -p uploads/videos uploads/thumbnails uploads/temp uploads/channels

# Change ownership to app user
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["./portalyus"]