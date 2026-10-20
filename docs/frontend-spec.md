# HR Management — Frontend Prototype Specification

> **How to use this file:** hand this entire document to an AI UI generator
> (Figma Make / Figma AI, v0, Lovable, etc.) together with any brand notes you
> like. It describes everything the UI needs: screens, component inventory,
> exact API contracts, data shapes, states, and user flows. After you are happy
> with the visual prototype, use the same file as the reference spec for the
> Next.js + React implementation.

**Target stack (later):** Next.js (App Router), React, TypeScript, Tailwind CSS (or CSS modules), a data-fetching library (React Query recommended).
**Backend (already built, NestJS):** running on `http://localhost:3000`, interactive docs at `http://localhost:3000/api` (OpenAPI JSON at `/api-json`).

---

## 1. Product summary

An internal HR administration app. Two personas:

| Role | Sees | Can do |
| --- | --- | --- |
| **Admin (HR staff)** | Everything | Create / edit / delete departments, employees, time entries & users; import time entries from Excel; view statistics |
| **User (regular staff account)** | Read-only + own profile | Browse departments, employees, time entries; edit only own name+password |

The UI must therefore have **permission-aware navigation** (admin-only buttons/routes hidden or disabled for `user` role).

Demo login (dev seed): `admin@example.com` / `Admin1234!`.

---

## 2. Design system

Build a small, reusable design kit first, then compose all screens from it.

### 2.1 Foundations

- **Style:** clean enterprise dashboard; generous whitespace; rounded corners (8px default, 12px for cards/popovers), subtle borders (`1px solid #E5E7EB`), soft shadows only for floating layers.
- **Theme tokens (light theme, add a later dark-mode variant):**
  - Primary: indigo/blue `#4F46E5` (buttons, links, active nav)
  - Primary hover: `#4338CA`
  - Success / "active" / status COMPLETE: `#16A34A`
  - Warning / status INCOMPLETE: `#D97706`
  - Danger / status INVALID / destructive: `#DC2626`
  - Neutral text: primary `#111827`, secondary `#6B7280`, disabled `#9CA3AF`
  - Surfaces: page background `#F9FAFB`, card `#FFFFFF`
- **Typography:** one modern sans (Inter). Scale: 12 / 14 (body) / 16 / 20 (section title) / 28–32 (page title). Font weights 400/500/600/700.
- **Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48.
- **Radius:** inputs & buttons 8px, cards 12px, badges pill.
- **Icons:** outline style (Lucide or similar) 16/20px inline.

### 2.2 Component inventory (build once, reuse everywhere)

**Primitives**
1. `Button` — variants: primary, secondary (subtle gray), outline, danger, ghost; sizes sm/md; loading spinner state; disabled state.
2. `Input` — text, email, password (with show/hide), number.
3. `Select` / native dropdown.
4. `DatePicker` (text input + calendar popover; value `YYYY-MM-DD`).
5. `TimeInput` (HH:mm:ss pattern; icon clock).
6. `Textarea` (department description, employee notes).
7. `Checkbox` (active toggles).
8. `Avatar` — initials circle with soft background color derived from the name.
9. `Badge/StatusTag` — colored pills:
   - Employee: active (green "Active"), inactive (gray "Inactive")
   - Time entry: `COMPLETE` (green), `INCOMPLETE` (amber), `INVALID` (red)
   - User role: `admin` (indigo), `user` (gray)
10. `Table` — generic: columns config, sortable headers (chevrons), row hover, sticky header, row selection checkboxes (for bulk actions), zebra-free minimal styling.
11. `Pagination` — page numbers, items-per-page selector (10/20/50/100), "X–Y of Z", prev/next disabled states.
12. `SearchBox` — with leading magnifier icon, debounce indicator.
13. `FilterBar` — labeled compact filters row: selects + date pickers + "Clear all" link.
14. `Dialog/Modal` — sm (confirmations), md (forms ~480px), lg (~720px). Header + body + sticky footer with cancel/submit.
15. `Toast` — success (green check), error (red), info; auto-dismiss 4s.
16. `EmptyState` — icon + title + description + primary CTA (e.g., "No departments yet — Create department").
17. `Skeleton` — table rows, stat cards, detail page blocks.
18. `StatCard` — label, big number, small delta/hint, optional icon container.
19. `Tabs` — for detail pages.
20. `ConfirmDialog` — danger style, "Confirm" / "Cancel", destructive verb in title.
21. `FormRow` — label + field + helper/error text (used inside modals).
22. `FileDropzone` — for the Excel import (click to browse; show filename + size; accepts `.xlsx/.xls`).
23. `ImportReportPanel` — per-row result list used after bulk import.

---

## 3. Information architecture / routes

Next.js-style route names (adapt in the prototype as frames):

```
/login                        → Auth: Login
/register                     → Auth: Register (secondary, rarely used)
/                             → Dashboard (overview)
/employees                    → Employees: table
/employees/new                → Employees: create (modal can also open inline)
/employees/[id]               → Employee: detail (tabs: Profile / Subordinates / Time entries)
/employees/[id]/edit          → Employees: edit (modal can also open inline)
/departments                  → Departments: table + CRUD
/employees?departmentId=X     → Departments "employees" drill-down (reuses Employees table)
/time-entries                 → Time entries: table + filters
/time-entries/import          → Time entries: Excel import wizard
/users                        → Users: table (admin)
/users/me                     → Users: my profile (self)
```

Global shell (everything except `/login`, `/register`):

- **Left sidebar (240px, collapsible to icons):** logo top; nav items with icons:
  Dashboard, Employees, Departments, Time Entries, Users *(admin only)*, My Profile; bottom: logout.
- **Topbar (64px):** page title left; right: current user avatar + name + role badge with dropdown (Profile, Logout).
- **Content area:** max-width fill, 24px padding, page title + primary action button ("+ Add employee", "+ Add department", "+ Add entry", "Import Excel") top-right.

Permission rules for navigation:
- `admin` → all items.
- `user` → Dashboard, Employees, Departments, Time Entries, My Profile. Users module hidden. All "Add/Edit/Delete/Import" buttons hidden or disabled with tooltip "Admin only".

---

## 4. Screen-by-screen specification

### 4.1 Login `/login`

- Centered card (400px) on soft gradient background, app logo + "HR Management".
- Fields: Email (email validation), Password (min 6 chars, show/hide).
- Button: "Sign in" (loading state).
- Error handling: 401 "Invalid credentials" shown as inline form error banner.
- Link below: "Create account" → `/register` (note: self-registration always creates a regular user).
- On success: store tokens (see §5.2), redirect to `/`.

### 4.2 Register `/register`

- Same visual language as login.
- Fields: Name, Email, Password (+ confirm).
- **No role picker** — the backend forces new registrations to the `user` role.
- On success → auto logged in → route to `/`.

### 4.3 Dashboard `/`

The "morning glance" screen. Grid:

**Row 1 — four stat cards**
| Card | Data source |
| --- | --- |
| Total employees | `GET /employees/stats/overview` → `total` |
| Active / inactive | `active`, `inactive` (show as "15 / 2") |
| Total time entries | `GET /time-entries/stats/overview` → `total` |
| Entries by status | mini stacked bar or three chips: COMPLETE / INCOMPLETE / INVALID with counts |

**Row 2 — two panels**
1. **Employees by department** — horizontal bar chart (label = department name, value = count). Data: `byDepartment` array of the employees-overview endpoint. Nice hover tooltips. Admin sees full palette; same as user.
2. **Quick actions** (admin only): buttons "+ Add employee", "+ Add department", "+ Add time entry", "Import from Excel". For non-admin show recent departments/employees links instead.

**Row 3 — recent activity tables (read-only)**
- Latest employees (list of 5, link to employee detail) — `GET /employees?limit=5`.
- Latest time entries (list of 5, show date, employee name, clock in/out, status pill) — `GET /time-entries?limit=2…5` is paginated; pick `limit=5`.

Loading: skeletons for cards and tables. Empty DB: EmptyStates with CTAs.

### 4.4 Employees table `/employees`

**Toolbar:** SearchBox (server-side search, debounce 400ms) · FilterBar: Department select (from departments list), Status select (Active/Inactive/All) · per-page select · primary button "+ Add employee" (admin).

**Table columns:**
| Column | Content | Sortable |
| --- | --- | --- |
| Employee | Avatar initials + First name Last name, hover shows email | ✓ (firstName/lastName via sortBy) |
| Email | text | ✓ |
| Phone | text | – |
| Department | department badge (name) | – |
| Hire date | `YYYY-MM-DD` | ✓ |
| Manager | manager name (or "—") — from `managerId`/`manager` on rows | – |
| Status | Active/Inactive pill | – |
| Actions | kebab menu: View · Edit (admin) · Delete (admin) | – |

- Selection checkboxes + floating bulk bar when selected: "N selected — Delete" — calls `PATCH`/delete per employee (no bulk endpoint on employees; do sequential or hide feature) → simplest: hide bulk bar on this table.
- Server-side pagination using the standard envelope (§5.3): `page`, `limit`, `sortBy` (`id:ASC` etc.), `filter.isActive=true|false`, `filter.departmentId=…`, search param (`search`).
- Sorting toggles send `sortBy=hireDate:DESC` style pairs.

**Row click** → `/employees/[id]`.

### 4.5 Employee create / edit (modal, admin)

Title: "New employee" / "Edit employee".

Fields (from `CreateEmployeeDto`):
| Field | Type | Validation |
| --- | --- | --- |
| First name | text | required, 2–50 |
| Last name | text | required, 2–50 |
| Email | email | optional, must be unique (backend 409) |
| Phone | text | placeholder `0550000000`, pattern `0[5-7]dddddddd` (Algerian mobile), optional |
| Hire date | date | optional |
| Department | select of departments (value = id) | required |
| Manager | searchable select of employees — **exclude the employee being edited itself** | optional |
| Active | switch (default on) | optional |

Save → 201/200 → toast "Employee saved" → list refresh. Backend 400 returns field errors (show under fields); 409 "Email already exists" under email.

Mock the manager select with employee list (`GET /employees?limit=100` or a lightweight search).

### 4.6 Employee detail `/employees/[id]`

Header block: large avatar, `First Last`, status pill, email/phone/hireDate row, department badge, quick edit (admin) & delete (admin) buttons.

**Tabs:**
1. **Profile** — full field list incl. `createdAt/updatedAt` timestamps, `managerId` (clickable link to that employee), `department` name.
2. **Subordinates** — paginated employees table filtered by `managerId`; columns same as employees table minus manager; empty state: "No direct reports".
   - API: `GET /employees/:id/subordinates?page&limit&filter.isActive=…` — supports search/sort like the main table.
3. **Time entries** — reuse the Time Entries table pre-filtered to this employee (see 4.8), with "Add entry" (admin) shortcut when opening for admins.

Breadcrumb: `Dashboard / Employees / Alice Manager` (manager name shown with a small 🡐 back link; also show "Reports to: X").

### 4.7 Departments `/departments`

**Toolbar:** SearchBox, "+ Add department" (admin).

**Table columns:** Name · Description (truncated 1 line) · Employee count (pill, click → drill to `/employees?departmentId=…` filtered employees table) · Created · Actions (Edit admin / Delete admin).

Use the count variant: `GET /departments/employee-count?page&limit` (includes `employeeCount` per row).

**Create/Edit modal:** Name (2–100, required, unique — 409 shows inline error), Description textarea (≤500).

**Delete:** ConfirmDialog "Delete department?"; if backend returns 400 with the "N employees assigned" message, show it verbatim in a danger toast and keep the row. Suggest the users reassign employees first via link to the filtered employee list.

### 4.8 Time entries `/time-entries`

The attendance center. Admin-only mutating actions; read for everyone.

**Toolbar:**
- FilterBar row 1: Date range (two DatePickers, syncs `GET /time-entries/date-range?startDate&endDate`), Employee select (or "All"), Status select (COMPLETE/INCOMPLETE/INVALID), per-page.
- Admin buttons: "+ Add entry" · "Excel import" · (selection-) "Delete selected".

**Table columns:**
| Column | Content |
| --- | --- |
| Date | `YYYY-MM-DD` |
| Employee | avatar + name (from nested `employee`) |
| Clock in | mono font `09:00:00` |
| Clock out | mono font (or `—` when null) |
| Status | pill (COMPLETE green / INCOMPLETE amber / INVALID red) |
| Actions | Edit (admin) · Delete (admin) |

Pagination like employees (`limit` default 20, max 200).

**Add/Edit entry modal (admin):**
- Employee: searchable select (required).
- Date: required `YYYY-MM-DD`.
- Clock in: required `HH:mm:ss` (accept HH:mm and normalize).
- Clock out: optional `HH:mm:ss`.
- Live helper text computing duration ("8h 30m") and warnings:
  - clock out defined but ≤ clock in → entry previews red `INVALID` pill.
  - Warn "another entry already exists for this employee on this date" if the duplicates response is 409 (backend enforces one entry per employee per day).

**Excel import `/time-entries/import` (admin) — 3-step wizard:**
1. **Template step:** text explaining the expected columns `Employee ID · Date · Clock In · Clock Out`; formats accepted (`YYYY-MM-DD`, `DD/MM/YYYY`, times `HH:mm` or `HH:mm:ss`); button "Download template" (streams `.xlsx`).
2. **Upload step:** FileDropzone; validate extension + ≤10MB; "Start import" with progress state.
3. **Report step:** result panel from `POST /time-entries/import/excel`:
   - Summary chips: `total`, `imported` (green), `failed` (red).
   - Errors table: `Row / Employee ID / Date / Reason` for each item in `errors[]` (e.g., "Duplicate entry for this date").
   - Buttons: "Import another file", "Go to time entries".

**Bulk delete (admin):** checkbox selection → ConfirmDialog with count → `DELETE /time-entries/bulk { ids: number[] }` → toast summary (`deleted` / `failed`), refresh list.

### 4.9 Users `/users` (admin only)

**Table columns:** Name (avatar) · Email · Role (admin/user badge) · Active (toggle directly on rows? — keep read-only badge; editing via Edit modal) · Created · Actions (Edit / Delete).

- Search (email/name), pagination, role filter.
- Edit modal: Name, Password change ("leave empty to keep current"), Role select, Active switch. Note: changing the **email** of a user is not supported by the API — omit the field or render it read-only.
- Delete: Confirm; block deleting your own account client-side (backend would 404/500 otherwise) with tooltip "You cannot delete yourself".

### 4.10 My Profile `/users/me`

- Shows current user (`GET /auth/me` or `/users/me`): avatar, email (read-only), member-since.
- Editable: Name, New password (+ confirm). Save applies via `PATCH /users/{own id}`.
- Role & Active shown as read-only badges.
- (Optional) "Sessions" placeholder card explaining refresh token expiry.

### 4.11 Empty & error choreography (applies globally)

- **401** on any request → auto attempt refresh (§5.2); if refresh fails → clear session → redirect `/login` with toast "Your session has expired, please sign in".
- **403** → toast "You do not have permission…" and route the user home.
- **404** (entity gone) → in-page empty state "This record no longer exists" + back link.
- **Network/5xx** → toast "Something went wrong — please try again".
- All mutations show loading state on their trigger button and disable it (double-submit protection).

---

## 5. API contract (exact)

### 5.1 Conventions

- Base URL: `http://localhost:3000` (dev). No global prefix.
- All requests/receive bodies are JSON (`application/json`) except the Excel endpoints.
- Auth: `Authorization: Bearer <access_token>` on every request except register/login/refresh.
- Global response `pagination` envelope (nestjs-paginate) for list endpoints:

```jsonc
{
  "data": [ /* entity DTOs */ ],
  "meta": {
    "itemsPerPage": 5,
    "totalItems": 17,
    "currentPage": 2,
    "totalPages": 4,
    "sortBy": [["id", "ASC"]]
  },
  "links": {
    "first": "/employees?page=1&limit=5&sortBy=id:ASC",
    "previous": "/employees?page=1&limit=5",
    "current": "/employees?page=2&limit=5",
    "next": "/employees?page=3&limit=5",
    "last": "/employees?page=4&limit=5"
  }
}
```

- The `links.*` values are absolute URLs; prefer re-computing from `meta` rather than following them.
- Error envelope:

```jsonc
{ "message": "Invalid credentials", "error": "Unauthorized", "statusCode": 401 }
```

Validation errors return `statusCode 400` with `message` either a string or a string array (one per failed field — display under the matching input).

- Standard pagination params: `page` (≥1), `limit` (10 default, 100 max for departments/employees/users; 20 default, 200 max for time entries), `sortBy=field:DIR`, `search=text`, `filter.<field>=value`.

### 5.2 Auth endpoints

**POST /auth/register** — public
Body: `{ email, password, name? }` (role ignored — always becomes "user"; email unique, password ≥6 chars with ≥1 lowercase + 1 digit)
Response `201`:

```jsonc
{
  "access_token": "…",           // ~1h, send as Bearer
  "refresh_token": "…",          // 7 days, safe storage, use to renew
  "user": { "id": 21, "email": "…", "role": "user" }
}
```

**POST /auth/login** — public
Body: `{ email, password }` → same `201?/200` response shape as register (`Anonymous: access_token, refresh_token, user`).

**POST /auth/refresh** — public
Body: `{ "refresh_token": "…" }` → same token trio. On failure: `401` (invalid/expired refresh token) → log the user out.

**GET /auth/me** — authed → `UserDto` (see 5.4) of the current user.

### 5.3 Domain endpoints

**Departments**
- `GET /departments?page&limit&sortBy&search&filter.name=…` → paginated `DepartmentDto[]`
- `GET /departments/employee-count?…` → paginated `DepartmentDto[]` with `employeeCount` on rows
- `GET /departments/:id` → `DepartmentDto`
- `POST /departments` (admin) body `{ name, description? }` → `201 DepartmentDto`
- `PATCH /departments/:id` (admin) partial body → `DepartmentDto`
- `DELETE /departments/:id` (admin) → `204`; `400` when employees are assigned (message says how many — surface it).

**Employees**
- `GET /employees?…&search&filter.departmentId&filter.isActive` → paginated `EmployeeDto[]` (includes nested `department {id,name}` and `manager`/`managerId` when the manager is loaded)
- `GET /employees/stats/overview` (admin) →

```jsonc
{ "total": 17, "active": 15, "inactive": 2,
  "byDepartment": [{ "departmentId": 1, "departmentName": "Softeware Engineering", "count": 8 }] }
```

- `GET /employees/department/:departmentId?…` → paginated employee rows of one department
- `GET /employees/:id` → `EmployeeDto`
- `GET /employees/:id/department` → `EmployeeDto` with `department` object loaded
- `GET /employees/:id/subordinates?page&limit&search&filter.isActive&filter.departmentId` → paginated employees managed by this employee (`404` if the manager doesn't exist)
- `POST /employees` (admin) body:

```jsonc
{ "firstName": "Bob", "lastName": "Subordinate", "email": "bob@example.com",
  "phone": "0550000002", "hireDate": "2025-01-15", "departmentId": 1, "managerId": 21, "isActive": true }
```
  → `201 EmployeeDto`; validation errors `400`; duplicate email `409`; department must exist `404`.
- `PATCH /employees/:id` (admin) — any subset of the above; `managerId: null` clears the manager (self-manager is rejected `400`); `404` unknown department/manager.
- `DELETE /employees/:id` (admin) → `204` (also removes that employee's time entries via cascade).

**Time entries**
- `GET /time-entries?page&limit&sortBy&filter.employeeId&filter.status&filter.date` → paginated `TimeEntryDto[]` (nested `employee`)
- `GET /time-entries/date-range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&…` (bad format `400`) → paginated
- `GET /time-entries/employee/:employeeId?…` → paginated (`404` unknown employee)
- `GET /time-entries/stats/overview` (admin) → `{ "total": 4, "byStatus": [{ "status": "COMPLETE", "count": 3 }, …] }`
- `GET /time-entries/export/template` → binary `.xlsx` stream (Content-Type spreadsheet). Downloadable via `<a href>` with Bearer header OR fetch blob → object URL.
- `POST /time-entries` (admin) body `{ employeeId, date, clockIn, clockOut? }` → `201 TimeEntryDto`; `409` when a duplicate daily entry exists.
- `POST /time-entries/import/excel` (admin) — `multipart/form-data` with field `file` (`.xlsx/.xls`, ≤10MB). `201`:

```jsonc
{ "message": "Import completed: 12 succeeded, 2 failed",
  "total": 14, "imported": 12, "failed": 2,
  "errors": [{ "employeeId": 7, "date": "2025-11-08", "error": "Duplicate entry for this date" }] }
```
  Bad file `400` with `{ "message": "Excel file contains invalid data", "errors": ["Row 4: Invalid date format: …"] }`.
- `PUT /time-entries/:id` (admin) partial body → `TimeEntryDto` (status recomputed)
- `DELETE /time-entries/bulk` (admin) body `{ "ids": [1, 2] }` → `200 { "deleted": 2, "failed": 0, "errors": [] }`
- `DELETE /time-entries/:id` (admin) → `204`

**Users (admin unless noted)**
- `GET /users?…&filter.role=admin|user` → paginated `UserDto[]`
- `POST /users` (admin) body `{ email, password, name?, role?, isActive? }` → `201 UserDto`
- `GET /users/me` — self profile
- `GET /users/:id` — self allowed (others `403`)
- `PATCH /users/:id` — self may change ONLY `name`/`password` (role/isActive silently stripped); admin may also change `role`/`isActive` on anyone (but not `email`)
- `DELETE /users/:id` (admin) → `204`

### 5.4 DTO shapes

```ts
UserDto        = { id, email, name?, isActive, role: "admin"|"user", createdAt, updatedAt }

DepartmentDto  = { id, name, description?, createdAt, updatedAt, employeeCount? }

EmployeeDto    = {
  id, firstName, lastName, email?, phone?, hireDate?,   // dates ISO strings
  departmentId?, department?: { id, name },
  managerId?,    manager?:    { id, firstName, lastName },
  isActive, createdAt, updatedAt
}

TimeEntryDto   = {
  id, employeeId, date,        // "2026-10-20"
  clockIn,                     // "09:00:00"
  clockOut,                    // "17:30:00" | null
  status,                      // "COMPLETE" | "INCOMPLETE" | "INVALID"
  createdAt, updatedAt,
  employee?: EmployeeDto       // loaded on lists / detail
}
```

### 5.5 Suggested client architecture

- `fetch wrapper` with:
  1. inject `Authorization`,
  2. on `401` → try `POST /auth/refresh` once (store tokens on success, retry the original request),
  3. on refresh failure → clear tokens → `Router.replace('/login')`.
- Token storage: memory + `localStorage` fallback for the prototype (document that production uses BFF/httpOnly cookies).
- React Query keys: `['employees', filters]`, `['employee', id]`, `['departments']`, `['time-entries', filters]`, `['user-stats']`, `['te-stats']` — mutations invalidate the relevant keys.
- Validation library mirroring the backend DTOs (zod) so modals validate locally before submitting.

---

## 6. Core user flows to prototype (interactions)

1. **First visit → login → dashboard.** Show skeleton→populated stat cards & charts.
2. **Employee lifecycle.** From the employees table: create Alice (dept + manager picker), see her row, open detail → 2. Subordinates tab empty → assign a MySubordinate via employee edit modal → subordinates tab reflects it. Delete via confirm (admin).
3. **Attendance day.** Add a manual entry (09:00–17:30 → green COMPLETE), add one without clock-out (amber INCOMPLETE), add one reversed (08:00 in, 07:00 out → red INVALID). Show these states in the prototype.
4. **Excel import.** Download template → upload a filled file (mock) → report panel listing successes and per-row failures in a table.
5. **Date-range view.** Set Oct 1 → Oct 31 → table + chips reflect the filtered data set; clear filters restores.
6. **Role switching.** Prototype the same app as `user`: nav without Users, no edit buttons anywhere, dashboard without admin quick actions. (Two frames: "Admin", "User".)
7. **Session expiry.** After ~1h access-token TTL the next request transparently refreshes; prototype as a toast "Session renewed" (implementation detail can be annotated in the prototype).
8. **Empty database states.** Empty departments → dashboard charts empty-state; empty employees → table EmptyState with "Add employee" CTA.

---

## 7. Prototype deliverables checklist (for Figma Make)

Produce the following frames, each also duplicated in the "User role" variant where it differs (§6.6):

| # | Frame | Notes |
| --- | --- | --- |
| 1 | Design system sheet | tokens, palette, type scale, all components from §2.2 |
| 2 | Login · Register | focused input, error banner, buttons |
| 3 | Shell | sidebar collapsed + expanded, topbar with avatar menu open |
| 4 | Dashboard | full populated + one skeleton state |
| 5 | Employees table | populated, sorting & filters visible, kebab menu open, pagination |
| 6 | Employee modal (create/edit) | validation error state on email + manager select open |
| 7 | Employee detail | 3 tabs (show all 3 as separate frames or blocks) |
| 8 | Departments table + modal | Employee count pills, delete-blocked toast |
| 9 | Time entries table | status pills all 3 colors, filter row, bulk-select bar |
| 10 | Time entry modal | duration helper + INVALID warning variant |
| 11 | Import wizard | 3 steps as separate frames incl. report table |
| 12 | Users table + edit modal (admin) | role/active controls |
| 13 | My profile | editable vs read-only fields |
| 14 | Toasts | success/error/info + destructive confirm dialog |
| 15 | Empty & error states | table empty, 403 toast, 404 detail screen |

After sign-off, the Next.js implementation should reuse these names for routes/components (§3, §2.2) and follow the API contract in §5 verbatim — the backend expects exactly those fields.
