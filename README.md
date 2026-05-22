# ManagerFlow — MVP Setup Guide

## Prerequisites
- Node.js 18+ installed
- MySQL 8 running locally
- npm

## Quick Start

### 1. Create the database
```sql
mysql -u root -p
CREATE DATABASE managerflow;
EXIT;
```

### 2. Configure environment
Edit `.env` in the project root — update the MySQL password:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/managerflow"
```

### 3. Install dependencies
```bash
npm install
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### 4. Setup database schema & seed data
```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

### 5. Run the app
```bash
# Terminal 1 — Backend
cd apps/api && npm run dev

# Terminal 2 — Frontend
cd apps/web && npm run dev
```

### 6. Open browser
Go to **http://localhost:3000**

Login as Senior Manager: `ramesh@demo.com` / `demo123`
Login as Line Manager: `manju@demo.com` / `demo123`

---

## Demo the Push API

Once the app is running, push a task from "Senior Manager" using curl:

```bash
curl -X POST http://localhost:4000/api/v1/managers/MANAGER_ID/tasks \
  -H "Authorization: Bearer demo-push-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Submit Q3 headcount plan by Friday",
    "priority": "high",
    "dueDate": "2026-06-01",
    "metadata": { "pushedBy": "VP Engineering - Ramesh K" }
  }'
```

Replace `MANAGER_ID` with the ID printed during seed.

The card will appear in the "Org Tasks" swimlane → "To Do" column on next refresh (5 seconds).

---

## Project Structure
```
kanban_mgr/
├── apps/api/        → Express backend (port 4000)
├── apps/web/        → React frontend (port 3000)
├── prisma/          → Schema + seed
├── .env             → Database config
└── PRD.md / HLD.md / LLD.md → Documentation
```
