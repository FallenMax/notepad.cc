set -e

echo 'start backup'

ssh root@139.59.222.188 -p9999 << EOF
  set -e

  echo 'backup started...'
  cd /root/code/github/notepad.cc

  echo 'restore stuff...'
  mkdir -p current
  mv -f public server package.json yarn.lock pm2.json current/

  mv -f backup/* ./

  echo 'install dependencies...'
  yarn install

  echo 'restart app...'
  pm2 startOrRestart pm2.json

  echo 'backup done'
EOF
echo 'done backup'

