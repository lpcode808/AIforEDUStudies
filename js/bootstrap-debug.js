/**
 * Debug file to specifically test the bootstrap.js module
 */
console.log('Starting bootstrap-debug.js');

// Try to import the bootstrap module and check its exports
import * as bootstrapModule from './modules/bootstrap.js';

// Log what we got
console.log('bootstrap.js module exports:', Object.keys(bootstrapModule));

// Check if bootstrapApplication exists
if (typeof bootstrapModule.bootstrapApplication === 'function') {
  console.log('bootstrapApplication function exists');
} else {
  console.error('bootstrapApplication function does not exist in the exports');
}

// Test if loadStudiesData is properly exported from data-loader.js
async function testDataLoader() {
  try {
    console.log('Testing data-loader.js import');
    const dataLoader = await import('./modules/data-loader.js');
    console.log('data-loader.js exports:', Object.keys(dataLoader));
    
    if (typeof dataLoader.loadStudiesData === 'function') {
      console.log('✅ loadStudiesData function exists');
    } else {
      console.error('❌ loadStudiesData function does not exist in data-loader.js exports');
    }
  } catch (error) {
    console.error('Error importing data-loader.js:', error);
  }
}

// Run the test
testDataLoader(); 