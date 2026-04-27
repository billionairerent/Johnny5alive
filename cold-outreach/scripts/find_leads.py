"""
find_leads.py — Find new local businesses via Yelp, then extract websites and emails.

Pipeline per business:
  1. Search Yelp (name, phone, city, category, rating)
  2. Search DuckDuckGo for their actual website
  3. Scrape website for contact email
  4. Deduplicate against existing leads
  5. Save as dated CSV in data/raw/

Usage:
    python find_leads.py                             # all locations + categories
    python find_leads.py --location "Memphis, TN"   # one location
    python find_leads.py --category restaurants     # one category
    python find_leads.py --limit 30                 # 30 per location/category

Requires in .env:
    YELP_API_KEY=...  (free at yelp.com/developers)
"""

import csv
import json
import os
import re
import time
import argparse
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

YELP_API_KEY = os.environ.get("YELP_API_KEY", "")
YELP_SEARCH  = "https://api.yelp.com/v3/businesses/search"

TARGET_LOCATIONS = [
    "Memphis, TN",
    "Atlanta, GA",
]

# Yelp category aliases — good matches for ByteVision Reelworks targets
TARGET_CATEGORIES = [
    "restaurants",
    "beautysvc",      # Beauty & Spas
    "barbers",        # Barbers
    "hair",           # Hair Salons
    "nightlife",      # Bars & Clubs / Lounges
    "eventplanning",  # Event Planners
    "fitness",        # Gyms & Studios
    "realestate",     # Real Estate Agencies
    "lawyers",        # Law Firms
]

# Category labels that appear in our CSV (more readable)
CATEGORY_LABELS = {
    "restaurants":   "restaurant",
    "beautysvc":     "beauty",
    "barbers":       "barbershop",
    "hair":          "hair salon",
    "nightlife":     "nightlife",
    "eventplanning": "event planning",
    "fitness":       "fitness",
    "realestate":    "real estate",
    "lawyers":       "law firm",
}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.IGNORECASE)

SKIP_EMAIL_DOMAINS = {
    "example.com", "sentry.io", "wixpress.com", "squarespace.com",
    "shopify.com", "wordpress.com", "amazonaws.com", "cloudflare.com",
    "google.com", "facebook.com", "instagram.com", "tiktok.com",
    "yelp.com", "tripadvisor.com",
}

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      "AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/120.0.0.0 Safari/537.36")


# ── Yelp ──────────────────────────────────────────────────────────────────────

def yelp_search(location: str, category: str, limit: int = 50) -> list:
    headers = {"Authorization": f"Bearer {YELP_API_KEY}"}
    results = []
    offset = 0
    while len(results) < limit:
        batch = min(50, limit - len(results))
        try:
            r = requests.get(
                YELP_SEARCH,
                headers=headers,
                params={"location": location, "categories": category,
                        "limit": batch, "offset": offset, "sort_by": "review_count"},
                timeout=12,
            )
            r.raise_for_status()
            businesses = r.json().get("businesses", [])
            if not businesses:
                break
            results.extend(businesses)
            offset += len(businesses)
            if len(businesses) < batch:
                break
        except Exception as e:
            print(f"    Yelp error: {e}")
            break
    return results


# ── Website discovery via Yelp business detail API ───────────────────────────

def find_website(yelp_id: str) -> str:
    """Fetch the actual business website URL from Yelp's detail endpoint."""
    if not yelp_id:
        return ""
    try:
        r = requests.get(
            f"https://api.yelp.com/v3/businesses/{yelp_id}",
            headers={"Authorization": f"Bearer {YELP_API_KEY}"},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        # Yelp detail returns website URL when available
        return data.get("website", "") or data.get("url", "")
    except Exception:
        return ""


# ── Email extraction ──────────────────────────────────────────────────────────

def extract_email(url: str) -> str:
    if not url:
        return ""
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=10, allow_redirects=True)
        emails = EMAIL_RE.findall(r.text)
        for email in emails:
            domain = email.split("@")[-1].lower()
            if domain not in SKIP_EMAIL_DOMAINS and "." in domain:
                return email.lower()
        # Try /contact page
        contact_url = url.rstrip("/") + "/contact"
        r2 = requests.get(contact_url, headers={"User-Agent": UA}, timeout=8, allow_redirects=True)
        emails2 = EMAIL_RE.findall(r2.text)
        for email in emails2:
            domain = email.split("@")[-1].lower()
            if domain not in SKIP_EMAIL_DOMAINS and "." in domain:
                return email.lower()
    except Exception:
        pass
    return ""


# ── Deduplication ────────────────────────────────────────────────────────────

def load_seen_phones(base: Path) -> set:
    seen = set()
    for f in (base / "data" / "raw").glob("*.csv"):
        try:
            with open(f) as fh:
                for row in csv.DictReader(fh):
                    ph = re.sub(r"\D", "", row.get("phone", ""))
                    if ph:
                        seen.add(ph)
        except Exception:
            pass
    for f in (base / "data" / "scored").glob("*.json"):
        try:
            for lead in json.loads(f.read_text()):
                ph = re.sub(r"\D", "", lead.get("phone", ""))
                if ph:
                    seen.add(ph)
        except Exception:
            pass
    return seen


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Find new leads via Yelp + website scraping")
    parser.add_argument("--location", help="Specific location (default: all targets)")
    parser.add_argument("--category", help="Specific Yelp category alias (default: all targets)")
    parser.add_argument("--limit", type=int, default=25,
                        help="Max Yelp results per location/category combo (default: 25)")
    args = parser.parse_args()

    if not YELP_API_KEY:
        print("ERROR: YELP_API_KEY not set in .env")
        print("Get a free key at: https://www.yelp.com/developers/v3/manage_app")
        return

    base       = Path(__file__).parent.parent
    raw_dir    = base / "data" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    seen_phones = load_seen_phones(base)
    print(f"Skipping {len(seen_phones)} already-known phone numbers.\n")

    locations  = [args.location] if args.location else TARGET_LOCATIONS
    categories = [args.category] if args.category else TARGET_CATEGORIES

    all_rows = []
    this_run_phones: set = set()

    for location in locations:
        city_state = location.split(",")
        city  = city_state[0].strip()
        state = city_state[1].strip() if len(city_state) > 1 else ""

        for category in categories:
            label = CATEGORY_LABELS.get(category, category)
            print(f"Searching {location} / {label} ...")
            businesses = yelp_search(location, category, limit=args.limit)
            print(f"  {len(businesses)} results from Yelp")

            new_count = 0
            for biz in businesses:
                phone_raw = biz.get("phone", "")
                phone_digits = re.sub(r"\D", "", phone_raw)

                # Skip already-known or duplicate-in-this-run
                if phone_digits and (phone_digits in seen_phones or phone_digits in this_run_phones):
                    continue
                if phone_digits:
                    this_run_phones.add(phone_digits)

                # Format phone nicely
                phone_display = biz.get("display_phone", phone_raw).replace("+1 ", "")

                name = biz.get("name", "")
                biz_city  = biz.get("location", {}).get("city", city)
                biz_state = biz.get("location", {}).get("state", state)

                # Try to find website + email via Yelp detail API
                yelp_id = biz.get("id", "")
                website = find_website(yelp_id)
                # Strip Yelp's own URL if that's all we got
                if "yelp.com" in website:
                    website = ""
                email = extract_email(website) if website else ""
                time.sleep(0.5)

                row = {
                    "company_name":   name,
                    "email":          email,
                    "phone":          phone_display,
                    "city":           biz_city,
                    "state":          biz_state,
                    "website":        website,
                    "industry":       label,
                    "reviews_count":  str(biz.get("review_count", 0)),
                    "reviews_rating": str(biz.get("rating", 0.0)),
                }
                all_rows.append(row)
                new_count += 1

                status = f"email: {email}" if email else "no email found"
                print(f"    ✓ {name} ({status})")

            print(f"  Added {new_count} new leads\n")

    if not all_rows:
        print("No new businesses found.")
        return

    out_path = raw_dir / f"yelp_leads_{date.today()}.csv"
    fieldnames = ["company_name", "email", "phone", "city", "state",
                  "website", "industry", "reviews_count", "reviews_rating"]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    with_email    = sum(1 for r in all_rows if r["email"])
    without_email = len(all_rows) - with_email

    print(f"Saved {len(all_rows)} new leads → {out_path}")
    print(f"  With email:    {with_email}")
    print(f"  Without email: {without_email} (phone-only; still scored, lower priority)")
    print("\nRun score_leads.py next to grade them.")


if __name__ == "__main__":
    main()
