# 🚧 Construction Management Plan

## Overview
We're refactoring the GenAI Studies Explorer using a **Strangler Fig Pattern** to ensure the site remains functional during construction.

## Parallel Development Tracks

### Branch: `claude/refactor-page-overview-011CUtFExbJfyvRwKeWoyZSx`
**Path 2: Moderate Restructuring** (Vanilla JS, Service Layer)
- Timeline: 1-2 weeks
- Strategy: Incremental migration, old code works alongside new

### Branch: `claude/svelte-migration-011CUtFExbJfyvRwKeWoyZSx`
**Path 3c: Svelte Migration** (Experimental, full rewrite)
- Timeline: 3-4 weeks
- Strategy: Clean slate, explore modern tooling

---

## Path 2 Construction Strategy

### Phase 1: Foundation (Days 1-2) ✅ Safe Zone
**Goal**: Build new infrastructure without touching existing code

```
js/
├── main.js ← KEEP AS-IS (works with old modules)
├── main-v2.js ← NEW (uses new modules, commented out)
├── modules/ ← OLD (keep working)
│   ├── state.js
│   ├── ui-handlers.js
│   └── ...
└── v2/ ← NEW (build in parallel)
    ├── core/
    ├── services/
    ├── views/
    └── components/
```

**Tasks**:
- [x] Create `js/v2/` directory structure
- [ ] Build `core/config.js` with domain mappings
- [ ] Build `core/event-bus.js` for decoupled events
- [ ] Build `services/search-service.js` wrapping existing search
- [ ] Build `services/filter-service.js` centralizing filter logic
- [ ] Test new modules in isolation (no site impact)

**Testing**: Import new modules in browser console, verify APIs

---

### Phase 2: View Layer (Days 3-4) ⚠️ Transition Zone
**Goal**: Create new view system, enable A/B testing

```html
<!-- index.html -->
<body data-version="v1"> <!-- Switch to v2 when ready -->
  <div id="app-v1" class="active"><!-- Current working app --></div>
  <div id="app-v2" class="hidden"><!-- New app (hidden) --></div>
</body>
```

**Tasks**:
- [ ] Create `v2/views/view-manager.js`
- [ ] Create `v2/views/card-view.js` + `list-view.js`
- [ ] Create `v2/components/` with consistent DOM element returns
- [ ] Add URL param `?version=v2` to test new version
- [ ] Verify both versions work side-by-side

**Testing**: Toggle between versions, compare output

---

### Phase 3: Integration (Days 5-6) 🔄 Migration Zone
**Goal**: Wire new modules to main app, keep fallbacks

```javascript
// main.js - Gradual migration
import AppState from './modules/state.js'; // OLD - keep
import { setupEventListeners } from './modules/ui-handlers.js'; // OLD - keep

// NEW - add alongside old
import { SearchService } from './v2/services/search-service.js';
import { ViewManager } from './v2/views/view-manager.js';

// Feature flag: use new modules if enabled
const USE_V2_SEARCH = true;
const USE_V2_VIEWS = false;

async function search(query) {
  if (USE_V2_SEARCH) {
    return searchService.search(query);
  } else {
    return oldSearch(query); // fallback
  }
}
```

**Tasks**:
- [ ] Add feature flags to `main.js`
- [ ] Wire search service with flag
- [ ] Wire view manager with flag
- [ ] Enable flags one by one, test each
- [ ] Monitor for errors, rollback if needed

**Testing**: Incremental flag activation with monitoring

---

### Phase 4: State Migration (Days 7-8) 🎯 Enhancement Zone
**Goal**: Enhance AppState with reactive features

```javascript
// v2/core/state-v2.js - Enhanced state
class AppStateV2 extends AppState {
  constructor() {
    super();
    this.eventBus = EventBus;
  }

  setSearchQuery(query) {
    super.setSearchQuery(query);
    this.eventBus.emit('search:changed', query);
  }
}

// Gradual migration
export const state = USE_V2_STATE ? new AppStateV2() : AppState;
```

**Tasks**:
- [ ] Create enhanced state in `v2/core/state-v2.js`
- [ ] Add reactive updates via event bus
- [ ] Migrate listeners incrementally
- [ ] Remove old manual update calls
- [ ] Clean up redundant code

---

### Phase 5: Cleanup (Days 9-10) 🧹 Demolition Zone
**Goal**: Remove old code, promote v2 to main

**Tasks**:
- [ ] Move `modules/` to `modules-legacy/` (backup)
- [ ] Move `v2/` contents to root `js/` structure
- [ ] Update all imports in `main.js`
- [ ] Remove feature flags
- [ ] Remove `?version=` URL param logic
- [ ] Delete legacy code after 1 week of stable operation
- [ ] Update documentation

---

## Safety Mechanisms

### 1. Version Toggle
```javascript
// Add to index.html
const urlParams = new URLSearchParams(window.location.search);
const version = urlParams.get('version') || 'v1';
document.body.dataset.version = version;
```

Access old version: `index.html?version=v1`
Access new version: `index.html?version=v2`

### 2. Feature Flags
```javascript
// config/features.js
export const FEATURES = {
  USE_V2_SEARCH: false,
  USE_V2_VIEWS: false,
  USE_V2_STATE: false,
  USE_V2_FILTERS: false
};
```

### 3. Error Boundaries
```javascript
// Wrap new code in try-catch, fallback to old
try {
  await newSearchService.search(query);
} catch (error) {
  console.error('V2 search failed, using V1 fallback', error);
  return oldSearch(query);
}
```

### 4. Git Safety
- Commit after each phase
- Tag stable points: `git tag v2-phase-1-stable`
- Easy rollback: `git reset --hard v2-phase-1-stable`

---

## Rollback Plan

If something breaks:

1. **Immediate**: Set feature flag to `false`
2. **Quick**: Add `?version=v1` to URL
3. **Emergency**: `git revert HEAD` or reset to last stable tag
4. **Nuclear**: Merge from main branch

---

## Success Criteria

Each phase must pass before moving to next:

- ✅ No console errors
- ✅ All studies display correctly
- ✅ Search returns expected results
- ✅ Filters work correctly
- ✅ Modal opens/closes
- ✅ View toggle works
- ✅ Mobile responsive
- ✅ Performance not degraded (< 50ms slower)

---

## Communication

Each commit message will indicate phase and status:
```
[Path2-Phase1] Add domain config module
[Path2-Phase2-WIP] Card view component (not active)
[Path2-Phase3] Enable v2 search via feature flag
[Path2-Rollback] Revert search service due to bug
```

---

## Timeline

| Phase | Days | Safe to Merge? | Notes |
|-------|------|---------------|-------|
| 1 | 1-2 | ✅ Yes | New code, no impact |
| 2 | 3-4 | ✅ Yes | Hidden, togglable |
| 3 | 5-6 | ⚠️ Caution | Feature flags protect |
| 4 | 7-8 | ⚠️ Caution | Enhanced but compatible |
| 5 | 9-10 | ✅ Yes | Cleanup only |

**Total**: ~10 working days with safety at every step

---

## Path 3c (Svelte) Notes

Separate branch, completely independent. Will explore:
- Vite build tooling
- Svelte components
- SvelteKit routing (optional)
- Modern dev experience
- Bundle size comparison

No risk to main site - purely experimental!
