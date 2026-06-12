# Transport Management System (TMS Express)

A complete production-ready, enterprise-grade fleet logistics management portal. Built with a Node.js/Express backend (MySQL database via Sequelize ORM) and a modern React/Vite/Material UI client dashboard.

---

## 🛠️ Technology Stack
- **Frontend**: React.js, Vite, React Router, Axios, React Hook Form, Material UI (MUI), Recharts
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **ORM**: Sequelize ORM
- **Authentication**: JWT Token signing + Role-Based Access Control (RBAC)

---

## 📂 Project Structure

```text
C:\Users\Doomshell\.gemini\antigravity\scratch\tms\
├── backend/
│   ├── config/
│   │   ├── database.js     # Sequelize instance connection
│   │   └── seed.js         # Initial mock seeder logic
│   ├── controllers/        # Express request routing controllers
│   ├── middleware/         # Auth, Roles, Request validation checks
│   ├── models/             # 14 Sequelize database models
│   ├── routes/             # Express API endpoints mapping
│   ├── utils/              # winston logs & Joi schemas
│   ├── server.js           # Server initializer
│   ├── .env                # Server configurations
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # Layout shell & reusable DataTable
    │   ├── context/        # Auth states provider
    │   ├── pages/          # CRUD views, Ledgers & Reports dashboards
    │   ├── services/       # Axios API client handlers
    │   ├── theme/          # Custom styled Material UI theme config
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js      # Compiler & Proxy configs
    └── package.json
```

---

## 🔑 Default Roles and Credentials (Seeded on Start)

When the server starts up, it automatically syncs the database tables and runs seeders to generate the following accounts:

| Role Name | Email Address | Password | Permissions Scope |
|---|---|---|---|
| **Super Admin** | `admin@tms.com` | `admin123` | Full access, user creation, core deletions |
| **Manager** | `manager@tms.com` | `manager123` | Full CRUD except user admin and core deletions |
| **Accountant** | `accountant@tms.com` | `accountant123` | Read-only masters, CRUD payments/ledger/claims |
| **Data Entry Operator** | `entry@tms.com` | `entry123` | Log trip sheets, refuels, expenses. No delete, no finance dashboards |

---

## ⚙️ Installation & Running Locally

### Step 1: Database Setup
1. Start your local MySQL server (e.g. via XAMPP, WAMP, or local service).
2. Create an empty database named `tms_db`:
   ```sql
   CREATE DATABASE tms_db;
   ```

### Step 2: Configure Environment
Configure the connection parameters inside `backend/.env`:
```ini
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=tms_db
DB_PORT=3306
JWT_SECRET=super_secret_tms_token_signing_key_2026_production_grade
JWT_EXPIRE=8h
```

### Step 3: Run Backend Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Note: On startup, the server automatically syncs the schema models (altering columns if necessary) and runs seeders to generate default accounts.*

### Step 4: Run Frontend Client
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Vite developer server:
   ```bash
   npm run dev
   ```
4. Access the web portal at `http://localhost:3000`.

---

## 🚢 Production Deployment

### 1. Backend Server Deployment (PM2 Process Daemon)
To keep the Express app running in background environments, use PM2:
```bash
cd backend
npm install -g pm2
pm2 start server.js --name "tms-backend-api"
pm2 save
pm2 startup
```

### 2. Frontend Production Bundling
Create optimized assets for static hosting (e.g., Nginx, IIS):
```bash
cd frontend
npm run build
```
This generates a standalone `dist/` directory ready to be served by Nginx or Apache.
Example Nginx Server block:
```nginx
server {
    listen 80;
    server_name logistics.yourdomain.com;

    location / {
        root /path/to/tms/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
