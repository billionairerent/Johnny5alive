# /clone-website

Clone and redesign any website into a clean, modern Next.js codebase.

## Usage

```
/clone-website <target-url>
```

## What This Does

This skill reverse-engineers a target website into a fresh, modern Next.js product page or site using this project's stack (Next.js 15, React 19, TypeScript, Tailwind CSS v4, Lucide React).

It does NOT copy the site — it creates an inspired redesign with improved layout, copy, and code quality.

## Phases

### Phase 1 — Reconnaissance
- Fetch the target URL using WebFetch
- Extract: page title, meta description, headings (H1–H3), CTAs, nav links, footer links
- Note the color palette, font choices, layout structure, and section order
- Identify the product/service being offered and the target customer

### Phase 2 — Design Token Extraction
- Map primary, secondary, and accent colors
- Identify typography scale (headings, body, mono)
- Note spacing patterns and border styles
- Choose a matching or improved dark/light theme

### Phase 3 — Component Spec Writing
Create `docs/research/<domain>-spec.md` with:
- Site overview and audience
- Section-by-section breakdown
- Design tokens (colors, fonts, spacing)
- Copy improvements (headline, subheadline, CTAs)
- Component list

### Phase 4 — Parallel Build
Build these components simultaneously:
1. `Navbar.tsx` — navigation with logo + links + CTA button
2. `Hero.tsx` — headline, subheadline, stat pills, product visual
3. `Details.tsx` — pricing, CTA buttons, quick specs
4. `Gallery.tsx` — image grid
5. `Features.tsx` — icon card grid
6. `Specs.tsx` — spec table
7. `InBox.tsx` — what's included
8. `Footer.tsx` — links + disclaimer

### Phase 5 — Assembly
- Create `src/app/<slug>/page.tsx` assembling all components
- Add page metadata (title, description, OG tags)
- Add root redirect in `src/app/page.tsx`
- Verify TypeScript compiles: `npm run build`

## Output

After completion you will have:
- A fully built product/landing page at `/src/app/<slug>/page.tsx`
- Research spec at `docs/research/<domain>-spec.md`
- All section components in `src/components/`
- Build-passing TypeScript

## Example

```
/clone-website https://example-business.com/product/widget-pro
```

## Safe Use Guidelines

- Use for clients who own the website being redesigned
- Use for migration from legacy to modern Next.js
- Use for creating "inspired redesign" concepts (with client permission)
- Do NOT use for impersonation, phishing, or passing off someone else's brand as your own
- Do NOT use for sites you do not have authorization to rebuild
