# Zero-dependency Node 24 production container for ThreadScout AI (`public_showcase` or `combined`)
FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4173 \
    THREADSCOUT_BIND_HOST=0.0.0.0 \
    THREADSCOUT_SURFACE_MODE=public_showcase \
    THREADSCOUT_STORAGE_MODE=sqlite \
    THREADSCOUT_DATA_DIR=/data

COPY --chown=node:node package.json ./
COPY --chown=node:node apps ./apps
COPY --chown=node:node packages ./packages
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node docs ./docs
COPY --chown=node:node CLAUDE.md README.md ./

RUN mkdir -p /data && chown -R node:node /data

USER node
VOLUME ["/data"]
EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4173) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/web/server.mjs"]
