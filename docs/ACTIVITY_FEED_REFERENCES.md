# Showing Flows & Rejects Without Cards and Buttons

Cards and primary buttons are a classic pattern but can feel heavy. Here are **modern alternatives** and **references** for activity flows, rejects, and status.

---

## 1. **List / feed rows (no card container)**

Use **simple list rows** instead of card boxes: one row per item with a divider or spacing. Click the row to open details; avoid a big “Review” button.

**Idea:**
- **Left:** Small status indicator (colored dot or icon).
- **Center:** Title + optional one-line subtitle (e.g. PNR, timestamp).
- **Right:** “Review” or “Open” as a **text link**, not a button. Or a chevron; action on row click.

**References:**
- **Tailwind UI – Feeds**  
  https://tailwindui.com/components/application-ui/lists/feeds  
  “Simple with icons” and “With multiple item types” – list-style feeds without card wrappers.

- **Stream – Activity feed design**  
  https://getstream.io/blog/activity-feed-design  
  Best practices: keep entries simple, reduce controls per row, avoid clutter.

- **UX Patterns – Activity feed**  
  https://uxpatterns.dev/patterns/social/activity-feed  
  Tied to timeline and feed patterns.

---

## 2. **Timeline list (SAP Fiori style)**

Chronological **list of cells** with timestamp, node/status, title, and short description. No card; each item is a **timeline cell**.

**Idea:**
- One column: time (e.g. “2m ago”).
- Next: status node (color = completed / failed / pending).
- Then: title (e.g. “CCV Rejected – MXCHSI”) and 1–2 lines of description.
- **Action:** Row is tappable; or a single text link “View” / “Review” at the end of the row.

**References:**
- **SAP Fiori – Timeline (Web)**  
  https://experience.sap.com/fiori-design-web/timeline/  
  Timeline control: entries in time order, node + title + description, optional attributes.

- **SAP Fiori – Timeline view (iOS)**  
  https://experience.sap.com/fiori-design-ios/article/timeline-view/  
  Timeline cells: timestamp, node, title, status stack, description. Good for workflows and status.

---

## 3. **Table / compact grid**

Use a **table** (or table-like layout): columns for Type, PNR, Status, Time, and one **link** column (“Review” / “Open”) instead of buttons.

**Idea:**
- Rows = one flow/reject per row.
- Status = badge or text (Failed, Pending, etc.).
- Action = one link per row; no card, no primary button.

---

## 4. **Inline status + link (minimal)**

Single line per item: **“[Status] Title • PNR: X • 2m ago · Review”**.  
No card, no button – only text and one link (“Review” / “Open”).

Good for high-density, scannable lists.

---

## 5. **Expandable rows**

**Collapsed:** One row per item (e.g. “CCV Rejected – MXCHSI · 2m ago” + chevron).  
**Expanded:** Show flow steps (Booking → CCV → Ticketing) as plain text or a small nested list, still without a card.  
Action: row click or a small “Open” link.

---

## 6. **Banner / strip (no card)**

Thin horizontal strip per item:  
e.g. **“CCV Rejected – PNR MXCHSI”** with a small “Review” link on the right.  
Looks like a slim notification bar, not a card.

---

## Summary: What to prefer

| Avoid (feels old)      | Prefer (modern / light)                    |
|------------------------|-------------------------------------------|
| Card container per item | List row or table row                    |
| Big “Review” / CTA button | Text link “Review” or row click          |
| Heavy borders/shadows   | Dividers or spacing only                 |
| Many controls per row   | One primary action (link or row tap)     |

**References quick list:**
- Tailwind UI Feeds: https://tailwindui.com/components/application-ui/lists/feeds  
- Stream activity feed guide: https://getstream.io/blog/activity-feed-design  
- SAP Fiori Timeline (Web): https://experience.sap.com/fiori-design-web/timeline/  
- SAP Fiori Timeline (iOS): https://experience.sap.com/fiori-design-ios/article/timeline-view/  
- UX Patterns Activity feed: https://uxpatterns.dev/patterns/social/activity-feed  
- Dribbble “activity feed”: https://dribbble.com/search/activity-feed  

---

## Implemented in this app: layout per category + multiple states

The activity panel now uses **different layout/design per category** and shows **multiple states** in each:

| Category | Layout | States shown |
|----------|--------|--------------|
| **PNR** | Timeline block – left teal border, title, subtitle, flow steps, status chip, time | `status` (New / In progress / Resolved / Closed); flow step status (completed / failed / pending). Actions: Accept \| Details (links). |
| **Email** | Message block – title, quoted text, status chip, time | `status`. Action: "Send Reply" link. |
| **Queue** | Banner strip – single line: icon + title + subtitle + time + "Take action" link | `status`. |
| **CCV Rejected** | Inline alert row – red left border, icon, title, subtitle, flow steps | `status`; flow steps (completed / failed / pending). Action: "Review CCV" link. |
| **CCD** | Table-like row – columns: icon \| title/subtitle \| badge \| status \| Review link; flow steps below | `status`; flow steps. |
| **Ticketing failed** | Expandable row – collapsed: one line + chevron; expanded: flow steps + "Fix ticketing" link | `status`; flow steps. Toggle expand to see steps. |
| **Ancillary failed** | Chip row – type chip (Ancillary) + status chip + title + subtitle + flow steps | `status`; flow steps. Action: "Fix ancillaries" link. |
| **Reissue failed** | Minimal strip – thin bar: title + status + time + "Review" link | `status`. |
| **Refund failed** | Inline alert (rose) – same as CCV but rose left border | `status`; flow steps. Action: "Review refund" link. |

All actions are **text links** (no heavy buttons). Activity status chips use: New (primary), In progress (amber), Resolved (green), Closed (muted).
