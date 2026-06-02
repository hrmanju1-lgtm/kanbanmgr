# ManagerFlow — Installation Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | 18+     |
| npm         | 9+      |
| MySQL       | 8.0+    |

Ensure MySQL is running before proceeding.

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd kanban_mgr
```

---

## Step 2: Install Dependencies

```bash
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

---

## Step 3: Create the MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE managerflow;
EXIT;
```

> **Note:** The database name is case-sensitive on Linux. Use the exact name you put in `.env`.

---

## Step 4: Configure Environment Variables

Copy the example and edit:

```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/managerflow"
JWT_SECRET="managerflow-demo-secret-change-in-prod"
PORT=4000
```

**Important:**
- If your password contains special characters (`#`, `@`, `%`, etc.), URL-encode them.  
  Example: `#` → `%23`, `@` → `%40`
- The database name in the URL must match the name you created in Step 3 exactly (case-sensitive).

---

## Step 5: Initialize the Database Schema

```bash
npx prisma db push
```

This creates all tables in your MySQL database based on the Prisma schema.

---

## Step 6: Seed Demo Data

```bash
npx ts-node prisma/seed.ts
```

On success you'll see:

```
✅ Seed complete!
   Senior Manager: ramesh@demo.com / demo123 (ID: ...)
   Line Manager 1: manju@demo.com / demo123 (ID: ...)
   Line Manager 2: suresh@demo.com / demo123 (ID: ...)
   Unit API Key: demo-push-key-12345
   Org API Key:  demo-org-key-99999
```

---

## Step 7: Start the Application

You need **two terminals**:

**Terminal 1 — Backend API (port 4000):**

```bash
cd apps/api
npm run dev
```

Wait for: `✅ API running on http://localhost:4000`

**Terminal 2 — Frontend (port 3000):**

```bash
cd apps/web
npm run dev
```

---

## Step 8: Open the App

Navigate to **http://localhost:3000**

### Demo Credentials

| Role            | Email             | Password |
|-----------------|-------------------|----------|
| Admin           | admin@demo.com    | admin123 |
| Senior Manager  | ramesh@demo.com   | demo123  |
| Line Manager    | manju@demo.com    | demo123  |
| Line Manager    | suresh@demo.com   | demo123  |

---

## Troubleshooting

### "Invalid credentials" on login

1. **Is the API running?** Test with:
   ```bash
   curl http://localhost:4000/api/auth/login -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"manju@demo.com","password":"demo123"}'
   ```
   If you get "connection refused", start the API server (Step 7).

2. **Was the seed run?** Check the database:
   ```sql
   SELECT email, role FROM manager;
   ```
   If empty, re-run `npx ts-node prisma/seed.ts`.

3. **Database name mismatch?** Ensure the database name in `.env` matches exactly what you created (case matters on Linux).

### "Can't reach database server"

- Verify MySQL is running: `mysql -u root -p -e "SELECT 1;"`
- Check the password in `.env` is correct and properly URL-encoded.

### Frontend shows blank or errors

- Ensure the API is running on port 4000 before using the frontend.
- Check browser console (F12) for network errors.

---

## Project Structure

```
kanban_mgr/
├── apps/
│   ├── api/          → Express backend (port 4000)
│   └── web/          → React + Vite frontend (port 3000)
├── prisma/
│   ├── schema.prisma → Database schema
│   └── seed.ts       → Demo data seeder
├── .env              → Environment config (not committed)
├── .env.example      → Template for .env
└── package.json      → Root workspace config
```
