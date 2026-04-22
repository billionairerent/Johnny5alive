# Deal Matching Workflow

## Purpose
Compare a seller lead and a buyer lead and produce a `DealMatch`.

## Inputs
- sellerLeadId
- buyerLeadId

## Steps
1. Load both leads from Airtable
2. Score the pair against match criteria (geography, price, timeline, terms)
3. If `fitScore >= threshold`, call `packageDeal`
4. Store a `DealMatch` record
5. If strong, notify closer

## Output
`DealMatch` JSON record (see `schemas/dealMatch.schema.json`).
