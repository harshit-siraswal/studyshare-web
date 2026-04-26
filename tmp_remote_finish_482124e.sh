set -e
cd /home/ubuntu/studyspace-backend
rm -rf dist
cp -a /tmp/codex-backend-dist-targz/dist ./dist
test -f ./dist/index.js
pm2 restart studyspace-api
sleep 5
pm2 show studyspace-api | grep -E 'status|uptime|restarts'
PORT=$(grep -E '^PORT=' .env | tail -n 1 | cut -d= -f2)
if [ -z "$PORT" ]; then PORT=4000; fi
echo "HEALTH_PORT=$PORT"
curl -fsS http://127.0.0.1:$PORT/health