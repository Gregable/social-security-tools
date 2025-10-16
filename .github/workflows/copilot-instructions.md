# Project Instructions for GitHub Copilot

## Project Overview

This project is the source repository for the website https://ssa.tools/. The
website is a SvelteKit application that provides a report on the user's social
security retirement benefits. The user inputs their social security earnings
record copy / pasted from ssa.gov as well as their birthdate and optionally the
same for their spouse. The site then shows a report that gives the user insights
into their benefits. The user can choose different future earnings scenarios,
see how those affect their primary insurance amount, and finally see how
different filing dates affect their actual social security benefits.

The philosophy of the site is to provide sufficient detail so that the user can
understand all of the calculations being done, not just see the final answer.

Visualizations are inspired by Tufte's principles for visualizing quantitative
information:

- Visual representations of data must tell the truth.
- Data visualizations should be clear and concise.
- Visualizations should be designed for the intended audience.
- Maximize the proportion of ink that represents data.
- Reduce elements that do not convey data.
- Strive for high-quality design in visualizations.

However, Tufte was typically limited to static representations, while this site
embraces interactivity and dynamic data exploration.

## Technology Stack

- **Framework**: SvelteKit with file-based routing
- **Language**: TypeScript
- **Build Tool**: Vite
- **Deployment**: Vercel (using @sveltejs/adapter-vercel)
- **Testing**: Vitest for unit tests
- **Component Development**: Storybook for component documentation and testing
- **Package Manager**: npm
- **Linting & Formatting**: Biome

## Code Architecture:

- Code is in the `src/` path primarily.
  - Components are primarily in `src/lib/components/`.
  - There are utility libraries in `src/lib/`.
  - Storybook stories are in `src/stories/` for component development and
    testing.
  - Routes are in `src/routes/` following SvelteKit file-based routing.
  - Tests are in `src/test/`.
  - Worker files are in `src/lib/workers/`.
  - Filing strategy calculations are in `src/lib/strategy/`.
- External data sources:
  - Life tables from SSA actuarial data in `data/CohLifeTables_*.csv`.
  - Pre-processing scripts in `scripts/`.
- Some more important utility libraries include:
  - `constants.ts` for social security constants related to credits, earnings,
    tax rates, wage indices, bendpoints, COLAs, retirement ages, month names,
    etc. These require annual updates when SSA publishes new values.
  - `money.ts` has a utility class for managing monetary values and calculations
    with proper precision.
  - `month-time.ts` has utilities for working with months and time-related
    calculations. Many social security calculations depend only on the month,
    not the day.
  - `recipient.ts` is the entrypoint for managing recipient-related data and
    calculations.
  - `birthday.ts` manages recipient birthdays which have some properties related
    to how social security treats a person's age.
  - `earning-record.ts` manages parsing and processing earnings history from
    SSA.
  - `pia.ts` contains Primary Insurance Amount calculations using bend points.
  - `ssa-parse.ts` handles parsing of copy/pasted SSA earnings records.

## Social Security Calculation Flow

The typical calculation pipeline follows these steps:

1. **Parse earnings record**: Extract earnings data from SSA copy/paste input
2. **Index earnings**: Apply wage indexing factors to historical earnings
3. **Calculate PIA**: Determine Primary Insurance Amount using bend points
4. **Apply adjustments**: Factor in early/delayed retirement credits
5. **Spousal/survivor benefits**: Calculate dependent benefits when applicable

Key calculation classes:

- `EarningRecord` - manages earnings history and indexing
- `PrimaryInsuranceAmount` - calculates PIA using current bend points
- `MonthDate`/`MonthDuration` - handles month-based time calculations
- `Money` - handles monetary calculations with proper precision
- `Recipient` - coordinates all recipient-related calculations

## Coding Standards:

- Code should be written in TypeScript.
- Use descriptive variable and function names.
- Use proper JSDoc comments for functions and classes.
- Write unit tests for components and libraries, run them before committing.
- Use Biome for code formatting and linting. Run `npm run quality` before
  committing.
- Prefer 80 character lines when possible.
- Follow SvelteKit conventions for file-based routing and component structure.
- Use private fields with getters/setters for class validation patterns.
- All code will be reviewed by a human senior developer before committing.

## Development Workflow:

Available npm scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run coverage` - Generate test coverage report
- `npm run storybook` - Start Storybook for component development
- `npm run build-storybook` - Build Storybook for deployment
- `npm run lint` - Run Biome linting
- `npm run lint:fix` - Fix Biome issues automatically
- `npm run format` - Format code with Biome
- `npm run format:check` - Check code formatting and linting
- `npm run quality` - Run full quality check (format, lint, type check)
- `npm run check` - TypeScript type checking

Testing strategy:

- Unit tests for all utility libraries (`*.test.ts` files)
- Storybook stories for all UI components (`*.stories.ts` files)
- Quality checks include formatting, linting, and TypeScript compilation

## Component and Library Patterns:

- Components follow PascalCase naming (e.g., `EarningsReport.svelte`)
- Most components have corresponding Storybook stories for development/testing
- Components are designed for specific steps in the calculation flow
- Utility classes use private fields with public getters/setters for validation
- Calculations follow official SSA formulas and rules precisely
- Time-based calculations prefer month precision over day precision
- External data dependencies are centralized and documented
- **Always use the `RecipientName` component when displaying recipient names**:
  - Import from `$lib/components/RecipientName.svelte`
  - Use `<RecipientName r={recipient} />` for basic display
  - Use `<RecipientName r={recipient} apos />` when possessive form is needed
  - This ensures consistent formatting and handles edge cases centrally
  - Never use `recipient.name` directly in templates

## Assistant Guidelines:

- Break down tasks into smaller, manageable steps.
- Prefer to ask clarifying questions if the task is ambiguous.
- Do not shy away from questioning the user's requirements or assumptions.
- Refactor related code after making changes, including removing unused code and
  improving readability.
- Prefer to request and read relevant files in the codebase to avoid duplicating
  effort and to ensure a better understanding of the project.
- Be careful with regards to domain knowledge about social security and related
  topics, as this is a specialized area. Ask questions if needed.
- When working with SSA calculations, verify against official SSA documentation
  and formulas.
- Consider the annual update cycle for SSA constants when making changes.
- Follow SvelteKit patterns for routing, components, and data loading.
- Ensure proper TypeScript typing, especially for financial calculations.
- Run `npm run quality` before suggesting code changes to ensure they meet
  project standards.

## Maintenance & Annual Update Checklist

Update these items annually (or when SSA/IRS publishes new data). Prefer small,
audited commits with tests proving continuity:

- Increment `MAX_YEAR` in `constants.ts`.
- Add new entries for: `EARNINGS_PER_CREDIT`, `MAXIMUM_EARNINGS`, wage indices
  (`WAGE_INDICES`), bend points (base 1977 bendpoints rarely change but wage
  indexing affects derived values), COLAs, taxation thresholds if applicable.
- Review retirement age tables, delayed retirement credit percentages.
- Import latest cohort life tables CSVs (female/male) into `data/` and re-run
  preprocessing script (see Life Tables Data Pipeline section).
- Add/update tests that assert newest year values and monotonic properties
  (e.g., earnings caps never decrease; credits per year logic still valid).
- Verify parsing still handles latest SSA statement format (manual sample).

## Performance & Precision Guidelines

- Avoid per-month iterative loops for long horizons; aggregate into periods.
  Example: `PersonalBenefitPeriods` computes at most two periods instead of
  iterating each month.
- Always use `Money` for currency math; never mix raw floats except transient
  factors. Use `div$` only for producing scalar ratios; otherwise stay in
  `Money` domain.
- Prefer `MonthDate` / `MonthDuration` for temporal logic; do not use JS Date in
  domain calculations (month precision only).
- Guard potential hot paths (strategy enumeration) against O(n \* months)
  regressions—consider adding micro-benchmarks if complexity increases.
- Be mindful of large couple strategy search spaces; prune clearly dominated
  filing ages early if future optimization work is added.

## Parsing Rules & Sentinels

SSA input parsing (`ssa-parse.ts`) must remain tolerant:

- Recognized sentinel tokens: `NotYetRecorded`, `MedicareBeganIn1966`, empty
  strings for missing amounts.
- PDF paste table ranges like `1991-2000` denote uniform earnings expansion.
- Treat unparseable tokens as zero, not exceptions—parsers are resilience
  boundaries; downstream logic should work with zeroed data.
- When introducing new heuristics, add unit tests (edge spacing, blank lines,
  partial last year, large future year edits).
- Do not log raw pasted earnings (privacy).

## Strategy Calculation Model

- Strategy engine (in `src/lib/strategy/`) represents benefit intervals via
  `BenefitPeriod` objects (inclusive start & end months).
- Period types: Personal, Spousal, Survivor. Survivor start date is the later of
  (earner death + 1 month) and dependent filing date.
- Dependent with zero PIA cannot file before higher earner; adjust strategy
  automatically (see `strategy-calc.ts`).
- Aggregate lifetime value by summing (amount.cents \* months in period).
- Future additions (e.g., widow(er) limits, restricted applications) should be
  modeled by generating additional disjoint `BenefitPeriod`s rather than
  embedding conditional logic in loops.

## Rounding & Regulatory Rules

- PIA brackets: compute AIME portions, apply 90% / 32% / 15% multipliers, sum,
  then floor to the nearest dime (`floorToDime`).
- Bend points derived by indexing 1977 base amounts then rounding to dollar.
- Earnings indexing stops at indexing year; later years use factor 1.0.
- Apply early/late filing adjustments (delayed retirement credits, reductions)
  per SSA formulas—document source links in code comments for any nuance.
- Always document non-intuitive rounding steps (e.g., dime floor) inline.

## Privacy & Data Handling

- User earnings data are ephemeral client-side inputs; avoid persisting or
  transmitting raw records. Flag any future storage-related code for review.
- Avoid adding analytics on raw financial input; if metrics needed, hash or
  bucket data irreversibly.
- Do not introduce console logs containing pasted earnings or birthdates.

## Life Tables Data Pipeline

- Source CSVs: `data/CohLifeTables_F_Alt2_TRYYYY.csv`, `..._M_...` from SSA.
- Preprocess via `python scripts/preprocess_life_tables.py` to
  `static/data/processed/{gender}_{year}.json` (one JSON per cohort year).
- Re-run when SSA releases new Trustees Report tables (typically annually).
- Add/update tests validating mortality q(x) shape (monotonic increase except at
  highest ages) and gender blending logic.
- Health multiplier (0.7 – 2.5) scales q(x); ensure clamping remains aligned
  with UI constraints.

## Accessibility & UX Guidelines

- Provide meaningful text or alt attributes for images/charts where possible.
- Ensure color choices in charts offer sufficient contrast; document palette in
  a central place if expanded beyond `RecipientColors`.
- Keep interactive controls keyboard navigable (tab order, ARIA labels for
  sliders / expandable sections like `Expando`).
- Favor concise numeric labeling; minimize decorative ink per Tufte.

## Potential Refactors & Future Enhancements

- Consider splitting `recipient.ts` into focused modules (e.g., mortality,
  benefit computation, parsing augmentation) if it grows further.
- Add micro-benchmark suite (Vitest + timing) for strategy calculations to catch
  performance regressions.
- Introduce data-driven configuration for bend point multipliers in case of
  legislative changes (avoid hard-coded magic numbers scattered).
- Add a test that enumerates a limited grid of filing ages and asserts monotonic
  properties (e.g., delayed credits never reduce benefit past NRA).
- Create a script or CI check to verify newly added year constants extend arrays
  and maps consistently (no gaps, strictly increasing where expected).

## Error Handling Principles

- Throw early on internal invariants (e.g., missing indexingYear) to surface
  developer errors; return neutral values (Money.zero) for user data issues.
- Keep parsing tolerant; keep computation strict.
- Document rationale when deviating from official SSA procedure for UX.

## Contribution Checklist (Before Opening PR)

- [ ] Added/updated unit tests & Storybook stories where applicable
- [ ] Ran `npm run quality` (format, lint, typecheck pass)
- [ ] Built project locally (`npm run build`) without errors
- [ ] Verified no console logs leak user financial data
- [ ] Updated documentation (this file / README) if domain logic changed
- [ ] Added references (links) in comments for any new SSA rules implemented

## References (Add When Editing Formulas)

- SSA POMS / Program Operations Manual
- SSA Actuarial Publications (Average Wage Index, Bend Points)
- Trustees Report (life tables)
- SSA Retirement Planner (filing age adjustments)
