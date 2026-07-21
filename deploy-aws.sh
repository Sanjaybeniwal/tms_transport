#!/bin/bash

# ==============================================================================
#  TMS (Transport Management System) AWS EC2 Auto-Deployment Script
#  Target OS: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS
# ==============================================================================

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0;37m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${CYAN}        TMS Transport Management System - AWS Deployment Agent        ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# Exit immediately if any command fails
set -e

# 1. Check if run as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script with sudo privileges:${NC}"
  echo -e "${YELLOW}sudo bash deploy-aws.sh${NC}"
  exit 1
fi

# Detect current user who called sudo
ACTUAL_USER=${SUDO_USER:-$USER}
echo -e "${GREEN}[*] running installation as root, original user: ${ACTUAL_USER}${NC}"

# 2. Update System Packages
echo -e "\n${YELLOW}[1/8] Updating system package definitions...${NC}"
apt-get update -y
apt-get upgrade -y

# 3. Install Dependencies (Git, curl, Nginx, MySQL Server)
echo -e "\n${YELLOW}[2/8] Installing Git, Curl, Nginx, and MySQL Server...${NC}"
apt-get install -y git curl nginx mysql-server

# 4. Install Node.js (v20 LTS) & npm
echo -e "\n${YELLOW}[3/8] Installing Node.js v20 LTS...${NC}"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo -e "${GREEN}[*] Node.js is already installed: $(node -v)${NC}"
fi

# Install PM2 globally
echo -e "\n${YELLOW}[4/8] Installing PM2 process daemon manager...${NC}"
npm install -g pm2

# 5. Set up MySQL Database and User
echo -e "\n${YELLOW}[5/8] Configuring MySQL database and user credentials...${NC}"
DB_NAME="tms_db"
DB_USER="tms_user"
# Generate a secure random password for the MySQL User
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

# Start and enable MySQL service
systemctl start mysql
systemctl enable mysql

# Create database and user with privileges
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}[+] MySQL database '${DB_NAME}' created successfully.${NC}"
echo -e "${GREEN}[+] MySQL user '${DB_USER}' created with a secure credentials.${NC}"

# 6. Deploy Code to /var/www/tms
echo -e "\n${YELLOW}[6/8] Copying files to /var/www/tms for web server delivery...${NC}"
TARGET_DIR="/var/www/tms"
mkdir -p ${TARGET_DIR}

# Copy files from the current repository path (where the script is run)
cp -r ./* ${TARGET_DIR}/ || true
cp -r ./.* ${TARGET_DIR}/ 2>/dev/null || true

# Change ownership of /var/www/tms to the actual non-root user
chown -R ${ACTUAL_USER}:${ACTUAL_USER} ${TARGET_DIR}
chmod -R 755 ${TARGET_DIR}

echo -e "${GREEN}[+] Application files copied to ${TARGET_DIR}.${NC}"

# Switch directory context to deployment target
cd ${TARGET_DIR}

# 7. Configure Backend Environment
echo -e "\n${YELLOW}[7/8] Creating production backend .env configurations...${NC}"
ENV_FILE="backend/.env"
JWT_SECRET=$(openssl rand -base64 32)

cat <<EOF > ${ENV_FILE}
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
SEED_DB=true
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=24h
EOF

# Ensure appropriate permissions for env file
chown ${ACTUAL_USER}:${ACTUAL_USER} ${ENV_FILE}
chmod 600 ${ENV_FILE}

echo -e "${GREEN}[+] Backend .env configuration successfully generated.${NC}"

# 8. Install NPM Modules & Build Production Artifacts
echo -e "\n${YELLOW}[8/8] Installing dependencies and building React client...${NC}"

# Run installation as the original non-root user to avoid permission conflicts on local node_modules
sudo -u ${ACTUAL_USER} npm run install:all

# Compile React frontend for production
sudo -u ${ACTUAL_USER} npm run build --prefix frontend

echo -e "${GREEN}[+] Frontend built successfully in /var/www/tms/frontend/dist.${NC}"

# 9. Configure Nginx Reverse Proxy
echo -e "\n${YELLOW}[*] Deploying Nginx site configuration...${NC}"
NGINX_CONF_PATH="/etc/nginx/sites-available/tms"

cat <<'EOF' > ${NGINX_CONF_PATH}
server {
    listen 80;
    server_name _;

    root /var/www/tms/frontend/dist;
    index index.html;

    client_max_body_size 10M;

    access_log /var/log/nginx/tms_access.log;
    error_log /var/log/nginx/tms_error.log;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host $host;
    }
}
EOF

# Enable Nginx site config
ln -sf ${NGINX_CONF_PATH} /etc/nginx/sites-enabled/
# Remove default site if it exists to avoid port 80 collisions
rm -f /etc/nginx/sites-enabled/default

# Test Nginx and restart
nginx -t
systemctl restart nginx
echo -e "${GREEN}[+] Nginx configuration verified and restarted successfully.${NC}"

# 10. Start Express Backend with PM2
echo -e "\n${YELLOW}[*] Starting Express API Server daemon with PM2...${NC}"

# Run pm2 as the non-root user to match their login context
cd ${TARGET_DIR}/backend
sudo -u ${ACTUAL_USER} pm2 stop tms-backend-api &>/dev/null || true
sudo -u ${ACTUAL_USER} pm2 start server.js --name "tms-backend-api"
sudo -u ${ACTUAL_USER} pm2 save

# Setup PM2 Startup script to run after server reboot
PM2_STARTUP=$(sudo -u ${ACTUAL_USER} pm2 startup | grep "sudo env PATH" || true)
if [ ! -z "$PM2_STARTUP" ]; then
  eval $PM2_STARTUP
fi

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}      🎉 TMS DEPLOYMENT COMPLETE! YOUR PROJECT IS NOW LIVE! 🎉       ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "${CYAN}Access Portal:${NC} http://<your_ec2_public_ip_or_domain>"
echo -e "${CYAN}Default Admin User:${NC} admin@tms.com"
echo -e "${CYAN}Default Admin Pass:${NC} admin123"
echo -e "${CYAN}Default Login OTP :${NC} 222555"
echo -e "${BLUE}======================================================================${NC}"
echo -e "${YELLOW}Security Credentials Created (also saved in backend/.env):${NC}"
echo -e "${CYAN}Database Name:${NC} ${DB_NAME}"
echo -e "${CYAN}Database User:${NC} ${DB_USER}"
echo -e "${CYAN}Database Pass:${NC} ${DB_PASS}"
echo -e "${BLUE}======================================================================${NC}"

