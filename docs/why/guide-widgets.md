# Why three guides have small interactive elements

## The problem

Nearly every guide was prose, hand-typed tables, and static PNGs. The only
live element on the site's guides was the bend-point chart in the PIA
guide. Several high-traffic guides asked the reader to do arithmetic on
their own numbers by hand: the earnings test ("$1 for every $2 over the
limit, held back as whole checks"), the taxation of benefits (a three-step
provisional income formula with a static infographic whose caption admitted
"boxes will differ in your situation"), and the COLA guide (a fifty-row
table behind a disclosure).

## What we added

- **Earnings test calculator** on the earnings-test guide. Year, under-FRA
  or FRA-year, expected earnings, monthly benefit. Shows the limit, the
  excess, the amount withheld, how many whole checks SSA holds back and when
  full checks resume, the refund of what the whole checks over-collect, and
  the net for the year.
- **Taxable benefits calculator** on the federal-taxes guide. Filing status,
  adjusted gross income before Social Security, tax-exempt interest, annual
  benefits. Shows provisional income, which band it lands in, the taxable
  dollars and share, and a bar of taxable versus untaxed. The static
  infographic is gone. The guide was also refreshed: the intro, a corrected
  top-tier formula, a tax torpedo section, a Form W-4V withholding section,
  and FAQ schema.
- **COLA history chart** on the COLA guide. An inline SVG bar chart of every
  adjustment since 1975 with the long-run average as a reference line. The
  collapsed full-history table stays as the table view.

## Decisions worth knowing

**Arithmetic lives in `src/lib`, never in the component.** The earnings
test is `earnings-test.ts`, taxation is `benefit-taxation.ts`, and both
follow the existing example-module pattern: `Money` throughout, a golden test
that pins the figures the guide prose quotes, and the guide reading its
example numbers from the same module. A constants bump cannot leave stale
narrative behind. The earnings-test guide used to hard-code its limit tables
and three worked examples; those now come from `EARNINGS_TEST_LIMITS` in
`constants.ts`, and the golden test fails on an annual update until the new
year's limits are added.

**Statutory figures also live in `constants.ts`.** The taxation thresholds
have not changed since 1994 and never will without new law, but keeping them
beside the other SSA figures means one place to look.

**Widgets take props only and import nothing from `context.ts`.** That is
what made the PIA guide's bend-point chart embeddable where the calculator's
filing-date chart was not. The props seed the fields with the guide's worked
example, so the prerendered HTML shows real numbers without JavaScript.

**Plain inputs and inline SVG, not canvas.** The existing charts are
hand-rolled canvas, around 700 lines each, and draw only after mount, so the
prerendered page is blank there. SVG computed from props renders in the
static build and is indexable.

**Fields are seeded with `$derived`, not `$state`.** Svelte 5 warns when
`$state(prop)` captures only the initial value, and the `svelte-ignore`
comment is stripped by the TypeScript preprocessor before Svelte sees it. A
`$derived` can be reassigned and bound since Svelte 5.25, which is exactly
the "start from the prop, then let the reader edit" behavior wanted.

**The IRS worksheet, not the folk formula.** The old guide said the top tier
is 85% of the excess plus a flat $4,500 (single) or $6,000 (joint). The
worksheet in Publication 915 uses the smaller of that band and half of the
benefits, which matters for small benefits. The module and the prose now
agree with the worksheet.

**One analytics event, no values.** Each widget reports "Guide Widget: Used"
once per page view on the first change, carrying only the widget name and
guide slug. Earnings, benefits, and income typed into the fields are never
sent.

**Chart conventions.** Single series in one validated blue, bars at most
24px with rounded tops, solid hairline gridlines, direct labels only on the
maximum and the latest bar, a title per bar for hover, and the average label
placed outside the plot so it cannot collide with a bar label.
