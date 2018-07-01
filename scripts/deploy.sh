set -e

echo 'start deploy'
ssh root@128.199.240.2 -p9999 << EOF
  set -e
  rm -rf /root/code/github/notepad.cc_bak
  cp -r /root/code/github/notepad.cc{,_bak}
  cd /root/code/github/notepad.cc
  git pull
  yarn install
  yarn run build
  pm2 startOrRestart pm2.json
EOF
echo 'done deploy'

