STEP ONE:
https://www.filson.com/

STEP TWO:

Open mobile nav toggle  
Selector: button.header-new__nav-toggle.js-header-mobile-nav-toggle

Within nav menu  
Selector: #mobile-mega-menu nav button  
Match innerText === "Men"

Then, inside the "Men" panel:  
- Collect all <a> links where href starts with "/collections/"  
- Extract both href and innerText (the label)  
- Example results might include:  
  • /collections/outerwear ("Outerwear")  
  • /collections/wool-jackets ("Wool Jackets")  
  • /collections/waxed-canvas-jackets ("Waxed Canvas Jackets")  
  • /collections/jac-shirts ("Jac-Shirts")  
  • /collections/vests ("Vests")  
  • /collections/field-jackets ("Field Jackets")  
  • /collections/insulated-jackets ("Insulated Jackets")  
  • /collections/rain-jackets ("Rain Jackets")  
  • /collections/fleece-jackets ("Fleece Jackets")

Within nav menu  
Selector: #mobile-mega-menu nav button  
Match innerText === "Women"

Then, inside the "Women" panel:  
- Collect all <a> links where href starts with "/collections/"  
- Extract both href and innerText (the label)  
- Example results might include:  
  • /collections/womens-outerwear ("Women's Outerwear")  
  • /collections/womens-shirts ("Women's Shirts")  
  • /collections/womens-pants ("Women's Pants")  
  • /collections/womens-vests ("Women's Vests")  
  • /collections/womens-accessories ("Women's Accessories")

Within nav menu  
Selector: #mobile-mega-menu nav button  
Match innerText === "Bags"

Then, inside the "Bags" panel:  
- Collect all <a> links where href starts with "/collections/"  
- Extract both href and innerText (the label)  
- Example results might include:  
  • /collections/backpacks ("Backpacks")  
  • /collections/duffel-bags ("Duffel Bags")  
  • /collections/tote-bags ("Tote Bags")  
  • /collections/luggage ("Luggage")  
  • /collections/tool-bags ("Tool Bags")

Within nav menu  
Selector: #mobile-mega-menu nav button  
Match innerText === "Gear"

Then, inside the "Gear" panel:  
- Collect all <a> links where href starts with "/collections/"  
- Extract both href and innerText (the label)  
- Example results might include:  
  • /collections/hunting-gear ("Hunting Gear")  
  • /collections/outdoor-essentials ("Outdoor Essentials")  
  • /collections/camping-gear ("Camping Gear")  
  • /collections/fishing-gear ("Fishing Gear")  
  • /collections/gift-ideas ("Gift Ideas")

Within nav menu  
Selector: #mobile-mega-menu nav button  
Match innerText === "Outlet"

Then, inside the "Outlet" panel:  
- Collect all <a> links where href starts with "/collections/"  
- Extract both href and innerText (the label)  
- Example results might include:  
  • /collections/clearance-outerwear ("Clearance Outerwear")  
  • /collections/clearance-bags ("Clearance Bags")  
  • /collections/clearance-apparel ("Clearance Apparel")  
  • /collections/clearance-accessories ("Clearance Accessories")  
  • /collections/sale-items ("Sale Items")
STEP THREE — Navigate L1 ➜ L2
Goal: From the selected L1 ("Men", "Women", etc.), click into a top-level collection category (L2).

Container resolution:
- Preferred: use the clicked L1 button’s `aria-controls` to scope to its panel (MEN_PANEL).
- Fallback: `#mobile-mega-menu` (visible mobile nav container).

Harvest L2 candidates:
- Selector: a[href^="/collections/"]
- Extract: { href, innerText }
- Filter: keep only items whose innerText matches one of the expected L2 labels (e.g., "Outerwear", "Shirts", "Pants", "Bags", etc.). (The code may keep all, but the spec shows intent.)

Action:
- Click the L2 link whose innerText equals the desired target (example: "Outerwear").
- Wait for navigation to complete.

---

STEP FOUR — Navigate L2 ➜ L3 (subcategory page)
Scope: Now on an L2 collection page (e.g., /collections/outerwear).

Find L3 links:
- Primary selector: a[href*="/collections/"] within the primary category grid/menu.
- Exclude: /account, /cart, /search, /blogs, hash anchors.
- Extract: { href, innerText }

Action:
- For each L3 candidate that matches your target (example: "Waxed Canvas Jackets"), click and wait for navigation.

Notes:
- Many pages render L3 links in a sidebar, tabs, or tiles. Prefer container scoping if present (e.g., aside, .collection-nav, .facets, or grid tiles with links).

---

STEP FIVE — Navigate L3 ➜ L4 (family)
Scope: Now on an L3 page (e.g., /collections/waxed-canvas-jackets).

Find L4 links:
- Selector: a[href*="/collections/"] in the page section that groups by sub-family (e.g., "Tin Cloth Jackets").
- Extract: { href, innerText }
- If there is no visible L4 grouping, treat the current L3 page as L4 (skip to STEP SIX).

Action:
- Click each L4 link (e.g., "Tin Cloth Jackets") to open its collection page, then proceed.

---

STEP SIX — Navigate L4 ➜ L5 (product list)
Scope: Now on an L4 collection page (e.g., /collections/tin-cloth-jackets).

Collect L5 product URLs (with pagination):
- Product link selector: a[href^="/products/"]
- Extract: absolute URL + product title (innerText or aria-label)
- De-dup: by URL
- Pagination:
  - Detect pager controls (e.g., a[rel="next"], .pagination a, button[aria-label*="Next"]).
  - While a next page exists:
    - Click "next" (or fetch next page URL) and continue collecting product links.
  - Stop when no more next pages.

Action:
- For each product URL collected, open it and run the product-classifications extractor (separate STEP).

---

STEP SEVEN — Product page classifications (data contract)
When on a product page (L5), extract:

Identity
- title, product_name, brand
- sku (primary), all variant SKUs if available
- product_handle (basename of URL)

Taxonomy breadcrumbs (resolved from clicks)
- department_l1 (e.g., "Men")
- category_l2 (e.g., "Outerwear")
- subcategory_l3 (e.g., "Waxed Canvas Jackets")
- family_l4 (e.g., "Tin Cloth Jackets")
- family_l5 (product family name if present; else product title as leaf)

Merch & pricing
- price_regular, price_sale, discount_pct
- badges/flags (e.g., "Made in USA", "Limited", "Special Edition")

Options & variants
- options_json (full)
- color_label + color_values_json (from swatches/labels)
- sizes (visible size labels; do not include availability words)
- size_guide_present (boolean)
- size_chart_json + size_chart_images (scrape Size Guide modal if present)

Content
- description_html + description_text
- features_json (bullets/specs list)
- material_primary, manufacturing, care
- images_json (all gallery URLs)
- rating_value, rating_count
- reviews_json (full individual reviews, paginated if needed)
- review_signals_json (e.g., “Fits small”, “Runs large” if present)
- cross_sell_products_json (You May Also Like)
- ld_json (raw schema.org JSON-LD)

Persistence
- Always write the row with the L1…L4 context that led here.
- If the same product is reachable from multiple paths, either:
  - Write multiple rows (one per path), or
  - Write one row and append an array of {department_l1, category_l2, subcategory_l3, family_l4} paths in a dedicated column (configurable).