# High-Level Design (HLD)
## ManagerFlow — Architecture Overview

**Version:** 2.0 | **Date:** 2026-05-22 | **Status:** Implemented

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Port 3000)                 │
│  Admin Panel │ Board │ Team Dashboard │ Notifications        │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JWT Auth)
┌──────────────────────────────▼──────────────────────────────┐
│                    EXPRESS API (Port 4000)                    │
│  Auth │ Board │ Cards │ People │ Team │ Notifications │ Admin│
│  Recurrence Cron │ Ingestion (API Key Auth)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM
┌──────────────────────────────▼──────────────────────────────┐
│                    MySQL 8 (Port 3306)                        │
│  Manager │ Board │ Swimlane │ Card │ Reportee │ ApiKey       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Style

**Modular Monolith** — logically separated routes in a single Express server.

| Decision | Rationale |
|----------|-----------|
| Monolith | Fast MVP, single team, simple deployment |
| MySQL + Prisma | Relational data with type-safe ORM |
| REST API | Standard, well-understood |
| Polling (5s) | Simple notifications without WebSocket complexity |
| JWT | Stateless auth |

---

## 3. Backend Routes

| Route | Responsibility |
|-------|---------------|
| `/api/auth` | Login, JWT issuance |
| `/api/boards` | Board with swimlanes and cards |
| `/api/cards` | Card CRUD, move, notes, action items, delete |
| `/api/people` | Reportees, health, interaction logging |
| `/api/recurrence-rules` | Recurring task CRUD |
| `/api/team` | Team Dashboard overview, push initiative, heatmap |
| `/api/notifications` | Recent pushed cards for bell |
| `/api/admin` | Org structure CRUD (Senior Managers, Line Managers, Reportees, Org Tree) |
| `/api/v1/managers/:id/tasks` | External push API (API key auth) |
| `/api/v1/org/broadcast` | Bulk push to all managers (API key auth) |
| `/api/v1/tasks/:id/status` | Query task acknowledgement status |

---

## 4. Swimlane Architecture

| Type | Purpose | Cards Source |
|------|---------|-------------|
| `org` | Organization tasks | API push (`source: 'organization'`) |
| `unit` | Senior Manager tasks | Push Initiative (`source: 'unit_manager'`) |
| `team` | Self-created tasks | Manager creates (`source: 'self'`) |
| `person` | Per-reportee tasks | Manager creates or 1-on-1 action items |

**Columns:** `todo` → `in_progress` → `waiting` → `done`

---

## 5. Security & Access Control

| Role | Permissions |
|------|-------------|
| Admin | Manage org structure; no board access |
| Senior Manager | Own board; push to line managers; view org/unit tasks across reports |
| Line Manager | Own board; view reportees in Team Dashboard |

### Privacy Rules
- Team-level tasks are private to the manager
- Senior Manager Team Dashboard only shows org/unit tasks

### Deletion Rules

| Source | Delete | Cancel |
|--------|--------|--------|
| Team (self) | ✅ Yes | N/A |
| Unit (SM push) | ❌ No | ❌ No |
| Org (API) | ❌ No | ❌ No |

### Due Date Rules

| Source | Due Date | Editable |
|--------|----------|----------|
| Org/Unit | Mandatory | No (locked) |
| Team | Optional | Yes |

---

## 6. Key Data Flows

| Flow | Path | Trigger |
|------|------|---------|
| Manager creates card | UI → POST /api/cards → MySQL | User action |
| Recurrence generates card | Cron (hourly) → MySQL | Scheduled |
| Senior Manager pushes | UI → POST /api/team/push-initiative → MySQL | User action |
| Org pushes via API | POST /api/v1/managers/:id/tasks → MySQL | API call |
| Org broadcasts | POST /api/v1/org/broadcast → all boards | API call |
| Card moved | UI drag → PATCH /api/cards/:id/move | User action |
| Auto-acknowledge | Card moved from To Do → acknowledgedAt set | Status change |
| 1-on-1 logged | UI → POST /api/people/:id/interactions → health resets | User action |
| Notification poll | Frontend → GET /api/notifications | 5s interval |
| Today's Focus nudges | Frontend computes from board data (overdue, due soon, unacked, stale, stuck, sentiment) | On board load |
| Heatmap data | Frontend → GET /api/team/heatmap → role-aware grid | Team Dashboard load |
| Admin creates manager | POST /api/admin/* → auto-provisions board + swimlanes | Admin action |

---

## 7. Notification System

```
1. External push or Senior Manager push → Card created (source ≠ 'self')
2. Frontend polls GET /api/notifications every 5 seconds
3. Returns cards from last 7 days with source = 'unit_manager' | 'organization'
4. Client filters out read IDs (localStorage)
5. Bell shows unread count badge
6. Click notification → Board view, card pulses with indigo ring (3s)
7. "Mark all read" → stores IDs in localStorage
```

---

## 8. Auto-Provisioning (Admin)

| Create | Auto-Provisions |
|--------|----------------|
| Senior Manager | Board + Org/Unit/Team swimlanes |
| Line Manager | Board + Org/Unit/Team swimlanes + Person swimlane on SM's board |
| Reportee | Person swimlane on Line Manager's board |

---

*End of HLD*
