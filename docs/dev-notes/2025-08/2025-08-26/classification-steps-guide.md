# STEP ONE — Open site nav and harvest category links (no SVG paths)

## Goal
Programmatically open the site navigation (desktop or mobile) and collect **category/collection links** for the next stage.

## Start URL
- `https://www.filson.com/`

## How to open the nav
- **Desktop first (preferred):**
  - Check if a desktop mega-nav is already rendered/visible.
  - Select a persistent nav container (avoid IDs that look versioned).
    - Candidate selectors (try in order):
      - `header .header-new__nav`                 # container
      - `header nav`                               # fallback
- **Mobile fallback (only if desktop categories not found):**
  - Click the **button** that toggles the mobile nav (do NOT descend into SVG).
    - Selector: `button.js-header-mobile-nav-toggle`
    - Secondary safe selector: `button.header-new__nav-toggle`
  - Wait for an expanded nav container to become visible.
    - Selector to await: `.header-new__nav, .mobile-nav, [aria-expanded="true"] ~ nav`

## Where to look for links (after nav is open/visible)
- Search within the active nav container only (scoped find), not entire document.
- Accept anchor elements that look like real category hubs:
  - `a[href^="/collections/"]`
  - `a[href^="https://www.filson.com/collections/"]`
- Also allow top-level departments that route to index pages:
  - `a[href^="/pages/"]` (only if text matches known department names)
- **Exclude** obvious non-category links:
  - `a[href*="/account"]`, `a[href*="/cart"]`, `a[href*="/search"]`,
    `a[href*="/policies"]`, `a[href*="/blogs"]`, `a[href*="/gift"]`,
    `a[href*="/journal"]`, `a[href*="/pro-program"]`, hash `#` links.

## What to extract for each link
- `link_url`  → absolute URL (normalize relative paths).
- `link_text` → trimmed visible text (`innerText`), collapse whitespace.
- `aria_label` → from `aria-label` if present (fallback name).
- `data-track` / `data-analytics-*` → capture if present (optional).
- `depth_hint` → compute a simple depth:
  - `depth=1` top row items,
  - `depth=2` submenu items, etc. (based on DOM nesting within the nav container).
- `parent_text` → text of the nearest labeled parent menu (if any) to keep hierarchy.

## De-dupe & normalize
- Lowercase + decode URL, remove trailing slashes and UTM/query params (keep `?page` for pagination only).
- De-duplicate by normalized URL.
- Keep the **first** occurrence at the shallowest `depth_hint`.

## Output of STEP ONE (for STEP TWO to consume)
Write a file (CSV or JSONL), one row per unique category/collection link:
- `collection_url`
- `link_text`
- `parent_text`
- `depth_hint`
- `source` (desktop|mobile)
- `found_at` (always `https://www.filson.com/` for STEP ONE)

### Example JSONL row
```json
{"collection_url":"https://www.filson.com/collections/outerwear","link_text":"Outerwear","parent_text":"","depth_hint":1,"source":"desktop","found_at":"https://www.filson.com/"}