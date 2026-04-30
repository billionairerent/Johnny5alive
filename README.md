# LaserPlays — JGX3-120 Product Page

Modern Next.js 15 product page for the JGX3-120 Laser Cannon, built using the AI Website Cloner template stack.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/billionairerent/Johnny5alive)

## Stack
- Next.js 15 (App Router) + React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- Lucide React icons

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — auto-redirects to `/product/jgx3-120`.

## Deploy to Vercel (Free)

1. Push your code to GitHub (already done — `billionairerent/Johnny5alive`)
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub
3. Click **Add New** → **Project**
4. Import `billionairerent/Johnny5alive`
5. Click **Deploy**
6. Get your live URL in ~30 seconds

## Use the `/clone-website` Skill

Inside Claude Code, run:

```
/clone-website https://target-url.com
```

This will rebuild the target site as a clean Next.js page in this project.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx            (redirects to product)
│   ├── globals.css
│   └── product/jgx3-120/
│       └── page.tsx        (main product page)
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ProductHero.tsx
│   ├── ProductGallery.tsx
│   ├── ProductDetails.tsx
│   ├── FeatureGrid.tsx
│   ├── SpecTable.tsx
│   └── InTheBox.tsx
├── lib/utils.ts
└── types/product.ts
.claude/
└── commands/
    └── clone-website.md    (the AI skill)
```

## Safety / Use Guidelines

This template is for legitimate website redesigns, migrations, and inspired rebuilds for sites you have authorization to rebuild. Do not use for impersonation, phishing, or passing off others' work as your own.
