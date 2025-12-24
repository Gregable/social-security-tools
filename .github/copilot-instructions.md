# Social Security Tools - AI Instructions

## Project Overview

This is a SvelteKit application (TypeScript) that calculates Social Security retirement benefits. It emphasizes precision, privacy (client-side only), and educational value.

## Architecture & Core Domain

The core logic resides in `src/lib/` and strictly follows SSA rules.

- **Currency**: **ALWAYS** use the `Money` class (`src/lib/money.ts`) for financial calculations. It uses integer cents to prevent floating-point errors. Never use raw numbers for currency.
- **Time**: **ALWAYS** use `MonthDate` or `MonthDuration` (`src/lib/month-time.ts`). SSA calculations operate on months, not days. JS `Date` objects are rarely appropriate for domain logic.
- **State Management**: The `Recipient` class (`src/lib/recipient.ts`) is the central model. It uses a pattern of private fields (`val_`) with public getters/setters that trigger `publish_()` to notify subscribers of changes.
- **Earnings**: `EarningRecord` (`src/lib/earning-record.ts`) handles parsing and indexing of SSA earnings history.
- **Strategy**: `src/lib/strategy/` contains logic for optimizing filing dates (e.g., `BenefitPeriod`, `Strategy`).

## Critical Conventions

- **Privacy**: User data (earnings, birthdates) is ephemeral and client-side only. **NEVER** write code that persists, logs, or transmits this data.
- **UI Components**:
  - Use `<RecipientName r={recipient} />` to display names consistently.
  - Components often have corresponding Storybook stories in `src/stories/`.
- **Data Sources**: `src/lib/constants.ts` holds annual SSA constants (bend points, COLA). `data/` contains life tables.
- **Routing**: Follow standard SvelteKit file-based routing in `src/routes/`.

## Developer Workflow

- **Build & Dev**: `npm run dev`, `npm run build`.
- **Testing**: `npm run test` (Vitest) for logic. `npm run storybook` for UI.
- **Quality**: `npm run quality` runs Biome for formatting, linting, and type checking. Run this before finalizing changes.

## Key Files

- `src/lib/money.ts`: Essential currency math wrapper.
- `src/lib/month-time.ts`: Essential time math wrapper.
- `src/lib/recipient.ts`: Primary user state object.
- `src/lib/constants.ts`: SSA configuration values.

## Guide Writing Guidelines:

- **Always use current date for new guides**: Use the `date --iso-8601` command
  to get the current date for both `published` and `modified` fields in guide
  metadata
- Guides should be placed in `/src/routes/guides/{topic}/+page.svelte` following
  SvelteKit routing conventions
- Include proper schema.org structured data for SEO (Article, author,
  datePublished, dateModified)
- **Add social media metadata**: Set `schema.imageAlt` (descriptive alt text)
  and `schema.tags` (relevant Social Security hashtags), then include
  `{@html schema.renderSocialMeta()}` in svelte:head for rich social media cards
- Cross-link to related guides where relevant (e.g., link AIME guide to
  earnings-cap and indexing-factors guides)
- Follow SSA.tools styling patterns with proper headings, sections, and visual
  hierarchy
- Include practical examples and clear explanations of complex Social Security
  concepts
- Update the guides index page at `/src/routes/guides/+page.svelte` to include
  new guides
