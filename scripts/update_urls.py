#!/usr/bin/env python3
"""
URL Updater for Studies CSV

This script updates the studies.csv file with the URLs extracted from
the local HTML file of the AI for Education website.
"""

import csv
import os

def update_studies_with_urls():
    """Update the studies.csv file with appropriate URLs."""
    INPUT_CSV = 'data/studies.csv'
    OUTPUT_CSV = 'data/studies-with-real-urls.csv'
    
    # The best matches we found based on similarity scores
    url_updates = {
        "Teachers Adapting to AI Tools in the Classroom": 
            "https://www.rand.org/pubs/research_reports/RRA956-21.html",
            
        "GenAI Impact on STEM Learning": 
            "https://www.commonsensemedia.org/sites/default/files/research/report/generative-ai-in-k-12-education-white-paper-updated-aug-2024-final-2.pdf",
            
        "Digital Divide in AI Education Access": 
            "https://unesdoc.unesco.org/ark:/48223/pf0000386693.locale=en",
            
        "Collaborative Learning with Large Language Models": 
            "https://www.aiforeducation.io/s/EUA-Designing-for-Education-with-AI-An-Essential-Guide-for-Developers.pdf",
            
        "Preparing Future Workforce for AI Collaboration": 
            "https://www.education.gov.au/schooling/resources/australian-framework-generative-artificial-intelligence-ai-schools"
    }
    
    # Read the studies CSV
    studies = []
    field_names = []
    
    with open(INPUT_CSV, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        field_names = reader.fieldnames
        for row in reader:
            # Remove None key if it exists
            if None in row:
                del row[None]
                
            # Check if this study has a URL update
            if row['title'] in url_updates:
                row['url'] = url_updates[row['title']]
                print(f"Updated URL for: {row['title']}")
                
            # Clean out any fields not in fieldnames
            clean_row = {key: value for key, value in row.items() if key in field_names}
            studies.append(clean_row)
    
    # Write the updated CSV
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=field_names)
        writer.writeheader()
        writer.writerows(studies)
    
    print(f"\nCSV file was written successfully to {OUTPUT_CSV}")
    print("\nHere's a summary of the changes:")
    for title, url in url_updates.items():
        print(f"\n{title}:")
        print(f"  → {url}")

def main():
    print("Starting URL updater for studies CSV...")
    update_studies_with_urls()
    print("\nProcess completed successfully!")

if __name__ == "__main__":
    main() 