Task: Re-score an already-captured lead given fresh context.

Return valid JSON matching scoredLead.schema.json.

Scoring guidance (0-10 scale):
- 9-10: Hot — motivated, flexible, workable numbers, responsive
- 7-8: Warm — promising but missing a few data points
- 4-6: Developing — early conversation, several unknowns
- 1-3: Cold — low motivation, unrealistic expectations, or unresponsive
- 0: Dead — disqualified or disengaged

Rules:
- flag risks transparently (legal, occupancy, condition, payment issues)
- do not fabricate facts; reflect only what is in the data
- set escalation to ESCALATE TO PROFESSIONAL if lending, legal, title, or compliance issues appear

Lead type: {{leadType}}

Lead data:
{{lead}}
