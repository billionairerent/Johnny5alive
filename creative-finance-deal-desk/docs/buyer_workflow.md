# Buyer Workflow

## Trigger
- Web form submission
- SMS reply
- Cold-call note
- Manual entry

## Steps
1. Webhook received by `buyerWebhook`
2. Payload normalized
3. Validated against `buyerLead.schema.json`
4. Persisted via `airtableAdapter.createBuyerLead`
5. Scored by `classifyBuyer` LLM module
6. Updated in CRM with score, status, risk flags
7. Follow-up task created
8. Strong buyers notify admin

## Output
Standard JSON envelope:
```json
{
  "success": true,
  "workflow": "intakeBuyerWorkflow",
  "leadId": "buyer_001",
  "status": "Hot",
  "score": 9,
  "followupCreated": true,
  "escalation": "NONE"
}
```
