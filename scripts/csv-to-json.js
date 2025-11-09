/**
 * Convert studies.csv to studies.json
 * Quick Win #1: Pre-process data to eliminate client-side parsing
 */

const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());
  return result;
}

function csvToJson(csvFilePath, jsonFilePath) {
  try {
    console.log('📖 Reading CSV file:', csvFilePath);
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);
    console.log('📋 Headers found:', headers);

    // Parse data rows
    const studies = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        console.warn(`⚠️  Row ${i + 1} has ${values.length} fields, expected ${headers.length}. Skipping.`);
        continue;
      }

      const study = {};
      headers.forEach((header, index) => {
        const value = values[index];

        // Special handling for categories field - split by comma
        if (header === 'categories') {
          study[header] = value.split(',').map(cat => cat.trim());
        } else {
          study[header] = value;
        }
      });

      studies.push(study);
    }

    console.log(`✅ Parsed ${studies.length} studies`);

    // Write JSON file
    const jsonContent = JSON.stringify(studies, null, 2);
    fs.writeFileSync(jsonFilePath, jsonContent, 'utf-8');

    console.log('✅ JSON file created:', jsonFilePath);
    console.log(`📊 File size: ${(jsonContent.length / 1024).toFixed(2)} KB`);
    console.log(`📈 Average study size: ${(jsonContent.length / studies.length).toFixed(0)} bytes`);

    return studies.length;
  } catch (error) {
    console.error('❌ Error converting CSV to JSON:', error.message);
    throw error;
  }
}

// Main execution
const csvPath = path.join(__dirname, '../data/studies.csv');
const jsonPath = path.join(__dirname, '../data/studies.json');

console.log('🚀 Starting CSV to JSON conversion...\n');
const count = csvToJson(csvPath, jsonPath);
console.log(`\n✨ Successfully converted ${count} studies from CSV to JSON!`);
