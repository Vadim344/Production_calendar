FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy the pre-built standalone
COPY --chown=nextjs:nodejs .next/standalone/ ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

# Prisma
COPY node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

USER nextjs
EXPOSE 3000
CMD [" node\, \server.js\]
