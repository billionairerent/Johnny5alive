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

## Sending path (updated 2026-10-28)

The GitHub Actions cron is **parked** — see the header of
`.github/workflows/daily-outreach.yml`. It ran every weekday from May to
October sending zero emails, because:

- every Yelp search returns 400, so `find_leads.py` adds nothing, and
- all 99 contacts in `logs/send_log_*.json` were emailed by 2026-05-11 and
  the emailable pool is exhausted (of 1,318 Grade-A leads only 102 ever had
  an email address; the other 1,216 are phone-only with no website).

Outreach now goes through the **Gmail connector** instead of SMTP-in-Actions,
so a send is visible and a failure cannot be swallowed by `|| true`.

Two accounts matter and they are easy to confuse:

| Account | Role | Fingerprint |
|---|---|---|
| `bytevisionreelworks@gmail.com` | the campaign sender | ~726 inbox / ~119 sent / no custom labels |
| `jabariokoro@gmail.com` | personal | ~220k inbox / ~4.4k sent / many custom labels |

Check which one is connected before concluding anything about replies. A
reply search run against the personal account returns nothing and that is
**not** evidence the campaign got no replies — it means the wrong mailbox.
`list_labels` is a cheap way to tell them apart; large `from:(a OR b OR ...)`
searches burn Gmail quota fast, so query in small batches.

### Known bug if the drafting engine is revived

`score_leads.py` grades A at >= 40. Leads without Yelp review counts top out
at industry 20 + geography + website 5, so a Memphis tier-1 lead scores
exactly 40 (A) but an **Atlanta** one scores 38 (B). The workflow's
`draft_emails.py --grade A` filter is an exact-letter match, so every Atlanta
lead is silently skipped. Drop `--grade A` to draft the top-scoring unsent
leads regardless of letter.
