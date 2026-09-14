"""
generate_mirrors.py — Generate markdown mirrors for every page on a static website.

For each index.html found in the site folder, creates a sibling index.md with:
  - YAML frontmatter (title)
  - Clean markdown body (nav/footer/scripts stripped)

Usage:
    python generate_mirrors.py --site /path/to/your/site
    python generate_mirrors.py --site ./my-site --dry-run
    python generate_mirrors.py --site ./my-site --verbose

Requires:
    pip install beautifulsoup4 markdownify
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from bs4 import BeautifulSoup, Comment
    from markdownify import markdownify as md
except ImportError:
    print("Missing dependencies. Run: pip install beautifulsoup4 markdownify")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Tags and classes to strip before conversion
# ---------------------------------------------------------------------------

STRIP_TAGS = [
    "script", "style", "noscript", "iframe",
    "nav", "footer", "header",
]

STRIP_CLASSES = [
    "nav", "footer", "header", "sidebar",
    "cta-split", "cookie-banner", "chat-widget",
]

STRIP_CLASS_PREFIXES = ["ghl", "hubspot", "hs-", "intercom"]

# Pages to skip (noindex or utility pages)
SKIP_PATHS = {"404", "thanks", "thank-you", "confirmation", "unsubscribe"}


def should_skip(page_dir: Path) -> bool:
    return any(part.lower() in SKIP_PATHS for part in page_dir.parts)


def extract_title(soup: BeautifulSoup) -> str:
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        return og_title["content"].strip()
    title_tag = soup.find("title")
    if title_tag:
        return title_tag.get_text(strip=True)
    h1 = soup.find("h1")
    if h1:
        return h1.get_text(strip=True)
    return page_dir.parent.name.replace("-", " ").replace("_", " ").title()


def class_matches_strip(element) -> bool:
    classes = element.get("class", [])
    for cls in classes:
        if cls in STRIP_CLASSES:
            return True
        if any(cls.startswith(prefix) for prefix in STRIP_CLASS_PREFIXES):
            return True
    return False


def clean_soup(soup: BeautifulSoup) -> BeautifulSoup:
    # Remove HTML comments
    for comment in soup.find_all(string=lambda t: isinstance(t, Comment)):
        comment.extract()

    # Strip by tag name
    for tag_name in STRIP_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    # Strip by class
    for tag in soup.find_all(True):
        if class_matches_strip(tag):
            tag.decompose()

    # Drop empty div/span wrappers
    for tag in soup.find_all(["div", "span"]):
        if not tag.get_text(strip=True):
            tag.decompose()

    return soup


def clean_markdown(raw: str) -> str:
    # Collapse 3+ blank lines into 2
    raw = re.sub(r"\n{3,}", "\n\n", raw)

    # Remove standalone step numbers like "01\n" or "02 "
    raw = re.sub(r"(?m)^\d{1,2}\s*$", "", raw)

    # Remove bullet separator lines (e.g., lines with only "—" or "•")
    raw = re.sub(r"(?m)^[\—\•\-]{1,3}\s*$", "", raw)

    # Remove empty image alt tags: ![](...) -> remove line
    raw = re.sub(r"!\[\]\([^)]*\)\n?", "", raw)

    # Strip trailing whitespace per line
    raw = "\n".join(line.rstrip() for line in raw.splitlines())

    return raw.strip()


def html_to_markdown(html_path: Path) -> tuple[str, str]:
    """Return (title, markdown_body)."""
    html = html_path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(html, "html.parser")

    title = extract_title(soup)

    body = soup.find("body") or soup
    body = clean_soup(body)

    raw_md = md(str(body), heading_style="ATX", bullets="-", strip=["a"])
    markdown_body = clean_markdown(raw_md)

    return title, markdown_body


def write_mirror(index_html: Path, title: str, body: str, dry_run: bool = False) -> Path:
    out_path = index_html.parent / "index.md"
    content = f"---\ntitle: {title}\n---\n\n{body}\n"
    if not dry_run:
        out_path.write_text(content, encoding="utf-8")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Generate markdown mirrors for a static site")
    parser.add_argument("--site",    required=True, help="Path to your website root folder")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without writing files")
    parser.add_argument("--verbose", action="store_true", help="Print each file processed")
    args = parser.parse_args()

    site_root = Path(args.site).resolve()
    if not site_root.exists():
        print(f"Site folder not found: {site_root}")
        sys.exit(1)

    html_files = list(site_root.rglob("index.html"))
    if not html_files:
        print(f"No index.html files found in {site_root}")
        sys.exit(1)

    processed = skipped = 0

    for html_path in sorted(html_files):
        rel = html_path.relative_to(site_root)

        if should_skip(rel):
            if args.verbose:
                print(f"  SKIP  {rel}")
            skipped += 1
            continue

        try:
            title, body = html_to_markdown(html_path)
            out = write_mirror(html_path, title, body, dry_run=args.dry_run)
            processed += 1
            if args.verbose or args.dry_run:
                tag = "[DRY RUN]" if args.dry_run else "  OK   "
                print(f"{tag} {rel.parent}/index.md  ({len(body)} chars)")
        except Exception as e:
            print(f"  ERROR {rel}: {e}")

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Done.")
    print(f"  Generated : {processed}")
    print(f"  Skipped   : {skipped}")


if __name__ == "__main__":
    main()
