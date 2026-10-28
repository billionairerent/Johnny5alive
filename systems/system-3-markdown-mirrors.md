# System 3 - Markdown Mirrors

Give AI a clean version of every page on your site to read.

## Concept

A markdown mirror is a clean, plain-text version of every page on your website that lives at a predictable URL, often by adding `/index.md` to the page path.

## Why It Matters

`llms.txt` gives the business-level overview. Markdown mirrors give per-page detail, making it easier for AI systems to quote the right page directly.

## What You'll Build

- A Python script that walks your website folder
- For each HTML page, it generates a sibling `index.md`
- A hosting/config tweak so `.md` files render as plain text in a browser
- An update to `llms.txt` so AI knows the mirrors exist

## Requirements

- Claude Code installed
- Static website host such as Netlify, Vercel, GitHub Pages, or Cloudflare Pages
- Website code in a local folder or repo
- Python 3 with `beautifulsoup4` and `markdownify`

## Time and Cost

- About an hour to set up
- $0 ongoing cost

---

## Step 1 - Build the Generator Script

Paste this into Claude Code:

```text
I want to build markdown mirrors for every page on my website. The goal is to give AI tools (ChatGPT, Claude, Perplexity) a clean version of each page they can read without wrestling with HTML, scripts, or chrome.

Write me a Python script that:
1. Walks my website folder and finds every index.html file (skip 404s and any /thanks/ pages that are noindex)
2. For each page, parses the HTML with BeautifulSoup
3. Strips out: nav, footer, scripts, styles, noscripts, chat widgets, GHL/HubSpot widgets, iframes, and any element with a class matching nav, footer, cta-split, or starting with ghl
4. Drops empty div/span wrappers that have no text content
5. Converts the remaining body HTML to clean markdown using the markdownify package
6. Cleans the markdown output: collapses 3+ blank lines, strips standalone "01" "02" step numbers, removes bullet separator characters, removes empty image alt tags
7. Writes the result to {page_dir}/index.md with frontmatter at the top:
---
title: [page title from HTML]
---
```

> **Note:** The source material for System 3 was partially extracted — the generator script prompt above may be incomplete. The frontmatter block and any subsequent steps were not fully visible in the original source PDF.

---

## Step 2 - Configure Your Host to Serve .md Files as Plain Text

After generating the mirrors, configure your host so `.md` files are served with `Content-Type: text/plain`.

**Netlify** — add to `netlify.toml`:

```toml
[[headers]]
  for = "/*.md"
  [headers.values]
    Content-Type = "text/plain; charset=utf-8"
```

**Vercel** — add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)\\.md",
      "headers": [{ "key": "Content-Type", "value": "text/plain; charset=utf-8" }]
    }
  ]
}
```

**GitHub Pages / Cloudflare Pages** — ask Claude Code for the right config for your setup.

---

## Step 3 - Update llms.txt to Reference the Mirrors

Add a section to your `llms.txt` so AI systems know the mirrors exist:

```text
## Page Mirrors
Each page on this site has a clean markdown version at the same URL with /index.md appended.
Example: yourwebsite.com/services/vehicle-wraps/index.md
```

---

## Tips

1. Run the generator script any time you update your site
2. Check a few mirrors manually to make sure the content is clean
3. Mirrors make it easier for AI to quote specific pages, not just the homepage
4. Works best with static sites — dynamic sites may need a different approach
