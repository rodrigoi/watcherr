#!/bin/sh
touch /tmp/cron.log
chmod 666 /tmp/cron.log
tail -f /tmp/cron.log &
exec crond -f
