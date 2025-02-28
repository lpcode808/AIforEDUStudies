# AI for EDU Studies

A web application for browsing and filtering AI studies in education.

## Features

- **Dual View Modes**: Switch between card and list views for study results
- **Advanced Filtering**: Filter studies by multiple categories
- **Responsive Design**: Optimized for desktop, tablet and mobile devices
- **Search Functionality**: Find studies by keyword
- **Study Details**: View comprehensive details for each study in a modal

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/lpcode808/AIforEDUStudies.git
   ```

2. Navigate to the project directory:
   ```
   cd AIforEDUStudies
   ```

3. Start the server:
   ```
   npx http-server -c-1 -p 8083
   ```
   This starts the server with caching disabled (`-c-1`) on port 8083.

4. Open the application in your browser:
   ```
   http://localhost:8083
   ```

## Project Structure

- `index.html`: Main entry point
- `css/`: Stylesheets
  - `styles.css`: Main stylesheet with responsive design
  - `modal.css`: Styles for the study details modal
- `js/`: JavaScript modules
  - `main.js`: Application initialization
  - `modules/`: Modular components
    - `app-state.js`: State management
    - `components.js`: UI component builders
    - `data-manager.js`: Data handling
    - `ui-handlers.js`: Event listeners and UI updates
- `data/`: JSON data files
- `docs/`: Documentation
  - `lessonsLearned.md`: Development insights and best practices

## Browser Compatibility

This application is designed to work with modern browsers that support:
- ES6 JavaScript
- CSS Grid and Flexbox
- Fetch API

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT
