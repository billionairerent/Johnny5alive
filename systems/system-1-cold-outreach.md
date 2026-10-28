# System 1 - The Cold Outreach Engine

Find businesses -> score them -> write personalized emails -> send them automatically.

## Intro

Brycen says he built this cold outreach system by talking to Claude Code, without a developer, agency, or monthly software stack.

## What You'll Build

By the end, you'll have a system that:

1. Finds local businesses in your area that might need your service
2. Scores each one on a 0-100 scale based on how likely they are to buy
3. Writes a personalized email to each business by reading its website
4. Sends emails automatically every morning
5. Follows up on a timed sequence
6. Detects replies and shows who responded

## Flow

Find Leads -> Score Them -> Write Emails -> Send Automatically -> Follow Up -> Detect Replies

## Prerequisites

- Claude Code installed on your computer
- A Gmail account for your business with an App Password
- A lead list in CSV format
- An Anthropic API key

## Cost

- About $5-$10 to draft 1,000+ emails via Anthropic API
- Gmail is free
- Claude Code subscription referenced as $20/month

---

## Step 1 - Set Up Your Project

Paste this into Claude Code:

```text
I'm building a cold outreach system for my business. Here's what I do:
Business: [YOUR BUSINESS NAME]
What I sell: [YOUR SERVICE - e.g., "commercial vehicle wraps", "HVAC installation", "landscaping services"]
Location: [YOUR CITY, STATE]
Service area: [CITIES/COUNTIES YOU SERVE]
My ideal customers are:
- [INDUSTRY 1 - e.g., "roofing companies"]
- [INDUSTRY 2 - e.g., "plumbing companies"]
- [INDUSTRY 3 - e.g., "HVAC companies"]
I have a CSV file of local businesses with columns for: company name, email, phone, city, state, website, industry, reviews count, and reviews rating.
Create a project folder structure for this cold outreach system. I need:
- A folder for my raw lead data (CSV files)
- A folder for scored/processed leads (JSON)
- A folder for email drafts
- A folder for send logs
- A main scripts folder
Set this up and create a CLAUDE.md file that explains the project so future sessions have context.
```

---

## Step 2 - Build the Lead Scoring Engine

Paste this into Claude Code:

```text
Build me a lead scoring script in Python. Here's how I want it to work:

Read all CSV files from my raw leads folder. For each business, score them on a 100-point scale using these categories:

INDUSTRY FIT (20 points max):
- [YOUR TOP INDUSTRIES] = 20 points (best fit for my service)
- [YOUR SECOND TIER INDUSTRIES] = 14 points
- [YOUR LOWER PRIORITY INDUSTRIES] = 8 points

GEOGRAPHY (15 points max):
- [YOUR PRIMARY CITY/COUNTY] = 15 points
- [YOUR SECONDARY AREA] = 13 points
- [BROADER REGION] = 8 points
- Out of area = 2 points

BUSINESS SIZE SIGNALS (30 points max):
- Look for keywords in company name that suggest size (fleet, services, systems, enterprises, group = likely bigger)
- Multiple locations = more points
- High review count = established business = more points
- Has "Inc", "LLC", "Corp" in name = more points

DIGITAL PRESENCE (10 points max):
- Has a website = points
- Has reviews = points
- High review rating (4.0+) = points

After scoring, assign grades:
- 55-100 = Grade A (top priority)
- 35-54 = Grade B (solid leads)
- 0-34 = Grade C (lower priority)

Save the output as a dated JSON file with all the original info plus the score breakdown.
Disqualify any lead that has no email AND no phone number.
Sort the output by score, highest first. Print a summary at the end showing how many A's, B's, and C's.
```

### Note
Customize the categories, cities, industries, and weights to fit your business.

---

## Step 3 - Write Personalized Emails with AI

Paste this into Claude Code:

```text
Build me an email drafting script that uses the Claude API to write personalized cold emails. Here's how it should work:
1. Load the scored leads JSON file
2. For each lead that hasn't been drafted yet:
   a. Fetch their website URL and grab the visible text (strip all HTML, keep just the content)
   b. Send that website text to the Claude API along with this prompt:

"You are writing a short cold email for [YOUR BUSINESS NAME]. We sell [YOUR SERVICE]. Write a personalized email to this company based on their website content.

Rules:
- Subject line: under 9 words, reference something specific about their business
- Body: 60-80 words max. Short and direct.
- Open by referencing something specific from their website (tagline, service area, specialty)
- Explain in one sentence why [YOUR SERVICE] would help them specifically
- Close with a low-pressure question (not \"schedule a call\" - something like \"worth a quick chat?\")
- Sound like a real person, not a salesperson
- No spam words (free, guarantee, act now, limited time)
- No AI-sounding phrases (leverage, utilize, streamline, elevate, delighted)
- Sign off with your name, company, phone, website

Company: {company_name}
Industry: {industry}
City: {city}
Website content: {website_text}"

3. Save each email as its own file in the drafts folder
4. If the website fetch fails, fall back to a simpler industry-specific template
5. Add a 1.5 second delay between API calls to avoid rate limits
6. Skip any lead that already has a draft

The Anthropic API key is in my .env file as ANTHROPIC_API_KEY.
```

---

## Step 4 - Set Up Auto-Sending

Paste this into Claude Code:

```text
Build me an email sending script. Here's how it works:
1. Read the draft email files from my drafts folder
2. Parse out the To address, Subject line, and Body from each file
3. Cross-reference with the scored leads JSON to skip any that are already sent
4. Send via Gmail SMTP (SSL on port 465) using credentials from my .env file:
   GMAIL_USER=your@email.com
   GMAIL_APP_PASSWORD=your_app_password
5. Send plain text only (no HTML) so it lands in the main inbox, not Promotions
6. Add a random 2-5 second delay between sends to look human
7. After each successful send, mark that lead as "email_sent" in the scored JSON
8. Log every send to a dated JSON file (send_log_YYYY-MM-DD.json)
9. Support these flags:
   --limit 15 (send max 15 per run, default)
   --dry-run (preview what would be sent without actually sending)
   --yes (skip confirmation prompt, for automation)

Important: Never send to the same person twice. Three-layer check:
- Check the email_sent flag in scored JSON
- Check the response_status field
- Check the send log files
```

### Cron Job Prompt

```text
Set up a cron job that runs my send_emails.py script every morning at 8 AM. Use the --limit 15 and --yes flags so it sends 15 emails automatically without needing my confirmation. Log the output to a file so I can check it later.
Also make sure my computer doesn't go to sleep so the cron job actually fires. Show me how to set that up.
```

---

## Step 5 - Add Follow-Up Sequences

Paste this into Claude Code:

```text
Build me a follow-up email script. Here's the sequence:
After the initial cold email, if no reply is detected:
- Day 3-5: Follow-up #1 - new angle, short question
- Day 7-11: Follow-up #2 - social proof angle ("we just worked with a company like yours")
- Day 14-18: Follow-up #3 - ROI angle (cost vs. benefit of your service)
- Day 21-26: Follow-up #4 - break-up email ("closing your file, but leaving the door open")

Rules:
- Use "Re:" in the subject line so it threads with the original email
- Only one follow-up per lead per day
- Skip anyone who has replied (check the replies log)
- Skip bounced emails
- Each follow-up should reference [YOUR SERVICE] and be under 60 words
- Track which follow-up step each lead is on in a follow-up log JSON file
- Support --dry-run flag to preview without sending

Add this to my daily cron job so follow-ups go out automatically after the new cold emails.
```

---

## Step 6 - Detect Replies

Paste this into Claude Code:

```text
Build me a reply detection script. It should:
1. Connect to my Gmail inbox (using Gmail API or IMAP)
2. Search for replies to emails I've sent (match against my send log)
3. Classify each reply:
   - POSITIVE: contains words like "interested", "tell me more", "how much", "quote", "schedule"
   - NEGATIVE: contains words like "not interested", "remove me", "unsubscribe", "stop"
   - BOUNCE: from mailer-daemon or postmaster
4. Log every reply to a dated JSON file with the classification
5. For positive replies, flag the lead for immediate follow-up
6. For bounces, add the email to a bounce list so we never email them again
7. Print a summary showing new positive/negative/bounce replies

Add this to my daily cron so it runs before the follow-up script. That way bounced leads get skipped before follow-ups go out.
```

---

## Results

- 1,213 businesses scored in one run
- 1,213 personalized emails drafted
- About $8 in API calls for drafting
- 15 emails sent per day automatically
- 4-email follow-up sequence running on autopilot
- Total build time: about a week
- Coding experience required: zero

## Tips

1. Build one script at a time
2. Keep emails short: 60-80 words max
3. Use plain text only
4. Keep sends to about 15 emails per day max
5. Follow-ups often matter more than the first email
6. Use a separate Gmail for outreach
7. Review drafts with `--dry-run` before trusting automation
