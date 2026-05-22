# Low-Level Design (LLD)
## ManagerFlow — Detailed Technical Design

**Version:** 2.0  
**Date:** 2026-05-21  
**Status:** Implemented (MVP)  

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | Latest |
| UI Framework | Tailwind CSS | Latest |
| State/Data | TanStack Query (React Query) | v5 |
| Build Tool | Vite | Latest |
| Backend | Node.js + Express | LTS |
| ORM | Prisma | 5.22 |
| Validation | Zod (ingestion API) | Latest |
| Database | MySQL 8 | Latest |
| Auth | JWT (jsonwebtoken) + bcryptjs | Latest |

---

## 2. Project Structure

```
kanban_mgr/
├── apps/
│   ├── api/                        # Express backend (port 4000)
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts         # JWT auth, API key auth, login endpoint
│   │   │   ├── routes/
│   │   │   │   ├── board.ts        # GET /api/boards
│   │   │   │   ├── cards.ts        # CRUD, move, notes, action items
│   │   │   │   ├── people.ts       # Reportees, interactions
│   │   │   │   ├── recurrence.ts   # Recurrence rule CRUD
│   │   │   │   ├── team-dashboard.ts # Overview, push initiative
│   │   │   │   ├── notifications.ts # Notification polling
│   │   │   │   ├── ingestion.ts    # External push API (API key auth)
│   │   │   │   └── admin.ts        # Admin CRUD: org structure management
│   │   │   ├── cron/
│   │   │   │   └── recurrence.ts   # Hourly card generation
│   │   │   └── server.ts           # Express app setup
│   │   └── package.json
│   └── web/                        # React frontend (port 3000)
│       ├── src/
│       │   ├── api/
│       │   │   └── client.ts       # Axios instance with JWT interceptor
│       │   ├── components/
│       │   │   ├── Board.tsx        # Kanban board (table layout)
│       │   │   ├── Card.tsx         # Draggable card with source colors
│       │   │   ├── CardDetail.tsx   # Modal: notes, actions, status
│       │   │   ├── CreateCard.tsx   # New card modal
│       │   │   ├── Log1on1.tsx      # 1-on-1 notes modal
│       │   │   ├── Login.tsx        # Email/password login
│       │   │   ├── NotificationBell.tsx # Bell icon with polling
│       │   │   ├── AdminPanel.tsx   # Admin: org tree, CRUD for managers/reportees
│       │   │   ├── TeamDashboard.tsx # Role-aware team view
│       │   │   └── Widgets.tsx      # Top stats bar
│       │   ├── App.tsx             # Root: auth, routing, layout
│       │   └── main.tsx            # Entry point
│       └── package.json
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Demo data seeder
├── .env                            # DATABASE_URL
├── PRD.md
├── HLD.md
└── LLD.md
```

---

## 3. Database Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

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

  seniorManager   Manager?  @relation("ManagerHierarchy", fields: [seniorManagerId], references: [id])
  lineManagers    Manager[] @relation("ManagerHierarchy")
  boards          Board[]
  reportees       Reportee[]
  apiKeys         ApiKey[]
}

model ApiKey {
  id         String    @id @default(uuid())
  managerId  String?
  keyHash    String    @unique
  name       String
  sourceType String    // 'unit_manager' | 'organization'
  sourceId   String
  isActive   Boolean   @default(true)
  createdAt  DateTime  @default(now())
  manager    Manager?  @relation(fields: [managerId], references: [id])
}

model Board {
  id        String   @id @default(uuid())
  managerId String
  title     String   @default("My Board")
  createdAt DateTime @default(now())
  manager   Manager    @relation(fields: [managerId], references: [id])
  swimlanes Swimlane[]
}

model Swimlane {
  id         String   @id @default(uuid())
  boardId    String
  type       String   // 'org' | 'unit' | 'team' | 'person'
  reporteeId String?
  title      String
  position   Int      @default(0)
  board      Board     @relation(fields: [boardId], references: [id])
  reportee   Reportee? @relation(fields: [reporteeId], references: [id])
  cards      Card[]
}

model Card {
  id               String    @id @default(uuid())
  swimlaneId       String
  title            String
  description      String?   @db.Text
  cardType         String    // 'org' | 'people'
  status           String    @default("todo")
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
  swimlane         Swimlane        @relation(fields: [swimlaneId], references: [id])
  reportee         Reportee?       @relation(fields: [reporteeId], references: [id])
  recurrenceRule   RecurrenceRule? @relation(fields: [recurrenceRuleId], references: [id])
  notes            CardNote[]
  actionItems      ActionItem[]
}

model CardNote {
  id        String   @id @default(uuid())
  cardId    String
  content   String   @db.Text
  noteType  String   @default("note")
  createdAt DateTime @default(now())
  card      Card @relation(fields: [cardId], references: [id], onDelete: Cascade)
}

model ActionItem {
  id          String    @id @default(uuid())
  cardId      String
  description String
  isDone      Boolean   @default(false)
  dueDate     DateTime?
  createdAt   DateTime  @default(now())
  card        Card @relation(fields: [cardId], references: [id], onDelete: Cascade)
}

model RecurrenceRule {
  id               String   @id @default(uuid())
  managerId        String
  swimlaneId       String
  frequency        String   // 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  dayOfWeek        Int?
  dayOfMonth       Int?
  templateTitle    String
  templatePriority String   @default("medium")
  nextGenerateAt   DateTime
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  cards            Card[]
}

model Reportee {
  id           String    @id @default(uuid())
  managerId    String
  name         String
  email        String?
  role         String?
  joinDate     DateTime?
  last1on1Date DateTime?
  riskLevel    String    @default("none")
  createdAt    DateTime  @default(now())
  manager      Manager        @relation(fields: [managerId], references: [id])
  swimlanes    Swimlane[]
  cards        Card[]
  interactions InteractionLog[]
}

model InteractionLog {
  id              String   @id @default(uuid())
  managerId       String
  reporteeId      String
  interactionType String
  occurredAt      DateTime @default(now())
  notes           String?  @db.Text
  sentiment       String?
  reportee        Reportee @relation(fields: [reporteeId], references: [id])
}
```

---

## 4. API Design

### 4.1 Authentication

#### Login
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, manager: { id, name, email, role } }
```

JWT payload: `{ managerId: string }`, signed with `JWT_SECRET`, expires in 7 days.

### 4.2 Board APIs

```
GET /api/boards
→ Returns manager's board with all swimlanes, cards (auto-archives done cards > 7 days)
  Includes: swimlanes[].reportee, swimlanes[].cards[].actionItems
```

### 4.3 Card APIs

```
POST   /api/cards                    → Create card (source: 'self')
GET    /api/cards/:id                → Card detail with notes + action items
PATCH  /api/cards/:id                → Update title, description, priority, dueDate
PATCH  /api/cards/:id/move           → Move card (change status)
                                       Auto-acknowledges pushed cards on move from todo
DELETE /api/cards/:id                → Delete card
POST   /api/cards/:id/notes          → Add note
POST   /api/cards/:id/action-items   → Add action item
PATCH  /api/cards/action-items/:id   → Toggle action item done
```

### 4.4 People APIs

```
GET    /api/people                   → Reportees with health (green/yellow/red)
POST   /api/people/:id/interactions  → Log interaction (updates last1on1Date if type='1on1')
GET    /api/people/:id/interactions  → Interaction history (last 20)
```

### 4.5 Recurrence APIs

```
GET    /api/recurrence-rules         → List rules for manager
POST   /api/recurrence-rules         → Create rule
DELETE /api/recurrence-rules/:id     → Delete rule
```

### 4.6 Team Dashboard APIs

```
GET  /api/team/overview
  → Senior Manager: returns line managers with their org/unit cards (privacy: no team-level)
  → Line Manager: returns reportees with their cards

GET  /api/team/line-managers
  → Returns line managers under this senior manager

POST /api/team/push-initiative
  → Senior Manager pushes task to selected line managers' 'unit' swimlanes
  Body: { title, description?, priority, dueDate?, targetManagerIds: string[] }

POST /api/v1/org/broadcast
  → Broadcast a task to ALL line managers' 'org' swimlanes
  Headers: Authorization: Bearer <api_key>
  Body: { title, description?, priority, dueDate (required) }
  Response: 201 { created: number, cardIds: string[] }
```

### 4.7 Notifications API

```
GET /api/notifications
  → Returns cards from last 7 days with source in ['unit_manager', 'organization']
    on the manager's board
```

### 4.8 External Push API (API Key Auth)

```
POST /api/v1/managers/:managerId/tasks
Headers: Authorization: Bearer <api_key>
Body: {
  title: string (required, max 255)
  description?: string (max 2000)
  cardType: 'org' | 'people'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: ISO date string
  reporteeId?: string
  metadata?: Record<string, unknown>
}
Response: 201 { cardId, status, acknowledged: false, boardId }

Swimlane resolution:
  - source = 'unit_manager' → places in 'unit' swimlane
  - source = 'organization' → places in 'org' swimlane
  - reporteeId provided → places in that reportee's person swimlane

GET /api/v1/tasks/:cardId/status
Response: { cardId, acknowledged, acknowledgedAt, currentStatus, createdAt, dueDate }
```

### 4.9 Admin APIs (JWT auth, role='admin')

```
GET    /api/admin/org-tree           → Full hierarchy: Senior Managers → Line Managers → Reportees
GET    /api/admin/senior-managers    → List all senior managers with their line managers
POST   /api/admin/senior-managers    → Create senior manager (auto-creates board + org/unit/team swimlanes)
       Body: { name, email, password, orgUnit? }
DELETE /api/admin/senior-managers/:id → Delete senior manager

GET    /api/admin/line-managers      → List all line managers with senior manager and reportees
POST   /api/admin/line-managers      → Create line manager (auto-creates board + person swimlane on SM's board)
       Body: { name, email, password, orgUnit?, seniorManagerId }
DELETE /api/admin/line-managers/:id  → Delete line manager

GET    /api/admin/reportees          → List reportees (only those under line managers)
POST   /api/admin/reportees          → Create reportee (auto-creates person swimlane on LM's board)
       Body: { name, email?, role?, managerId }
DELETE /api/admin/reportees/:id      → Delete reportee
```

---

## 5. Key Module Designs

### 5.1 Swimlane Resolution (Ingestion)

```
IF reporteeId provided → find person swimlane with that reporteeId
ELSE IF apiKey.sourceType == 'unit_manager' → find swimlane with type='unit'
ELSE → find swimlane with type='org'
FALLBACK → first swimlane on board
```

### 5.2 Recurrence Engine

```
Cron: runs every hour (setInterval)
1. Query: RecurrenceRule WHERE nextGenerateAt <= NOW() AND isActive = true
2. For each rule:
   a. Create card in rule's swimlane (status='todo', source='self')
   b. Calculate next generation date based on frequency
   c. Update rule.nextGenerateAt
```

### 5.3 Acknowledgement Flow

```
1. Pushed card arrives with acknowledgedAt = null, status = 'todo'
2. Manager moves card from 'todo' to any other status
3. PATCH /api/cards/:id/move detects:
   - source != 'self' AND status was 'todo' AND new status != 'todo'
   - Sets acknowledgedAt = now()
4. Source system can query GET /api/v1/tasks/:id/status to check
```

### 5.4 Cancellation & Deletion Rules

```
DELETE /api/cards/:id
- Only allowed if card.source is null or 'self'
- Returns 403 for pushed tasks (unit_manager, organization)

Status 'cancelled' is blocked:
- PATCH /api/cards/:id/move with status='cancelled' returns 403
- No task can be cancelled — must be completed (moved to Done)

Summary:
| Source        | Delete? | Cancel? |
|---------------|---------|---------|
| self (Team)   | Yes     | N/A     |
| unit_manager  | No      | No      |
| organization  | No      | No      |
```

### 5.5 Due Date Rules

```
Mandatory (enforced by backend validation):
- Org push API: Zod schema requires dueDate field
- Unit push (Push Initiative): Backend rejects if dueDate missing
- Bulk broadcast: Same Zod schema as single push

Optional:
- Self-created cards (POST /api/cards): dueDate is optional
- Due date on pushed cards cannot be edited by the manager (frontend locks it)
```

### 5.6 Notification System

```
Frontend (NotificationBell.tsx):
1. Polls GET /api/notifications every 5 seconds
2. Filters out IDs stored in localStorage ('readNotifs')
3. Shows unread count as red badge on bell icon
4. Click notification → marks as read, switches to Board, highlights card (3s pulse)
5. "Mark all read" → stores all current IDs in localStorage

Backend:
- Returns cards from last 7 days where source in ['unit_manager', 'organization']
- Scoped to cards on the authenticated manager's board
```

### 5.7 Team Dashboard (Privacy-Aware)

```
Senior Manager view:
- Shows each line manager as a section
- Only displays cards with source = 'unit_manager' | 'organization'
- Team-level cards (source='self') are NOT shown (privacy)
- Each card shows: layer badge, status, priority, acknowledgement status

Line Manager view:
- Shows each reportee as a section
- Displays all active cards for each reportee
- Each card shows: layer badge, status, priority
```

### 5.8 Relationship Health Indicator

```
Computed on board load from reportee.last1on1Date:
- Green: ≤ 7 days since last 1-on-1
- Yellow: 8–14 days
- Red: > 14 days
Displayed as colored dot on person swimlane header
```

### 5.9 1-on-1 Notes (Log1on1.tsx)

```
Flow:
1. Manager clicks 📝 button on person swimlane header
2. Log1on1 modal opens with:
   - Notes textarea (free-form)
   - Sentiment dropdown (Positive / Neutral / Concern)
   - Action items list (dynamic, add/remove)
3. On "Save & Generate Cards":
   a. POST /api/people/:reporteeId/interactions
      - interactionType: '1on1', notes, sentiment
      - Backend updates reportee.last1on1Date → health goes green
   b. For each non-empty action item:
      - POST /api/cards { swimlaneId, title: actionItem, cardType: 'people', reporteeId }
      - Card created in reportee's person swimlane, status: 'todo'
4. Board refreshes showing new cards
```

---

## 6. Frontend Component Details

### 6.1 App.tsx (Root)
- Manages: token, role, name (localStorage + state)
- Renders: Login (if no token) or Header + Board/TeamDashboard
- Passes: highlightedCard state to Board (from notification clicks)

### 6.2 Board.tsx
- Fetches board via React Query (`GET /api/boards`)
- Renders table: rows = swimlanes, 4 columns = To Do | In Progress | Waiting | Done
- Drag-and-drop via @dnd-kit/core + @dnd-kit/sortable
- Passes highlighted prop to Card for pulse animation

### 6.3 Card.tsx
- Visual: left border color by source (amber=org, purple=unit, blue=team)
- Shows: title, priority badge, source badge, due date
- Draggable with `onDragStart` setting cardId
- Highlighted state: indigo ring + animate-pulse

### 6.4 Widgets.tsx
- Computes from board data: overdue, org count, unit count, team count, unacknowledged
- 5-column grid with colored border-left indicators

### 6.5 TeamDashboard.tsx
- Role-aware: shows Push Initiative button only for senior_manager
- Maps overview data into expandable sections per manager/reportee
- Card rows with status progress timeline, notes, acknowledgement status

### 6.6 NotificationBell.tsx
- Polls notifications every 5s
- Client-side read tracking via localStorage
- Dropdown with task list, "Mark all read" button
- Click → onHighlight callback → parent switches to board + highlights card

---

## 7. Authentication Detail

### JWT Flow
```
1. POST /api/auth/login { email, password }
2. Server: bcrypt.compare(password, manager.passwordHash)
3. Server: jwt.sign({ managerId }, JWT_SECRET, { expiresIn: '7d' })
4. Client: stores token in localStorage
5. Client: Axios interceptor adds Authorization: Bearer <token> to all requests
6. Server: authenticateJwt middleware verifies token, sets req.managerId
```

### API Key Flow
```
1. Seed creates API keys with bcrypt-hashed values
2. External system sends: Authorization: Bearer <raw_key>
3. Server: iterates active ApiKeys, bcrypt.compare(raw_key, keyHash)
4. On match: sets req.apiKey = { sourceType, sourceId, managerId }
5. Proceeds with ingestion using source metadata from key
```

---

## 8. Error Handling

| Scenario | Response |
|----------|----------|
| Invalid login | 401 `{ error: 'Invalid credentials' }` |
| No board found | 404 `{ error: 'No board found' }` |
| Invalid push payload | 400 `{ error: 'Validation failed', details: [...] }` |
| Invalid API key | 401 `{ error: 'Invalid API key' }` |
| Manager not found (push) | 404 `{ error: 'Manager not found' }` |
| Missing required fields | 400 `{ error: 'title and targetManagerIds required' }` |

---

## 9. Demo Credentials & Data

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@demo.com | admin123 | admin |
| Ramesh K | ramesh@demo.com | demo123 | senior_manager |
| Manju R | manju@demo.com | demo123 | line_manager |
| Suresh P | suresh@demo.com | demo123 | line_manager |

| API Key | Source Type | Purpose |
|---------|------------|---------|
| demo-push-key-12345 | unit_manager | Senior Manager push |
| demo-org-key-99999 | organization | Org-level push |

### Hierarchy
```
Ramesh K (Senior Manager)
├── Manju R (Line Manager)
│   ├── Rahul S (Senior Engineer)
│   ├── Priya M (Tech Lead)
│   ├── Anil K (Engineer)
│   ├── Neha T (Senior Engineer)
│   └── Vikram D (Engineer)
└── Suresh P (Line Manager)
```

---

## 10. Configuration

```env
# .env
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/managerflow"
JWT_SECRET="your-secret-key"  # defaults to 'managerflow-secret' in code
```

---

## 11. Build & Run

```bash
# Install
npm install && cd apps/api && npm install && cd ../web && npm install && cd ../..

# Database
npx prisma db push
npx ts-node prisma/seed.ts

# Run
cd apps/api && npm run dev    # port 4000
cd apps/web && npm run dev    # port 3000
```

---

*End of LLD*
