set -e
cd /home/ubuntu/studyspace-backend
rm -rf /tmp/codex-backend-dist-482124e
mkdir -p /tmp/codex-backend-dist-482124e
python3 - <<'PY'
import zipfile
zipfile.ZipFile('/tmp/codex-backend-deploy-482124e.zip').extractall('/tmp/codex-backend-dist-482124e')
PY
rm -rf dist.backup-482124e
if [ -d dist ]; then mv dist dist.backup-482124e; fi
cp -a /tmp/codex-backend-dist-482124e/dist ./dist
pm2 restart studyspace-api
sleep 5
pm2 show studyspace-api | grep -E 'status|uptime|restarts'
PORT=$(grep -E '^PORT=' .env | tail -n 1 | cut -d= -f2)
if [ -z "$PORT" ]; then PORT=4000; fi
echo "HEALTH_PORT=$PORT"
curl -fsS http://127.0.0.1:$PORT/health