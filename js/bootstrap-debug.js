/**
 * Debug file to specifically test the bootstrap.js module
 */

// Try to import the bootstrap module and check its exports
import * as bootstrapModule from './modules/bootstrap.js';

// Log what we got

// Check if bootstrapApplication exists
if (typeof bootstrapModule.bootstrapApplication === 'function') {
  
} else {
  console.error('bootstrapApplication function does not exist in the exports');
}

// Test if loadStudiesData is properly exported from data-loader.js
async function testDataLoader() {
  try {
    
    const dataLoader = await import('./modules/data-loader.js');

    if (typeof dataLoader.loadStudiesData === 'function') {
      
    } else {
      console.error('❌ loadStudiesData function does not exist in data-loader.js exports');
    }
  } catch (error) {
    console.error('Error importing data-loader.js:', error);
  }
}

// Run the test
testDataLoader(); 