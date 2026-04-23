# Creative Finance Deal Desk OS — Capabilities Report

## What This System Does

Deal Desk OS is a qualification and routing engine for creative-finance real
estate operations. It takes raw, messy lead data from any source — web forms,
SMS replies, cold-call notes, manual entry — and turns it into scored,
classified, follow-up-ready records with compliance guardrails baked in.

It is not a CRM, not a dialer, not a lender. It is the brain that sits
between lead capture and deal closing.

---

## Problems This Solves

### 1. Leads fall through the cracks

**Before**: A seller texts back "yeah I'd sell for 200k, mortgage is about
120, just want it done this month" and it sits in someone's inbox for three
days. By the time an agent follows up, the seller already talked to a
wholesaler.

**After**: That text hits the seller webhook, gets normalized, scored a 9
(Hot), and generates a follow-up task due within 60 minutes. The agent gets
an alert. The system writes a ready-to-send script:

> "Hi Jane, following up on the property at 123 Main St. Quick question —
> is the place occupied right now or vacant? Happy to work around your
> timeline."

**Example workflow output:**
```json
{
  "success": true,
  "workflow": "intakeSellerWorkflow",
  "leadId": "seller_m2x9k4",
  "status": "Hot",
  "score": 9,
  "followupCreated": true,
  "escalation": "NONE"
}
```

---

### 2. Agents don't know what to ask next

**Before**: A new agent gets a lead that says "looking in Austin, have some
money saved, need to move soon." They freeze. What's the next question?
How hard do they push? What shouldn't they say?

**After**: The scoring engine identifies exactly what's missing — down
payment amount, budget range, monthly income — and generates the single
best next question:

> "Roughly how much do you have available for a down payment?"

It also flags what NOT to say: no promises of financing, no "pre-approved"
language, no legal advice. The agent sounds natural and compliant without
memorizing a script book.

---

### 3. Messy data from 12 different sources

**Before**: One form sends `property_address`, another sends `address`,
a third sends `property`. Airtable has `asking_price`, the webhook sends
`price`. Someone types `dp` for down payment. Nothing lines up.

**After**: The normalization engine handles 30+ field-name variations
automatically:

| Incoming field | Normalized to |
|----------------|---------------|
| `address`, `property`, `property_address` | `propertyAddress` |
| `price`, `ask`, `asking_price` | `askingPrice` |
| `dp`, `down`, `down_payment` | `downPayment` |
| `income`, `monthly_income`, `income_range` | `monthlyIncome` |
| `full_name`, `fullname` | `name` |
| `note`, `comments` | `notes` |

Every lead enters the system in the same shape regardless of source.

---

### 4. No one knows which leads are actually worth working

**Before**: An agent has 47 leads. Some are motivated sellers with equity.
Some are tire-kickers who filled out a form at 2 AM. They all look the same
in the spreadsheet.

**After**: Every lead gets a 0-10 score based on weighted factors:

**Seller scoring:**
- Timeline urgency (0-3 pts) — "ASAP" = 3, "maybe next year" = 0
- Flexibility on terms (0-3 pts) — "open to creative terms" = 3, "cash only" = 0
- Data completeness (0-2 pts) — asking price + mortgage balance known
- Occupancy signal (0-2 pts) — vacant property adds bonus points

**Buyer scoring:**
- Down payment strength (0-3 pts) — 15%+ of budget = 3, nothing = risk flag
- Timeline urgency (0-2 pts)
- Income stability (0-2 pts) — $6k+/mo = 2
- Data completeness (0-2 pts) — target area + budget present

**Status mapping:**

| Score | Status | Follow-up window |
|-------|--------|-----------------|
| 9-10 | Hot | Within 1 hour |
| 7-8 | Warm | Within 24 hours |
| 4-6 | Developing | Within 3 days |
| 1-3 | Cold | Long-cycle |
| 0 | Dead | Archive |

Agents work hot leads first. Cold leads get a low-pressure drip. Nothing
gets ignored.

---

### 5. Compliance exposure

**Before**: An agent tells a buyer "don't worry, we'll get you approved."
Another agent tries to help a seller "work around" a due-on-sale clause.
Nobody catches it until there's a problem.

**After**: The risk engine scans every lead for 9 compliance patterns and
flags them automatically:

| Pattern detected | Flag | Action |
|-----------------|------|--------|
| Foreclosure, bankruptcy | Legal complication | ESCALATE TO PROFESSIONAL |
| Due-on-sale clause discussion | Lending compliance | ESCALATE TO PROFESSIONAL |
| Title dispute, lien concern | Title complication | ESCALATE TO PROFESSIONAL |
| Probate, inheritance | Ownership clarity | ESCALATE TO PROFESSIONAL |
| "Hide" or "conceal" language | Deception risk | ESCALATE TO PROFESSIONAL |
| "Guaranteed" or "pre-approved" | Promised approval | REVIEW |
| Note creation, Dodd-Frank | Regulatory | ESCALATE TO PROFESSIONAL |

The system never gives legal advice. It never promises financing. It never
drafts contracts. When anything touches compliance territory, it marks it
clearly and stops.

---

### 6. Seller-buyer matching is manual guesswork

**Before**: A closer has 15 sellers and 20 buyers in a spreadsheet. Matching
is "I think this one in Austin might work with that buyer who wants Austin."
Opportunities slip because nobody runs the combinations.

**After**: The match engine scores every seller-buyer pair on 5 dimensions:

| Factor | Weight | How it works |
|--------|--------|-------------|
| Geography overlap | 0-3 | Buyer's target area terms found in seller's address |
| Price alignment | 0-3 | Budget vs. asking price: within 10% = 3, within 20% = 2 |
| Timeline alignment | 0-2 | Both urgent = 2 |
| Seller flexibility | 0-2 | Open to creative terms = 2 |
| Buyer down payment | 0-1 | Has real money = 1 |

**Example: Strong match (fit score 9/10)**

Seller: 100 Main St, Austin TX — asking $250k, mortgage $120k, vacant,
wants to sell in 30 days, open to flexible terms.

Buyer: Looking in Austin TX — budget $260k, $40k down, income $8k/mo,
wants to move in 30 days.

```
Geography overlap      ✓  +3  (Austin matches)
Price within 10%       ✓  +3  ($260k vs $250k)
Timelines aligned      ✓  +2  (both 30 days)
Seller flexible        ✓  +2
Buyer has down payment ✓  +1
─────────────────────────────
Fit score: 11 → capped at 10  Status: Strong
```

When the fit score hits 7+, the system automatically generates a closer
packet.

---

### 7. Closers get incomplete or scattered information

**Before**: A closer gets a text that says "I think this seller and buyer
might work together, here's the seller's number." They spend 45 minutes
hunting for the actual data.

**After**: The system generates a complete closer-ready packet in markdown:

```
# Closer Packet — packet_m3f7x9

## Property Snapshot
100 Main St, Austin TX (vacant)

## Seller Snapshot
Jane Seller — 555-1000 | Asking $250,000 | Mortgage $120,000
Payment $1,400 | Timeline: 30 days | Flex terms: yes

## Buyer Snapshot
John Buyer — 555-2000 | Target Austin TX | Budget $260,000
Down $40,000 | Income $8,000 | Timeline: 30 days

## Known Numbers
- askingPrice: 250000
- mortgageBalance: 120000
- monthlyPayment: 1400
- buyerBudget: 260000
- buyerDownPayment: 40000
- buyerMonthlyIncome: 8000

## Missing Numbers
- (none — both leads fully qualified)

## Opportunity Summary
Seller and buyer appear aligned on area and timeline.
Numbers need closer review before terms discussion.

## Risk Flags
- (none)

## Recommended Next Move
Hand to closer for fit confirmation and structure discussion.
```

Everything the closer needs is on one page. No chasing data. No guessing
what's missing.

---

### 8. Follow-up is inconsistent or nonexistent

**Before**: Agent A follows up on Day 1, then forgets until Day 12. Agent B
never follows up at all. Hot leads go cold because nobody's tracking the
cadence.

**After**: Every lead gets a structured follow-up cadence based on its
score:

**Hot leads (score 9-10):**
- Within 60 minutes: first live contact attempt
- Within 24 hours: follow-up via second channel
- Within 48 hours: handoff to closer if responsive

**Standard leads:**
- Day 1: thank-you + confirm next step
- Day 3: helpful check-in + single clarifying question
- Day 7: soft re-engage + alternative path
- Day 14: low-pressure status check
- Day 30: long-cycle touch

The daily follow-up workflow scans for due tasks, resolves the contact's
phone/email, dispatches via SMS or email, and advances the next touch
automatically.

```json
{
  "success": true,
  "workflow": "dailyFollowupWorkflow",
  "processed": 23,
  "sent": 21,
  "failed": 2,
  "errors": ["No contact for lead buyer_old123", "..."]
}
```

---

## What You Can Build On Top Of This

The engine is the backend brain. Once it's stable, you can layer on:

- **Lovable or Retool front end** — agent dashboard showing hot leads,
  due follow-ups, and match candidates
- **Airtable interfaces** — live views for agents, closers, and admins
  powered by the same data the engine writes
- **Investor portal** — closer packets rendered as web pages for investor
  review
- **Reporting dashboard** — conversion rates, lead-to-close timelines,
  agent performance, follow-up compliance
- **Multi-channel automation** — connect real Twilio + Gmail to auto-send
  follow-ups instead of queuing them
- **Round-robin assignment** — route new leads to available agents
  automatically
- **Hot-lead Slack/SMS alerts** — push notifications when a 9 or 10
  comes in

---

## Architecture at a Glance

```
     WEBHOOK IN
         │
    ┌────▼────┐
    │Normalize │  30+ field-name mappings
    └────┬────┘
    ┌────▼────┐
    │Validate  │  JSON Schema (AJV)
    └────┬────┘
    ┌────▼────┐
    │Classify  │  LLM-first, heuristic fallback
    │& Score   │  0-10 weighted scoring
    └────┬────┘
    ┌────▼────┐
    │Persist   │  Airtable (pluggable transport)
    └────┬────┘
    ┌────▼────┐
    │Schedule  │  Follow-up task with cadence
    │Follow-up │
    └────┬────┘
         │
    ┌────▼────┐
    │Match     │  Geography + price + timeline + flexibility
    └────┬────┘
    ┌────▼────┐
    │Package   │  Closer-ready markdown packet
    └────┬────┘
    ┌────▼────┐
    │Escalate  │  9 compliance patterns → ESCALATE TO PROFESSIONAL
    └─────────┘
```

Every workflow returns a predictable JSON envelope. Every adapter is
pluggable. The system works end-to-end right now with heuristic scoring
(no API key needed), and upgrades to LLM-powered classification with a
single function call.

---

## Bottom Line

This system turns a chaotic lead pipeline into a predictable qualification
machine. Leads get scored in seconds, not days. Follow-up happens on
schedule, not when someone remembers. Compliance boundaries are enforced
automatically, not by hope. And when a deal is ready, the closer gets a
complete packet instead of a phone number on a sticky note.
