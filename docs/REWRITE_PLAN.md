# GitHub Pages Site Rewrite Plan
## GenAI Studies Explorer v2.0

**Created:** 2025-11-08
**Status:** Planning Phase
**Target Launch:** TBD

---

## Executive Summary

This document outlines a comprehensive plan to rewrite the GenAI Studies Explorer for improved performance, maintainability, and scalability. The rewrite will reduce initial load time by 40-50%, improve search performance, and establish a modern development workflow.

### Key Goals
- **Performance:** <100KB total bundle size, <1s time to interactive
- **Developer Experience:** Modern tooling with hot module replacement
- **Maintainability:** Clean architecture with TypeScript
- **Scalability:** Support for 100+ studies without performance degradation

---

## Technology Stack Decision

### Recommended: **Option 1 - Lightweight Modern Stack**

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Build Tool** | Vite 5.x | Fast dev server, optimized production builds, built-in TypeScript |
| **Language** | TypeScript | Type safety, better IDE support, catches errors early |
| **Framework** | Vanilla TS + Web Components | No framework overhead, perfect for 30 studies, faster than React |
| **Styling** | SCSS → PostCSS | Variables, nesting, mixins; compiles to optimized CSS |
| **Search** | Custom implementation or bundled Fuse.js | Either works; custom for <50 studies, Fuse.js for flexibility |
| **State Management** | Lightweight custom store | No need for Redux/Zustand with simple app |
| **Testing** | Vitest + Playwright | Fast unit tests, E2E coverage |
| **Deployment** | GitHub Actions → Pages | Automated builds, cache optimization |

### Alternative: **Option 2 - React Stack** (if expanding features)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | React 18 + TypeScript | Component reusability, large ecosystem |
| **Build Tool** | Vite 5.x | Same benefits as Option 1 |
| **Styling** | Tailwind CSS | Utility-first, smaller bundle with purge |
| **State** | Zustand | Lightweight, no boilerplate |
| **Testing** | Vitest + React Testing Library | Standard React testing approach |

**Recommendation:** Start with **Option 1**. If study count exceeds 100 or features become complex, migrate to Option 2.

---

## Project Structure

```
AIforEDUStudies-v2/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Auto-deploy to GitHub Pages
│       └── test.yml            # Run tests on PR
├── public/                     # Static assets (copied as-is)
│   ├── favicon.svg             # Self-hosted favicon
│   └── robots.txt
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── _variables.scss # CSS variables
│   │       ├── _mixins.scss    # Reusable mixins
│   │       ├── _base.scss      # Reset & typography
│   │       ├── _components.scss# Component styles
│   │       └── main.scss       # Entry point
│   ├── components/
│   │   ├── StudyCard.ts        # Study card component
│   │   ├── StudyList.ts        # List view component
│   │   ├── SearchBar.ts        # Search component
│   │   ├── FilterPanel.ts      # Category filters
│   │   ├── Modal.ts            # Study detail modal
│   │   └── ViewToggle.ts       # Card/List toggle
│   ├── core/
│   │   ├── state.ts            # Application state
│   │   ├── router.ts           # URL state management
│   │   └── events.ts           # Event bus
│   ├── data/
│   │   └── studies.json        # Pre-processed study data
│   ├── services/
│   │   ├── search.ts           # Search implementation
│   │   ├── filter.ts           # Filter logic
│   │   └── data-loader.ts      # Data initialization
│   ├── types/
│   │   └── study.ts            # TypeScript interfaces
│   ├── utils/
│   │   ├── dom.ts              # DOM helpers
│   │   ├── formatters.ts       # Date, text formatting
│   │   └── validators.ts       # Input validation
│   ├── main.ts                 # Application entry point
│   └── index.html              # HTML template
├── scripts/
│   ├── csv-to-json.js          # Build-time data processing
│   └── optimize-images.js      # Image optimization
├── tests/
│   ├── unit/                   # Vitest unit tests
│   │   ├── search.test.ts
│   │   ├── filter.test.ts
│   │   └── state.test.ts
│   └── e2e/                    # Playwright E2E tests
│       ├── search.spec.ts
│       └── filters.spec.ts
├── .gitignore
├── package.json
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Test configuration
└── README.md
```

---

## Implementation Phases

### **Phase 1: Foundation Setup** (Est. 4-6 hours)

#### 1.1 Project Initialization
- [ ] Create new branch: `rewrite/v2-foundation`
- [ ] Initialize new Vite project with TypeScript template
- [ ] Set up folder structure as defined above
- [ ] Configure TypeScript with strict mode
- [ ] Set up SCSS with PostCSS

**Commands:**
```bash
# Create new directory for clean start
mkdir aiforedustudies-v2
cd aiforedustudies-v2

# Initialize Vite project
npm create vite@latest . -- --template vanilla-ts

# Install dependencies
npm install

# Install dev dependencies
npm install -D sass postcss autoprefixer

# Install optional dependencies (if using Fuse.js)
npm install fuse.js

# Install testing dependencies
npm install -D vitest @vitest/ui playwright @playwright/test
```

#### 1.2 Vite Configuration
Create optimized build configuration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/AIforEDUStudies/', // GitHub Pages base path
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code if needed
          vendor: ['fuse.js'], // Only if using Fuse.js
        },
      },
    },
    // Performance optimizations
    cssCodeSplit: false, // Single CSS file for small apps
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

#### 1.3 TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"]
}
```

#### 1.4 Data Migration
- [ ] Create `scripts/csv-to-json.js` to convert studies.csv → studies.json
- [ ] Run conversion as part of build process
- [ ] Validate JSON structure
- [ ] Add schema validation

**Script:**
```javascript
// scripts/csv-to-json.js
import fs from 'fs';
import csv from 'csv-parser';

const results = [];

fs.createReadStream('../data/studies.csv')
  .pipe(csv())
  .on('data', (data) => {
    // Transform and validate data
    results.push({
      id: data.id,
      url: data.url,
      categories: data.categories.split(',').map(c => c.trim()),
      title: data.title,
      organization: data.organization,
      date: data.date,
      description: data.description,
    });
  })
  .on('end', () => {
    fs.writeFileSync(
      './src/data/studies.json',
      JSON.stringify(results, null, 2)
    );
    console.log(`✓ Converted ${results.length} studies to JSON`);
  });
```

**Add to package.json:**
```json
{
  "scripts": {
    "preprocess": "node scripts/csv-to-json.js",
    "dev": "npm run preprocess && vite",
    "build": "npm run preprocess && tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

### **Phase 2: Core Architecture** (Est. 6-8 hours)

#### 2.1 Define TypeScript Interfaces

```typescript
// src/types/study.ts
export interface Study {
  id: string;
  url: string;
  categories: string[];
  title: string;
  organization: string;
  date: string;
  description: string;
  // Computed fields
  displayDate?: string;
  categorySlug?: string;
}

export interface AppState {
  studies: Study[];
  filteredStudies: Study[];
  searchQuery: string;
  activeCategories: Set<string>;
  viewMode: 'card' | 'list';
  selectedStudy: Study | null;
}

export interface FilterOptions {
  categories: string[];
  searchQuery: string;
}

export type ViewMode = 'card' | 'list';
```

#### 2.2 State Management

```typescript
// src/core/state.ts
import { AppState, Study } from '@types/study';
import { EventBus } from './events';

class StateManager {
  private state: AppState = {
    studies: [],
    filteredStudies: [],
    searchQuery: '',
    activeCategories: new Set(),
    viewMode: 'card',
    selectedStudy: null,
  };

  private eventBus = EventBus.getInstance();

  // Getters
  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  getStudies(): Study[] {
    return [...this.state.studies];
  }

  getFilteredStudies(): Study[] {
    return [...this.state.filteredStudies];
  }

  // Setters
  setStudies(studies: Study[]): void {
    this.state.studies = studies;
    this.state.filteredStudies = studies;
    this.eventBus.emit('studies:loaded', studies);
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.eventBus.emit('search:changed', query);
  }

  toggleCategory(category: string): void {
    if (this.state.activeCategories.has(category)) {
      this.state.activeCategories.delete(category);
    } else {
      this.state.activeCategories.add(category);
    }
    this.eventBus.emit('filters:changed', this.getActiveFilters());
  }

  setViewMode(mode: 'card' | 'list'): void {
    this.state.viewMode = mode;
    this.eventBus.emit('view:changed', mode);
  }

  setFilteredStudies(studies: Study[]): void {
    this.state.filteredStudies = studies;
    this.eventBus.emit('results:updated', studies);
  }

  private getActiveFilters() {
    return {
      categories: Array.from(this.state.activeCategories),
      searchQuery: this.state.searchQuery,
    };
  }
}

export const state = new StateManager();
```

#### 2.3 Event Bus

```typescript
// src/core/events.ts
type EventHandler = (...args: any[]) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventHandler>> = new Map();

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }
}
```

---

### **Phase 3: Services & Business Logic** (Est. 6-8 hours)

#### 3.1 Search Service (Option A: Custom)

```typescript
// src/services/search.ts
import { Study } from '@types/study';

export class SearchService {
  /**
   * Simple but effective search for small datasets
   */
  search(studies: Study[], query: string): Study[] {
    if (!query.trim()) return studies;

    const lowerQuery = query.toLowerCase();

    return studies.filter(study => {
      // Search in title (highest weight)
      if (study.title.toLowerCase().includes(lowerQuery)) return true;

      // Search in description
      if (study.description.toLowerCase().includes(lowerQuery)) return true;

      // Search in organization
      if (study.organization.toLowerCase().includes(lowerQuery)) return true;

      // Search in categories
      if (study.categories.some(cat => cat.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      return false;
    });
  }

  /**
   * Highlight matching text
   */
  highlight(text: string, query: string): string {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}

export const searchService = new SearchService();
```

#### 3.1 Search Service (Option B: Fuse.js)

```typescript
// src/services/search.ts
import Fuse from 'fuse.js';
import { Study } from '@types/study';

export class SearchService {
  private fuse: Fuse<Study> | null = null;

  initialize(studies: Study[]): void {
    this.fuse = new Fuse(studies, {
      includeScore: true,
      threshold: 0.3,
      keys: [
        { name: 'title', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'categories', weight: 1.5 },
        { name: 'organization', weight: 0.8 },
      ],
    });
  }

  search(query: string): Study[] {
    if (!this.fuse) return [];
    if (!query.trim()) return [];

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }
}

export const searchService = new SearchService();
```

#### 3.2 Filter Service

```typescript
// src/services/filter.ts
import { Study, FilterOptions } from '@types/study';
import { searchService } from './search';

export class FilterService {
  applyFilters(
    studies: Study[],
    options: FilterOptions
  ): Study[] {
    let filtered = [...studies];

    // Apply category filters
    if (options.categories.length > 0) {
      filtered = filtered.filter(study =>
        study.categories.some(cat =>
          options.categories.includes(cat)
        )
      );
    }

    // Apply search filter
    if (options.searchQuery.trim()) {
      filtered = searchService.search(filtered, options.searchQuery);
    }

    return filtered;
  }

  /**
   * Get unique categories from all studies
   */
  getCategories(studies: Study[]): string[] {
    const categories = new Set<string>();
    studies.forEach(study => {
      study.categories.forEach(cat => categories.add(cat));
    });
    return Array.from(categories).sort();
  }
}

export const filterService = new FilterService();
```

#### 3.3 Data Loader

```typescript
// src/services/data-loader.ts
import studiesData from '@/data/studies.json';
import { Study } from '@types/study';

export class DataLoader {
  private normalizeDate(dateStr: string): string {
    // Convert "2024-12" to "December 2024"
    const [year, month] = dateStr.split('-');
    if (!month) return year;

    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  private createCategorySlug(category: string): string {
    return category
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  async loadStudies(): Promise<Study[]> {
    try {
      const studies = studiesData as Study[];

      // Enhance studies with computed fields
      return studies.map(study => ({
        ...study,
        displayDate: this.normalizeDate(study.date),
        categorySlug: this.createCategorySlug(study.categories[0]),
      }));
    } catch (error) {
      console.error('Failed to load studies:', error);
      throw new Error('Could not load studies data');
    }
  }
}

export const dataLoader = new DataLoader();
```

---

### **Phase 4: Component Development** (Est. 10-12 hours)

#### 4.1 Base Component Class

```typescript
// src/components/BaseComponent.ts
export abstract class BaseComponent {
  protected element: HTMLElement;

  constructor(selector?: string) {
    if (selector) {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`Element ${selector} not found`);
      this.element = el as HTMLElement;
    } else {
      this.element = document.createElement('div');
    }
  }

  abstract render(): void;

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
    this.render();
  }

  protected createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    content?: string
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.textContent = content;
    return el;
  }
}
```

#### 4.2 Study Card Component

```typescript
// src/components/StudyCard.ts
import { Study } from '@types/study';
import { BaseComponent } from './BaseComponent';

export class StudyCard extends BaseComponent {
  constructor(private study: Study) {
    super();
    this.element.className = 'study-card';
    this.element.dataset.category = study.categorySlug || '';
  }

  render(): void {
    this.element.innerHTML = `
      <div class="study-header">
        <span class="category-badge">${this.study.categories[0]}</span>
      </div>
      <h3 class="study-title">${this.escapeHtml(this.study.title)}</h3>
      <p class="study-org">${this.escapeHtml(this.study.organization)}</p>
      <p class="study-date">${this.study.displayDate}</p>
      <p class="study-desc">${this.escapeHtml(this.study.description)}</p>
      <div class="study-footer">
        <a href="${this.study.url}"
           target="_blank"
           rel="noopener noreferrer"
           class="view-study-btn">
          View Study
        </a>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
```

#### 4.3 Search Bar Component

```typescript
// src/components/SearchBar.ts
import { BaseComponent } from './BaseComponent';
import { EventBus } from '@/core/events';

export class SearchBar extends BaseComponent {
  private input!: HTMLInputElement;
  private button!: HTMLButtonElement;
  private eventBus = EventBus.getInstance();

  constructor() {
    super();
    this.element.className = 'search-container';
  }

  render(): void {
    this.input = this.createElement('input', 'search-input');
    this.input.type = 'text';
    this.input.placeholder = 'Search studies by title, description, or keywords...';

    this.button = this.createElement('button', 'search-button', 'Search');

    this.element.appendChild(this.input);
    this.element.appendChild(this.button);

    this.attachEvents();
  }

  private attachEvents(): void {
    const performSearch = () => {
      const query = this.input.value.trim();
      this.eventBus.emit('search:triggered', query);
    };

    this.button.addEventListener('click', performSearch);
    this.input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // Debounced live search (optional)
    let debounceTimer: number;
    this.input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.eventBus.emit('search:input', this.input.value);
      }, 300);
    });
  }
}
```

#### 4.4 Filter Panel Component

```typescript
// src/components/FilterPanel.ts
import { BaseComponent } from './BaseComponent';
import { EventBus } from '@/core/events';

export class FilterPanel extends BaseComponent {
  private categories: string[] = [];
  private eventBus = EventBus.getInstance();

  constructor(categories: string[]) {
    super();
    this.categories = categories;
    this.element.className = 'filter-panel';
  }

  render(): void {
    this.element.innerHTML = `
      <div id="category-filters"></div>
    `;

    const container = this.element.querySelector('#category-filters')!;

    this.categories.forEach(category => {
      const button = this.createElement('button', 'filter-button domain-button');
      button.dataset.category = category;

      const span = this.createElement('span', '', category);
      button.appendChild(span);

      button.addEventListener('click', () => {
        button.classList.toggle('active');
        this.eventBus.emit('filter:toggled', category);
      });

      container.appendChild(button);
    });
  }
}
```

#### 4.5 Studies Grid/List Component

```typescript
// src/components/StudiesView.ts
import { Study } from '@types/study';
import { BaseComponent } from './BaseComponent';
import { StudyCard } from './StudyCard';

export class StudiesView extends BaseComponent {
  private viewMode: 'card' | 'list' = 'card';

  constructor() {
    super();
    this.element.id = 'studies-container';
  }

  render(): void {
    // Will be called when studies update
  }

  updateStudies(studies: Study[]): void {
    this.element.innerHTML = '';

    if (studies.length === 0) {
      this.renderEmptyState();
      return;
    }

    if (this.viewMode === 'card') {
      this.renderCardView(studies);
    } else {
      this.renderListView(studies);
    }
  }

  setViewMode(mode: 'card' | 'list'): void {
    this.viewMode = mode;
    this.element.className = mode === 'card' ? 'studies-grid' : 'studies-list';
  }

  private renderCardView(studies: Study[]): void {
    this.element.className = 'studies-grid';

    studies.forEach(study => {
      const card = new StudyCard(study);
      card.mount(this.element);
    });
  }

  private renderListView(studies: Study[]): void {
    this.element.className = 'studies-list';

    studies.forEach(study => {
      const row = this.createElement('div', 'study-row');
      row.innerHTML = `
        <div class="color-indicator" data-category="${study.categorySlug}"></div>
        <h3 class="row-title">${study.title}</h3>
        <a href="${study.url}"
           target="_blank"
           rel="noopener noreferrer"
           class="view-study-btn">
          View Study
        </a>
      `;
      this.element.appendChild(row);
    });
  }

  private renderEmptyState(): void {
    this.element.innerHTML = `
      <div class="no-results">
        <p>No studies found matching your filters.</p>
        <p>Try adjusting your search or clearing filters.</p>
      </div>
    `;
  }
}
```

---

### **Phase 5: CSS Refactoring** (Est. 4-6 hours)

#### 5.1 SCSS Structure

```scss
// src/assets/styles/_variables.scss
// Design tokens
$colors: (
  primary: #3498db,
  primary-dark: #2980b9,
  secondary: #2ecc71,
  text: #333333,
  text-muted: #7f8c8d,
  background: #ffffff,
  background-light: #f9f9f9,
  border: #e0e0e0,
);

$domain-colors: (
  pk12: #4285F4,
  guidelines: #EA4335,
  performance: #34A853,
  workforce: #E37400,
);

$spacing: (
  xs: 0.3rem,
  sm: 0.5rem,
  md: 1rem,
  lg: 1.5rem,
  xl: 2rem,
);

$breakpoints: (
  mobile: 600px,
  tablet: 768px,
  desktop: 1200px,
);

// Helper function
@function color($key) {
  @return map-get($colors, $key);
}

@function spacing($key) {
  @return map-get($spacing, $key);
}
```

```scss
// src/assets/styles/_mixins.scss
@mixin respond-to($breakpoint) {
  @media (min-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}

@mixin card-hover {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
```

```scss
// src/assets/styles/_base.scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: color(text);
  background-color: color(background);
  max-width: 1200px;
  margin: 0 auto;
  padding: spacing(md);
}
```

```scss
// src/assets/styles/_components.scss
.study-card {
  border: 1px solid color(border);
  border-radius: 10px;
  padding: spacing(md);
  background-color: color(background);
  @include card-hover;
}

.studies-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: spacing(lg);

  @include respond-to(tablet) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include respond-to(desktop) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

**Target CSS size: ~15KB (down from 27KB)**

---

### **Phase 6: Main Application** (Est. 4 hours)

```typescript
// src/main.ts
import { state } from '@/core/state';
import { EventBus } from '@/core/events';
import { dataLoader } from '@services/data-loader';
import { filterService } from '@services/filter';
import { SearchBar } from '@components/SearchBar';
import { FilterPanel } from '@components/FilterPanel';
import { StudiesView } from '@components/StudiesView';
import '@/assets/styles/main.scss';

class App {
  private eventBus = EventBus.getInstance();
  private studiesView!: StudiesView;

  async initialize() {
    try {
      // Load studies
      const studies = await dataLoader.loadStudies();
      state.setStudies(studies);

      // Initialize components
      this.initializeComponents(studies);

      // Set up event listeners
      this.setupEventListeners();

      console.log('✓ Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to load application');
    }
  }

  private initializeComponents(studies: Study[]) {
    // Search bar
    const searchBar = new SearchBar();
    searchBar.mount(document.querySelector('.search-section')!);

    // Filter panel
    const categories = filterService.getCategories(studies);
    const filterPanel = new FilterPanel(categories);
    filterPanel.mount(document.querySelector('.filters-section')!);

    // Studies view
    this.studiesView = new StudiesView();
    this.studiesView.mount(document.querySelector('.results-section')!);
    this.studiesView.updateStudies(studies);
  }

  private setupEventListeners() {
    // Search events
    this.eventBus.on('search:triggered', (query: string) => {
      state.setSearchQuery(query);
      this.updateResults();
    });

    // Filter events
    this.eventBus.on('filter:toggled', (category: string) => {
      state.toggleCategory(category);
      this.updateResults();
    });

    // View mode events
    this.eventBus.on('view:changed', (mode: 'card' | 'list') => {
      this.studiesView.setViewMode(mode);
      this.studiesView.updateStudies(state.getFilteredStudies());
    });
  }

  private updateResults() {
    const currentState = state.getState();
    const filtered = filterService.applyFilters(
      currentState.studies,
      {
        categories: Array.from(currentState.activeCategories),
        searchQuery: currentState.searchQuery,
      }
    );

    state.setFilteredStudies(filtered);
    this.studiesView.updateStudies(filtered);
  }

  private showError(message: string) {
    document.body.innerHTML = `
      <div class="error-message">
        ${message}
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});
```

---

### **Phase 7: Testing** (Est. 6-8 hours)

#### 7.1 Unit Tests with Vitest

```typescript
// tests/unit/search.test.ts
import { describe, it, expect } from 'vitest';
import { SearchService } from '@services/search';
import { Study } from '@types/study';

describe('SearchService', () => {
  const mockStudies: Study[] = [
    {
      id: 'study-01',
      title: 'Teachers Love AI',
      description: 'Study about AI adoption',
      organization: 'CDT',
      categories: ['AI Use'],
      date: '2025-01',
      url: 'https://example.com',
    },
    // ... more mock data
  ];

  it('should find studies by title', () => {
    const service = new SearchService();
    const results = service.search(mockStudies, 'teachers');

    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Teachers');
  });

  it('should return all studies for empty query', () => {
    const service = new SearchService();
    const results = service.search(mockStudies, '');

    expect(results).toHaveLength(mockStudies.length);
  });

  it('should search case-insensitively', () => {
    const service = new SearchService();
    const results = service.search(mockStudies, 'TEACHERS');

    expect(results.length).toBeGreaterThan(0);
  });
});
```

```typescript
// tests/unit/filter.test.ts
import { describe, it, expect } from 'vitest';
import { FilterService } from '@services/filter';

describe('FilterService', () => {
  it('should filter by category', () => {
    const service = new FilterService();
    const filtered = service.applyFilters(mockStudies, {
      categories: ['AI Use'],
      searchQuery: '',
    });

    expect(filtered.every(s => s.categories.includes('AI Use'))).toBe(true);
  });

  it('should extract unique categories', () => {
    const service = new FilterService();
    const categories = service.getCategories(mockStudies);

    expect(categories).toBeInstanceOf(Array);
    expect(new Set(categories).size).toBe(categories.length);
  });
});
```

#### 7.2 E2E Tests with Playwright

```typescript
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should search and filter results', async ({ page }) => {
    // Type in search box
    await page.fill('#search-input', 'teachers');
    await page.click('#search-button');

    // Wait for results
    await page.waitForSelector('.study-card');

    // Verify results contain search term
    const titles = await page.$$eval('.study-title',
      els => els.map(el => el.textContent)
    );

    expect(titles.some(title =>
      title?.toLowerCase().includes('teachers')
    )).toBe(true);
  });

  test('should toggle view modes', async ({ page }) => {
    await page.click('#card-view-btn');
    await expect(page.locator('.studies-grid')).toBeVisible();

    await page.click('#list-view-btn');
    await expect(page.locator('.studies-list')).toBeVisible();
  });
});
```

---

### **Phase 8: Deployment & CI/CD** (Est. 2-3 hours)

#### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 8.2 Performance Budget

```javascript
// .github/workflows/lighthouse.yml
# Add Lighthouse CI for performance monitoring
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000
          budgetPath: ./budget.json
          uploadArtifacts: true
```

```json
// budget.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "total-byte-weight": ["error", { "maxNumericValue": 102400 }]
      }
    }
  }
}
```

---

## Migration Strategy

### **Option A: Clean Cutover** (Recommended)
1. Complete rewrite in new branch
2. Test thoroughly in preview environment
3. Switch main branch when ready
4. Archive old code in `legacy/` folder

**Pros:** Clean break, no hybrid complexity
**Cons:** Requires complete rebuild before launch

### **Option B: Incremental Migration**
1. Start with build system (Vite)
2. Gradually port components one by one
3. Maintain backward compatibility during transition

**Pros:** Lower risk, gradual improvements
**Cons:** Complexity of maintaining two systems

**Recommendation:** Use **Option A** - the codebase is small enough for clean rewrite.

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Foundation Setup | 4-6 hours | None |
| 2. Core Architecture | 6-8 hours | Phase 1 |
| 3. Services & Logic | 6-8 hours | Phase 2 |
| 4. Components | 10-12 hours | Phase 2, 3 |
| 5. CSS Refactoring | 4-6 hours | Phase 4 |
| 6. Main Application | 4 hours | Phase 4, 5 |
| 7. Testing | 6-8 hours | Phase 6 |
| 8. Deployment | 2-3 hours | Phase 7 |
| **Total** | **42-55 hours** | ~1-2 weeks |

**With parallel work on CSS/Components:** ~35-45 hours

---

## Performance Targets

### Before vs After

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Total Bundle Size** | ~195KB | <100KB | 48% reduction |
| **HTTP Requests** | 10-12 | 3-5 | 60% reduction |
| **First Contentful Paint** | ~800ms | <500ms | 40% faster |
| **Time to Interactive** | ~1.5s | <1s | 33% faster |
| **Search Ready Time** | ~2s | <500ms | 75% faster |
| **Lighthouse Score** | ~75 | >90 | +20% |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Timeline overrun | Medium | Medium | Phased approach, MVP first |
| Breaking changes | Low | High | Comprehensive testing, preview deploy |
| Performance regression | Low | High | Performance budgets, Lighthouse CI |
| Data migration issues | Low | Medium | Validate JSON schema, test thoroughly |
| Browser compatibility | Low | Low | Use polyfills, test in IE11 if needed |

---

## Success Criteria

### Must Have
- [ ] All 30 studies display correctly
- [ ] Search works as well or better than current
- [ ] Filters function identically
- [ ] Card/List view toggle works
- [ ] All links functional
- [ ] Mobile responsive
- [ ] Lighthouse score >90

### Should Have
- [ ] <100KB total bundle size
- [ ] <1s time to interactive
- [ ] Automated tests passing
- [ ] CI/CD pipeline functional

### Nice to Have
- [ ] Service worker for offline
- [ ] Dark mode
- [ ] Advanced search operators
- [ ] Export functionality

---

## Next Steps

1. **Review & Approve** this plan
2. **Create new branch:** `rewrite/v2-foundation`
3. **Set up project:** Run Phase 1 commands
4. **Begin Phase 2:** Implement core architecture
5. **Weekly check-ins:** Review progress and adjust

---

## Questions to Resolve

1. **Framework choice:** Stick with Vanilla TS or use React?
2. **Search library:** Custom implementation or bundle Fuse.js?
3. **CSS approach:** SCSS with modules or switch to Tailwind?
4. **Testing priority:** Focus on E2E or unit tests first?
5. **Timeline:** When do you want to launch v2?

---

## Appendix: Quick Wins (Before Full Rewrite)

If you want improvements NOW while planning rewrite:

1. **Minify CSS** (5 min)
   ```bash
   npx csso css/styles.css -o css/styles.min.css
   ```

2. **Convert CSV to JSON** (10 min)
   ```bash
   node scripts/csv-to-json.js
   ```

3. **Remove console.log** (15 min)
   - Find/replace all console.log with empty string

4. **Bundle Fuse.js** (20 min)
   - Download Fuse.js to `/js/vendor/`
   - Update import path

5. **Self-host favicon** (5 min)
   - Download favicon.ico to `/public/`
   - Update HTML link

**Total time:** ~1 hour
**Expected improvement:** 25-30% faster load

---

*Plan Version: 1.0*
*Last Updated: 2025-11-08*
