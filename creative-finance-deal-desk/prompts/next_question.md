Task: Given a lead's known facts and missing facts, propose the single best next question to ask the lead.

Return JSON with:
- leadId
- nextQuestion
- reason
- tone

Rules:
- ask one question at a time
- use plain, conversational language
- avoid technical jargon
- do not ask for sensitive information unnecessarily (SSNs, bank routing, etc.)
- if the lead has stalled, suggest a low-pressure reconnect question

Lead data:
{{lead}}
