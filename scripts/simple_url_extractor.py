#!/usr/bin/env python3
"""
Simple URL Extractor for Local HTML File

This script extracts URLs from the local copy of the AI for Education website
and prints them in an easy-to-copy format without modifying any CSV files.
"""

from bs4 import BeautifulSoup
import os

# Path to the local HTML file
HTML_FILE_PATH = 'data/Studies Related to Generative AI in Education — AI for Education.html'

def extract_study_links():
    """Extract study links from the local HTML file and print them."""
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
                    study_links.append({
                        'title': title,
                        'url': url
                    })
        
        # Print all extracted links in an easy-to-copy format
        print("\n\n========== EXTRACTED STUDY LINKS ==========")
        print("Title | URL")
        print("-" * 100)
        
        for link in study_links:
            print(f"{link['title']} | {link['url']}")
            
        print("\nTotal links found:", len(study_links))
        
        # Print as JSON for alternative use
        print("\n\n========== LINKS IN JSON FORMAT ==========")
        import json
        print(json.dumps(study_links, indent=2))
        
        return study_links
    
    except Exception as e:
        print(f"Error extracting study links: {e}")
        return []

def main():
    """Main function to run the extractor."""
    print("Starting simple URL extractor for local HTML file...")
    extract_study_links()

if __name__ == "__main__":
    main() 