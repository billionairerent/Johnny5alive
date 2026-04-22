# Closer Handoff Workflow

## Purpose
Produce a closer-ready packet once a seller and buyer appear to fit.

## Inputs
- sellerLead
- buyerLead
- optional match context

## Steps
1. Run `packageDeal` LLM module
2. Validate output against `closerPacket.schema.json`
3. Save markdown version via `storageAdapter.saveCloserPacket`
4. Notify the assigned closer

## Rules
- The packet is a summary, not a contract.
- No legal language.
- Any compliance-relevant item is marked `ESCALATE TO PROFESSIONAL`.

## Output
`CloserPacket` JSON + rendered markdown file path.
