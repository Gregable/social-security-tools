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

**Navigation from Home Page**: Users can also enter the integration via the home
page. The hash parameter is automatically preserved when navigating from the
home page to the calculator:

```text
https://ssa.tools/#integration=opensocialsecurity.com
```

When users click "Get Started" or any calculator links from the home page, the
integration parameter will be carried through to the calculator page.

### User Experience

When an integration is active:

1. **Intro Banner**: A small banner appears at the top of both the home page and
   calculator page (after the header) informing the user that the integration is
   active and that they'll see additional information at the end of their
   report. On the calculator page, the banner automatically disappears once the
   user has entered their earnings data (or loaded demo data), providing a clean
   experience during data confirmation and report viewing.

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

### Linopt (linopt.com)

- **Intro Banner**: Informs users that they'll see their PIA information for use
  with Linopt
- **Report End**: Displays the user's Primary Insurance Amount(s) and provides a
  link to Linopt for retirement income optimization. Values are
  inflation-adjusted to future dollars using Linopt's 2.5% annual inflation
  rate. Displays filing ages rounded to nearest year, with yearly benefit
  amounts in thousands.

### FIRECalc (firecalc.com)

- **Intro Banner**: Informs users that they'll see their Social Security
  calculations for use with FIRECalc
- **Report End**: Displays annual Social Security amounts in today's dollars
  with starting years (not ages). For couples, includes a toggle to choose
  between personal benefit only or combined personal + spousal benefit for the
  lower earner. No inflation adjustment is applied since FIRECalc expects
  amounts in today's dollars.

## Testing

Unit tests for the integration system are in `src/test/integrations.test.ts`.
Run with:

```bash
npm test -- src/test/integrations.test.ts
```

## Implementation Details

### Root Page Integration

The root page (`src/routes/+page.svelte`) displays the intro banner when an
integration is active:

1. On mount, it subscribes to the active integration state
2. It dynamically loads the IntroBanner component based on the active
   integration
3. The banner is conditionally rendered after the header

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

Integration sections are visually distinguished in the sidebar with the
integration's favicon icon.

### Hash Parameter Preservation

The integration system preserves the active integration across page navigation
within the same browser session using `sessionStorage`:

1. **Initial Load**: When a user visits any page with `#integration=...` in the
   URL, the integration ID is saved to `sessionStorage`
2. **Root Layout**: The root layout (`src/routes/+layout.svelte`) initializes
   the integration on every page load by checking:
   - First priority: URL hash parameter (explicit)
   - Second priority: `sessionStorage` (persisted from earlier navigation)
3. **Session Persistence**: The integration remains active for the entire
   browser session, even when navigating to pages without the hash parameter
4. **Navigation Flow Example**:
   - User visits `https://ssa.tools/#integration=opensocialsecurity.com`
   - Visits `/about` → integration persists (from sessionStorage)
   - Visits `/guides` → integration persists (from sessionStorage)
   - Visits `/calculator` → integration is active, shows banner and report end

This allows users to browse the site naturally without losing their integration
context, while still allowing explicit URL parameters to take precedence.

### Backward Compatibility

The hard-coded Open Social Security reference in `CombinedChart.svelte` is now
conditional - it only displays when no integration is active, serving as a
fallback for users who navigate directly to the calculator without an
integration parameter.
