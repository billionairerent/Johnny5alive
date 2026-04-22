Task: Generate an outreach script for a lead.

Return JSON with:
- leadId
- channel (sms | email | call)
- subject (if email)
- body
- fallbackBody
- tone

Rules:
- open with value, not a pitch
- do not promise financing or approval
- avoid legal or lending jargon
- include one clear question or call-to-action
- keep SMS under 320 characters
- keep email under 200 words

Channel: {{channel}}
Lead type: {{leadType}}

Lead data:
{{lead}}
