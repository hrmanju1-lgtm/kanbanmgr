# ManagerFlow — User Guide

**Version:** 1.0  
**Last Updated:** 2026-05-21  

---

## 1. Getting Started

### Login

Open **http://localhost:3000** in your browser.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | admin123 |
| Senior Manager | ramesh@demo.com | demo123 |
| Line Manager | manju@demo.com | demo123 |
| Line Manager | suresh@demo.com | demo123 |

Enter your email and password, then click **Sign In**.

> **Admin users** are taken directly to the Admin Panel (no board view).

### First Look

After login, you'll see:
- **Header** — App title, view toggle (My Board / Team Dashboard), notification bell, your name, logout
- **Widgets Bar** — Quick stats about your workload
- **Kanban Board** — Your tasks organized by swimlanes and columns

---

## 2. Understanding the Board

### The 4 Columns

Every task moves left-to-right through these stages:

| Column | Meaning |
|--------|---------|
| **To Do** | Task is on your radar, not started yet |
| **In Progress** | You're actively working on it |
| **Waiting** | Blocked — waiting on someone else (HR, Finance, a reportee, etc.) |
| **Done** | Completed |

### The Swimlanes (Rows)

Your board has horizontal rows, each representing a category:

| Swimlane | Color (left border) | Purpose |
|----------|-------------------|---------|
| 🏢 **Org Tasks** | Amber | Tasks pushed by the organization (HR, Finance, Compliance) via API |
| 📥 **Unit Tasks** | Purple | Tasks pushed by your Senior Manager |
| ✏️ **Team Tasks** | Blue | Tasks you created yourself |
| 👤 **Person** (one per reportee) | Blue | Tasks related to a specific team member |

### Card Colors

Each card has a colored left border indicating its source:
- **Amber** = Org Level (pushed by organization)
- **Purple** = Unit Level (pushed by Senior Manager)
- **Blue** = Team Level (self-created)

---

## 3. Three Task Layers

ManagerFlow enforces a clear hierarchy of task ownership:

### 🏢 Org Level
- **Created by:** Organization systems via API only
- **Lands in:** Org Tasks swimlane
- **Due date:** Mandatory (set by the organization)
- **Can you delete it?** No
- **Can you edit the due date?** No (locked by source)
- **Example:** "Complete mandatory security training by June 15"

### 📥 Unit Level
- **Created by:** Your Senior Manager (via Push Initiative)
- **Lands in:** Unit Tasks swimlane
- **Due date:** Mandatory (set by Senior Manager)
- **Can you delete it?** No
- **Can you edit the due date?** No (locked by source)
- **Example:** "Submit Q3 headcount plan by Friday"

### ✏️ Team Level
- **Created by:** You (the manager)
- **Lands in:** Team Tasks or Person swimlanes
- **Due date:** Optional
- **Can you delete it?** Yes
- **Can you edit the due date?** Yes
- **Example:** "Prepare weekly sync agenda", "Follow up with HR on Priya's promotion"

### Privacy

Your Team-level tasks are **private**. Your Senior Manager cannot see them in their Team Dashboard. They can only see Org and Unit level tasks.

---

## 4. Creating Tasks

Click the **➕ Create Task** button (top-right of the board).

**Fields:**
- **Title** — What needs to be done
- **Swimlane** — Where to place it (only swimlanes you're allowed to create in are shown)
- **Priority** — Low / Medium / High / Critical
- **Due Date** — Optional for self-created tasks

**Which swimlanes can you create in?**

| Role | Available Swimlanes |
|------|-------------------|
| Senior Manager | Unit Tasks, Team Tasks, Person swimlanes |
| Line Manager | Team Tasks, Person swimlanes |

> Note: Nobody can create Org-level tasks via the UI. Those come only through the API.

### Recurring Tasks

Check **🔄 Make this recurring** to auto-generate the task on a schedule:
- **Weekly** — Pick a day (Monday–Friday)
- **Every 2 weeks** — Pick a day
- **Monthly** — Pick a day of month (1–28)
- **Quarterly** — Pick a day of month

A new card will auto-appear in "To Do" on each cycle.

---

## 5. Drag and Drop

**To move a card:** Click and hold a card, then drag it to a different column.

- A **ghost card** (slightly rotated) follows your cursor
- The **target cell** highlights in light indigo when you hover over it
- The **original card** fades to show it's being moved
- **Release** to drop the card in the new column

**What happens when you move a pushed task (Org/Unit) out of "To Do":**
- It's automatically **acknowledged** — the source system can see you've started working on it
- The acknowledgement timestamp is recorded

**Tip:** You need to move at least 5 pixels before a drag starts. This prevents accidental drags when you just want to click a card.

---

## 6. Card Details

**Click any card** to open the detail panel (slides in from the right).

**What you can do:**
- View source information (who pushed it, when)
- See and edit the due date (only for self-created tasks)
- View status and priority
- **Add notes** — Type in the text field and press Enter or click Add
- **Toggle action items** — Check/uncheck items
- **Delete** (only for self-created Team tasks) — Click 🗑️ Delete Task

**For pushed tasks (Org/Unit):**
- Due date shows with a 🔒 icon (cannot be edited)
- No delete button available
- Source badge shows who pushed it

---

## 7. Widgets Bar

The top of your board shows at-a-glance stats:

| Widget | What it Shows |
|--------|--------------|
| **Overdue** (red) | Cards past their due date that aren't done |
| **🚨 Stale 1-on-1s** (rose) | Reportees you haven't had a 1-on-1 with in >14 days |
| **🏢 Org Level** (amber) | Active org-pushed tasks |
| **📥 Unit Level** (purple) | Active unit-pushed tasks |
| **✏️ Team Level** (blue) | Active self-created tasks |
| **⏳ Unacknowledged** (yellow) | Pushed tasks still in "To Do" (not yet started) |

### ⚠️ Needs Attention Section

When you have overdue cards or stale reportees, a red alert section appears below the widgets:
- Shows each overdue card with how many days overdue
- Shows each reportee with stale 1-on-1 (>14 days) and the day count
- **Disappears automatically** when everything is healthy

---

## 8. Notifications

### The Bell Icon 🔔

Located in the header, next to your name. It shows:
- A **red badge** with a count when you have unread notifications
- Notifications are **new tasks pushed to your board** (Org or Unit level)
- Polls every **5 seconds** — new tasks appear almost instantly

### Viewing Notifications

Click the bell to open the dropdown:
- Each notification shows the task title, source (Org/Unit), and priority
- Click **"Mark all read"** to dismiss all notifications

### Highlighting a Card

Click on a specific notification to:
1. Switch to the Board view (if you're on Team Dashboard)
2. The corresponding card **pulses with an indigo ring** for 3 seconds
3. The notification is marked as read

---

## 9. 1-on-1 Notes

### Logging a 1-on-1

Each person swimlane has a **📝 button** next to the reportee's name. Click it to open the 1-on-1 logging modal.

**Fill in:**
1. **Notes** — What was discussed (free-form text)
2. **Sentiment** — How the conversation felt:
   - 😊 Positive
   - 😐 Neutral
   - 😟 Concern
3. **Action Items** — Things to follow up on. Each becomes a card!
   - Click "+ Add action item" to add more
   - Click ✕ to remove one

### What Happens on Save

Click **💾 Save & Generate Cards** and three things happen:

1. **Interaction logged** — The 1-on-1 is recorded with your notes and sentiment
2. **Health indicator resets** — The dot next to the reportee's name turns **green** (days counter resets to 0)
3. **Cards created** — Each action item becomes a new card in that reportee's person swimlane (status: To Do)

### Why This Matters

Next time you have a 1-on-1 with this person, just look at their swimlane — you'll see all pending action items from last time. No more forgotten promises.

---

## 10. Team Dashboard

Switch to Team Dashboard using the toggle in the header.

### For Senior Managers

You see a section for each of your Line Managers showing:
- Their name and org unit
- Status summary pills (how many tasks in each state)
- All **Org and Unit level** tasks on their board
- Each card shows: layer badge, status, priority, acknowledgement status, due date

**Privacy:** You do NOT see their Team-level (self-created) tasks. Those are private.

Click any card row to expand and see:
- Status progress timeline
- Created/acknowledged dates
- Notes from the Line Manager

### For Line Managers

You see a section for each of your reportees showing:
- Their name and role
- All active tasks related to them

### Push Initiative (Senior Manager Only)

Click **📤 Push Initiative** to assign a task to your Line Managers:

1. Enter the **Initiative Title** (required)
2. Add a **Description** (optional)
3. Set **Priority** (Medium / High / Critical)
4. Set **Due Date** (required)
5. Select which Line Managers to push to (all selected by default)
6. Click **📤 Push to X managers**

The task lands in each selected Line Manager's **Unit Tasks** swimlane as a "To Do" card. They'll see it in their notification bell within 5 seconds.

---

## 11. Relationship Health Indicators

Each person swimlane shows a colored dot and a label like "5d ago":

| Color | Meaning | Days Since Last 1-on-1 |
|-------|---------|----------------------|
| 🟢 Green | Healthy | 0–7 days |
| 🟡 Yellow | Needs attention soon | 8–14 days |
| 🔴 Red | Stale — action needed | >14 days |

**How to reset:** Log a 1-on-1 using the 📝 button. The indicator immediately turns green.

**Red-zone reportees** also appear in the "Needs Attention" section at the top of your board.

---

## 12. Recurring Tasks

Recurring tasks auto-generate on a schedule so you never forget regular obligations.

### Creating a Recurring Task

1. Click **➕ Create Task**
2. Fill in the title and swimlane
3. Check **🔄 Make this recurring**
4. Choose frequency:
   - **Weekly** — e.g., "Every Monday"
   - **Every 2 weeks** — e.g., "Every other Friday"
   - **Monthly** — e.g., "Day 1 of each month"
   - **Quarterly** — e.g., "Day 15 every 3 months"
5. Click **🔄 Create Recurring**

### How It Works

- The system checks every hour for rules that are due
- When triggered, a new card appears in "To Do" in the specified swimlane
- The rule then schedules itself for the next occurrence
- Each generated card is independent — completing one doesn't affect the rule

### Examples

| Task | Frequency | Day |
|------|-----------|-----|
| Submit utilization report | Weekly | Monday |
| Monthly team review | Monthly | Day 1 |
| Quarterly goals update | Quarterly | Day 15 |

---

## 13. Admin Panel

Login as `admin@demo.com` / `admin123` to access the Admin Panel. This is a separate interface for managing the organization structure.

### 🌳 Org Tree Tab

A visual hierarchy showing the entire organization:

```
👔 Ramesh K (Senior Manager • Engineering)
├── 👤 Manju R (Line Manager • Network Operations)
│   ├── Rahul S (Senior Engineer)
│   ├── Priya M (Tech Lead)
│   ├── Anil K (Engineer)
│   ├── Neha T (Senior Engineer)
│   └── Vikram D (Engineer)
└── 👤 Suresh P (Line Manager • Cloud Platform)
```

This is read-only — use the other tabs to make changes.

### 👔 Senior Managers Tab

**Create a Senior Manager:**
1. Fill in Name, Email, Password, and Org Unit
2. Click **Create**
3. A board is automatically created with Org Tasks, Unit Tasks, and Team Tasks swimlanes

**Delete:** Click the red "Delete" link next to any Senior Manager.

### 👤 Line Managers Tab

**Create a Line Manager:**
1. Fill in Name, Email, Password, Org Unit
2. **Select a Senior Manager** from the dropdown (required — defines who they report to)
3. Click **Create**
4. Automatically:
   - A board is created with Org/Unit/Team swimlanes
   - A person swimlane is added to the Senior Manager's board for this Line Manager

**Delete:** Click the red "Delete" link.

### 👥 Reportees Tab

**Create a Reportee:**
1. Fill in Name, Email (optional), Role (e.g., "Senior Engineer")
2. **Select a Line Manager** from the dropdown (required — defines who manages them)
3. Click **Create**
4. Automatically: a person swimlane is added to the Line Manager's board for this reportee

**Delete:** Click the red "Delete" link.

> **Note:** Only reportees under Line Managers are shown here. Line Managers themselves (who appear as reportees on Senior Manager boards) are managed in the Line Managers tab.

### Auto-Provisioning Summary

| When You Create... | What Gets Auto-Created |
|-------------------|----------------------|
| Senior Manager | Board + Org/Unit/Team swimlanes |
| Line Manager | Board + Org/Unit/Team swimlanes + Person swimlane on Senior Manager's board |
| Reportee | Person swimlane on Line Manager's board |

---

## 14. API Integration (For Admins)

### Pushing Org-Level Tasks

Use the organization API key to push tasks to specific managers or broadcast to all.

**Push to a specific manager:**

```cmd
curl -X POST http://localhost:4000/api/v1/managers/MANAGER_ID/tasks -H "Authorization: Bearer demo-org-key-99999" -H "Content-Type: application/json" -d "{\"title\":\"Complete mandatory security training\",\"priority\":\"high\",\"dueDate\":\"2026-06-15\",\"metadata\":{\"pushedBy\":\"HR Systems\"}}"
```

**Broadcast to ALL managers:**

```cmd
curl -X POST http://localhost:4000/api/v1/org/broadcast -H "Authorization: Bearer demo-org-key-99999" -H "Content-Type: application/json" -d "{\"title\":\"Submit compliance declaration\",\"priority\":\"high\",\"dueDate\":\"2026-06-30\",\"metadata\":{\"pushedBy\":\"Compliance Team\"}}"
```

**Check task status:**

```cmd
curl http://localhost:4000/api/v1/tasks/CARD_ID/status -H "Authorization: Bearer demo-org-key-99999"
```

Response:
```json
{
  "cardId": "abc-123",
  "acknowledged": true,
  "acknowledgedAt": "2026-05-21T10:30:00.000Z",
  "currentStatus": "in_progress",
  "createdAt": "2026-05-21T09:00:00.000Z",
  "dueDate": "2026-06-15T00:00:00.000Z"
}
```

### API Keys

| Key | Source Type | Use For |
|-----|-----------|---------|
| `demo-org-key-99999` | organization | Org-level pushes and broadcasts |
| `demo-push-key-12345` | unit_manager | Senior Manager pushes (alternative to UI) |

### Required Fields for Push

| Field | Required? | Notes |
|-------|-----------|-------|
| title | Yes | Max 255 characters |
| dueDate | Yes | ISO date format (YYYY-MM-DD) |
| priority | No | Defaults to "medium". Options: low, medium, high, critical |
| description | No | Max 2000 characters |
| metadata | No | JSON object with context (e.g., pushedBy) |

---

## 15. Roles & Permissions Summary

| Action | Admin | Senior Manager | Line Manager |
|--------|-------|---------------|--------------|
| Access Admin Panel | ✅ | ❌ | ❌ |
| Manage org structure (CRUD) | ✅ | ❌ | ❌ |
| View own board | ❌ | ✅ | ✅ |
| Create Team-level tasks | ❌ | ✅ | ✅ |
| Create Unit-level tasks (via Push Initiative) | ❌ | ✅ | ❌ |
| Create Org-level tasks | ❌ (API only) | ❌ (API only) | ❌ (API only) |
| Delete self-created tasks | ❌ | ✅ | ✅ |
| Delete pushed tasks (Org/Unit) | ❌ | ❌ | ❌ |
| View Team Dashboard | ❌ | ✅ | ✅ |
| See Line Managers' Team-level tasks | ❌ | ❌ (privacy) | N/A |
| Push Initiative to Line Managers | ❌ | ✅ | ❌ |
| Log 1-on-1 with reportees | ❌ | ✅ | ✅ |
| Receive notifications for pushed tasks | ❌ | ✅ | ✅ |
| Use bulk broadcast API | ❌ (org key only) | ❌ (org key only) | ❌ (org key only) |

---

## 16. Tips & Best Practices

1. **Start your day** by scanning the Widgets Bar and Needs Attention section
2. **Log 1-on-1s immediately** after the meeting — don't let action items slip
3. **Use "Waiting"** for tasks blocked on others — it keeps your "In Progress" clean
4. **Check the notification bell** when you see the red badge — acknowledge pushed tasks promptly
5. **Set up recurring tasks** for weekly/monthly obligations so they auto-appear
6. **Keep person swimlanes focused** — one card per action item, not mega-cards

---

## 17. Troubleshooting

| Issue | Solution |
|-------|----------|
| Board is empty after re-seeding | Log out and log back in (old JWT references deleted manager ID) |
| Notifications not clearing | Click "Mark all read" in the bell dropdown |
| Can't create task in Org swimlane | Org tasks can only be created via API |
| Can't delete a pushed task | Pushed tasks (Org/Unit) cannot be deleted — complete them instead |
| Health indicator not updating | Log a 1-on-1 via the 📝 button to reset it |
| Drag not working | Ensure you drag at least 5px before releasing |

---

*End of User Guide*
