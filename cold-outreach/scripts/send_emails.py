"""
send_emails.py — Send drafted cold emails via Gmail SMTP.

Usage:
    python send_emails.py                  # send up to 15 emails (with confirmation)
    python send_emails.py --limit 20       # send up to 20
    python send_emails.py --dry-run        # preview without sending
    python send_emails.py --limit 15 --yes # send without confirmation (for cron)

Requires:
    GMAIL_USER and GMAIL_APP_PASSWORD in .env
"""

import json
import os
import random
import re
import smtplib
import sys
import time
import argparse
from datetime import date
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

GMAIL_USER     = os.environ.get("GMAIL_USER", "")
GMAIL_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465

DEFAULT_LIMIT = 15


def load_latest_scored(scored_dir: Path) -> tuple[Path, list[dict]]:
    files = sorted(scored_dir.glob("scored_*.json"), reverse=True)
    if not files:
        raise FileNotFoundError("No scored JSON found. Run score_leads.py first.")
    p = files[0]
    return p, json.loads(p.read_text(encoding="utf-8"))


def load_send_logs(logs_dir: Path) -> set[str]:
    """Return set of all emails already recorded in send logs."""
    sent = set()
    for log_file in logs_dir.glob("send_log_*.json"):
        entries = json.loads(log_file.read_text(encoding="utf-8"))
        for entry in entries:
            if entry.get("to"):
                sent.add(entry["to"].lower())
    return sent


def parse_draft(draft_path: Path) -> dict | None:
    """Parse a draft file into {to, subject, body}."""
    text = draft_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    to = subject = None
    body_lines = []
    in_body = False
    for line in lines:
        if not in_body:
            if line.startswith("To:"):
                to = line[3:].strip()
            elif line.startswith("Subject:"):
                subject = line[8:].strip()
            elif to and subject and line.strip() == "":
                in_body = True
        else:
            body_lines.append(line)
    if not to or not subject:
        return None
    return {"to": to, "subject": subject, "body": "\n".join(body_lines).strip()}


def already_sent(lead: dict, logged_emails: set[str]) -> bool:
    if lead.get("email_sent"):
        return True
    if lead.get("response_status"):
        return True
    if lead.get("email", "").lower() in logged_emails:
        return True
    return False


def send_email(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body, "plain", "utf-8")
    msg["From"]    = GMAIL_USER
    msg["To"]      = to
    msg["Subject"] = subject
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.sendmail(GMAIL_USER, to, msg.as_string())


def main():
    parser = argparse.ArgumentParser(description="Send drafted cold emails via Gmail")
    parser.add_argument("--limit",   type=int, default=DEFAULT_LIMIT, help="Max emails to send per run")
    parser.add_argument("--dry-run", action="store_true", help="Preview without actually sending")
    parser.add_argument("--yes",     action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()

    base       = Path(__file__).parent.parent
    scored_dir = base / "data" / "scored"
    drafts_dir = base / "drafts"
    logs_dir   = base / "logs"
    logs_dir.mkdir(exist_ok=True)

    scored_path, leads = load_latest_scored(scored_dir)
    logged_emails = load_send_logs(logs_dir)

    # Build lookup: email -> lead index
    email_to_idx = {l.get("email", "").lower(): i for i, l in enumerate(leads)}

    # Collect sendable drafts
    queue = []
    for draft_path in sorted(drafts_dir.glob("*.txt")):
        parsed = parse_draft(draft_path)
        if not parsed or not parsed["to"]:
            continue
        idx = email_to_idx.get(parsed["to"].lower())
        if idx is not None and already_sent(leads[idx], logged_emails):
            continue
        queue.append((draft_path, parsed, idx))

    queue = queue[: args.limit]

    if not queue:
        print("No emails to send.")
        return

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Ready to send {len(queue)} email(s):\n")
    for _, parsed, _ in queue:
        print(f"  To: {parsed['to']}")
        print(f"  Subject: {parsed['subject']}")
        print()

    if not args.dry_run and not args.yes:
        confirm = input(f"Send {len(queue)} emails? [y/N] ").strip().lower()
        if confirm != "y":
            print("Aborted.")
            return

    if args.dry_run:
        print("[DRY RUN] No emails sent.")
        return

    send_log = []
    sent_count = 0

    for draft_path, parsed, idx in queue:
        try:
            send_email(parsed["to"], parsed["subject"], parsed["body"])
            entry = {"to": parsed["to"], "subject": parsed["subject"], "status": "sent", "timestamp": str(date.today())}
            send_log.append(entry)
            if idx is not None:
                leads[idx]["email_sent"] = True
            sent_count += 1
            print(f"  Sent -> {parsed['to']}")
        except Exception as e:
            print(f"  FAILED -> {parsed['to']}: {e}")
            send_log.append({"to": parsed["to"], "status": "failed", "error": str(e), "timestamp": str(date.today())})

        delay = random.uniform(2, 5)
        time.sleep(delay)

    log_path = logs_dir / f"send_log_{date.today()}.json"
    existing = json.loads(log_path.read_text()) if log_path.exists() else []
    log_path.write_text(json.dumps(existing + send_log, indent=2), encoding="utf-8")
    scored_path.write_text(json.dumps(leads, indent=2), encoding="utf-8")

    print(f"\nSent: {sent_count} / {len(queue)}  |  Log: {log_path.name}")


if __name__ == "__main__":
    main()
