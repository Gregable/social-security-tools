# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application (TypeScript) that calculates Social Security retirement benefits for https://ssa.tools/. It emphasizes precision, privacy (client-side only), and educational value. All user data (earnings, birthdates) is ephemeral and client-side only.

## Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run Vitest tests
npm run quality      # Run Biome linting + svelte-check (run before finalizing changes)
npm run storybook    # Start Storybook for UI component development
npm run fix          # Auto-fix linting issues with Biome
```

To run a single test file:

```bash
npm test src/test/money.test.ts
```

Note: Fuzz tests are excluded by default. Run manually with:

```bash
npm test src/test/strategy/fuzz.test.ts
```

## Architecture

### Core Domain Classes (`src/lib/`)

The core logic strictly follows SSA rules:

- **`Money`** (`money.ts`): Use for ALL financial calculations. Stores values as integer cents to prevent floating-point errors. Never use raw numbers for currency.
- **`MonthDate` / `MonthDuration`** (`month-time.ts`): Use for ALL time calculations. SSA calculations operate on months, not days. JS `Date` objects are rarely appropriate for domain logic.
- **`Recipient`** (`recipient.ts`): Central user model. Uses a pub/sub pattern with private `val_` fields and public getters/setters that call `publish_()` to notify Svelte subscribers. Implements Svelte store contract.
- **`EarningRecord`** (`earning-record.ts`): Handles parsing and indexing of SSA earnings history.
- **`PrimaryInsuranceAmount`** (`pia.ts`): Calculates PIA using bend points and COLA adjustments.
- **`constants.ts`**: Annual SSA constants (bend points, COLA, wage indices, retirement ages). Requires annual updates.

### State Management (`src/lib/context.ts`)

Global application state uses Svelte stores:

- `context.recipient` / `context.spouse`: The two possible Recipients
- `recipientFilingDate` / `spouseFilingDate`: Writable stores for filing dates
- Session persistence via `sessionStorage` (not server-side)

### Strategy Module (`src/lib/strategy/`)

Filing date optimization logic:

- `calculations/`: Core calculation logic (benefit periods, alternative strategies)
- `data/`: Data fetching (Treasury yields)
- `ui/`: Display formatting and colors

### Routing

Standard SvelteKit file-based routing in `src/routes/`:

- `/calculator`: Main calculator page
- `/strategy`: Filing strategy optimizer
- `/guides/*`: Educational content pages

### Testing

- Unit tests in `src/test/` using Vitest
- Storybook stories in `src/stories/` for UI components
- Coverage thresholds: 70% lines/functions/statements, 60% branches

### Data Files

- `data/`: SSA life tables (CSV files for mortality calculations)
- `src/lib/pastes/`: Sample SSA paste data for testing

## Critical Conventions

- **Privacy First**: Never persist, log, or transmit user data (earnings, birthdates)
- Use `Money.from()` for dollars, `Money.fromCents()` for cents
- Use `MonthDate.initFromYearsMonths()` or `MonthDuration.initFromYearsMonths()` for dates
- Use `<RecipientName r={recipient} />` component to display names consistently
- When updating SSA constants annually, update all related values in `constants.ts`

## Guide Writing

New guides go in `/src/routes/guides/{topic}/+page.svelte`:

- Use `date --iso-8601` for `published` and `modified` fields in metadata
- Include schema.org structured data for SEO
- Set `schema.imageAlt` and `schema.tags` for social media cards
- Update the index at `/src/routes/guides/+page.svelte`
