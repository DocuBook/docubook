FROM oven/bun:1-debian

LABEL org.opencontainers.image.title="DocuBook Flame Builder"
LABEL org.opencontainers.image.description="Pre-installed @docubook/flame CLI — user supplies content via COPY or volume"
LABEL org.opencontainers.image.source="https://github.com/DocuBook/docubook"
LABEL org.opencontainers.image.licenses="MIT"

ARG FLAME_VERSION=latest

# Install flame CLI globally (available as `flame` from any WORKDIR)
RUN bun install -g @docubook/flame@${FLAME_VERSION} && \
    flame --help > /dev/null 2>&1

WORKDIR /app
