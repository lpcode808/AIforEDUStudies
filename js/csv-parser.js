/**
 * Simple CSV parser to load and parse the studies data
 */

// Function to parse CSV text into an array of objects
function parseCSV(csvText) {
    // Split the CSV into lines
    const lines = csvText.trim().split('\n');
    
    // The first line contains headers
    const headers = lines[0].split(',').map(header => {
        // Remove quotes if they exist
        return header.replace(/^"|"$/g, '').trim();
    });
    
    // Parse each data line
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        // Handle quoted fields with commas inside them
        const row = {};
        let currentLine = lines[i];
        let fields = [];
        let inQuotes = false;
        let currentField = '';
        
        // Parse fields considering quotes
        for (let j = 0; j < currentLine.length; j++) {
            const char = currentLine[j];
            
            if (char === '"' && (j === 0 || currentLine[j-1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        // Add the last field
        fields.push(currentField);
        
        // Create object from fields and headers
        for (let j = 0; j < headers.length; j++) {
            const value = fields[j] ? fields[j].replace(/^"|"$/g, '').trim() : '';
            
            // Special processing for certain fields
            if (headers[j] === 'categories') {
                row[headers[j]] = value.split('|').map(cat => cat.trim());
            } else if (headers[j] === 'metadata') {
                // Parse metadata into an object
                const metadataObj = {};
                value.split('|').forEach(item => {
                    const [key, val] = item.split('=');
                    if (key && val) {
                        // If value contains commas, split into array
                        metadataObj[key.trim()] = val.includes(',') 
                            ? val.split(',').map(v => v.trim()) 
                            : val.trim();
                    }
                });
                row[headers[j]] = metadataObj;
            } else {
                row[headers[j]] = value;
            }
        }
        
        results.push(row);
    }
    
    return results;
}

// Function to load the CSV file
async function loadStudiesData() {
    try {
        const response = await fetch('./data/studies.csv');
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error loading studies data:', error);
        return [];
    }
}

// Export the functions for use in other scripts
window.csvUtils = {
    parseCSV,
    loadStudiesData
}; 