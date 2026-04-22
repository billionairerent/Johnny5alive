Task: Classify the buyer lead.

Return valid JSON matching scoredLead.schema.json.

Rules:
- prioritize down payment, readiness, urgency, income stability, and responsiveness
- use simple language in scripts
- do not promise approval or financing
- if scenario raises lending or compliance concerns, set escalation to ESCALATE TO PROFESSIONAL

Buyer lead data:
{{buyerLead}}
