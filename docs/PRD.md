# Product Requirements Document (PRD)
## ManagerFlow — A Kanban Operating System for IT Line Managers

**Version:** 2.0 | **Date:** 2026-05-22 | **Status:** MVP Implemented

---

## 1. Executive Summary

ManagerFlow is a purpose-built visual workflow dashboard for IT Line Managers who manage people, not projects. It combines recurring organizational obligations and reportee management into a single Kanban-style interface.

**Core thesis:** Line Managers need a cadence-driven, people-centric operating system — not another sprint board.

---

## 2. Target Users

| Persona | Role | Key Need |
|---------|------|----------|
| Admin | System administrator | Manage org structure |
| Senior Manager | VP/Director managing Line Managers | Push initiatives, track compliance |
| Line Manager | Engineering/Ops Manager with 5-15 reports | Daily workflow management |

---

## 3. Design Principles

1. **Manager-only tool** — reportees never log in
2. **Cadence over sprints** — work recurs on weekly/biweekly/monthly/quarterly cycles
3. **People over projects** — swimlanes organized by humans, not epics
4. **Lightweight** — 2-minute daily check, not a 30-minute admin session
5. **Nudge over nag** — surface what needs attention without creating anxiety
6. **Three-layer hierarchy** — Org → Unit → Team with clear ownership and privacy

---

## 4. Feature Requirements (MVP — Implemented)

| ID | Feature | Description |
|----|---------|-------------|
| F1 | Kanban Board | @dnd-kit drag-and-drop with 4 columns: To Do, In Progress, Waiting, Done |
| F2 | Swimlanes | 4 types: Org Tasks, Unit Tasks, Team Tasks, Person (per-reportee) |
| F3 | Three Task Layers | Org (API-only), Unit (Senior Manager push), Team (self-created) with distinct rules |
| F4 | Recurrence Engine | Auto-generate cards on weekly/biweekly/monthly/quarterly schedules |
| F5 | Reportee Profiles | Name, role, last 1-on-1 date, relationship health indicator |
| F6 | Health Indicators | Green/Yellow/Red dots based on days since last 1-on-1 |
| F7 | Card Detail Panel | Notes, action items, source info, due date management |
| F8 | 1-on-1 Notes | Log meetings with notes, sentiment, action items → auto-generate cards |
| F9 | Needs Attention | Dashboard section showing overdue cards + stale reportees (>14 days) |
| F10 | Notification Bell | Live polling (5s) for pushed tasks with card highlighting |
| F11 | Authentication | Email/password JWT auth with admin/senior_manager/line_manager roles |
| F12 | Team Dashboard | Role-aware view with "Show completed" toggle; privacy-respecting |
| F13 | Push Initiative | Senior Manager pushes tasks to Line Managers with mandatory due date |
| F14 | Admin Panel | Org structure CRUD with auto-provisioning of boards/swimlanes |
| F15 | External Push API | REST API for org-level task push + bulk broadcast |
| F16 | Widgets Bar | Overdue, stale 1-on-1s, org/unit/team counts, unacknowledged |

---

## 5. Three Task Layers

| Layer | Created By | Swimlane | Due Date | Deletable | Privacy |
|-------|-----------|----------|----------|-----------|---------|
| 🏢 Org | External API only | Org Tasks | Mandatory | No | Visible to Senior Manager |
| 📥 Unit | Senior Manager (Push Initiative) | Unit Tasks | Mandatory | No | Visible to Senior Manager |
| ✏️ Team | Manager (self) | Team Tasks / Person | Optional | Yes | Private — NOT visible to Senior Manager |

---

## 6. Information Architecture

```
ManagerFlow
├── Login (email/password → role-based routing)
├── Admin Panel (admin role only)
│   ├── 🌳 Org Tree
│   ├── 👔 Senior Managers CRUD
│   ├── 👤 Line Managers CRUD
│   └── 👥 Reportees CRUD
├── Manager View (senior_manager / line_manager)
│   ├── Header (view toggle, notifications, username, logout)
│   ├── My Board
│   │   ├── Widgets Bar + Needs Attention
│   │   ├── Kanban Board (4 columns × N swimlanes)
│   │   └── Card Detail Panel
│   └── Team Dashboard
│       ├── Senior Manager: org/unit tasks across line managers
│       ├── Line Manager: reportee tasks
│       └── Push Initiative Modal
└── Notification Bell (live polling)
```

---

## 7. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind + Vite |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Data Fetching | TanStack Query (React Query) |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod (push API) |

---

## 8. MVP Scope Summary

**Implemented:**
- 4-column Kanban board with dnd-kit drag-and-drop
- 4 swimlane types (org/unit/team/person)
- 3 task layers with distinct ownership, privacy, and deletion rules
- Recurring card engine
- 1-on-1 notes with auto-generated action item cards
- Relationship health indicators (green/yellow/red)
- Notification bell with live polling
- Team Dashboard with privacy (Senior Manager can't see team-level tasks)
- Admin Panel with full org structure CRUD and auto-provisioning
- External Push API with bulk broadcast
- Needs Attention section (overdue + stale reportees)
- Widgets bar with 6 metrics

**Out of scope:**
- Calendar/HRIS integration
- AI/smart nudges
- Mobile native app
- SSO (Microsoft/Google)
- Reporting/export
- Teams/Slack notifications

---

*End of PRD*
