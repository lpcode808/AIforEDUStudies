/**
 * Debug file to test module loading
 */

// Log all import attempts
console.log('Debug: Starting module import tests');

// Test importing each module separately to identify issues
async function testImports() {
  try {
    console.log('Debug: Testing AppState import');
    const appStateModule = await import('./modules/state.js');
    console.log('Debug: AppState import successful:', appStateModule);
    
    console.log('Debug: Testing data-loader import');
    const dataLoaderModule = await import('./modules/data-loader.js');
    console.log('Debug: data-loader import successful:', Object.keys(dataLoaderModule));
    
    console.log('Debug: Testing search-engine import');
    const searchEngineModule = await import('./modules/search-engine.js');
    console.log('Debug: search-engine import successful:', Object.keys(searchEngineModule));
    
    console.log('Debug: Testing ui-handlers import');
    const uiHandlersModule = await import('./modules/ui-handlers.js');
    console.log('Debug: ui-handlers import successful:', Object.keys(uiHandlersModule));
    
    console.log('Debug: Testing bootstrap import');
    const bootstrapModule = await import('./modules/bootstrap.js');
    console.log('Debug: bootstrap import successful:', Object.keys(bootstrapModule));
    
    console.log('Debug: All module imports completed successfully');
    
    return {
      appState: appStateModule,
      dataLoader: dataLoaderModule,
      searchEngine: searchEngineModule,
      uiHandlers: uiHandlersModule,
      bootstrap: bootstrapModule
    };
  } catch (error) {
    console.error('Debug: Module import test failed:', error);
    return null;
  }
}

// Execute tests when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Debug: DOMContentLoaded, starting import tests');
  
  // Create a UI element to display results
  const debugContainer = document.createElement('div');
  debugContainer.id = 'debug-output';
  debugContainer.style.margin = '20px';
  debugContainer.style.padding = '15px';
  debugContainer.style.border = '1px solid #ccc';
  debugContainer.style.backgroundColor = '#f8f8f8';
  debugContainer.innerHTML = '<h2>Module Loading Tests</h2><div id="test-results">Running tests...</div>';
  document.body.appendChild(debugContainer);
  
  // Run the tests
  testImports().then(results => {
    const resultsContainer = document.getElementById('test-results');
    
    if (results) {
      resultsContainer.innerHTML = '<h3>Module Import Results</h3>';
      
      // Create a table to display results
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      
      // Add header row
      const headerRow = document.createElement('tr');
      headerRow.innerHTML = `
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Module</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Status</th>
        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Exports</th>
      `;
      table.appendChild(headerRow);
      
      // Add rows for each module
      Object.entries(results).forEach(([name, module]) => {
        const row = document.createElement('tr');
        const exports = module ? Object.keys(module).join(', ') : 'Failed to load';
        row.innerHTML = `
          <td style="border: 1px solid #ddd; padding: 8px;">${name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${module ? '✅ Loaded' : '❌ Failed'}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${exports}</td>
        `;
        table.appendChild(row);
      });
      
      resultsContainer.appendChild(table);
    } else {
      resultsContainer.innerHTML = '<p>❌ Tests failed. Check the console for details.</p>';
    }
  });
}); 