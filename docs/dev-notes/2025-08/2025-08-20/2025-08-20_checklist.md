Here’s a working strategy so we keep the workflow clean and predictable:

How we’ll proceed (tight, step‑by‑step)
	1.	Branch + breadcrumbs (once)

	•	You’ve already got the checklist; we’ll keep logs minimal and temporary.
	•	I won’t touch multiple areas at once. One file per step, one copy‑pasteable block, with a quick “Acceptance” check before moving on.

	2.	Order of operations (no surprises)

	•	Step 1: Manifest verify (read‑only): confirm the pattern matches disk, no code edits unless the pattern is wrong.
	•	Step 2: Loader range fan‑out (single file): implement month list expansion for ranges; keep period/periods paths unchanged.
	•	Step 3: Normalize row dates in the loader (single file): add __ymd once.
	•	Step 4: Table filter uses __ymd (single file): tiny change in applyDateAndLimit.
	•	Step 5: Time state types (read‑only unless mismatch): confirm we’re staging strings; only adjust if needed.
	•	Step 6: Analytics criteria (read‑only unless mismatch): confirm we pass range only when valid.
	•	Step 7: Metrics = columns only (read‑only unless mismatch).
	•	Step 8: Product search quick sanity (read‑only).

	3.	Communication + guardrails

	•	You show me exactly one file at a time (starting with the manifest if you want).
	•	I return one full replacement (no “-/+” diff format), clearly labeled.
	•	We run the acceptance check; if pass, we commit; if not, we revert that single file and fix.
	•	I will not propose cross‑file edits in the same turn unless you explicitly ask for it.

	4.	What I need from you to start

	•	Confirm the manifest path you want to use (A or B from the checklist) and paste the current data/registry/index.json. If it’s already correct, just say “use as is”.
	•	Then we’ll proceed with Step 2 (loader range fan‑out) as a single, copy‑pasteable replacement for the orders loader only.

If that plan looks good, say “go Step 1” (and share the manifest) or “skip to Step 2” and share the orders loader file you want me to edit.
⸻

✅ Fix Gameplan – Orders across full history (Products • Metrics • Time)

0) Guardrails (do first)
	•	Create a branch: feat/time-range-multi-month.
	•	Turn on console breadcrumbs (temporary):
	•	[Analytics] before fetch → print kpiId + criteria.
	•	[Loader] upon entry → print { period, periods, range }.
	•	[Loader] after resolve → print months/files to fetch and rows count.
	•	Commit after each numbered section below.
Additional concerns:
	1.	Type normalization for dates
Ensure we consistently pass YYYY-MM-DD strings (or consistently Date objects) end‑to‑end: TimePanel → controls state → loader → table filter. Mixed types can cause silent drops even after the loader fix.
	2.	Manifest vs. on-disk paths
Double‑check the manifest pattern exactly matches your folder layout (including the YYYY/ directory segment) before we judge any loader change; a single path mismatch will look like a loader bug.
⸻

1) Align Manifest paths (single source of truth)

Files: data/registry/index.json
	•	Ensure pattern matches real disk tree (choose one):
A. Single pattern with year folder
filename_pattern: "YYYY/YYYY-MM_orders_in_store.csv"
OR
B. Separate path pattern
path_pattern: "{base}/{YYYY}/{YYYY}-{MM}_orders_in_store.csv"
	•	Add:
	•	base: "data/NewStore/orders" (confirm correct)
	•	date_field: "Order Date/Time"
	•	coverage.start: "YYYY-MM" and coverage.end: "YYYY-MM" (same bounds as periods)

Acceptance: Opening one known month file via the pattern in dev tools network tab resolves (200), not 404.

⸻

2) Loader: expand range → months (stop “July-only”)

Files: src/features/analytics/data/loaders/orders/loadRows.js (or your equivalent)
	•	In the range branch, replace the “load latest” behavior with:
	1.	Compute list of YYYY-MM months from range.start → range.end (inclusive).
	2.	Intersect with manifest periods.
	3.	Build file paths via manifest pattern.
	4.	Fetch all existing files (skip 404 months, warn once).
	5.	Concatenate rows and return.
	•	Keep existing behavior for period and periods unchanged.

Acceptance: With a custom range spanning multiple months, [Loader] months/files log shows >1 month and combined rows count grows accordingly.

⸻

3) Normalize row dates once (fast & consistent)

Files: same loader as above.
	•	When parsing each CSV row, add one normalized field:
	•	row.__ymd = String(row["Order Date/Time"]).slice(0,10) OR
	•	row.__dt = new Date(<safe ISO or normalized y-m-d>)
	•	Prefer __ymd (string) to avoid timezone edge cases.

Acceptance: Spot‑log the first 3 rows and confirm __ymd looks like YYYY-MM-DD.

⸻

4) Table layer: use normalized dates for range trim

Files: src/features/analytics/registry/tableDataRegistry.js
	•	In applyDateAndLimit, swap the current slice with the normalized field:
	•	Use r.__ymd if present; otherwise fall back to String(r["Order Date/Time"]).slice(0,10).

Acceptance: With a wide range set, table shows only rows whose __ymd falls inside the exact custom range edges.

⸻

5) Time Panel + state: consistent types

Files:
	•	src/features/analytics/components/panels/TimePanel.jsx
	•	src/features/analytics/state/controlsContext.jsx
	•	Ensure TimePanel stages strings ("YYYY-MM-DD") not Date objects.
	•	Controls reducer keeps pendingRange and range as strings (start, end).
	•	(Optional) Validate start <= end on Apply; ignore Apply otherwise.

Acceptance: console.log(state.range) shows { start: "YYYY-MM-DD", end: "YYYY-MM-DD" }.

⸻

6) Analytics fetch: confirm criteria plumbing

Files: src/pages/Analytics.jsx
	•	Ensure criteria passed to getTableForKPI includes:
	•	range only when mode === "range" and both start & end exist.
	•	period only when mode === "period".
	•	params.search from product search (unchanged).

Acceptance: [Analytics] log shows correct criteria shape; empty range does not trigger fetch.

⸻

7) Metrics visibility → columns only (no data dependence)

Files:
	•	src/features/analytics/state/controlsContext.jsx
	•	src/features/analytics/components/panels/MetricsPanel.jsx
	•	Confirm metrics checkboxes only update column visibility (headers), not the dataset query.
	•	If “preview while open” isn’t desired, derive selectedColumnKeys from applied state only (not pending).

Acceptance: Checking a metric shows/hides the column header; underlying row values remain intact.

⸻

8) Product search: live filter (already working; verify)

Files: ProductPanel.jsx, Analytics.jsx (criteria params.search)
	•	Debounce still updates products/setQuery.
	•	Table rows filter reactively client‑side or via applyDateAndLimit if you kept params filtering there.

Acceptance: Typing narrows results; clearing shows the full set for the same range.

⸻

9) Regression checklist (run after each section)
	•	Switching tabs: panel roll‑up/down behavior unchanged.
	•	Clicking same tab closes and stays closed.
	•	Clicking outside the panel closes and deselects tab.
	•	Apply in Time: updates table rows; panel closes.
	•	Apply in Metrics: updates headers only; panel closes.
	•	Product search works across multiple months (not July‑only).
	•	Sort toggles per column still work.

⸻

10) Clean‑up (before merge)
	•	Remove temporary logs.
	•	Keep one targeted [Loader] debug behind an env guard (optional).
	•	Update docs/dev-notes with the final manifest pattern and loader behavior.

⸻

Notes / Open Questions
	•	Do you want the loader to skip missing months silently (warn once) or error on first missing file? (Recommend: skip + warn once.)
	•	Do we need a hard cap on months per request to avoid mega-loads (e.g., 36 months max, then prompt user)?
	•	Should we add a tiny in-memory cache per month file during session to speed up repeated range queries?

⸻

When you’re ready, we can start with Step 1 (Manifest) together and verify with a quick network check before touching the loader.