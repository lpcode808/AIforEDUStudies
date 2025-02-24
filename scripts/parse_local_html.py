#!/usr/bin/env python3
"""
URL Extractor for Local HTML File

This script extracts URLs from the local copy of the AI for Education website
and formats them for inclusion in our studies.csv file.
"""

from bs4 import BeautifulSoup
import csv
import os
from difflib import SequenceMatcher

# Path to the local HTML file
HTML_FILE_PATH = 'data/Studies Related to Generative AI in Education — AI for Education.html'

def calculate_similarity(a, b):
    """Calculate string similarity between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def extract_study_links():
    """Extract study links from the local HTML file."""
    print(f"Reading local HTML file: {HTML_FILE_PATH}")
    try:
        # Check if file exists
        if not os.path.exists(HTML_FILE_PATH):
            raise FileNotFoundError(f"The file {HTML_FILE_PATH} does not exist")
        
        # Read the HTML file
        with open(HTML_FILE_PATH, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        study_links = []
        
        # Find all h4 tags which seem to be section headers in the document
        section_headers = soup.find_all('h4')
        
        for header in section_headers:
            # The structure appears to have h4 headers for categories followed by study entries
            category = header.get_text().strip()
            print(f"\nProcessing category: {category}")
            
            # Find study entries after this header
            current_element = header.next_sibling
            
            while current_element and (not isinstance(current_element, type(header)) or current_element.name != 'h4'):
                # Look for study titles (bold text) and links
                if hasattr(current_element, 'find_all'):
                    # Find study titles (usually in bold)
                    study_titles = current_element.find_all('strong')
                    
                    for title_elem in study_titles:
                        title = title_elem.get_text().strip()
                        
                        # Skip empty titles or category headers
                        if not title or title.endswith(':') or title == category:
                            continue
                        
                        # Try to find associated link - look at parent paragraph and sibling elements
                        parent = title_elem.parent
                        links = parent.find_all('a')
                        
                        if links:
                            url = links[0].get('href', '')
                            print(f"Found: {title} -> {url}")
                            
                            study_links.append({
                                'title': title,
                                'url': url
                            })
                
                if current_element is None:
                    break
                
                # Move to next element
                current_element = current_element.next_sibling
        
        # Also look for links and titles in a more direct way as fallback
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            strong_tags = p.find_all('strong')
            
            # Skip paragraphs without bold text (likely not study titles)
            if not strong_tags:
                continue
                
            for strong in strong_tags:
                title = strong.get_text().strip()
                
                # Skip empty titles or those that seem to be headers
                if not title or title.endswith(':') or len(title) < 5:
                    continue
                
                # Check if this title is already in our list
                if any(link['title'] == title for link in study_links):
                    continue
                
                # Look for links in this paragraph
                links = p.find_all('a')
                if links:
                    url = links[0].get('href', '')
                    print(f"Found additional: {title} -> {url}")
                    
                    study_links.append({
                        'title': title,
                        'url': url
                    })
        
        print(f"\nFound {len(study_links)} study links")
        return study_links
    
    except Exception as e:
        print(f"Error extracting study links: {e}")
        return []

def update_studies_csv(study_links):
    """Update our studies CSV with the extracted URLs."""
    INPUT_CSV = 'data/studies.csv'
    OUTPUT_CSV = 'data/studies-with-links.csv'
    
    studies = []
    
    # Read current studies
    with open(INPUT_CSV, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        field_names = reader.fieldnames
        print(f"CSV fields: {field_names}")
        for row in reader:
            studies.append(row)
    
    # Match studies with extracted links based on title similarity
    for study in studies:
        best_match = None
        highest_similarity = 0.6  # Lower threshold to catch more matches
        
        study_title = study['title']
        print(f"\nLooking for matches for: {study_title}")
        
        for link in study_links:
            similarity = calculate_similarity(study_title, link['title'])
            print(f"  Comparing with '{link['title']}' - similarity: {similarity:.2f}")
            
            if similarity > highest_similarity:
                highest_similarity = similarity
                best_match = link
        
        if best_match:
            study['url'] = best_match['url']
            print(f"✓ Best match: '{best_match['title']}' -> {best_match['url']}")
        else:
            print("✗ No good match found")
    
    # Check for and remove problematic fields
    for study in studies:
        # Remove any keys that are not in fieldnames
        problem_keys = [key for key in study.keys() if key not in field_names]
        for key in problem_keys:
            print(f"Removing problematic key: {key}")
            del study[key]
        
        # Check for None keys which can happen with malformed CSV data
        if None in study:
            print(f"Removing None key")
            del study[None]
    
    # Write updated CSV
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=field_names)
        writer.writeheader()
        writer.writerows(studies)
    
    print(f"\nCSV file was written successfully to {OUTPUT_CSV}")

def main():
    """Main function to run the extractor."""
    print("Starting URL extractor for local HTML file...")
    study_links = extract_study_links()
    
    if study_links:
        update_studies_csv(study_links)
    else:
        print("No links found to update CSV")

if __name__ == "__main__":
    main() 