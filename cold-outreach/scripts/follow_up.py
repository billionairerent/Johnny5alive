"""
follow_up.py — Send follow-up emails on a timed sequence.

Sequence (days after initial send, randomised within range):
  Step 1: Day 3-5   — new angle, short question
  Step 2: Day 7-11  — social proof angle
  Step 3: Day 14-18 — ROI angle
  Step 4: Day 21-26 — break-up email

Usage:
    python follow_up.py
    python follow_up.py --dry-run
    python follow_up.py --yes
"""

import json
import os
import random
import smtplib
import sys
import time
import argparse
from datetime import date, datetime, timedelta
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

GMAIL_USER     = os.environ.get("GMAIL_USER", "")
GMAIL_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

SERVICE = "your service"  # <- edit to match your business

SEQUENCE = [
    {
        "step": 1,
        "day_min": 3,
        "day_max": 5,
        "subject_prefix": "Re: ",
        "body": (
            "Hey {first_name},\n\n"
            "Just circling back on my last email. I know timing is everything.\n\n"
            "Quick question — is {service} something on your radar for this year?\n\n"
            "{sender_name}"
        ),
    },
    {
        "step": 2,
        "day_min": 7,
        "day_max": 11,
        "subject_prefix": "Re: ",
        "body": (
            "Hey {first_name},\n\n"
            "We just wrapped a project for a {industry} company similar to yours. "
            "They saw results within the first 30 days.\n\n"
            "Happy to share details if it's relevant — just let me know.\n\n"
            "{sender_name}"
        ),
    },
    {
        "step": 3,
        "day_min": 14,
        "day_max": 18,
        "subject_prefix": "Re: ",
        "body": (
            "Hey {first_name},\n\n"
            "Last thought on this: most businesses in {industry} spend more on the problem "
            "{service} solves than on the solution itself.\n\n"
            "Worth 10 minutes to see if the math works for you?\n\n"
            "{sender_name}"
        ),
    },
    {
        "step": 4,
        "day_min": 21,
        "day_max": 26,
        "subject_prefix": "Re: ",
        "body": (
            "Hey {first_name},\n\n"
            "I'll stop reaching out after this — I don't want to be noise in your inbox.\n\n"
            "If the timing ever changes and {service} becomes relevant, you know where to find me.\n\n"
            "Wishing {company_name} continued success.\n\n"
            "{sender_name}"
        ),
    },
]

SENDER_NAME = "Your Name"


def load_latest_scored(scored_dir: Path) -> tuple[Path, list[dict]]:
    files = sorted(scored_dir.glob("scored_*.json"), reverse=True)
    if not files:
        raise FileNotFoundError("No scored JSON. Run score_leads.py first.")
    p = files[0]
    return p, json.loads(p.read_text(encoding="utf-8"))


def load_bounce_list(logs_dir: Path) -> set[str]:
    bounce_file = logs_dir / "bounces.json"
    if not bounce_file.exists():
        return set()
    return set(json.loads(bounce_file.read_text()))


def load_replies(logs_dir: Path) -> set[str]:
    """Return emails that have any reply logged."""
    replied = set()
    for f in logs_dir.glob("replies_*.json"):
        for entry in json.loads(f.read_text()):
            if entry.get("from_email"):
                replied.add(entry["from_email"].lower())
    return replied


def days_since_sent(lead: dict) -> int | None:
    sent_date_str = lead.get("sent_date")
    if not sent_date_str:
        return None
    try:
        sent = datetime.fromisoformat(sent_date_str).date()
        return (date.today() - sent).days
    except ValueError:
        return None


def get_due_step(lead: dict) -> dict | None:
    """Return the next sequence step if it's due, else None."""
    if not lead.get("email_sent"):
        return None
    days = days_since_sent(lead)
    if days is None:
        return None
    current_step = lead.get("follow_up_step", 0)
    if current_step >= len(SEQUENCE):
        return None
    step = SEQUENCE[current_step]
    if days >= step["day_min"]:
        return step
    return None


def first_name(lead: dict) -> str:
    contact = lead.get("contact_name") or lead.get("company_name") or "there"
    return contact.split()[0]


def build_followup(lead: dict, step: dict, original_subject: str) -> tuple[str, str]:
    subject = step["subject_prefix"] + original_subject
    body = step["body"].format(
        first_name=first_name(lead),
        company_name=lead.get("company_name", ""),
        industry=lead.get("industry", ""),
        service=SERVICE,
        sender_name=SENDER_NAME,
    )
    return subject, body


def send_email(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body, "plain", "utf-8")
    msg["From"]    = GMAIL_USER
    msg["To"]      = to
    msg["Subject"] = subject
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.sendmail(GMAIL_USER, to, msg.as_string())


def original_subject_for(lead: dict, drafts_dir: Path) -> str:
    import re
    safe = re.sub(r"[^\w]+", "_", lead.get("company_name", "unknown"))
    draft = drafts_dir / f"{safe}.txt"
    if draft.exists():
        for line in draft.read_text().splitlines():
            if line.startswith("Subject:"):
                return line[8:].strip()
    return "our conversation"


def main():
    parser = argparse.ArgumentParser(description="Send follow-up emails")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--yes",     action="store_true")
    args = parser.parse_args()

    base       = Path(__file__).parent.parent
    scored_dir = base / "data" / "scored"
    drafts_dir = base / "drafts"
    logs_dir   = base / "logs"
    logs_dir.mkdir(exist_ok=True)

    scored_path, leads = load_latest_scored(scored_dir)
    bounces  = load_bounce_list(logs_dir)
    replied  = load_replies(logs_dir)

    queue = []
    for i, lead in enumerate(leads):
        email = lead.get("email", "").lower()
        if not email:
            continue
        if email in bounces or email in replied:
            continue
        step = get_due_step(lead)
        if step:
            queue.append((i, lead, step))

    if not queue:
        print("No follow-ups due today.")
        return

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Follow-ups due: {len(queue)}\n")
    for _, lead, step in queue:
        print(f"  {lead.get('company_name')} — Step {step['step']} — {lead.get('email')}")

    if not args.dry_run and not args.yes:
        if input(f"\nSend {len(queue)} follow-ups? [y/N] ").strip().lower() != "y":
            print("Aborted.")
            return

    if args.dry_run:
        print("[DRY RUN] No emails sent.")
        return

    log = []
    for idx, lead, step in queue:
        orig_subject = original_subject_for(lead, drafts_dir)
        subject, body = build_followup(lead, step, orig_subject)
        try:
            send_email(lead["email"], subject, body)
            leads[idx]["follow_up_step"] = step["step"]
            log.append({"to": lead["email"], "step": step["step"], "status": "sent", "date": str(date.today())})
            print(f"  Sent step {step['step']} -> {lead['email']}")
        except Exception as e:
            print(f"  FAILED -> {lead['email']}: {e}")
            log.append({"to": lead["email"], "step": step["step"], "status": "failed", "error": str(e), "date": str(date.today())})
        time.sleep(random.uniform(2, 5))

    log_path = logs_dir / f"followup_log_{date.today()}.json"
    existing = json.loads(log_path.read_text()) if log_path.exists() else []
    log_path.write_text(json.dumps(existing + log, indent=2))
    scored_path.write_text(json.dumps(leads, indent=2))
    print(f"\nDone. Log: {log_path.name}")


if __name__ == "__main__":
    main()
