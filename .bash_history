sudo yum update -y
sudo yum install httpd -y
sudo systemctl start httpd
sudo systemctl enable httpd
echo "Hello AWS!" | sudo tee /var/www/html/index.html
ll
sudo dnf install httpd -y
sudo systemctl start httpd
sudo chown -R ec2-user:ec2-user /var/www/html
sudo -i -u postgres
sudo -u postgresql psql -c "CREATE DATABASE SKIA;"
cut -d: -f1 /etc/passwd | grep -E "post|sql"
sudo dnf install -y postgresql15-server postgresql15-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo psql -U postgres -c "CREATE DATABASE SKIA;"
cut -d: -f1 /etc/passwd | grep -E "post|sql"
sudo -u postgres psql -c "CREATE DATABASE SKIA;"
sudo -u postgres psql -d SKIA -f /home/ec2-user/skia/_member__202607040011.sql
sudo -u postgres psql -l
sudo -u postgres psql -d skia -f /home/ec2-user/skia/_member__202607040011.sql
cp -r /home/ec2-user/skia /tmp/skia
chmod -R 777 /tmp/skia
sudo -u postgres psql -d skia -f /tmp/skia/_member__202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/member_profile_202607040011.sq
sudo -u postgres psql -d skia -f /tmp/skia/member_profile_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_char_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_group_code_202607040011.sql
sed -i 's/public\.//g' /tmp/skia/_member__202607040011.sql
sed -i 's/public\.//g' /tmp/skia/member_profile_202607040011.sql
sed -i 's/public\.//g' /tmp/skia/skia_char_202607040011.sql
sed -i 's/public\.//g' /tmp/skia/skia_char_buff_202607040011.sql
sed -i 's/public\.//g' /tmp/skia/skia_code_202607040011.sql
sed -i 's/public\.//g' /tmp/skia/skia_group_code_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_group_code_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_code_202607040011.sql
sudo -u postgres psql -d skia
sudo -u postgres psql -d skia -f /tmp/skia/skia_group_code_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_code_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/_member__202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/member_profile_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_char_202607040011.sql
sudo -u postgres psql -d skia -f /tmp/skia/skia_char_buff_202607040011.sql
sudo nano /var/lib/pgsql/data/pg_hba.conf
sudo systemctl restart postgresql
cd ~
mkdir backend && cd backend
npm install
ll
sudo dnf install -y nodejs
npm install
node index.js
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
ll
cd backend
ll
node index.js
sudo netstat -nlpt | grep 3000
sudo kill -9 4734
node index.js
sudo netstat -nlpt | grep 3000
sudo kill -9 5768
sudo netstat -nlpt | grep 3000
node index.js
sudo netstat -nlpt | grep 3000
sudo kill -9 6235
node index.js
sudo netstat -nlpt | grep 3000
sudo netstat -nlpt | grep 6774
node index.js
sudo netstat -nlpt | grep 6774
sudo netstat -nlpt | grep 3000
sudo kill -9 6774
node index.js
sudo netstat -nlpt | grep 3000
sudo kill -9 7662
node index.js
sudo netstat -nlpt | grep 3000
npm install -g nodemon
sudo npm install -g nodemon
nodemon index.js
npm i multer
node index.js
ls
cd skia
node index.js
ll
cd ..
ll
cd backend/
ll
node index.js
cd ..
npm create vite@latest skia-frontend -- --template vue
. ~/.nvm/nvm.sh
nvm install 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
nvm --version
nvm install 20
npm create vite@latest skia-frontend -- --template vue
cd skia-frontend
npm install
ll
npm run dev -- --host
cd..
cd ..
ll
cd skia
cd ..
cd backend/
ll
node index.js
pwd
npm init -y
npm install express cors pg multer
node index.js
npm init -y
npm install express cors pg multer
node index.js
npm run dev -- --host
cd /home/ec2-user/backend
node index.js
cd /home/ec2-user/skia-frontend
npm run dev -- --host
ll
chmod +x start.sh
./start.sh
nano start.sh
chmod +x start.sh
./start.sh
ll
nano start.sh
./start.sh
sed -i 's/\r$//' start.sh
./start.sh
killall node
./start.sh
tail -f backend.log
cd backend/
tail -f backend.log
psql -U postgres -d skia -c "SELECT count(*) FROM skia_char;"
psql -U postgres -d skia -h localhost -c "SELECT count(*) FROM skia_char;"
psql -U postgres -d skia -h localhost -c "\d skia_char"
killall node
node index.js > backend.log 2>&1 &
killall node
cd..
ccdcd d c
..
cd..
ll
killall node
./start.sh
npm install vue-router@4
ll
cd skia
ll
cd ..
cd skia-frontend/
ll
cd src
ll
..
cd..
cd ..
ll
mkdir src/router
ll
cd src
ll
..\
ll
cd ..
ll
cd skia-frontend
ll
touch src/router/index.js
cd src
ll
cd router/
ll
cd ..
ll
cd ..
ll
cd ..
ll
sudo netstat -nlpt | grep 3000
sudo kill -9 37655
./start.sh
ll
./start.sh
cd skia-frontend
ll
cd /home/ec2-user/skia-frontend
npm install axios
npm run dev
killall node
cd ..
ll
./start.sh
ps -ef | grep -E "node|vite"
htop
sudo lsof -i :3000
sudo lsof -i :5173
kill -9 4460
ll
cd ./start/sh
./start/sh
start.sh
[ec2-user@ip-172-31-37-205 ~]$ cd ./start/sh
start.sh
[ec2-user@ip-172-31-37-205 ~]$ cd ./start/sh
./start/sh
ll
start.sh
cd ~
./start.sh
cd skia-frontend
ll
cd ..
cd backend/
ll
cat backend.log
sudo lsof -i :3000
sudo lsof -i :5173
killall node
cd ..
./start.sh
ll
cd backend/
dir
ll
cat backend.log
cd ~\
cd ~
killall node
./start.sh
ll
cd backend
ll
cat backend.log
sudo nano /etc/postgresql/15/main/postgresql.conf
sudo find / -name "postgresql.conf" 2>/dev/null
cat /etc/postgresql-setup/upgrade/postgresql.conf
sudo nano /var/pgsql/data/postgresql.conf
cd ..
sudo nano /var/pgsql/data/postgresql.conf
ll
ll /var/pgsql/data/postgresql.conf
cd /etc/postgresql-setup/upgrade
ll
sudo nano postgresql.conf
cd ..cd ..
cd ..
cd..
..
cd ~
sudo nano /var/pgsql/data/postgresql.conf
sudo find / -name "postgresql.conf" ! -path "*upgrade*" 2>/dev/null
sudo nano /var/lib/pgsql/data/postgresql.conf
ll
cd var
sudo nano /var/lib/pgsql/data/postgresql.conf
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
ll
cd backend/
ll
tail -f backend.log
killall node
./start.sh
cd ..
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
ps -ef | grep node
npm install -g pm2
pm2 start index.js --name "my-skia-backend"
pm2 status
ll
cd backend/
ll
pm2 start index.js --name "skia-backend"
pm2 status
kill -9 49382
cd..
..
cd ..
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
cd backend/
ll
cat backend.log
killall node
./start.sh
cd ..
./start.sh
cd backend/
ll
killall node
cd ..
ll
cd skia-frontend
killall node
cd ..
./start.sh
cd backend/
ll
cat backend.log
killall node
cd ..
./start.sh
cd skia
ll
cd ../backend/\
cd ../backend/
ll
killall node
..
cd ..
./start.sh
cd ../backend/
cd backend/
ll
killall node
cd ..
./start.sh
cd backend/
ll
killall node
cd ..
killall node
./start.sh
df -f
df -h
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
cd backend/
killall node
cd ..
./start.sh
killall node

killall node
cd ..
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
ll
cat start.sh
ll
cd /home/ec_user
pwd
cat start.sh
ll
killall node
./start.sh
sudo -u postgres psql
ll
sudo -u postgres psql
ll
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
git --version
ㅣㅣ
ll
sudo dnf install git -y
git --version
git init
echo "node_modules/" >> .gitignore
git status
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/hitimeth/skia-project
git push -u origin main
git config --global pack.windowMemory "10m"
git config --global pack.packSizeLimit "20m"
git config --global pack.threads "1"
git config --global core.bigFileThreshold "10m"
git push -u origin main
echo ".nvm/" >> .gitignore
echo ".vscode-server/" >> .gitignore
echo ".npm/" >> .gitignore
rm -rf .git
git init
git branch -M main
git status
git add .
git commit -m "Initial commit with proper gitignore"
git remote add origin https://github.com/hitimeth/skia-project.git
git push -u origin main
ll
./start.sh
free -h
df -f /
df -h /
df -h
free -h
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
rm -rf .git
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
ㅣㅣ
ll
cd backend/
ll
tail -f backend.log
killall node
./start.sh
cd ..
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
dir
cd backend/
ls
tail -f backend.log 
cd ..
killall node
./start.sh
cd backend/
tail -f backend.log 
cd ..
killall node
./start.sh
cd backend/
tail -f backend.log 
cd ..
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
;32R
exit
ssh -i .\wple_newkey.pem -L 5432:localhost:5432 ec2-user@3.38.80.197
exit
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh

./start.sh
killall node
./start.sh
node index.js 
cd backend/
node index.js 
cd ..
killall node
./start.sh
killall node
./start.sh
cd /home/ec2-user/backend
tail -f backend.log
find . -name "index.js"
grep -rn --exclude-dir=node_modules "font/woff" .
killall node
./start.sh
grep -rn --exclude-dir=node_modules "font/woff" .
cd backend/
grep -rn --exclude-dir=node_modules "font/woff" .
cd ..
killall node
./start.sh
cd ..
ll
cd ec2-user/
ll
cd skia-frontend/
ll
grep -rn --exclude-dir=node_modules "font/woff" .
..
CD ..
cd ..
killall node
./start.sh
ssh -i C:\wple\wple_newkey.pem -L 5432:localhost:5432 ec2-user@3.38.80.197
exit
ll
./start.sh
free -h
df -h
ll
killall node
./start.sh
killon node
killall node
./start/sh
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
cd var
ll
cd skia
ll
cd ..
ll
cd ..
ll
cd var
ll
cdrlog
cd log
ll
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
lsblk
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
df -h /
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
free -m
killall node
./start.sh
killall node
./start.sh
killall node
./start.sh
pm2 logs
pm2 logs skia-frontend --err --lines 50
pm2 logs my-app --err --lines 50
pm2 logs skia-frontend --err --lines 50
ll
[200~pm2 status ~
pm2 status 
pm2 logs
sudo timedatectl set-timezone Asia/Seoul
date
pm2 restart all
df -h
df -i
sudo dmesg -T | grep -i oom
free -h
last reboot
dior
dir
cd backend
dir
cat backend.log
ps aux | grep node
cd ..
ps aux | grep node
tail -n 50 nohup.out
sudo ss -tlpn | grep 254671
killall node
./start.sh
sudo npm install -g pm2
pkill -f node
pm2 start index.js --name "my-app"
ll
cd backend/
ll
pm2 start index.js --name "my-app"
pm2 save
pm2 startup
cd ..
./start.sh
sudo systemctl status nginx
ll
cd skia-frontend/
sudo systemctl status nginx
cat start.sh
cd ..
cat start.sh
pkill -f "npm run dev"
cd skia-frontend/
pm2 start "npm run dev -- --host --mode production" --name "skia-frontend"
pm2 status
pm2 save
pm2 startup
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v20.20.2/bin /home/ec2-user/.nvm/versions/node/v20.20.2/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
cd ..
bash
ll
killall node
./start.sh
pm2 logs my-app
killall node
ll
./start.sh
killall node
./start.sh
pm2 log 
pm2 status
pm2 restart all
pm2 monit
pm2 log 
pm2 list
dmesg -T | grep -i oom
pm2 list
free -h
pm2 stop all
cd /home/ec2-user/skia-frontend
npm run build
pm2 delete skia-frontend
pm2 start "npx serve -s dist -l 3000" --name "skia-frontend"
pm2 restart my-app
pm2 save
free -h
pm2 restart all
pm2 resurrect
cd /path/to/my-app
cd..
cd ..
cd be
ll
cd backend
ll
pm2 start index.js --name "my-app"
pm2 restart my-app
cd cd /home/ec2-user/skia-frontend
cd /home/ec2-user/skia-frontend
pm2 start "npx serve -s dist -l 3000" --name "skia-frontend"
cd ..
pm2 delete all
cd /home/ec2-user/skia-frontend
pm2 start "npx serve -s dist -l 3000" --name "skia-frontend"
cd /home/ec2-user/backend
pm2 start index.js --name "my-app"
pm2 list
pm2 logs my-app --lines 30 --err
pm2 delete all
cd /home/ec2-user/backend
pm2 start index.js --name "my-app"
cd /home/ec2-user/skia-frontend
pm2 start "npx serve -s dist -l 5173" --name "skia-frontend"
pm2 list
pm2 save
pm2 show skia-frontend
ps aux | grep node
tail -n 100 ~/.pm2/logs/<my-app>-error.log
pm2 show my-app
pm2 restart my-app --log-date-format "YYYY-MM-DD HH:mm:ss"
pm2 save
cd /home/ec2-user/.pm2/logs/
ll
..
ㅊㅇ ..
cd ..
pm2 list
ssh -i C:\wple\wple_newkey.pem -L 5432:localhost:5432 ec2-user@3.38.80.197
pm2 restart all
pm2 restart all
pm2 show my-app
npm run build
ll
cd skia
ll
cd ..
cd frontend
cd skia-frontend/
ll
ls -la
npm run build
git remote -v
ll
git fetch origin
git remote add origin https://github.com/hitimeth/skia-project.git
ls -al
cd skia-project
ll
cd ..
cd skia-project
git remote add origin https://github.com/hitimeth/skia-project.git
git remote set-url origin https://github.com/hitimeth/skia-project.git
git remote remove origin
git remote add origin https://github.com/hitimeth/skia-project.git
git remote -v
git fetch origin
git status
