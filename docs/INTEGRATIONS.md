# Third-Party Integration System

This document describes the third-party integration system for customized
calculator experiences.

## Overview

The integration system allows predetermined third-party sites to provide
customized content when users navigate to the calculator from their site. This
is triggered by a URL parameter.

## Usage

### URL Format

To activate an integration, add the `integration` parameter to the URL hash:

```text
https://ssa.tools/calculator#integration=opensocialsecurity.com
```

The integration parameter can be combined with other hash parameters:

```text
https://ssa.tools/calculator#integration=opensocialsecurity.com&other=value
```

### User Experience

When an integration is active:

1. **Intro Banner**: A small banner appears at the top of the calculator page
   (after the header, before the paste flow) informing the user that the
   integration is active and that they'll see additional information at the end
   of their report.

2. **Report End Section**: After the user enters their data and completes the
   report, a new section appears immediately before the "More Reading" section.
   This section is automatically added to the sidebar navigation.

## Architecture

### Components

#### Configuration (`src/lib/integrations/config.ts`)

- Central registry of allowed integrations
- Type-safe configuration for each integration
- Dynamic component loading functions

#### Context (`src/lib/integrations/context.ts`)

- Svelte store for active integration state
- URL hash parsing and validation
- Initialization and cleanup functions

#### Integration Components (`src/lib/components/integrations/<sitename>/`)

Each integration has two components:

- `IntroBanner.svelte`: Shown at the top when integration is active
- `ReportEnd.svelte`: Shown at the end of the report before "More Reading"

### Security

Only whitelisted integrations (defined in `INTEGRATIONS` registry) can be
activated. Any unknown integration ID in the URL will be rejected with a console
warning.

## Adding a New Integration

1. **Register the integration** in `src/lib/integrations/config.ts`:

   ```typescript
   'newsite.com': {
     id: 'newsite.com',
     displayName: 'New Site Name',
     reportEndLabel: 'Section Title for Sidebar',
   }
   ```

2. **Create integration components**:
   - `src/lib/components/integrations/newsite.com/IntroBanner.svelte`
   - `src/lib/components/integrations/newsite.com/ReportEnd.svelte`

3. **Component Props**:
   - `IntroBanner.svelte`: No props required
   - `ReportEnd.svelte`: Receives `recipient` and `spouse` (nullable) as props

4. **Test**: Add the integration ID to the URL hash and verify both components
   appear correctly.

## Current Integrations

### Open Social Security (opensocialsecurity.com)

- **Intro Banner**: Informs users that they'll see information about maximizing
  lifetime benefits
- **Report End**: Provides context about filing date strategies and a
  pre-populated link back to Open Social Security with the user's data

## Testing

Unit tests for the integration system are in `src/test/integrations.test.ts`.
Run with:

```bash
npm test -- src/test/integrations.test.ts
```

## Implementation Details

### Calculator Page Integration

The calculator page (`src/routes/calculator/+page.svelte`) handles the
integration display:

1. On mount, it initializes the integration context by parsing the URL hash
2. It dynamically loads the appropriate components based on the active
   integration
3. Components are conditionally rendered based on the integration state

### Sidebar Integration

Integration sections automatically appear in the sidebar navigation because
they're wrapped in `SidebarSection` components. The `Sidebar` component
dynamically discovers all sections with the `data-sidebarsection` attribute.

### Backward Compatibility

The hard-coded Open Social Security reference in `CombinedChart.svelte` is now
conditional - it only displays when no integration is active, serving as a
fallback for users who navigate directly to the calculator without an
integration parameter.
