# High-Level Design (HLD)
## ManagerFlow — Kanban Operating System for IT Line Managers

**Version:** 2.0  
**Date:** 2026-05-21  
**Status:** Implemented (MVP)  

---

## 1. System Overview

ManagerFlow is a web application that provides IT Line Managers with a cadence-driven, people-centric Kanban board. The system supports three task layers:

1. **Org Level** — Tasks pushed via external API from organization systems (HR, Finance, Compliance)
2. **Unit Level** — Tasks pushed by Senior Managers to their Line Managers
3. **Team Level** — Tasks created by the manager themselves

### Two User Roles

| Role | Capabilities |
|------|-------------|
| **Senior Manager** | Own board, push tasks to line managers, Team Dashboard (view org/unit tasks across reports) |
| **Line Manager** | Own board, manage reportees, Team Dashboard (view reportee tasks) |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SOURCES                                │
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐                           │
│  │ Senior Manager   │    │  Org Systems     │                           │
│  │ (Push Initiative │    │  (HR, Finance,   │                           │
│  │  via UI/API)     │    │   Compliance)    │                           │
│  └────────┬─────────┘    └────────┬─────────┘                           │
│           │                       │                                      │
└───────────┼───────────────────────┼──────────────────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS API (Port 4000)                            │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │
│  │   Board     │ │    Card     │ │   People    │ │  Task Ingestion │  │
│  │   Route     │ │   Route     │ │   Route     │ │  Route (API)    │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────────┐  │
│  │ Recurrence  │ │  Team       │ │  Notifications Route            │  │
│  │ Cron        │ │  Dashboard  │ │                                  │  │
│  └─────────────┘ └─────────────┘ └─────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼────────────────────────────────────┐
│                           DATA LAYER                                      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  MySQL 8 (via Prisma ORM)                                         │   │
│  │  Tables: Manager, Board, Swimlane, Card, CardNote, ActionItem,    │   │
│  │          Reportee, InteractionLog, RecurrenceRule, ApiKey          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Port 3000)                            │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Board   │ │  Team    │ │ Widgets  │ │ Notif    │ │  Card       │  │
│  │  View    │ │ Dashboard│ │  Bar     │ │  Bell    │ │  Detail     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Style

**Modular Monolith** — logically separated routes within a single Express server. Frontend is a React SPA communicating via REST API.

| Decision | Rationale |
|----------|-----------|
| Monolith (Express) | Fast MVP, single team, simple deployment |
| MySQL via Prisma | Relational data with type-safe ORM |
| REST API | Standard, well-understood |
| Polling (5s) for notifications | Simple, no WebSocket complexity for MVP |
| JWT auth | Stateless, simple token-based auth |

---

## 3. Component Architecture

### 3.1 Frontend (React SPA — Vite)

```
React App (App.tsx)
├── Auth (Login component — email/password JWT)
├── Header (view toggle, notification bell, username, logout)
├── Board View
│   ├── Widgets Bar (overdue, org/unit/team counts, unacknowledged)
│   ├── Kanban Board (table layout: swimlanes × columns)
│   │   ├── Card Component (draggable, highlighted on notification click)
│   │   └── Card Detail Panel (modal — notes, action items, status)
│   └── Create Card Modal
├── Team Dashboard
│   ├── Senior Manager: line managers' org/unit tasks with status
│   ├── Line Manager: reportees' tasks with status
│   └── Push Initiative Modal (senior manager only)
├── Notification Bell (polling, client-side read tracking)
└── Admin Panel (role='admin' → separate UI)
    ├── Org Tree (visual hierarchy)
    ├── Senior Managers CRUD
    ├── Line Managers CRUD (assign to Senior Manager)
    └── Reportees CRUD (assign to Line Manager)
```

### 3.2 Backend Routes

| Route | Responsibility |
|-------|---------------|
| **Auth** (`/api/auth`) | Login, JWT issuance |
| **Board** (`/api/boards`) | Board with swimlanes and cards |
| **Cards** (`/api/cards`) | Card CRUD, move (status change), notes, action items |
| **People** (`/api/people`) | Reportee list with health, interaction logging |
| **Recurrence** (`/api/recurrence-rules`) | CRUD for recurring task rules |
| **Team Dashboard** (`/api/team`) | Overview (role-aware), line-managers list, push initiative |
| **Notifications** (`/api/notifications`) | Recent pushed cards for notification bell |
| **Ingestion** (`/api/v1`) | External push API (API key auth) |
| **Broadcast** (`/api/v1/org/broadcast`) | Bulk push a single task to multiple managers at once (API key auth) |
| **Admin** (`/api/admin`) | Org structure CRUD: Senior Managers, Line Managers, Reportees, Org Tree |

### 3.3 Task Ingestion Flow (External Push)

```
External System                    ManagerFlow
     │                                  │
     │  POST /api/v1/managers/{id}/tasks│
     │─────────────────────────────────▶│
     │                                  │
     │                          ┌───────▼────────┐
     │                          │ API Key Auth   │
     │                          │ - Validate key │
     │                          │ - Identify src │
     │                          └───────┬────────┘
     │                                  │
     │                          ┌───────▼────────┐
     │                          │ Swimlane       │
     │                          │ Resolution     │
     │                          │ - org → 'org'  │
     │                          │ - unit → 'unit'│
     │                          └───────┬────────┘
     │                                  │
     │                          ┌───────▼────────┐
     │                          │ Card Created   │
     │                          │ status=todo    │
     │                          │ source=type    │
     │                          └───────┬────────┘
     │                                  │
     │  201 Created {card_id, status}   │
     │◀─────────────────────────────────│
     │                                  │
     │         (Notification bell polls │
     │          and shows new card)     │
```

---

## 4. Swimlane Architecture

Each manager's board has these swimlane types:

| Swimlane Type | Purpose | Cards Placed Here |
|---------------|---------|-------------------|
| `org` | Organization-level tasks | Cards with `source: 'organization'` (API push) |
| `unit` | Unit-level tasks from Senior Manager | Cards with `source: 'unit_manager'` (push initiative) |
| `team` | Self-created team tasks | Cards with `source: 'self'` |
| `person` | Per-reportee tasks | People-related cards tied to a specific reportee |

### Column States (all swimlanes — 4 columns)
`todo` → `in_progress` → `waiting` → `done`

---

## 5. Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Authentication (UI) | Email/password → JWT (bcrypt hashed passwords) |
| Authentication (API) | API keys (bcrypt hashed, stored in DB) |
| Authorization | Role-based: `senior_manager` vs `line_manager` |
| Transport | CORS-enabled Express server |
| Privacy | Senior Manager Team Dashboard only shows org/unit tasks (not team-level) |
| Input validation | Zod schema validation on push API |

### Role-Based Access

| Role | Permissions |
|------|-------------|
| Admin | Manage org structure (Senior Managers, Line Managers, Reportees); no board access |
| Senior Manager | Full CRUD on own board; push tasks to line managers; view org/unit tasks across line managers |
| Line Manager | Full CRUD on own board; view reportees in Team Dashboard |

### Cancellation / Deletion Rules

| Task Source | Can Delete? | Can Cancel? | Notes |
|-------------|-------------|-------------|-------|
| `self` (Team) | Yes — owner manager | N/A | Hard delete from DB |
| `unit_manager` (Unit) | No | No | Must be completed (moved to Done) |
| `organization` (Org) | No | No | Must be completed (moved to Done) |

### Due Date Rules

| Task Source | Due Date | Editable by Manager? |
|-------------|----------|---------------------|
| Org (API) | Mandatory | No (locked by source) |
| Unit (Senior Manager) | Mandatory | No (locked by source) |
| Team (self-created) | Optional | Yes |

---

## 6. Notification System

```
┌─────────────────────────────────────────────────┐
│  Notification Flow                               │
│                                                  │
│  1. External push or Senior Manager push         │
│     → Card created with source ≠ 'self'          │
│                                                  │
│  2. Frontend polls GET /api/notifications        │
│     every 5 seconds                              │
│                                                  │
│  3. Returns cards from last 7 days with          │
│     source = 'unit_manager' | 'organization'     │
│                                                  │
│  4. Client filters out read IDs (localStorage)   │
│                                                  │
│  5. Bell shows unread count badge                │
│                                                  │
│  6. Click notification → switches to Board,      │
│     highlights card with pulse animation (3s)    │
│                                                  │
│  7. "Mark all read" → stores IDs in localStorage │
│                                                  │
│  8. 1-on-1 Notes submission resets reportee      │
│     health indicator to green (via interaction   │
│     log timestamp update)                        │
└─────────────────────────────────────────────────┘
```

---

## 7. Data Flow Summary

| Flow | Source → Destination | Trigger |
|------|---------------------|---------|
| Manager creates card | UI → POST /api/cards → MySQL | User action |
| Recurrence generates card | Cron (hourly) → MySQL | Scheduled |
| Senior Manager pushes task | UI (Push Initiative) → POST /api/team/push-initiative → MySQL | User action |
| Org pushes task via API | API → POST /api/v1/managers/:id/tasks → MySQL | API call |
| Org broadcasts to all | API → POST /api/v1/org/broadcast → MySQL (all boards) | API call |
| Manager drags card | UI → PATCH /api/cards/:id/move → MySQL | User action |
| Auto-acknowledge | Card moved from To Do → `acknowledgedAt` set | Status change |
| Source queries status | GET /api/v1/tasks/:id/status → MySQL → Response | API call |
| Notification poll | Frontend → GET /api/notifications → Response | 5s interval |
| 1-on-1 Notes saved | UI → POST /api/people/:id/notes → MySQL | User action (resets health to green) |
| Admin creates manager | Admin UI → POST /api/admin/* → MySQL (auto-provisions board + swimlanes) | Admin action |

---

## 8. Deployment (Current MVP)

```
Local Development:
├── Frontend: Vite dev server (port 3000)
├── Backend: ts-node Express (port 4000)
└── Database: MySQL 8 (localhost:3306)
```

| Component | Technology | Notes |
|-----------|-----------|-------|
| Frontend | React + Vite | Hot reload dev server |
| Backend | Express + ts-node | Auto-restart on changes |
| Database | MySQL 8 | Prisma ORM, schema push |
| Auth | JWT (jsonwebtoken) | bcrypt for passwords |

---

*End of HLD*
