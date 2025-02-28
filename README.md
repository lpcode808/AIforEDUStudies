# GenAI Education Research Explorer

A web application for exploring studies on Generative AI in education.

## Overview

This application provides a user-friendly interface to search and filter through research studies related to Generative AI in education. Users can search by keywords, filter by research categories and subject areas, and share links to their search results.

## Features

- **Search Functionality**: Search through study titles, findings, and metadata
- **Filtering System**: Filter studies by research domain and subject area
- **Shareable Links**: Generate links to share specific search results
- **Responsive Design**: Works well on desktop and mobile devices

## Project Structure

The codebase follows a modular architecture for better maintainability:

```
project/
├── css/
│   └── styles.css               # CSS with design system variables
├── js/
│   ├── main.js                  # Application entry point
│   └── modules/
│       ├── state.js             # State management
│       ├── data-loader.js       # Data loading utilities
│       ├── search-engine.js     # Search functionality
│       ├── components.js        # UI components
│       ├── ui-handlers.js       # Event handlers
│       └── utils.js             # Utility functions
├── data/
│   ├── processed/               # Processed data ready for the app
│   │   └── studies.csv          # Main data file used by the app
│   ├── raw/                     # Raw data files
│   │   └── studies-source.html  # Original HTML source
│   └── scripts/                 # Data processing scripts
│       ├── extract.js           # Data extraction
│       ├── transform.js         # Data transformation
│       └── load.js              # CSV generation
├── index.html                   # Main HTML file
├── package.json                 # Project dependencies
└── README.md                    # Project documentation
```

## Technology Stack

- **Frontend**: Vanilla JavaScript with ES modules
- **Search**: Fuse.js for fuzzy search capabilities
- **Styling**: CSS with variables for a consistent design system
- **Data Processing**: Node.js scripts for data extraction and transformation

## Getting Started

### Prerequisites

- Node.js and npm for data processing scripts
- Any modern web browser for viewing the application

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/genai-education-research-explorer.git
   cd genai-education-research-explorer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. To process new data (optional):
   ```
   cd data/scripts
   node load.js --pipeline
   ```

4. Start a local server:
   ```
   npx http-server
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Data Processing Pipeline

The data processing pipeline consists of three stages:

1. **Extract**: Parses HTML source to extract study information
2. **Transform**: Cleans and enhances the extracted data
3. **Load**: Converts the data to CSV format for use in the web application

To run the complete pipeline:
```
node data/scripts/load.js --pipeline
```

## Development

### Adding New Features

1. **New Filter Types**: Extend the state in `state.js` and add UI elements in `components.js`
2. **Additional Search Fields**: Update the Fuse.js configuration in `search-engine.js`
3. **New UI Components**: Add component templates to `components.js`

### Code Style

- Use ES6+ features
- Follow modular design principles
- Document functions with JSDoc comments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all researchers contributing to the field of AI in education
- Fuse.js for the excellent search functionality
