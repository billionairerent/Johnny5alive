# System 2 - The AI Recommendation System (llms.txt)

Make ChatGPT, Claude, and Perplexity recommend your business by name.

## Intro

The core idea is that AI chat is replacing some Google-style search behavior. If your business website is readable to AI systems, those systems can cite and recommend you.

## What You'll Build

1. An `llms.txt` file
2. Structured data / schema markup
3. A strong FAQ section
4. Location and service pages
5. AI crawler access via `robots.txt`

## Why This Works

AI models pull from pages that are clear, structured, and easy to summarize. Most local business sites are not.

## Prerequisites

- Claude Code installed
- Access to your website files or host
- Basic info about your business
- About 15-30 minutes for `llms.txt` and schema, and a few hours for location/service pages

## Cost

No extra cost beyond the tools you already use.

---

## Step 1 - Create Your llms.txt File

Paste this into Claude Code:

```text
I need you to create an llms.txt file for my business. This is a plain text file that lives at the root of my website. It tells AI chat models (ChatGPT, Claude, Perplexity) exactly what my business does, so they can recommend me when someone asks about my industry.

Here are my business details:
Business Name: [YOUR BUSINESS NAME]
What I do: [ONE-SENTENCE DESCRIPTION]
Founded by / owners: [YOUR NAME]
Locations: [CITY, STATE — list all locations]
Phone: [YOUR PHONE]
Website: [YOUR URL]
Hours: [YOUR HOURS]
Service area: [LIST CITIES/COUNTIES YOU SERVE]
Services and pricing:
- [SERVICE 1]: [PRICE RANGE]
- [SERVICE 2]: [PRICE RANGE]
- [SERVICE 3]: [PRICE RANGE]
(add as many as you offer)
What makes me different: [2-3 SENTENCES ABOUT YOUR EDGE — materials, warranty, in-house vs. outsourced, experience, etc.]
Ideal customers / industries served: [WHO YOU WANT TO WORK WITH]
Key facts and credentials: [YEARS IN BUSINESS, # OF JOBS DONE, REVIEW COUNT, CERTIFICATIONS, WARRANTY]

Now write the llms.txt file following this structure:
# [Business Name]
## About
(short paragraph)
## Services and Pricing
(bulleted list with real numbers — AI loves specific pricing)
## Locations
(bulleted list)
## Contact
(phone, website, social, hours)
## Service Area
(comma-separated list of cities)
## Key Facts
(bulleted list of credibility points)
## What Makes Us Different
(short paragraph)
## Frequently Asked Questions
(5-8 real Q&A pairs that a customer would actually ask — include pricing, timing, warranty, common concerns)

Make it scannable. Use short sentences. Include specific numbers wherever possible. No marketing fluff. Save it as llms.txt in my website's root folder.
```

### Note
Real pricing matters because AI answers often depend on concrete numbers.

---

## Step 2 - Upload It to Your Website

Paste this into Claude Code:

```text
I have a website hosted on [YOUR HOST — GitHub/Netlify/Squarespace/WordPress/Webflow/etc.].
Walk me through exactly how to upload the llms.txt file we just created to the root of my site. Give me step-by-step instructions for my specific host. After I upload it, tell me how to confirm it's live by visiting the URL directly.
```

### Important
The file needs to live at:

```text
yourwebsite.com/llms.txt
```

---

## Step 3 - Add Schema Markup (Structured Data)

Paste this into Claude Code:

```text
I want to add JSON-LD schema markup to my homepage so AI and search engines understand my business better.
Business details:
- Name: [YOUR BUSINESS]
- Type: [e.g., LocalBusiness, AutoRepair, Plumber, HVACBusiness, Restaurant]
- Description: [ONE LINE]
- Address: [FULL STREET ADDRESS]
- Phone: [YOUR PHONE]
- Website: [YOUR URL]
- Hours: [YOUR HOURS]
- Price range: [$, $$, $$$]
- Services: [LIST]
- Review rating and count: [IF YOU HAVE GOOGLE REVIEWS]
- Lat/long: [IF YOU KNOW — otherwise skip]
Generate JSON-LD structured data using schema.org types:
1. LocalBusiness (or the most specific type for my industry)
2. FAQPage — with 5-8 common customer questions and answers
3. Service — one entry per main service I offer
Give me the code to paste inside the <head> section of my website.
Also explain what each block does so I can check it's accurate.
```

### Validation
- validator.schema.org
- search.google.com/test/rich-results

---

## Step 4 - Open the Door for AI Crawlers

Paste this into Claude Code:

```text
Check the robots.txt file on my website at [YOUR URL]/robots.txt. I want to make sure the following AI crawlers are explicitly ALLOWED (not blocked):
- GPTBot (OpenAI / ChatGPT)
- ClaudeBot (Anthropic)
- PerplexityBot (Perplexity)
- Google-Extended (Google's AI training bot)
- CCBot (Common Crawl — a lot of models train on this)
If any are blocked, give me the updated robots.txt file I should upload. Also add a line pointing to my sitemap.xml so everyone can find my pages.
```

---

## Step 5 - Add a Real FAQ Section to Your Homepage

Paste this into Claude Code:

```text
Write an FAQ section for my homepage. It should have 8-10 real questions a potential customer would actually type into ChatGPT or Google.
My business: [DESCRIBE IT]
My services: [LIST]
My pricing: [REAL RANGES]
My area: [CITY/STATE]
Rules:
- Every question should start with how, what, where, when, why, or do
- Every answer should be 2-4 sentences max, direct, include specific numbers when possible
- Include at least one pricing question, one "how long does it take" question, one "do you serve my area" question, and one "what makes you different" question
- Write the answers so they can be quoted directly by AI — short, factual, confident
- No marketing words: avoid "premier", "best-in-class", "industry-leading", "cutting-edge"

Then wrap the whole thing in FAQPage schema markup so AI and Google both index it properly.
```

---

## Step 6 - Build Location + Service Pages

Paste this into Claude Code:

```text
I want to build location pages and service pages for my website that rank in both Google and AI chat results.
My service area: [LIST OF CITIES YOU SERVE]
My core services: [LIST OF 3-6 MAIN SERVICES]
Generate two sets of pages:

LOCATION PAGES — one per city. URL format: /locations/[city-name]/
Each page should include:
- H1 with "[Service] in [City], [State]"
- Intro paragraph mentioning the city by name and my business by name
- 400-600 words covering: why local matters, services offered in that city, specific neighborhoods or landmarks, pricing, contact info
- Embedded FAQ (3-5 questions) specific to that city
- Schema markup for LocalBusiness with the city's info
- Internal links back to the homepage and related service pages

SERVICE PAGES — one per core service. URL format: /services/[service-name]/
Each page should include:
- H1 with the service name
- 600-800 words covering: what the service is, who it's for, what it costs, how long it takes, what's included, the process step by step
- A "who this is for" section
- FAQ schema block
- Internal links back to the homepage and related services

Write real, useful content. Not keyword-stuffed garbage. Assume a real customer will read these. Start with 3 location pages and 2 service pages. We'll expand from there.
```

---

## Step 7 - Test It

Test after 3-7 days:

1. Ask ChatGPT: `who does the best [your service] in [your city]?`
2. Ask Perplexity the same question
3. Ask Claude the same question
4. Ask Google's AI Overview the same question

Paste this into Claude Code for an audit:

```text
Help me audit how well my AI SEO is working. Check [YOUR URL] and give me a report on:
1. Is my llms.txt live and does it have everything important?
2. Is my schema markup valid?
3. Is robots.txt allowing AI bots?
4. Does my homepage have a real FAQ section with schema?
5. How many location pages do I have? Are they thin or real content?
6. What's missing that top AI-recommended sites in my industry have?

Give me a prioritized list of fixes, most impactful first.
```

---

## Results

- Old site: about 7 real visitors per day
- New site after two weeks: about 100-150 real visitors per day
- Traffic increase: about 1,400%
- ChatGPT reportedly recommended Summit Wraps by name
- Google Search Console reportedly showed page-1 ranking for a local query

## Tips

1. Specificity beats polish
2. Update `llms.txt` when the business changes
3. Do not block AI bots if you want AI visibility
4. One clean page can beat multiple bloated ones
5. FAQs are highly quotable
6. Watch Google Search Console for adjacent query impressions
7. Ask AI about your business regularly to monitor visibility
