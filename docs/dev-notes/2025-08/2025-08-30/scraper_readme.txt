Orders Scraper — How To Run
=================================

Environment variables
- NS_USERNAME: NewStore login (email). Required for fresh login.
- NS_PASSWORD: NewStore password. Required for fresh login.
- EXPORTS_DIR: Output root. Default: orders_exports
- HEADLESS: true|false. Default: true
- SLOWMO: ms to slow actions (e.g. 100). Default: 0
- DEBUG: true to enable verbose logs.
- SCREENSHOT: true to capture debug screenshots on errors.
- FORCE_REBUILD: true to regenerate days even if files exist.
- FORCE_REBUILD_DATE: YYYY-MM-DD to force one specific day.
- MAX_MONTHS: number of months to crawl backward. Default: 60

First-time auth
1) Run: npm run auth
2) Log in in the opened browser, then press Enter in terminal.
   This saves storageState.json to re-use your session.

Run the scraper
- Quick start (headless): npm run scrape:orders
- Debug mode (visible browser + screenshots): npm run scrape:orders:debug

Focused per-day (visible) line-items debug
- Use the day test script with env flags:
  - HEADLESS=false SLOWMO=150 node scripts/test_line_items_export.mjs YYYY-MM-DD
  - Optional envs:
    - ONLY_ORDER_ID=FSP1234567 to debug one order
    - LIMIT=1 to stop after the first processed order

One-command per-day run (orders → line-items)
- Visible by default; can override with envs
- Examples:
  - node scripts/run_day.mjs 2025-08-24
  - HEADLESS=false SLOWMO=150 node scripts/run_day.mjs 2025-08-24

Outputs
- Structure: <EXPORTS_DIR>/<YYYY>/<YYYY-MM>/
  - YYYY-MM-DD_orders.csv
  - YYYY-MM-DD_line-items.csv
  - Plus the same files mirrored inside per-day folder: <YYYY-MM>/<YYYY-MM-DD>/

Tips
- To resume after failures, keep storageState.json valid and re-run.
- Use FORCE_REBUILD_DATE=YYYY-MM-DD to re-extract a single day.
- Use EXPORTS_DIR to separate test vs prod runs (e.g. orders_exports_TEST).
- If you want to validate with the older smoke script, set EXPORTS_DIR=data/NewStore/orders for that run.
