# GenAI Education Research Explorer

A simple web application for exploring research studies on Generative AI in education.

## Project Overview

This project creates a searchable and filterable interface for browsing research studies related to Generative AI in education. The data is stored in a CSV file, which makes it easy to edit and maintain.

### Features

- **Fuzzy Search**: Search across study titles, findings, and other metadata using Fuse.js
- **Category Filtering**: Filter studies by research domains
- **Date Range Filtering**: Filter studies by publication date
- **External Links**: Direct links to original studies
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (for local development server)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/lpcode808/AIforEDUStudies.git
   cd AIforEDUStudies
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
.
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # CSS styles
├── js/
│   ├── csv-parser.js       # CSV parsing utility
│   └── search.js           # Search and filter functionality
├── data/
│   └── studies.csv         # CSV data file containing research studies
└── .github/
    └── workflows/
        └── sync.yml        # GitHub Actions workflow for deployment
```

## Data Structure

The `studies.csv` file has the following structure:

```csv
id,categories,title,organization,date,key_findings,url,metadata
```

Where:
- **id**: Unique identifier for the study
- **categories**: Pipe-separated (|) list of research domains
- **title**: Title of the study
- **organization**: Organization that conducted the study
- **date**: Publication date (YYYY-MM format)
- **key_findings**: Main findings of the study
- **url**: Direct link to the original study
- **metadata**: Additional metadata in key=value format, separated by pipes (|)

## Deployment

This project can be deployed to GitHub Pages using the GitHub Actions workflow in `.github/workflows/sync.yml`. 

To deploy:
1. Push your changes to the main branch
2. GitHub Actions will automatically build and deploy the site to GitHub Pages

## Contributing

To add or modify research studies, simply edit the `data/studies.csv` file.

## License

[MIT License](LICENSE) 
