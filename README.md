# GenAI Education Research Explorer

This web-based application provides a searchable and filterable interface for exploring studies related to Generative AI in education. It allows researchers, educators, and policymakers to quickly find relevant research based on various criteria.

## Features

- **Powerful Search**: Fuzzy text search across study titles, findings, and metadata
- **Multi-Faceted Filtering**: Filter by research domains, date ranges, complexity, region, and subject areas
- **Shareable Results**: Generate and share direct links to specific search results
- **CSV-Driven**: Easy data management through CSV files, no database required
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

The application uses a simple, yet powerful architecture:

1. **Data Layer**: Studies are stored in a CSV file with standardized fields
2. **Search Engine**: Fuse.js provides fast client-side search with fuzzy matching
3. **Filter System**: Dynamic filtering based on study metadata
4. **URL Integration**: Search state is preserved in URL parameters for easy sharing
5. **GitHub Pages Deployment**: Automatic deployment through GitHub Actions

## Getting Started

### Local Development

To run the application locally:

1. Clone this repository
2. Open index.html in a web browser (no server required)

For active development with auto-reloading:

```bash
# Install a local development server
npm install -g live-server

# Start the server
live-server
```

### Editing the Data

The research data is stored in `/data/studies.csv` with the following structure:

```csv
id,categories,title,organization,date,key_findings,url,metadata
study-id,"Category 1|Category 2","Study Title","Organization Name",YYYY-MM,"Key findings text...","https://example.com",complexity=3|region=global|subjects=math,science
```

Guidelines for editing:
- **categories**: Use pipe (|) to separate multiple categories
- **date**: Use ISO format (YYYY-MM)
- **metadata**: Use pipe (|) to separate key-value pairs, format: key=value
- **multi-value metadata**: Use commas to separate values within a metadata field, like: subjects=math,science

### Deployment

The application is automatically deployed to GitHub Pages whenever changes are pushed to the main branch. The GitHub Action workflow:

1. Checks out the code
2. Converts the CSV data to JSON
3. Deploys to GitHub Pages

## Data Structure

### CSV Fields

| Field | Description | Format |
|-------|-------------|--------|
| id | Unique identifier | Text |
| categories | Research domains | Pipe-separated values |
| title | Study title | Text |
| organization | Publishing organization | Text |
| date | Publication date | YYYY-MM |
| key_findings | Summary of findings | Text |
| url | Link to original study | URL |
| metadata | Additional attributes | key=value pairs |

### Metadata Structure

Common metadata fields:
- **complexity**: Study complexity level (1-5)
- **region**: Geographic focus (global, usa, europe, etc.)
- **subjects**: Academic subjects (math, reading, computer_science, etc.)
- **grade**: Education levels (k-12, college, etc.)

## Customization

The application can be customized in several ways:

- Edit `css/styles.css` to change the visual appearance
- Modify `js/search.js` to adjust search behavior
- Update the filter system in `index.html` to add new filter types

## License

This project is released under the MIT license.

## Acknowledgments

- Fuse.js for the fuzzy search functionality
- GitHub Pages for hosting
- All researchers contributing valuable studies on AI in education 
