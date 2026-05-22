# Low-Level Design (LLD)
## ManagerFlow — Technical Implementation Details

**Version:** 2.0 | **Date:** 2026-05-22 | **Status:** Implemented

---

## 1. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Data Fetching | TanStack Query v5 |
| Backend | Node.js + Express 4 |
| ORM | Prisma 5.22 |
| Validation | Zod |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |

---

## 2. Project Structure

```
kanban_mgr/
├── apps/
│   ├── api/                        # Express backend (port 4000)
│   │   └── src/
│   │       ├── middleware/auth.ts   # JWT + API key auth
│   │       ├── routes/
│   │       │   ├── board.ts        # GET /api/boards
│   │       │   ├── cards.ts        # CRUD, move, notes, action items, delete
│   │       │   ├── people.ts       # Reportees, interactions
│   │       │   ├── recurrence.ts   # Recurrence rule CRUD
│   │       │   ├── team-dashboard.ts # Overview, push initiative
│   │       │   ├── notifications.ts # Notification polling
│   │       │   ├── ingestion.ts    # External push API
│   │       │   └── admin.ts        # Org structure CRUD
│   │       ├── cron/recurrence.ts  # Hourly card generation
│   │       └── server.ts
│   └── web/                        # React frontend (port 3000)
│       └── src/
│           ├── api/client.ts       # Axios + JWT interceptor
│           ├── components/
│           │   ├── AdminPanel.tsx   # Admin: org tree + CRUD
│           │   ├── Board.tsx        # Kanban board (dnd-kit)
│           │   ├── Card.tsx         # Draggable card + overlay
│           │   ├── CardDetail.tsx   # Detail panel
│           │   ├── CreateCard.tsx   # New card modal
│           │   ├── Log1on1.tsx      # 1-on-1 notes modal
│           │   ├── Login.tsx        # Login form
│           │   ├── NotificationBell.tsx # Bell + dropdown
│           │   ├── TeamDashboard.tsx # Role-aware team view
│           │   └── Widgets.tsx      # Stats bar + needs attention
│           ├── App.tsx             # Root: auth routing
│           └── main.tsx
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docs/                           # PRD, HLD, LLD, USERGUIDE
├── setup.js                        # Installation script
└── .env                            # DATABASE_URL
```

---

## 3. Database Schema

```prisma
model Manager {
  id              String   @id @default(uuid())
  email           String   @unique
  name            String
  passwordHash    String
  orgUnit         String?
  role            String   @default("line_manager") // 'admin' | 'senior_manager' | 'line_manager'
  seniorManagerId String?
  lastSeenAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  // Relations: seniorManager, lineManagers, boards, reportees, apiKeys
}

model Board {
  id        String @id @default(uuid())
  managerId String
  title     String @default("My Board")
  // Relations: manager, swimlanes
}

model Swimlane {
  id         String  @id @default(uuid())
  boardId    String
  type       String  // 'org' | 'unit' | 'team' | 'person'
  reporteeId String?
  title      String
  position   Int     @default(0)
  // Relations: board, reportee, cards
}

model Card {
  id               String    @id @default(uuid())
  swimlaneId       String
  title            String
  description      String?
  cardType         String    // 'org' | 'people'
  status           String    @default("todo") // 'todo' | 'in_progress' | 'waiting' | 'done'
  priority         String    @default("medium")
  reporteeId       String?
  recurrenceRuleId String?
  dueDate          DateTime?
  position         Int       @default(0)
  createdAt        DateTime  @default(now())
  completedAt      DateTime?
  source           String?   // 'self' | 'unit_manager' | 'organization'
  sourceId         String?
  sourceMeta       Json?
  acknowledgedAt   DateTime?
  // Relations: swimlane, reportee, recurrenceRule, notes, actionItems
}

model CardNote { id, cardId, content, noteType, createdAt }
model ActionItem { id, cardId, description, isDone, dueDate, createdAt }
model RecurrenceRule { id, managerId, swimlaneId, frequency, dayOfWeek?, dayOfMonth?, templateTitle, templatePriority, nextGenerateAt, isActive }
model Reportee { id, managerId, name, email?, role?, last1on1Date?, riskLevel, createdAt }
model InteractionLog { id, managerId, reporteeId, interactionType, occurredAt, notes?, sentiment? }
model ApiKey { id, managerId?, keyHash, name, sourceType, sourceId, isActive }
```

---

## 4. API Design

### 4.1 Auth
```
POST /api/auth/login { email, password } → { token, manager: { id, name, email, role } }
```

### 4.2 Board
```
GET /api/boards → Board with swimlanes, cards (auto-archives done > 7 days)
```

### 4.3 Cards
```
POST   /api/cards { swimlaneId, title, cardType, priority, dueDate?, reporteeId? }
GET    /api/cards/:id → Card with notes + action items
PATCH  /api/cards/:id { title?, description?, priority?, dueDate? }
PATCH  /api/cards/:id/move { status } → Auto-acknowledges pushed cards on move from 'todo'
DELETE /api/cards/:id → Only self-created cards (403 for pushed)
POST   /api/cards/:id/notes { content, noteType }
POST   /api/cards/:id/action-items { description, dueDate? }
PATCH  /api/cards/action-items/:id → Toggle isDone
```

### 4.4 People
```
GET  /api/people → Reportees with health (green/yellow/red)
POST /api/people/:id/interactions { interactionType, notes, sentiment }
GET  /api/people/:id/interactions → Last 20 interactions
```

### 4.5 Team Dashboard
```
GET  /api/team/overview?showDone=false
  → Senior Manager: line managers' org/unit cards (privacy: no team-level)
  → Line Manager: reportees' cards
GET  /api/team/line-managers → Line managers under this senior manager
POST /api/team/push-initiative { title, description?, priority, dueDate, targetManagerIds }
```

### 4.6 Notifications
```
GET /api/notifications → Cards from last 7 days with source in ['unit_manager', 'organization']
```

### 4.7 Admin
```
GET    /api/admin/org-tree → Full hierarchy
GET    /api/admin/senior-managers
POST   /api/admin/senior-managers { name, email, password, orgUnit? }
DELETE /api/admin/senior-managers/:id
GET    /api/admin/line-managers
POST   /api/admin/line-managers { name, email, password, orgUnit?, seniorManagerId }
DELETE /api/admin/line-managers/:id
GET    /api/admin/reportees
POST   /api/admin/reportees { name, email?, role?, managerId }
DELETE /api/admin/reportees/:id
```

### 4.8 External Push API (API Key Auth)
```
POST /api/v1/managers/:managerId/tasks { title, dueDate, priority?, description?, metadata? }
POST /api/v1/org/broadcast { title, dueDate, priority?, description?, metadata? }
GET  /api/v1/tasks/:cardId/status → { cardId, acknowledged, acknowledgedAt, currentStatus }
```

---

## 5. Key Module Designs

### 5.1 Swimlane Resolution (Push API)
- `apiKey.sourceType == 'unit_manager'` → `unit` swimlane
- `apiKey.sourceType == 'organization'` → `org` swimlane
- `reporteeId` provided → person swimlane

### 5.2 Recurrence Engine
- Cron runs hourly
- Queries rules where `nextGenerateAt <= NOW()` and `isActive = true`
- Creates card (status: 'todo', source: 'self')
- Calculates next date based on frequency

### 5.3 Acknowledgement Flow
- Pushed card arrives with `acknowledgedAt = null`, status = 'todo'
- Manager moves card from 'todo' → `acknowledgedAt = now()`
- Source queries GET /api/v1/tasks/:id/status

### 5.4 1-on-1 Notes (Log1on1)
1. Click 📝 on person swimlane → modal opens
2. Enter notes, sentiment, action items
3. Save → logs interaction (resets health to green) + creates cards per action item

### 5.5 Notification System
- Backend: returns cards from last 7 days with source in ['unit_manager', 'organization']
- Frontend: polls every 5s, filters read IDs via localStorage
- Click → highlights card on board (3s pulse)

### 5.6 Auto-Provisioning (Admin)
- Create Senior Manager → Board + org/unit/team swimlanes
- Create Line Manager → Board + org/unit/team swimlanes + person swimlane on SM's board
- Create Reportee → Person swimlane on LM's board

---

## 6. Demo Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@demo.com | admin123 | admin |
| Ramesh K | ramesh@demo.com | demo123 | senior_manager |
| Manju R | manju@demo.com | demo123 | line_manager |
| Suresh P | suresh@demo.com | demo123 | line_manager |

| API Key | Source Type | Purpose |
|---------|------------|---------|
| demo-org-key-99999 | organization | Org-level push + broadcast |
| demo-push-key-12345 | unit_manager | Senior Manager push via API |

---

## 7. Build & Run

```bash
node setup.js          # Check deps, install, setup DB, seed
cd apps/api && npm run dev    # Port 4000
cd apps/web && npm run dev    # Port 3000
```

---

*End of LLD*
