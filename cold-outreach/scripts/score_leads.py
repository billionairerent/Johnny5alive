"""
score_leads.py — Score and grade leads from CSV files.

Usage:
    python score_leads.py
    python score_leads.py --input ../data/raw/my_leads.csv
"""

import csv
import json
import os
import sys
import argparse
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# CONFIGURATION — edit these to match your business
# ---------------------------------------------------------------------------

INDUSTRY_SCORES = {
    # Tier 1 — best fit for ByteVision (20 pts)
    "restaurant": 20, "barbershop": 20, "salon": 20, "beauty": 20,
    "real estate": 20, "event": 20, "nightclub": 20, "lounge": 20,
    "law firm": 20, "attorney": 20, "lawyer": 20, "legal": 20,
    # Tier 2 (14 pts)
    "fitness": 14, "gym": 14, "clothing": 14, "boutique": 14,
    "funding": 14, "finance": 14, "mortgage": 14, "insurance": 14,
    "dental": 14, "med spa": 14, "spa": 14,
    # Tier 3 (8 pts)
    "retail": 8, "auto": 8, "staffing": 8, "consulting": 8,
    "marketing": 8, "construction": 8,
}

GEOGRAPHY_SCORES = {
    # Primary market (15 pts)
    "memphis": 15, "shelby": 15,
    # Secondary market (13 pts)
    "atlanta": 13, "fulton": 13,
    # Broader region (8 pts)
    "tennessee": 8, "georgia": 8,
}

SIZE_KEYWORDS_HIGH = {"fleet", "systems", "enterprises", "group", "services", "solutions", "industries"}
SIZE_KEYWORDS_MED  = {"inc", "llc", "corp", "co.", "company"}

GRADE_THRESHOLDS = {"A": 40, "B": 25}   # below 25 = C

# ---------------------------------------------------------------------------

def score_industry(industry: str) -> int:
    industry_lower = industry.lower()
    for key, pts in INDUSTRY_SCORES.items():
        if key in industry_lower:
            return pts
    return 0


def score_geography(city: str, state: str) -> int:
    location = f"{city} {state}".lower()
    for key, pts in GEOGRAPHY_SCORES.items():
        if key in location:
            return pts
    return 2  # out of area


def score_size(company_name: str, reviews_count: str) -> int:
    pts = 0
    name_lower = company_name.lower()
    words = set(name_lower.replace(",", "").replace(".", "").split())

    if words & SIZE_KEYWORDS_HIGH:
        pts += 15
    if words & SIZE_KEYWORDS_MED:
        pts += 8

    try:
        count = int(reviews_count)
        if count >= 100:
            pts += 7
        elif count >= 25:
            pts += 4
        elif count >= 5:
            pts += 2
    except (ValueError, TypeError):
        pass

    return min(pts, 30)


def score_digital(website: str, reviews_count: str, reviews_rating: str) -> int:
    pts = 0
    if website and website.strip():
        pts += 5
    try:
        if int(reviews_count) > 0:
            pts += 3
    except (ValueError, TypeError):
        pass
    try:
        if float(reviews_rating) >= 4.0:
            pts += 2
    except (ValueError, TypeError):
        pass
    return min(pts, 10)


def assign_grade(score: int) -> str:
    if score >= GRADE_THRESHOLDS["A"]:
        return "A"
    if score >= GRADE_THRESHOLDS["B"]:
        return "B"
    return "C"


def score_lead(row: dict) -> dict | None:
    email   = row.get("email", "").strip()
    phone   = row.get("phone", "").strip()
    if not email and not phone:
        return None  # disqualified

    industry_pts  = score_industry(row.get("industry", ""))
    geography_pts = score_geography(row.get("city", ""), row.get("state", ""))
    size_pts      = score_size(row.get("company_name", ""), row.get("reviews_count", "0"))
    digital_pts   = score_digital(row.get("website", ""), row.get("reviews_count", "0"), row.get("reviews_rating", "0"))

    total = industry_pts + geography_pts + size_pts + digital_pts

    return {
        **row,
        "score": total,
        "grade": assign_grade(total),
        "score_breakdown": {
            "industry":  industry_pts,
            "geography": geography_pts,
            "size":      size_pts,
            "digital":   digital_pts,
        },
        "email_sent":       False,
        "response_status":  None,
        "follow_up_step":   0,
    }


def process_file(csv_path: Path) -> list[dict]:
    results = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            scored = score_lead(row)
            if scored:
                results.append(scored)
    return results


def main():
    parser = argparse.ArgumentParser(description="Score leads from CSV files")
    parser.add_argument("--input", help="Path to a specific CSV file (default: all CSVs in data/raw/)")
    args = parser.parse_args()

    base = Path(__file__).parent.parent
    raw_dir    = base / "data" / "raw"
    scored_dir = base / "data" / "scored"
    scored_dir.mkdir(parents=True, exist_ok=True)

    if args.input:
        csv_files = [Path(args.input)]
    else:
        csv_files = list(raw_dir.glob("*.csv"))

    if not csv_files:
        print("No CSV files found. Place lead files in data/raw/ or use --input.")
        sys.exit(1)

    all_leads = []
    for f in csv_files:
        print(f"Processing {f.name}...")
        all_leads.extend(process_file(f))

    all_leads.sort(key=lambda x: x["score"], reverse=True)

    out_path = scored_dir / f"scored_{date.today()}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_leads, f, indent=2)

    grades = {"A": 0, "B": 0, "C": 0}
    for lead in all_leads:
        grades[lead["grade"]] += 1

    print(f"\nScored {len(all_leads)} leads -> {out_path.name}")
    print(f"  Grade A: {grades['A']}")
    print(f"  Grade B: {grades['B']}")
    print(f"  Grade C: {grades['C']}")


if __name__ == "__main__":
    main()
