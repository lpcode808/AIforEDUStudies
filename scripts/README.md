# URL Extraction Scripts for GenAI Education Studies

This directory contains scripts for extracting URLs from the AI for Education website and updating our studies database.

## Available Scripts

### Local HTML Parsing (Recommended)

These scripts parse a local HTML file of the website, which is more reliable than web scraping.

#### Python Version

```bash
cd scripts
pip install -r requirements.txt
python parse_local_html.py
```

#### Node.js Version

```bash
cd scripts
npm install
node parse-local-html.js
```

### Web Scraping (Alternative)

These scripts scrape the live website directly. Use only if the local HTML parsing doesn't work.

#### Node.js Version

A JavaScript implementation using Axios and Cheerio for web scraping.

#### Prerequisites
- Node.js 14+ installed

#### Installation
```bash
cd scripts
npm install
```

#### Usage
```bash
npm run scrape
```

#### Python Version

A Python implementation using Requests and BeautifulSoup for web scraping.

#### Prerequisites
- Python 3.6+ installed

#### Installation
```bash
cd scripts
pip install -r requirements.txt
```

#### Usage
```bash
python scrape_urls.py
```

## Expected Output

All scripts will:

1. Extract study titles and their associated URLs from either the local HTML file or the live website
2. Match these with our studies in data/studies.csv using string similarity algorithms
3. Generate a new file data/studies-with-links.csv with updated URL fields

## How the Local HTML Parsing Works

The local HTML parsing scripts look for:

1. Section headers (h4 tags) that define categories of studies
2. Study titles (typically in bold/strong tags)
3. Links associated with those titles

The scripts implement multiple passes to ensure maximum extraction:
- First pass: Look for section headers and extract studies within each section
- Second pass: Look for any paragraphs with bold text and links that might contain studies

## Notes

- Manual verification of matches is recommended
- All scripts include detailed logging to help troubleshoot any issues
- The string similarity algorithms help match studies even when titles differ slightly

## Manual Process Alternative

If the automated scripts don't work effectively, you can also:

1. Open the local HTML file in a browser
2. Manually identify study titles and their corresponding links
3. Edit the studies.csv file directly, adding the URLs for the corresponding studies 