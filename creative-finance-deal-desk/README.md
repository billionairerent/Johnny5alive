# Creative Finance Deal Desk OS

This project provides Claude Code-ready workflows for:
- seller lead intake
- buyer lead intake
- lead scoring
- follow-up generation
- deal matching
- closer packet generation

## Core rule
This system is a qualification and routing engine.
It is not a lender, attorney, title company, or compliance authority.

## Main folders
- `/prompts` — prompt files
- `/skills` — modular skill definitions
- `/schemas` — JSON contracts
- `/src/workflows` — automation logic
- `/src/adapters` — third-party service adapters
- `/src/llm` — LLM module callers
- `/src/api` — webhook endpoints
- `/src/templates` — outreach templates
- `/docs` — product, SOP, and workflow documentation

## Starting order
1. Configure environment variables (copy `.env.example` to `.env`)
2. Connect Airtable
3. Connect Twilio
4. Add LLM client
5. Test seller intake workflow
6. Test buyer intake workflow
7. Enable follow-up workflow
8. Add deal match workflow

## Operating pipeline
```
LEAD -> CONTACT -> QUALIFY -> SCORE -> FOLLOW-UP -> MATCH -> PACKAGE -> ESCALATE
```

## Compliance boundaries
This system will never:
- promise financing
- provide legal advice
- draft contracts
- advise users to hide information
- position itself as a lender

When legal, title, note creation, lending, or compliance issues arise, the
workflow marks the lead `ESCALATE TO PROFESSIONAL`.

## Install
```bash
npm install
cp .env.example .env
npm run build
npm test
```

## License
MIT
