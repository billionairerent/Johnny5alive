# Cold Outreach Engine

Automated cold email system: score leads, draft personalized emails via Claude API, send via Gmail, follow up, detect replies.

## Project Structure

```
cold-outreach/
├── data/
│   ├── raw/          # Input CSV files with lead data
│   └── scored/       # Scored leads as dated JSON files
├── drafts/           # One .txt file per drafted email
├── logs/             # Send logs and reply logs (dated JSON)
├── scripts/
│   ├── score_leads.py      # Score and grade leads from CSV
│   ├── draft_emails.py     # Write personalized emails via Claude API
│   ├── send_emails.py      # Send via Gmail SMTP
│   ├── follow_up.py        # Send follow-up sequence
│   └── detect_replies.py   # Check Gmail for replies, classify them
└── .env                    # API keys and Gmail credentials (never commit)
```

## CSV Format

Your raw lead CSV should have these columns:
`company_name, email, phone, city, state, website, industry, reviews_count, reviews_rating`

## Environment Variables (.env)

```
ANTHROPIC_API_KEY=sk-ant-...
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

## Daily Workflow (automated via cron)

1. `detect_replies.py` — classify inbox replies first
2. `follow_up.py` — send follow-ups to non-responders
3. `send_emails.py --limit 15 --yes` — send new cold emails

## Scoring Grades

- A (55-100): Top priority — send first
- B (35-54): Solid leads
- C (0-34): Lower priority
