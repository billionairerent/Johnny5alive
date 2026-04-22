Task: Review a lead and any attached context for risk and compliance flags.

Return JSON with:
- leadId
- riskFlags (array of short strings)
- escalation (one of: NONE, REVIEW, ESCALATE TO PROFESSIONAL)
- reason (short explanation)

Flag if any of the following appear:
- foreclosure, pre-foreclosure, bankruptcy
- title disputes, lien concerns, unclear ownership
- due-on-sale concerns that the user wants you to "work around"
- requests to hide information from a lender or buyer
- note creation, Dodd-Frank compliance questions, mortgage licensing issues
- minors, incapacity, or guardianship questions
- promises of guaranteed financing or approval

Do not diagnose legal issues. Simply flag and escalate.

Lead data:
{{lead}}
