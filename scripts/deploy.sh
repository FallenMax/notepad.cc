set -e

echo 'start deploy'

rm -rf bundle.zip
zip -q -r bundle.zip public server package.json yarn.lock

ssh root@139.59.222.188 -p9999 << EOF
  set -e

  echo 'deploy started...'
  cd /root/code/github/notepad.cc

  echo 'backup stuff...'
  mv -f public{,_bak}
  mv -f server{,_bak}
  mv -f package.json{,_bak}
  mv -f yarn.lock{,_bak}

  echo 'unpack bundle...'
  unzip bundle.zip
  rm -rf bundle.zip

  echo 'install dependencies...'
  yarn install

  echo 'restart app...'
  pm2 startOrRestart pm2.json

  echo 'deploy done'
EOF
echo 'done deploy'

