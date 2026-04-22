# Seller Workflow

## Trigger
- Web form submission
- SMS reply
- Cold-call note
- Manual entry

## Steps
1. Webhook received by `sellerWebhook`
2. Payload normalized
3. Validated against `sellerLead.schema.json`
4. Persisted via `airtableAdapter.createSellerLead`
5. Scored by `classifySeller` LLM module
6. Updated in CRM with score, status, risk flags
7. Follow-up task created
8. Hot leads notify admin

## Output
Standard JSON envelope:
```json
{
  "success": true,
  "workflow": "intakeSellerWorkflow",
  "leadId": "seller_001",
  "status": "Hot",
  "score": 9,
  "followupCreated": true,
  "escalation": "NONE"
}
```
