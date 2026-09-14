"""
detect_replies.py — Check Gmail inbox for replies and classify them.

Classifications:
  POSITIVE — interest signals ("interested", "how much", "quote", etc.)
  NEGATIVE — opt-out signals ("not interested", "remove me", etc.)
  BOUNCE   — delivery failures (from mailer-daemon / postmaster)

Usage:
    python detect_replies.py
    python detect_replies.py --days 7    # look back 7 days (default: 3)

Requires:
    pip install imap-tools
    GMAIL_USER and GMAIL_APP_PASSWORD in .env
"""

import json
import os
import re
import argparse
from datetime import date, timedelta, datetime
from pathlib import Path

from dotenv import load_dotenv
from imap_tools import MailBox, AND, A

load_dotenv(Path(__file__).parent.parent / ".env")

GMAIL_USER     = os.environ.get("GMAIL_USER", "")
GMAIL_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")
IMAP_HOST      = os.environ.get("IMAP_HOST", "imap.gmail.com")

POSITIVE_KEYWORDS = {
    "interested", "tell me more", "how much", "quote", "schedule",
    "sounds good", "let's chat", "yes", "call me", "reach out",
    "love to", "when can", "pricing",
}
NEGATIVE_KEYWORDS = {
    "not interested", "remove me", "unsubscribe", "stop emailing",
    "don't contact", "do not contact", "please remove", "opt out",
    "no thanks", "not for us",
}
BOUNCE_SENDERS = {"mailer-daemon", "postmaster"}


def classify(msg_from: str, subject: str, body: str) -> str:
    from_lower    = msg_from.lower()
    subject_lower = subject.lower()
    body_lower    = body.lower()
    full_text     = f"{subject_lower} {body_lower}"

    if any(b in from_lower for b in BOUNCE_SENDERS):
        return "BOUNCE"
    if any(k in full_text for k in NEGATIVE_KEYWORDS):
        return "NEGATIVE"
    if any(k in full_text for k in POSITIVE_KEYWORDS):
        return "POSITIVE"
    return "NEUTRAL"


def load_sent_emails(logs_dir: Path) -> set[str]:
    sent = set()
    for log_file in logs_dir.glob("send_log_*.json"):
        for entry in json.loads(log_file.read_text()):
            if entry.get("to"):
                sent.add(entry["to"].lower())
    return sent


def load_bounces(logs_dir: Path) -> list[str]:
    p = logs_dir / "bounces.json"
    return json.loads(p.read_text()) if p.exists() else []


def save_bounces(logs_dir: Path, bounces: list[str]) -> None:
    (logs_dir / "bounces.json").write_text(json.dumps(sorted(set(bounces)), indent=2))


def update_lead_status(scored_dir: Path, email: str, classification: str) -> None:
    files = sorted(scored_dir.glob("scored_*.json"), reverse=True)
    if not files:
        return
    p = files[0]
    leads = json.loads(p.read_text())
    changed = False
    for lead in leads:
        if lead.get("email", "").lower() == email.lower():
            lead["response_status"] = classification
            changed = True
    if changed:
        p.write_text(json.dumps(leads, indent=2))


def main():
    parser = argparse.ArgumentParser(description="Detect and classify email replies")
    parser.add_argument("--days", type=int, default=3, help="How many days back to search (default: 3)")
    args = parser.parse_args()

    base       = Path(__file__).parent.parent
    logs_dir   = base / "logs"
    scored_dir = base / "data" / "scored"
    logs_dir.mkdir(exist_ok=True)

    sent_emails = load_sent_emails(logs_dir)
    if not sent_emails:
        print("No sent emails found in logs. Run send_emails.py first.")
        return

    bounces = load_bounces(logs_dir)
    since   = date.today() - timedelta(days=args.days)

    print(f"Checking inbox for replies since {since}...\n")

    results = {"POSITIVE": [], "NEGATIVE": [], "BOUNCE": [], "NEUTRAL": []}

    with MailBox(IMAP_HOST).login(GMAIL_USER, GMAIL_PASSWORD) as mailbox:
        for msg in mailbox.fetch(AND(date_gte=since), mark_seen=False):
            from_email = msg.from_values.email.lower() if msg.from_values else ""

            # Only care about replies from people we emailed
            if from_email not in sent_emails:
                # Also check if it's a bounce referencing one of our recipients
                body_text = msg.text or msg.html or ""
                if not any(e in body_text.lower() for e in sent_emails):
                    continue

            classification = classify(
                msg.from_ or "",
                msg.subject or "",
                msg.text or msg.html or "",
            )

            entry = {
                "from_email":      from_email,
                "subject":         msg.subject,
                "classification":  classification,
                "date":            str(msg.date.date()) if msg.date else str(date.today()),
            }
            results[classification].append(entry)

            if classification == "BOUNCE":
                bounces.append(from_email)
            elif classification in ("POSITIVE", "NEGATIVE"):
                update_lead_status(scored_dir, from_email, classification)

    # Write reply log
    all_replies = [e for v in results.values() for e in v]
    if all_replies:
        log_path = logs_dir / f"replies_{date.today()}.json"
        existing = json.loads(log_path.read_text()) if log_path.exists() else []
        log_path.write_text(json.dumps(existing + all_replies, indent=2))

    save_bounces(logs_dir, bounces)

    print(f"  POSITIVE : {len(results['POSITIVE'])}")
    print(f"  NEGATIVE : {len(results['NEGATIVE'])}")
    print(f"  BOUNCE   : {len(results['BOUNCE'])}")
    print(f"  NEUTRAL  : {len(results['NEUTRAL'])}")

    if results["POSITIVE"]:
        print("\nPositive replies:")
        for r in results["POSITIVE"]:
            print(f"  {r['from_email']} — {r['subject']}")


if __name__ == "__main__":
    main()
