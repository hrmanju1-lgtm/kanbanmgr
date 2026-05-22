# Product Requirements Document (PRD)
## ManagerFlow — A Kanban Operating System for IT Line Managers

**Version:** 1.0  
**Date:** 2026-05-20  
**Author:** Manju  
**Status:** Draft  

---

## 1. Executive Summary

ManagerFlow is a purpose-built visual workflow dashboard for IT Line Managers who manage people, not projects. It combines recurring organizational obligations and reportee management into a single Kanban-style interface — replacing the fragmented mix of Outlook reminders, Excel trackers, HR portals, and memory that managers currently rely on.

**Core thesis:** Line Managers need a cadence-driven, people-centric operating system — not another sprint board adapted from delivery tools.

---

## 2. Problem Statement

### Who suffers?
IT Line Managers (Engineering Managers, Delivery Managers, Ops Managers) managing 5–15 direct reports who are accountable for organizational processes and people outcomes but do NOT run sprints or manage project backlogs.

### What's broken?
| Pain Point | Current Workaround | Cost |
|------------|-------------------|------|
| Recurring org tasks forgotten until escalated | Outlook reminders, memory | Missed deadlines, poor perception |
| 1-on-1 action items lost | OneNote, scattered docs | Broken trust with reportees |
| No single view of managerial workload | Mental model only | Burnout, dropped balls |
| Inconsistent people engagement | Ad-hoc approach | Attrition, disengagement |
| Invisible managerial work | Not tracked anywhere | Undervalued by leadership |
| Stale relationships with reportees | No tracking | Surprise resignations |

### Why now?
- Hybrid/remote work eliminated passive relationship maintenance (hallway chats)
- Companies investing heavily in "manager enablement" as retention lever
- IC tooling is mature (Jira, GitHub, etc.) but manager tooling is primitive
- AI capabilities now enable smart nudges and pattern detection

---

## 3. Target Users

### Primary Persona: "The IT Line Manager"

| Attribute | Detail |
|-----------|--------|
| Role | Engineering Manager / Delivery Manager / Ops Manager |
| Team size | 5–15 direct reports |
| Industry | Telecom, Enterprise IT, Managed Services, Infra Ops |
| Daily tools | Outlook, Teams/Slack, Excel, HR portal, Jira (read-only) |
| Key frustration | "I'm accountable for everything but have no system to manage it" |
| Tech comfort | Moderate — uses SaaS tools daily but won't adopt complex systems |
| Decision authority | Can adopt personal tools; needs manager approval for team-wide tools |

### Secondary Persona: "HR / Skip-Level Leadership"
- Wants visibility into manager engagement patterns
- Cares about consistency across managers
- Buyer for enterprise deals

### Anti-Persona
- Scrum Masters (have Jira)
- Individual Contributors (have task managers)
- Project Managers (have delivery tools)
- HR Business Partners (have HRIS)

---

## 4. Product Vision

> Make invisible managerial work visible, structured, and sustainable through cadence-driven, people-centric workflow management.

### Design Principles
1. **Manager-only tool** — reportees never need to log in or adopt anything
2. **Cadence over sprints** — work recurs on weekly/biweekly/monthly/quarterly cycles
3. **People over projects** — swimlanes organized by humans, not epics
4. **Lightweight over comprehensive** — 2-minute daily check, not a 30-minute admin session
5. **Nudge over nag** — surface what needs attention without creating anxiety

---

## 5. Feature Requirements

### 5.1 MVP (Phase 1) — Core Board

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F1 | Kanban Board | P0 | Drag-and-drop board (using @dnd-kit with visual overlay and drop zone highlighting) with columns: To Do, In Progress, Waiting, Done |
| F2 | Swimlanes | P0 | Horizontal lanes by type: Org Tasks, Unit Tasks, Team Tasks, Person (one per Reportee) |
| F3 | Task Layers | P0 | Three task layers with distinct rules: Org Level (API-pushed only), Unit Level (Senior Manager push), Team Level (self-created by Line Manager) |
| F4 | Recurrence Engine | P0 | Define recurring cards with frequency (weekly/biweekly/monthly/quarterly) that auto-generate |
| F5 | Reportee Profiles | P0 | Name, role, join date, last 1-on-1 date, risk level, notes |
| F6 | Relationship Health Indicator | P0 | Visual badge on swimlane header showing days since last interaction (green/yellow/red) |
| F7 | Card Detail Panel | P1 | Side panel on card click: notes, action items, history, linked reportee |
| F8 | 1-on-1 Notes | P0 | Log 1-on-1 meetings with notes, sentiment tracking, and action items that auto-generate task cards |
| F9 | Needs Attention Section | P0 | Dashboard section showing overdue cards and stale reportees (>14 days since last interaction) |
| F10 | Notification Bell | P0 | In-app notification bell with live polling (5s interval) for pushed tasks (Org/Unit level) |
| F11 | Authentication | P0 | Email/password JWT authentication |
| F12 | Team Dashboard | P0 | Senior Manager and Line Manager can view team dashboard; shows only Org/Unit tasks (Team-level tasks are private to the Line Manager) |
| F13 | Mobile Responsive | P2 | Usable on phone for quick status checks (read-heavy, light edits) |
| F14 | Admin Panel | P0 | Separate admin login to manage org structure: create/delete Senior Managers, Line Managers, Reportees with auto-provisioning of boards and swimlanes |

### 5.2 Task Ingestion (Three Layers)

#### Layer 1: Org Level Tasks (API-only)
External organizational systems (HR, Finance, Compliance) push tasks via REST API. These land in the "Org Tasks" swimlane. Due date is mandatory. Cannot be cancelled or deleted by the Line Manager.

#### Layer 2: Unit Level Tasks (Senior Manager Push)
Senior Managers push tasks to their Line Managers via the UI or API. These land in the "Unit Tasks" swimlane. Due date is mandatory. Cannot be cancelled or deleted by the Line Manager.

#### Layer 3: Team Level Tasks (Self-created)
Line Managers create their own tasks for personal tracking. These live in the "Team Tasks" or "Person" swimlanes. Due date is optional. Can be deleted by the Line Manager.

#### Privacy Rules
- Team Dashboard (visible to both Senior Manager and Line Manager) only shows Org and Unit level tasks
- Team-level tasks are private to the Line Manager and never visible to the Senior Manager

#### Cancellation & Deletion Rules
| Layer | Can Delete? | Can Cancel? |
|-------|-------------|-------------|
| Org | No | No |
| Unit | No | No |
| Team | Yes | Yes |

#### Push API

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F25 | Task Push API | P0 | REST API that allows external systems (Org-level tools) and Senior Managers (Unit-level) to push tasks directly onto a Line Manager's board |
| F26 | API Authentication | P0 | Bearer token authentication for API access |
| F27 | Source Identification | P0 | Every pushed task carries a `source_type` (unit_manager | organization) and metadata to identify who pushed it |
| F28 | Auto-Placement Rules | P0 | Pushed tasks land in "To Do" column in the appropriate swimlane (Org Tasks for org-pushed, Unit Tasks for unit-pushed) |
| F29 | Priority & Deadline Passthrough | P0 | External systems set priority (low/medium/high/critical) and due_date (mandatory for Org/Unit); Line Manager cannot override |
| F30 | Push Notification on Ingest | P0 | Line Manager receives in-app notification via notification bell (live polling every 5 seconds) when a new task is pushed |
| F31 | Bulk Push | P2 | Org-level systems can push tasks to multiple managers in one API call |
| F32 | Task Template Reference | P2 | Pushed tasks can reference a template ID so the card arrives pre-populated |

#### API Design (Conceptual)

**Push a task to a specific manager:**
```
POST /api/v1/managers/{manager_id}/tasks

Headers:
  Authorization: Bearer <api_key_or_oauth_token>
  X-Source-Type: organization | unit_manager
  X-Source-Id: <source_identifier>

Body:
{
  "title": "Submit Q3 headcount plan",
  "description": "Due to Finance by June 1. Template attached.",
  "card_type": "org",
  "priority": "high",
  "due_date": "2026-06-01",
  "cadence": "one_time",
  "swimlane_hint": "org",
  "reportee_id": null,
  "template_id": "tpl_headcount_v2",
  "metadata": {
    "pushed_by": "VP Engineering - Ramesh K",
    "department": "Network Operations",
    "compliance_required": true
  }
}

Response: 201 Created
{
  "card_id": "card_abc123",
  "status": "todo",
  "acknowledged": false,
  "board_id": "board_xyz"
}
```

**Bulk push to multiple managers (org-level):**
```
POST /api/v1/org/tasks/broadcast

Body:
{
  "target": "all" | ["mgr_id_1", "mgr_id_2"],
  "target_filter": { "org_unit": "Network Ops", "level": "L2" },
  "task": {
    "title": "Complete mandatory security training",
    "card_type": "org",
    "priority": "high",
    "due_date": "2026-06-15",
    "cadence": "one_time"
  }
}
```

**Query acknowledgement status (for source systems):**
```
GET /api/v1/tasks/{card_id}/status

Response:
{
  "card_id": "card_abc123",
  "acknowledged": true,
  "acknowledged_at": "2026-05-21T09:30:00Z",
  "current_status": "in_progress",
  "manager_id": "mgr_456"
}
```

#### User Stories — Task Push

- As a Unit Senior Manager, I want to push tasks to my Line Managers' boards via API so they receive structured assignments without email chains.
- As an Organization (HR/Finance/Compliance), I want to broadcast mandatory tasks to all relevant managers so nothing falls through the cracks.
- As a Line Manager, I want to see who pushed a task and why so I have context without asking.
- As a Line Manager, I want pushed tasks to land in "To Do" so I can triage them on my own schedule.
- As a Unit Senior Manager, I want to check if my Line Managers acknowledged the task so I know it's on their radar.
- As an Organization admin, I want to see acknowledgement rates across managers so I can follow up on non-responders.

---

### 5.3 Phase 2 — Intelligence & Integrations

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F13 | Calendar Integration | P1 | Sync with Outlook/Google Calendar for 1-on-1 scheduling and auto-logging |
| F14 | Manager Heatmap | P1 | Visual grid: reportees × engagement dimensions (1-on-1s, action items, risk) |
| F15 | Smart Nudges | P2 | AI-driven: "You haven't spoken to Priya in 18 days", "Escalations from Team B up 32%" |
| F16 | Manager Capacity Analytics | P2 | Breakdown: meetings vs coaching vs admin vs firefighting (self-reported or calendar-derived) |
| F17 | Teams/Slack Notifications | P2 | Reminders for overdue cards, stale relationships, upcoming recurring tasks |
| F18 | HRIS Integration | P3 | Pull reportee data from Workday/BambooHR/SuccessFactors |

### 5.3 Phase 3 — Enterprise & Scale

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| F19 | Multi-Manager Org View | P3 | Skip-level leaders see aggregated health across their managers |
| F20 | Template Library | P2 | Pre-built recurring task templates (onboarding checklist, quarterly review prep, etc.) |
| F21 | Manager Health Score | P3 | Composite score visible to HR: engagement consistency, response times, risk coverage |
| F22 | Export & Reporting | P2 | PDF/CSV export of board state, interaction history, analytics |
| F23 | Audit Trail | P3 | Full history of card movements, notes, and interactions for compliance |

---

## 6. User Stories

### Board Management
- As a Line Manager, I want to see all my org tasks and reportee tasks in one board so I don't context-switch between tools.
- As a Line Manager, I want to drag a card from "To Do" to "In Progress" so I can quickly update status.
- As a Line Manager, I want separate swimlanes per reportee so I can see each person's pending items at a glance.

### Recurrence
- As a Line Manager, I want to define a recurring task (e.g., "Submit utilization report" every Monday) so it auto-appears without me remembering.
- As a Line Manager, I want recurring cards to appear in "To Do" on the scheduled day so I can plan my week.
- As a Line Manager, I want to skip or snooze a recurring card instance without deleting the rule.

### People Management
- As a Line Manager, I want to see how many days since my last 1-on-1 with each reportee so no one falls through the cracks.
- As a Line Manager, I want to capture 1-on-1 notes and have action items auto-created as cards so nothing is lost.
- As a Line Manager, I want to flag a reportee as "at risk" so their swimlane gets visual priority.

### Awareness
- As a Line Manager, I want a top-bar widget showing overdue items so I know what needs immediate attention.
- As a Line Manager, I want to see my capacity breakdown so I can advocate for less admin load.

### Enterprise (Phase 3)
- As an HR Leader, I want to see which managers have stale 1-on-1 patterns so I can intervene early.
- As a Skip-Level Leader, I want aggregated team health across my managers so I spot systemic issues.

---

## 7. Information Architecture

```
ManagerFlow
├── Dashboard (Board View) ← default landing
│   ├── Top Widgets Bar (overdue, stale 1-on-1s, org/unit/team counts, unacknowledged)
│   ├── Needs Attention Section (overdue cards + red-zone reportees)
│   ├── Kanban Board (4 columns: To Do | In Progress | Waiting | Done)
│   │   ├── Org Tasks Swimlane (API-pushed only)
│   │   ├── Unit Tasks Swimlane (Senior Manager pushed)
│   │   ├── Team Tasks Swimlane (self-created)
│   │   └── Reportee Swimlanes (1 per person, with 📝 Log 1-on-1 button)
│   └── Card Detail Panel (slide-out)
├── Team Dashboard
│   ├── Senior Manager View (Org/Unit tasks across line managers)
│   ├── Line Manager View (reportee tasks)
│   └── Push Initiative Modal (Senior Manager only)
├── Notification Bell
│   ├── Live polling (5s) for new pushed tasks
│   └── Click to highlight card on board
├── Admin Panel (admin@demo.com — separate login)
│   ├── 🌳 Org Tree (visual hierarchy)
│   ├── 👔 Senior Managers (CRUD + auto-provision board)
│   ├── 👤 Line Managers (CRUD + assign to Senior Manager + auto-provision)
│   └── 👥 Reportees (CRUD + assign to Line Manager + auto-provision swimlane)
└── Settings
    ├── Recurrence Rules (manage templates)
    └── Profile & Preferences
```

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Board loads in < 2 seconds with 50 cards visible |
| Availability | 99.5% uptime (SaaS) |
| Security | SOC 2 Type II compliance path; data encrypted at rest and in transit |
| Privacy | Manager notes are private by default; opt-in sharing with HR |
| Scalability | Support 10,000 managers with up to 20 reportees each |
| Accessibility | WCAG 2.1 AA compliant |
| Data Residency | EU and US region options (enterprise) |
| Backup | Daily automated backups, 30-day retention |
| Browser Support | Chrome, Edge, Firefox (latest 2 versions), Safari |

---

## 9. Success Metrics

### North Star Metric
**Weekly Active Managers (WAM)** — % of registered managers who interact with their board at least 3 days/week.

### Supporting Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Daily board opens per manager | ≥ 1.5 |
| Cards moved per week per manager | ≥ 8 |
| 1-on-1 notes captured per month | ≥ 3 per reportee |
| Recurring task on-time completion | ≥ 85% |
| Reportee "red zone" (>14 days no interaction) | < 10% |
| NPS from managers | ≥ 50 |
| Time-to-value (first useful board) | < 15 minutes |

---

## 10. Technical Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | React + TypeScript + Tailwind | Rich drag-and-drop UX, large ecosystem |
| Backend | Node.js (Express) | Fast MVP development, JS full-stack |
| Database | MySQL 8 | Relational data (people, recurrence rules, relationships) |
| Auth | Microsoft Entra ID (primary) | Enterprise IT managers use Microsoft ecosystem |
| Hosting | AWS (ECS + RDS) | Scalable, enterprise-friendly |
| Drag-and-drop | dnd-kit | Accessible, performant, React-native |
| Scheduler | Bull (Redis-backed job queue) | Reliable recurring card generation |

---

## 11. Competitive Landscape

| Competitor | Category | Why ManagerFlow Wins |
|------------|----------|---------------------|
| Jira/Trello/Asana | Project Management | Not people-centric, no cadence engine, requires team adoption |
| Lattice/15Five | Performance Management | Review-cycle focused, not daily workflow |
| Personal Kanban | Individual Productivity | No team structure, no recurrence |
| Monday.com | Work OS | Generic — requires heavy customization, still project-oriented |
| Notion | All-in-one workspace | Too flexible — no opinionated manager workflow |
| Fellow.app | Meeting management | 1-on-1 focused only, no org-task dimension |

**ManagerFlow's unique position:** Only tool that combines org-task Kanban + people-management Kanban + cadence engine in a single opinionated workflow for line managers.

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Managers won't adopt another tool | High | High | Zero-friction onboarding (<15 min), no reportee adoption needed, immediate value from recurring cards |
| "Just use Trello with labels" objection | Medium | Medium | Differentiate on cadence engine + people health indicators — things Trello can't do natively |
| Privacy concerns (manager notes about people) | Medium | High | Strong access controls, no HR visibility by default, clear data policies |
| Enterprise sales cycle too long | Medium | Medium | Start PLG (product-led growth) — free tier for individual managers, enterprise upsell later |
| Scope creep toward project management | Medium | Medium | Strict anti-persona definition; say no to sprint features |

---

## 13. Go-to-Market Strategy

### Phase 1: Validate (Months 1–3)
- Build MVP (F1–F11)
- Recruit 15–20 IT Line Managers as design partners
- Weekly feedback loops
- Hypothesis: "Managers will use a visual board ≥3 days/week"

### Phase 2: Launch (Months 4–6)
- Public beta (free tier: 1 board, 8 reportees)
- Paid tier: unlimited reportees, recurrence engine, analytics
- Content marketing: "The Invisible Work of Line Managers" blog series
- Community: LinkedIn group for IT people managers

### Phase 3: Scale (Months 7–12)
- Enterprise tier with HRIS integration and org-wide analytics
- Partner with manager coaching platforms
- SOC 2 certification
- Multi-language support

### Pricing

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | 1 board, 5 reportees, 3 recurrence rules |
| Pro | $15/manager/month | Unlimited reportees, unlimited recurrence, analytics, calendar sync |
| Enterprise | Custom | HRIS integration, org-wide dashboards, SSO, audit trail, SLA |

---

## 14. MVP Scope Summary

**In scope for MVP (Implemented):**
- Single Kanban board per manager with 4 columns (To Do, In Progress, Waiting, Done)
- Four swimlane types: Org Tasks, Unit Tasks, Team Tasks, Person (per-reportee)
- Three task layers with distinct rules (Org/Unit/Team)
- @dnd-kit drag-and-drop with visual overlay and drop zone highlighting
- Recurring card engine (weekly/biweekly/monthly/quarterly)
- Reportee profiles with relationship health indicators (green/yellow/red)
- 1-on-1 note capture with sentiment tracking and auto-generated action item cards
- Top widgets bar (overdue, stale 1-on-1s, org/unit/team counts, unacknowledged)
- Needs Attention section (overdue cards + red-zone reportees)
- Notification bell with live polling for pushed tasks
- Team Dashboard (role-aware: Senior Manager sees org/unit tasks with "Show completed" toggle, Line Manager sees reportee tasks)
- Push Initiative (Senior Manager → Line Managers)
- External Push API with bulk broadcast (`/api/v1/org/broadcast`)
- Email/password JWT authentication
- Privacy: Team-level tasks not visible to Senior Manager
- Cancellation rules: Team tasks deletable, Unit/Org tasks cannot be deleted
- **Admin Panel** (separate login: `admin@demo.com`):
  - Org Tree visualization (Senior Managers → Line Managers → Reportees)
  - CRUD for Senior Managers (auto-creates board with org/unit/team swimlanes)
  - CRUD for Line Managers (auto-creates board + person swimlane on Senior Manager's board)
  - CRUD for Reportees (auto-creates person swimlane on Line Manager's board)
  - Full auto-provisioning of boards and swimlanes on entity creation

**Explicitly out of scope for MVP:**
- Calendar integration
- HRIS integration (Admin panel serves as manual alternative)
- AI/smart nudges
- Mobile native app
- Reporting/export
- Teams/Slack notifications
- Microsoft SSO / Google SSO

---

## 15. Open Questions

1. **Kanban vs. Hybrid UX** — Should the default view be pure Kanban, or a combination of board + daily agenda list? (Validate with design partners)
2. **Reportee visibility** — Should reportees ever see their own swimlane? (Initial answer: No — manager-only tool)
3. **Sentiment tracking** — Is tracking "sentiment" per interaction too subjective/risky? (Validate with HR stakeholders)
4. **Org task source** — Can we auto-detect org tasks from email/calendar patterns, or is manual creation sufficient for MVP?
5. **Data ownership** — If a manager leaves, what happens to their board data? (Transfer to successor vs. archive)

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| Swimlane | Horizontal row on the board grouping related cards (one per reportee or task category) |
| Cadence | The recurring frequency of an org task (weekly, biweekly, monthly, quarterly) |
| Relationship Health | A computed indicator (green/yellow/red) based on days since last meaningful interaction |
| Card | A single work item on the board representing a task, action, or concern |
| Recurrence Rule | A template that auto-generates cards on a defined schedule |
| Interaction Log | A record of any meaningful touchpoint between manager and reportee |

---

*End of PRD*
