import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const SOURCE_FALLBACK_TZ = "America/New_York";
const TARGET_TZ = "America/Los_Angeles";

// Map timezone abbreviations to IANA timezone names
const TIMEZONE_MAPPING = {
  // Eastern Time
  "EDT": "America/New_York",    // Eastern Daylight Time
  "EST": "America/New_York",    // Eastern Standard Time
  "ET": "America/New_York",     // Eastern Time (generic)
  
  // Central Time
  "CDT": "America/Chicago",     // Central Daylight Time
  "CST": "America/Chicago",     // Central Standard Time
  "CT": "America/Chicago",      // Central Time (generic)
  
  // Mountain Time
  "MDT": "America/Denver",      // Mountain Daylight Time
  "MST": "America/Denver",      // Mountain Standard Time
  "MT": "America/Denver",       // Mountain Time (generic)
  
  // Pacific Time
  "PDT": "America/Los_Angeles", // Pacific Daylight Time
  "PST": "America/Los_Angeles", // Pacific Standard Time
  "PT": "America/Los_Angeles",  // Pacific Time (generic)
  
  // Add more as needed for your data
};

function normalizeTimezone(tzValue) {
  if (!tzValue) return SOURCE_FALLBACK_TZ;
  
  const cleaned = String(tzValue).trim().toUpperCase();
  
  // Check if it's already an IANA timezone (contains slash)
  if (cleaned.includes('/')) {
    return tzValue; // Assume it's already a valid IANA timezone
  }
  
  // Map abbreviation to IANA timezone
  const mapped = TIMEZONE_MAPPING[cleaned];
  if (mapped) {
    return mapped;
  }
  
  // Log unknown timezones for debugging
  console.warn(`Unknown timezone abbreviation: "${tzValue}", using fallback: ${SOURCE_FALLBACK_TZ}`);
  return SOURCE_FALLBACK_TZ;
}

function toNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null) return 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeOrdersRow(row) {
  // Start with all original columns
  const out = { ...row };
  
  
  try {
    // Use schema-driven field mapping for line_items.csv
    out["Product Name"] = row["product_name"] ?? null;
    out["Color"] = row["color"] ?? null;
    out["Size"] = row["size"] ?? null;
    out["Product Net"] = toNumber(row["discounted_price"]);
    out["Order ID"] = row["order_id"] ?? null;
    out["UPC"] = row["upc"] ?? null;
    out["Quantity Sold"] = toNumber(row["quantity"] ?? 1);
    out["Unit Price"] = toNumber(row["unit_price"]);
    out["Line Discount"] = toNumber(row["line_discount"]);
    out["Taxes"] = toNumber(row["taxes"]);
    out["Line Number"] = toNumber(row["line_number"]);
    
    out["SKU"] = row["sku"] ?? null;

    const src = row["Order Date/Time"] ?? null;

    if (src) {
      let d = null;
      
      // Parse the time as-is without any timezone conversion
      d = dayjs(src, "YYYY-MM-DD h:mmA");
      if (!d.isValid()) {
        d = dayjs(src, "YYYY-MM-DD hh:mmA");
      }
      if (!d.isValid()) {
        d = dayjs(src, "YYYY-MM-DD h:mma");
      }
      if (!d.isValid()) {
        d = dayjs(src);
      }
      
      if (d && d.isValid()) {
        out.__yyyy = String(d.year());
        out.__mm   = String(d.month() + 1).padStart(2, "0");
        out["Order Date/Time"] = src;
        out.order_datetime_normalized = d.format('YYYY-MM-DD HH:mm:ss');
      }
    }
    
    return out;
    
  } catch (error) {
    console.error(`Error normalizing row:`, error.message, row);
    // Return all original fields even on error, with safe defaults for key fields
    return {
      ...row,
      "Product Name": row["product_name"] ?? null,
      "Color": row["color"] ?? null,
      "Size": row["size"] ?? null,
      "Product Net": 0,
      "Order ID": row["order_id"] ?? null,
      "UPC": row["upc"] ?? null,
      "Quantity Sold": 1,
      "Line Number": 1,
    };
  }
}