# 🚀 Path 3c: Svelte Migration (Experimental)

**Branch**: `claude/svelte-migration-011CUtFExbJfyvRwKeWoyZSx`

This branch explores a complete rewrite of the GenAI Studies Explorer using **Svelte** and modern tooling.

## Why Svelte?

- ⚡ **Compiled** - No runtime, smaller bundles
- 🎯 **Simple** - Less boilerplate than React/Vue
- 🎨 **Scoped styles** - Built-in component styling
- 📦 **Tiny** - 1-3KB runtime vs 40KB+ for React
- 🔥 **Reactive** - Natural reactivity without hooks
- 🛠️ **Great DX** - TypeScript, HMR, great tooling

## Goals

1. ✅ Maintain all current functionality
2. ✅ Improve developer experience
3. ✅ Reduce bundle size
4. ✅ Simplify state management
5. ✅ Better component reusability
6. ✅ Add TypeScript for type safety
7. 📊 Measure performance improvements

## Tech Stack

- **Framework**: Svelte 5
- **Build**: Vite
- **Language**: TypeScript (optional, gradual)
- **State**: Svelte stores
- **Routing**: None (SPA, could add SvelteKit later)
- **Search**: Fuse.js (keep existing)
- **Styling**: CSS with Svelte scoped styles
- **Testing**: Vitest + @testing-library/svelte

## Migration Plan

### Phase 1: Setup (Day 1)
- [ ] Initialize Vite + Svelte project
- [ ] Configure TypeScript
- [ ] Set up dev server
- [ ] Port existing styles
- [ ] Create base layout

### Phase 2: Data Layer (Day 2-3)
- [ ] Port CSV loader
- [ ] Create Svelte stores for state
- [ ] Implement search service
- [ ] Implement filter service
- [ ] Add data loading state

### Phase 3: Components (Day 4-7)
- [ ] `StudyCard.svelte` component
- [ ] `StudyRow.svelte` component
- [ ] `StudyModal.svelte` component
- [ ] `SearchBar.svelte` component
- [ ] `FilterButton.svelte` component
- [ ] `ViewToggle.svelte` component

### Phase 4: Views (Day 8-10)
- [ ] Card view layout
- [ ] List view layout
- [ ] Modal overlay
- [ ] View switching
- [ ] Responsive grid

### Phase 5: Features (Day 11-14)
- [ ] Search functionality
- [ ] Category filtering
- [ ] Active filter display
- [ ] URL state sync
- [ ] View mode persistence
- [ ] Loading states

### Phase 6: Polish (Day 15-20)
- [ ] Animations/transitions
- [ ] Error handling
- [ ] Performance optimization
- [ ] Accessibility (a11y)
- [ ] Mobile optimization
- [ ] Testing

## Comparison Metrics

We'll track:

| Metric | Current (Vanilla) | Target (Svelte) |
|--------|------------------|-----------------|
| Bundle size | ~TBD | < 50KB |
| Initial load | ~TBD | < 500ms |
| Search speed | ~TBD | Similar |
| Lines of code | ~2000 | < 1500 |
| Components | Mixed | ~8 clean |

## Project Structure

```
svelte-app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── StudyCard.svelte
│   │   │   ├── StudyRow.svelte
│   │   │   ├── StudyModal.svelte
│   │   │   ├── FilterButton.svelte
│   │   │   └── SearchBar.svelte
│   │   ├── stores/
│   │   │   ├── studies.ts
│   │   │   ├── filters.ts
│   │   │   └── ui.ts
│   │   ├── services/
│   │   │   ├── data-loader.ts
│   │   │   ├── search.ts
│   │   │   └── filter.ts
│   │   ├── config/
│   │   │   └── domains.ts
│   │   └── utils/
│   │       └── helpers.ts
│   ├── App.svelte
│   └── main.ts
├── public/
│   └── data/
│       └── studies.csv
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
└── package.json
```

## Component Example

```svelte
<script lang="ts">
  import type { Study } from '$lib/types';
  import { getDomainClass } from '$lib/config/domains';

  export let study: Study;

  $: domainClass = getDomainClass(study.categories[0]);
  $: formattedDate = new Date(study.date).toLocaleDateString();
</script>

<div class="study-card {domainClass}">
  <div class="study-header">
    <span class="category-badge">{study.categories[0]}</span>
    <span class="date">{formattedDate}</span>
  </div>

  <h3>{study.title}</h3>
  <p class="organization">{study.organization}</p>
  <p class="description">{study.description}</p>

  <a href={study.url} target="_blank" class="view-btn">
    View Study
  </a>
</div>

<style>
  .study-card {
    border-radius: 10px;
    padding: 1.5rem;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }

  .study-card:hover {
    transform: translateY(-4px);
  }

  /* Domain-specific styling automatically scoped */
  .domain-pk12 { border-top: 4px solid var(--color-pk12); }
  .domain-guidelines { border-top: 4px solid var(--color-guidelines); }
</style>
```

## Store Example

```typescript
// stores/studies.ts
import { writable, derived } from 'svelte/store';
import { searchQuery, categoryFilters } from './filters';
import { searchStudies, filterStudies } from '$lib/services';

export const allStudies = writable<Study[]>([]);
export const loading = writable(true);

// Reactive filtering
export const filteredStudies = derived(
  [allStudies, searchQuery, categoryFilters],
  ([$studies, $query, $categories]) => {
    let results = $studies;

    if ($query) {
      results = searchStudies(results, $query);
    }

    if ($categories.length > 0) {
      results = filterStudies(results, $categories);
    }

    return results;
  }
);
```

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (HMR enabled)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Decision Points

After completion, we'll evaluate:

1. **Bundle size**: Is it meaningfully smaller?
2. **Performance**: Is it faster/comparable?
3. **Maintainability**: Is code clearer?
4. **DX**: Is development easier?
5. **Learning curve**: Is it worth the migration cost?

## Status

🚧 **Not started** - This is an experimental exploration branch

## Notes

- This is a **separate experiment** from Path 2
- No impact on production site
- Can be abandoned if results aren't compelling
- Can inform future architectural decisions
- Fun to explore modern tooling! 🎉
