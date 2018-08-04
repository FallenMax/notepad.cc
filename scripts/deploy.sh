set -e

echo 'start deploy'

rm -rf bundle.zip
zip -q -r bundle.zip public server package.json yarn.lock pm2.json
scp -P 9999 bundle.zip root@139.59.222.188:/root/code/github/notepad.cc

ssh root@139.59.222.188 -p9999 << EOF
  set -e

  echo 'deploy started...'
  cd /root/code/github/notepad.cc

  echo 'backup stuff...'
  mkdir -p backup
  mv -f public server package.json yarn.lock pm2.json backup/

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

