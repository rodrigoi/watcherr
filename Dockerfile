FROM oven/bun:alpine
WORKDIR /app

RUN addgroup -S watcherr && adduser -S -G watcherr watcherr

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY tsconfig.json ./
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# watcherr's crontab — crond (root) runs these jobs as the watcherr user.
# Jobs write to a named pipe created at runtime by entrypoint.sh.
RUN mkdir -p /var/spool/cron/crontabs \
    && printf '* * * * * /usr/local/bin/bun /app/src/index.ts >> /tmp/cron.log 2>&1\n* * * * * sleep 30 && /usr/local/bin/bun /app/src/index.ts >> /tmp/cron.log 2>&1\n' \
       > /var/spool/cron/crontabs/watcherr \
    && chmod 600 /var/spool/cron/crontabs/watcherr

ENTRYPOINT ["/entrypoint.sh"]
