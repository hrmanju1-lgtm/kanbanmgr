# ManagerFlow — User Guide

**Version:** 1.0 | **Last Updated:** 2026-05-22

---

## 1. Getting Started

### Login

Open **http://localhost:3000** and sign in:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Senior Manager | ramesh@demo.com | demo123 |
| Line Manager | manju@demo.com | demo123 |

Admin users go directly to the Admin Panel. Managers see the Kanban board.

---

## 2. Understanding the Board

### 4 Columns

| Column | Meaning |
|--------|---------|
| **To Do** | Not started yet |
| **In Progress** | Actively working on it |
| **Waiting** | Blocked on someone else |
| **Done** | Completed |

### Swimlanes (Rows)

| Swimlane | Left Border Color | Purpose |
|----------|------------------|---------|
| 🏢 Org Tasks | Amber | Organization-pushed tasks (API only) |
| 📥 Unit Tasks | Purple | Senior Manager-pushed tasks |
| ✏️ Team Tasks | Blue | Self-created tasks |
| 👤 Person | Blue | Per-reportee tasks |

---

## 3. Three Task Layers

| Layer | Created By | Due Date | Deletable | Visible to Senior Manager |
|-------|-----------|----------|-----------|--------------------------|
| 🏢 Org | API only | Mandatory | No | Yes |
| 📥 Unit | Senior Manager push | Mandatory | No | Yes |
| ✏️ Team | You (self) | Optional | Yes | No (private) |

---

## 4. Creating Tasks

Click **➕ Create Task**. Available swimlanes depend on your role:
- **Senior Manager:** Unit Tasks, Team Tasks, Person swimlanes
- **Line Manager:** Team Tasks, Person swimlanes
- Nobody can create Org tasks via UI (API only)

### Recurring Tasks
Check **🔄 Make this recurring** → choose frequency (weekly/biweekly/monthly/quarterly). Cards auto-appear in "To Do" on schedule.

---

## 5. Drag and Drop

- **Grab** a card and drag to another column
- Ghost card follows your cursor; target cell highlights in indigo
- Moving a pushed task (Org/Unit) out of "To Do" **auto-acknowledges** it
- 5px minimum drag distance prevents accidental drags

---

## 6. Card Details

Click any card to open the detail panel:
- **Notes** — add free-text notes
- **Action Items** — checklist with toggle
- **Due Date** — editable only for self-created tasks (🔒 for pushed tasks)
- **Delete** — only for self-created Team tasks (🗑️ button)

---

## 7. Widgets Bar

| Widget | Shows |
|--------|-------|
| Overdue (red) | Cards past due date |
| 🚨 Stale 1-on-1s (rose) | Reportees with >14 days since last 1-on-1 |
| 🏢 Org Level (amber) | Active org tasks |
| 📥 Unit Level (purple) | Active unit tasks |
| ✏️ Team Level (blue) | Active self-created tasks |
| ⏳ Unacknowledged (yellow) | Pushed tasks still in "To Do" |

### ⚠️ Needs Attention
Red alert section showing overdue cards and stale reportees. Disappears when everything is healthy.

---

## 8. Notifications (🔔)

- Red badge shows unread count
- Polls every 5 seconds for new pushed tasks
- Click a notification → card pulses on board for 3 seconds
- "Mark all read" clears all

---

## 9. 1-on-1 Notes

Click **📝** next to any reportee's name:
1. Enter **notes** (what was discussed)
2. Set **sentiment** (Positive/Neutral/Concern)
3. Add **action items** (each becomes a card)
4. Click **💾 Save & Generate Cards**

This resets the health indicator to green and creates cards in the reportee's swimlane.

---

## 10. Team Dashboard

Toggle to "Team Dashboard" in the header.

**Senior Manager view:** See org/unit tasks across all line managers. Toggle "Show completed" to include done tasks. Click **📤 Push Initiative** to assign tasks.

**Line Manager view:** See all reportees and their active tasks.

---

## 11. Push Initiative (Senior Manager)

1. Click **📤 Push Initiative**
2. Enter title, description, priority, **due date (required)**
3. Select target line managers
4. Click Push — task lands in their Unit Tasks swimlane

---

## 12. Relationship Health

| Color | Days Since Last 1-on-1 |
|-------|----------------------|
| 🟢 Green | 0–7 days |
| 🟡 Yellow | 8–14 days |
| 🔴 Red | >14 days |

Reset by logging a 1-on-1 (📝 button).

---

## 13. Admin Panel

Login as `admin@demo.com` / `admin123`.

### Tabs

| Tab | Purpose |
|-----|---------|
| 🌳 Org Tree | Visual hierarchy (read-only) |
| 👔 Senior Managers | Create/delete (auto-creates board) |
| 👤 Line Managers | Create/delete, assign to Senior Manager (auto-creates board + swimlane on SM's board) |
| 👥 Reportees | Create/delete, assign to Line Manager (auto-creates swimlane on LM's board) |

Everything auto-provisions — no manual board setup needed.

---

## 14. API Integration

### Push to specific manager:
```cmd
curl -X POST http://localhost:4000/api/v1/managers/MANAGER_ID/tasks -H "Authorization: Bearer demo-org-key-99999" -H "Content-Type: application/json" -d "{\"title\":\"Complete security training\",\"priority\":\"high\",\"dueDate\":\"2026-06-15\",\"metadata\":{\"pushedBy\":\"HR\"}}"
```

### Broadcast to ALL managers:
```cmd
curl -X POST http://localhost:4000/api/v1/org/broadcast -H "Authorization: Bearer demo-org-key-99999" -H "Content-Type: application/json" -d "{\"title\":\"Submit compliance declaration\",\"priority\":\"high\",\"dueDate\":\"2026-06-30\",\"metadata\":{\"pushedBy\":\"Compliance\"}}"
```

### Check task status:
```cmd
curl http://localhost:4000/api/v1/tasks/CARD_ID/status -H "Authorization: Bearer demo-org-key-99999"
```

### API Keys
| Key | Use |
|-----|-----|
| `demo-org-key-99999` | Org-level push + broadcast |
| `demo-push-key-12345` | Unit-level push (Senior Manager) |

---

## 15. Roles & Permissions

| Action | Admin | Senior Manager | Line Manager |
|--------|-------|---------------|--------------|
| Admin Panel | ✅ | ❌ | ❌ |
| View own board | ❌ | ✅ | ✅ |
| Create Team tasks | ❌ | ✅ | ✅ |
| Push Initiative | ❌ | ✅ | ❌ |
| Delete self tasks | ❌ | ✅ | ✅ |
| Delete pushed tasks | ❌ | ❌ | ❌ |
| View Team Dashboard | ❌ | ✅ | ✅ |
| See team-level tasks of others | ❌ | ❌ (privacy) | N/A |
| Log 1-on-1 | ❌ | ✅ | ✅ |
| Notifications | ❌ | ✅ | ✅ |

---

## 16. Troubleshooting

| Issue | Solution |
|-------|----------|
| Board empty after re-seed | Log out and back in (old JWT) |
| Notifications not clearing | Click "Mark all read" |
| Can't create Org task in UI | Org tasks are API-only |
| Can't delete pushed task | Pushed tasks cannot be deleted |
| Health not updating | Log a 1-on-1 via 📝 button |
| Drag not working | Drag at least 5px before releasing |
| Team Dashboard empty | Log out/in after re-seed |

---

*End of User Guide*
