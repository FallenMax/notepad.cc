set -e

echo 'start deploy'
ssh root@128.199.69.214 << EOF
  cd /root/code/github/notepad.cc
  git pull
  npm install
  npm run enableCache
  pm2 restart pm2.json
EOF
echo 'done deploy'

