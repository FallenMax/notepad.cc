
set -e

target=$1
user=root
host=139.59.222.188
port=9999
download_dir=/root/download

if [ $target = 'dev' ]
then
  app_dir=/root/apps/notepad_dev
  data_dir=/var/lib/notepad_dev/data
  start_cmd="pm2 startOrRestart pm2_dev.json"
elif [ $target = 'prod' ]
then
  app_dir=/root/apps/notepad
  data_dir=/var/lib/notepad/data
  start_cmd="pm2 startOrRestart pm2_prod.json"
else
  echo 'unknown target'
  exit -1
fi

echo "deploying: $target"


npm run build
npm run test
npm run bundle

scp -P $port bundle.zip $user@$host:$download_dir


ssh $user@$host -p$port << EOF
  set -e

  echo 'deploy started...'
  cd $download_dir

  echo 'replacing bundle...'
  rm -rf $app_dir
  unzip bundle.zip -d $app_dir
  rm bundle.zip
  cd $app_dir

  echo 'install dependencies...'
  yarn install

  echo 'starting app...'
  $start_cmd
  pm2 ls

  echo 'deploy done'
EOF

echo 'done deploy'


