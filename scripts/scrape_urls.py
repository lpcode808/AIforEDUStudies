#!/usr/bin/env python3
"""
URL Scraper for AI for Education Studies

This script scrapes URLs from the AI for Education website and
formats them for inclusion in our studies.csv file.
"""

import requests
from bs4 import BeautifulSoup
import csv
import re
from difflib import SequenceMatcher

# Target URL to scrape
TARGET_URL = 'https://www.aiforeducation.io/ai-resources/studies-related-to-generative-ai-in-education'

def calculate_similarity(a, b):
    """Calculate string similarity between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def scrape_study_links():
    """Scrape study links from the target URL."""
    print("Fetching webpage content...")
    try:
        response = requests.get(TARGET_URL)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        soup = BeautifulSoup(response.text, 'html.parser')
        study_links = []
        
        # Adjust these selectors based on the actual structure of the website
        # This is a generic approach - you'll need to inspect the actual HTML
        study_items = soup.select('.study-item, article, .resource-item')
        
        for item in study_items:
            # Try different ways to extract the title
            title_elem = item.select_one('.study-title, h2, h3, .title')
            title = title_elem.get_text().strip() if title_elem else ""
            
            # Find links - prioritize those that might point to studies
            links = item.find_all('a')
            url = ""
            
            # Look for promising links (PDF links, external links, etc.)
            for link in links:
                href = link.get('href', '')
                # Prioritize PDF links or links with certain keywords
                if href.endswith('.pdf') or any(keyword in href.lower() for keyword in ['study', 'research', 'paper', 'doi']):
                    url = href
                    break
            
            # If no specialized link was found, use the first link
            if not url and links:
                url = links[0].get('href', '')
            
            if title and url:
                # Ensure URL is absolute
                if not url.startswith(('http://', 'https://')):
                    # Handle relative URLs
                    if url.startswith('/'):
                        # Domain-relative URL
                        domain = re.match(r'(https?://[^/]+)', TARGET_URL).group(1)
                        url = domain + url
                    else:
                        # Path-relative URL
                        url = TARGET_URL.rsplit('/', 1)[0] + '/' + url
                
                study_links.append({
                    'title': title,
                    'url': url
                })
                print(f"Found: {title} -> {url}")
        
        print(f"Found {len(study_links)} study links")
        return study_links
    
    except Exception as e:
        print(f"Error scraping study links: {e}")
        return []

def update_studies_csv(study_links):
    """Update our studies CSV with the scraped URLs."""
    INPUT_CSV = 'data/studies.csv'
    OUTPUT_CSV = 'data/studies-with-links.csv'
    
    studies = []
    
    # Read current studies
    with open(INPUT_CSV, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            studies.append(row)
    
    # Match studies with scraped links based on title similarity
    for study in studies:
        best_match = None
        highest_similarity = 0.7  # Threshold for a good match
        
        for link in study_links:
            similarity = calculate_similarity(study['title'], link['title'])
            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match = link
        
        if best_match:
            study['url'] = best_match['url']
            print(f"Matched: {study['title']} -> {best_match['url']}")
    
    # Write updated CSV
    fieldnames = list(studies[0].keys())
    if 'url' not in fieldnames:  # Make sure 'url' field is included
        # Insert url before metadata
        metadata_index = fieldnames.index('metadata')
        fieldnames.insert(metadata_index, 'url')
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(studies)
    
    print(f"CSV file was written successfully to {OUTPUT_CSV}")

def main():
    """Main function to run the scraper."""
    print("Starting URL scraper...")
    study_links = scrape_study_links()
    
    if study_links:
        update_studies_csv(study_links)
    else:
        print("No links found to update CSV")

if __name__ == "__main__":
    main() 