# Content Engine — ByteVision Reelworks

Spec reels: one cinematic 8-second vertical reel per target vertical, produced
as a portfolio so every pitch can open with a reel in the prospect's own
category instead of a description of one.

This is the same deliverable as the **$200 Scroll-Stopper Reel**, so each spec
reel doubles as marketing, portfolio, and a live demo of the entry tier.

## Economics

| | |
|---|---|
| Generation cost | **56 credits** per 8s 9:16 reel (`seedance_2_5`) |
| Sold as | **$200** Scroll-Stopper Reel |
| Balance | 322 credits after the first reel (378 − 56, as preflighted) |

Preflight every job with `get_cost: true` before spending.

## House style

Drawn from the brand's own positioning in `ai-recommendation/llms.txt` —
"make businesses look bigger, stronger, and more important", "stop the
scroll", "change perception".

- Vertical 9:16, 8 seconds, three beats: hook → texture → hero
- Shallow depth of field, anamorphic flare, filmic grain
- Confident unhurried camera; no frantic cuts
- Warm practical light against a cool ambient base
- No on-screen text, no logos, no close-up faces — keeps a reel reusable
  for any client in the vertical, and avoids inventing a real business

## Status

| Vertical | Prompt | Generated |
|---|---|---|
| Restaurant / BBQ | `prompts/restaurant.txt` | ✅ job `61562e2e-6c78-4352-b133-20a8633d5640` (720p, 8s, audio) |
| Barbershop | `prompts/barbershop.txt` | — |
| Real estate | `prompts/real-estate.txt` | — |
| Beauty / med spa | `prompts/beauty.txt` | — |
| Event promotion | `prompts/events.txt` | — |
| Public figure | `prompts/public-figure.txt` | — |

## Publishing

Zernio handles scheduling. As of 2026-10-28 the only connected accounts are
`pressplaypromo1` (facebook) and `jabariokoro` (instagram) — **no ByteVision
account is connected**, so these reels cannot yet be published under this
brand. Connect the ByteVision accounts in Zernio before scheduling.

## Notes from the first run

- `seedance_2_5` rendered 720x1280 with audio. 720p is fine for a spec reel
  but is worth revisiting before anything is delivered as the paid product;
  check `models_explore` for higher-resolution options and re-preflight cost.
- Measured spend matched the preflight exactly (56 credits), so `get_cost`
  is reliable for budgeting a batch.
- CloudFront result URLs may expire; the job ID is the durable handle and
  can be re-displayed with `job_display`.
