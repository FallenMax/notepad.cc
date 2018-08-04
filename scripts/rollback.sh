set -e

echo 'start rollback'

ssh root@139.59.222.188 -p9999 << EOF
  set -e
  echo 'rollback started...'
  cd /root/code/github/notepad.cc

  echo 'restore backup...'
  mv -f public{_bak,}
  mv -f server{_bak,}
  mv -f package.json{_bak,}
  mv -f yarn.lock{_bak,}

  echo 'install dependencies...'
  yarn install


  echo 'restart app...'
  pm2 startOrRestart pm2.json

  echo 'rollback done'
EOF
echo 'done rollback'

