"""
draft_emails.py — Write personalized cold emails using the Claude API.

Usage:
    python draft_emails.py                     # draft all un-drafted A/B leads
    python draft_emails.py --grade A           # only Grade A leads
    python draft_emails.py --limit 50          # cap at 50 drafts per run
    python draft_emails.py --scored my.json    # use a specific scored file

Requires:
    pip install anthropic requests beautifulsoup4
    ANTHROPIC_API_KEY in .env
"""

import json
import os
import re
import time
import argparse
from datetime import date
from pathlib import Path

import anthropic
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ---------------------------------------------------------------------------
# CONFIGURATION — edit to match your business
# ---------------------------------------------------------------------------

BUSINESS_NAME  = "ByteVision Reelworks"
SERVICE        = "cinematic short-form video production — reels, commercials, and campaign content"
SENDER_NAME    = "Jabari Okoro"
SENDER_PHONE   = "901-546-1899"
SENDER_WEBSITE = "bytevisionreelworks.com"

EMAIL_PROMPT = """You are writing a short cold email for {business_name}. We sell {service}.
Write a personalized email to this company based on their website content.

Rules:
- Subject line: under 9 words, reference something specific about their business
- Body: 60-80 words max. Short and direct.
- Open by referencing something specific from their website (tagline, service area, specialty)
- Explain in one sentence why {service} would help them specifically
- Close with a low-pressure question (not "schedule a call" — something like "worth a quick chat?")
- Sound like a real person, not a salesperson
- No spam words (free, guarantee, act now, limited time)
- No AI-sounding phrases (leverage, utilize, streamline, elevate, delighted)
- Sign off: {sender_name} / {business_name} / {sender_phone} / {sender_website}

Output format — exactly two labeled sections:
Subject: <subject line here>
Body:
<body here>

Company: {company_name}
Industry: {industry}
City: {city}
Website content:
{website_text}"""

FALLBACK_SUBJECT = "Quick question about {company_name}"
FALLBACK_BODY = """Hi,

I came across {company_name} and noticed you're in the {industry} space in {city}.

We help businesses like yours with {service} — typically saves time and adds a polished, professional look.

Worth a quick chat?

{sender_name}
{business_name}
{sender_phone}
{sender_website}"""

# ---------------------------------------------------------------------------

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def fetch_website_text(url: str, timeout: int = 10) -> str:
    if not url or not url.strip():
        return ""
    if not url.startswith("http"):
        url = "https://" + url
    try:
        resp = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "noscript"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        # Truncate to ~2000 chars to stay within token budget
        return text[:2000]
    except Exception:
        return ""


def draft_with_claude(lead: dict) -> tuple[str, str]:
    """Returns (subject, body). Raises on API error."""
    website_text = fetch_website_text(lead.get("website", ""))
    prompt = EMAIL_PROMPT.format(
        business_name=BUSINESS_NAME,
        service=SERVICE,
        sender_name=SENDER_NAME,
        sender_phone=SENDER_PHONE,
        sender_website=SENDER_WEBSITE,
        company_name=lead.get("company_name", ""),
        industry=lead.get("industry", ""),
        city=lead.get("city", ""),
        website_text=website_text or "(no website content available)",
    )
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()

    subject_match = re.search(r"Subject:\s*(.+)", text)
    body_match    = re.search(r"Body:\s*(.+)", text, re.DOTALL)

    subject = subject_match.group(1).strip() if subject_match else FALLBACK_SUBJECT.format(**lead)
    body    = body_match.group(1).strip()    if body_match    else text

    return subject, body


def fallback_draft(lead: dict) -> tuple[str, str]:
    subject = FALLBACK_SUBJECT.format(**lead)
    body = FALLBACK_BODY.format(
        business_name=BUSINESS_NAME,
        service=SERVICE,
        sender_name=SENDER_NAME,
        sender_phone=SENDER_PHONE,
        sender_website=SENDER_WEBSITE,
        **lead,
    )
    return subject, body


def draft_file_path(drafts_dir: Path, lead: dict) -> Path:
    safe_name = re.sub(r"[^\w]+", "_", lead.get("company_name", "unknown"))
    return drafts_dir / f"{safe_name}.txt"


def write_draft(path: Path, lead: dict, subject: str, body: str) -> None:
    content = (
        f"To: {lead.get('email', '')}\n"
        f"Subject: {subject}\n"
        f"\n"
        f"{body}\n"
    )
    path.write_text(content, encoding="utf-8")


def load_scored(scored_dir: Path, specific: str | None) -> tuple[Path, list[dict]]:
    if specific:
        p = Path(specific)
    else:
        files = sorted(scored_dir.glob("scored_*.json"), reverse=True)
        if not files:
            raise FileNotFoundError("No scored JSON found. Run score_leads.py first.")
        p = files[0]
    return p, json.loads(p.read_text(encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser(description="Draft personalized cold emails via Claude API")
    parser.add_argument("--grade",   default=None,  help="Only draft leads of this grade (A/B/C)")
    parser.add_argument("--limit",   type=int, default=0, help="Max drafts per run (0 = unlimited)")
    parser.add_argument("--scored",  default=None,  help="Path to a specific scored JSON file")
    args = parser.parse_args()

    base       = Path(__file__).parent.parent
    scored_dir = base / "data" / "scored"
    drafts_dir = base / "drafts"
    drafts_dir.mkdir(exist_ok=True)

    scored_path, leads = load_scored(scored_dir, args.scored)
    print(f"Loaded {len(leads)} leads from {scored_path.name}")

    drafted = skipped = errors = 0

    for lead in leads:
        if args.grade and lead.get("grade") != args.grade.upper():
            continue
        if not lead.get("email"):
            continue

        out_path = draft_file_path(drafts_dir, lead)
        if out_path.exists():
            skipped += 1
            continue

        if args.limit and drafted >= args.limit:
            break

        try:
            subject, body = draft_with_claude(lead)
            source = "claude"
        except Exception as e:
            print(f"  Claude API error for {lead.get('company_name')}: {e} — using fallback")
            subject, body = fallback_draft(lead)
            source = "fallback"
            errors += 1

        write_draft(out_path, lead, subject, body)
        drafted += 1
        print(f"  [{source}] {lead.get('company_name')} -> {out_path.name}")

        time.sleep(1.5)

    # Persist any lead-level changes back to the scored JSON (none here, but keeps pattern consistent)
    scored_path.write_text(json.dumps(leads, indent=2), encoding="utf-8")

    print(f"\nDone. Drafted: {drafted}  Skipped (existing): {skipped}  Fallbacks: {errors}")


if __name__ == "__main__":
    main()
