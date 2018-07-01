set -e

echo 'start deploy'
ssh root@128.199.240.2 -p9999 << EOF
  cd /root/code/github/notepad.cc
  git pull
  npm install
  npm run build
  pm2 restart pm2.json
EOF
echo 'done deploy'

