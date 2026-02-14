<script lang="ts">
import { GuidesSchema, renderFAQSchema, type FAQItem } from '$lib/schema-org';
import { MAX_YEAR, MAX_WAGE_INDEX_YEAR, WAGE_INDICES } from '$lib/constants';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';
import HeroImage from './hero.png';

// Generate a dynamic earnings example
// Use MAX_WAGE_INDEX_YEAR as the indexing year (simulating someone who turned 60 that year)
const indexingYear = MAX_WAGE_INDEX_YEAR;
const startYear = indexingYear - 11; // Show 12 years of earnings
const startAge = 27; // Starting age for the example person

interface EarningsRow {
  year: number;
  age: number;
  taxedEarnings: string;
  multiplier: string;
  indexedEarnings: string;
}

// Generate earnings rows with ~2.5% annual raises
const earningsRows: EarningsRow[] = [];
let baseEarnings = 40000; // Starting salary
for (let i = 0; i < 13; i++) {
  const year = startYear + i;
  const age = startAge + i;
  const earnings = Math.round(baseEarnings * Math.pow(1.025, i));

  // Calculate multiplier: AWI(indexingYear) / AWI(year)
  const yearAWI = WAGE_INDICES[year];
  const indexingAWI = WAGE_INDICES[indexingYear];
  const multiplier = yearAWI && indexingAWI ? indexingAWI.div$(yearAWI) : 1.0;
  const indexedEarnings = Math.round(earnings * multiplier);

  earningsRows.push({
    year,
    age,
    taxedEarnings: '$' + earnings.toLocaleString(),
    multiplier: multiplier.toFixed(2),
    indexedEarnings: '$' + indexedEarnings.toLocaleString(),
  });
}

// Get the first and last rows for the explanation text
const firstRow = earningsRows[0];
const lastRow = earningsRows[earningsRows.length - 1];

const title = "How Inflation Affects Your Social Security Benefits: AWI and COLA Explained";
const description =
  "Discover how Social Security protects your benefits from inflation through wage indexing (AWI) during your working years and Cost of Living Adjustments (COLA) after retirement.";
const publishDate = new Date('2018-11-23T00:00:00+00:00');
const updateDate = new Date('2026-01-21T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/inflation';
schema.title = title;
schema.image = HeroImage;
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt = 'A grocery cart representing the rising cost of living';
schema.tags = [
  'Inflation',
  'Social Security',
  'COLA',
  'Cost of Living Adjustment',
  'AWI',
  'Wage Indexing',
  String(MAX_YEAR),
];

const faqs: FAQItem[] = [
  {
    question: 'Are Social Security benefits adjusted for inflation?',
    answer:
      "Yes, Social Security has two inflation protections. During your working years, your earnings are adjusted using wage indexing (AWI) to account for wage growth. After you start receiving benefits, annual Cost of Living Adjustments (COLA) increase your benefit based on consumer price inflation.",
  },
  {
    question: 'What is COLA and when does it apply?',
    answer:
      "COLA stands for Cost of Living Adjustment. It's an annual increase to your Social Security benefit based on the Consumer Price Index (CPI-W). COLA is applied starting the January after you begin receiving benefits, and continues every year thereafter.",
  },
  {
    question: "Why is my estimated benefit shown in 'today's dollars'?",
    answer:
      "Benefit estimates are shown in today's dollars so you can compare them directly to your current income and expenses. The actual dollar amount you receive will be higher due to inflation adjustments, but the purchasing power will be approximately the same as the estimate shows today.",
  },
  {
    question: 'What is the difference between AWI and COLA?',
    answer:
      'AWI (Average Wage Index) adjusts your historical earnings during your working years to account for wage growth. COLA (Cost of Living Adjustment) increases your benefit amount after you start collecting to keep pace with consumer price inflation. AWI is based on wage growth; COLA is based on price inflation.',
  },
  {
    question: 'Can my Social Security benefit ever decrease due to inflation?',
    answer:
      "No. By law, COLA can never be negative. In years when prices decrease (deflation), your benefit stays the same rather than decreasing. This protects your purchasing power even in unusual economic conditions.",
  },
];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page inflation-guide">
  <h1>{title}</h1>
  <p class="postdate">
    Published: {publishDate.toLocaleDateString()} · Updated: {updateDate.toLocaleDateString()}
  </p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="A grocery cart representing the rising cost of living"
    />
  </figure>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        Social Security has <strong>two different inflation protections</strong>
        that apply at different times in your life
      </li>
      <li>
        <strong>Wage indexing (AWI)</strong> adjusts your earnings during your working
        years to reflect wage growth
      </li>
      <li>
        <strong>COLA</strong> increases your benefit each year after you start collecting
        to keep pace with prices
      </li>
      <li>
        Benefit estimates are shown in <strong>"today's dollars"</strong> so you
        can compare to your current expenses
      </li>
    </ul>
  </div>

  <h2>How Social Security Protects Against Inflation</h2>

  <p>
    Inflation reduces the purchasing power of money over time. A dollar today
    buys less than a dollar did 20 years ago. Social Security is designed to
    account for this through two separate mechanisms:
  </p>

  <ol>
    <li>
      <strong>Wage indexing</strong> during your working years (before you collect)
    </li>
    <li>
      <strong>Cost of Living Adjustments (COLA)</strong> after you start receiving
      benefits
    </li>
  </ol>

  <p>
    The result is that your benefit maintains its purchasing power both during
    the decades you work and during the decades you collect.
  </p>

  <h2>Wage Indexing (AWI) — During Your Working Years</h2>

  <p>
    When Social Security calculates your benefit, it doesn't simply add up your
    lifetime earnings. Instead, it adjusts your historical earnings using the
    <a href="https://www.ssa.gov/oact/cola/awidevelop.html"
      >Average Wage Index (AWI)</a
    >.
  </p>

  <p>
    The AWI measures how much average wages have grown over time. If average
    wages doubled between 1995 and 2025, then $30,000 earned in 1995 would be
    adjusted to $60,000 for benefit calculation purposes.
  </p>

  <div class="example-box">
    <h4>Wage Indexing in Action</h4>
    <p>Consider this simplified earnings record for someone who turned 60 in {indexingYear}:</p>
    <table class="earnings-table">
      <thead>
        <tr>
          <th class="year">Year</th>
          <th class="age">Age</th>
          <th class="taxed">Taxed Earnings</th>
          <th class="multiplier" colspan="3">Multiplier</th>
          <th class="indexed" colspan="2">Indexed Earnings</th>
        </tr>
      </thead>
      <tbody>
        {#each earningsRows as row}
          <tr>
            <td class="year">{row.year}</td>
            <td class="age">{row.age}</td>
            <td class="taxed">{row.taxedEarnings}</td>
            <td class="symbol-x">×</td>
            <td class="multiplier">{row.multiplier}</td>
            <td class="symbol-eq">=</td>
            <td class="indexed">{row.indexedEarnings}</td>
            <td class="spacer"></td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p>
      Notice how the {firstRow.year} earnings of {firstRow.taxedEarnings} have a multiplier of {firstRow.multiplier}, making
      them worth {firstRow.indexedEarnings} in indexed terms. This reflects approximately {Math.round((parseFloat(firstRow.multiplier) - 1) * 100)}%
      wage growth between {firstRow.year} and {indexingYear}.
    </p>
  </div>

  <p>
    This indexing process ensures that your early-career earnings are credited
    fairly. Someone who earned $30,000 in 1985 shouldn't have those earnings
    count the same as $30,000 today—the 1985 earnings should be adjusted up to
    reflect wage growth.
  </p>

  <p>
    <strong>When does wage indexing stop?</strong> Your earnings are indexed using
    the AWI from the year you turn 60. After that, any additional earnings are counted
    at face value with no indexing adjustment. For more details, see our
    <a href="/guides/indexing-factors">Wage Indexing Guide</a>.
  </p>

  <InlineCTA type="calculator" />

  <h2>COLA — After You Start Collecting Benefits</h2>

  <p>
    Once you begin receiving Social Security benefits, wage indexing no longer
    applies. Instead, your benefit is protected by annual
    <a href="https://www.ssa.gov/cola">Cost of Living Adjustments (COLA)</a>.
  </p>

  <p>
    Each year, Social Security increases benefits based on the
    <a href="https://www.ssa.gov/oact/STATS/cpiw.html"
      >Consumer Price Index for Urban Wage Earners (CPI-W)</a
    >. If consumer prices rise 3% in a year, benefits increase by 3% the
    following January.
  </p>

  <div class="highlight-box">
    <p>
      <strong>COLA can never be negative.</strong> Even if prices decrease (deflation),
      your benefit stays the same rather than decreasing. This one-way protection
      ensures your benefit never loses ground.
    </p>
  </div>

  <h2>AWI vs. COLA: Key Differences</h2>

  <p>
    While both protect against inflation, AWI and COLA work differently and
    serve different purposes:
  </p>

  <table class="comparison-table">
    <thead>
      <tr>
        <th></th>
        <th>Wage Indexing (AWI)</th>
        <th>COLA</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>When it applies</strong></td>
        <td>During your working years (until age 60)</td>
        <td>After you start receiving benefits</td>
      </tr>
      <tr>
        <td><strong>What it measures</strong></td>
        <td>Wage growth (how much workers earn)</td>
        <td>Price inflation (how much things cost)</td>
      </tr>
      <tr>
        <td><strong>What it adjusts</strong></td>
        <td>Your historical earnings record</td>
        <td>Your monthly benefit amount</td>
      </tr>
      <tr>
        <td><strong>Index used</strong></td>
        <td>Average Wage Index (AWI)</td>
        <td>Consumer Price Index (CPI-W)</td>
      </tr>
    </tbody>
  </table>

  <h2>How This Affects Your Benefit Estimate</h2>

  <p>
    When you use this <a href="/calculator">Social Security calculator</a> or receive
    a benefit estimate from the Social Security Administration, the amounts are shown
    in <strong>"today's dollars."</strong>
  </p>

  <div class="example-box">
    <h4>What "Today's Dollars" Means</h4>
    <p>
      If this calculator estimates your benefit at $2,000 per month starting in
      15 years, and there's 50% cumulative inflation during that time:
    </p>
    <ul>
      <li>Your actual monthly payment will be approximately $3,000</li>
      <li>
        But $3,000 in 15 years will buy about the same as $2,000 does today
      </li>
      <li>The estimate shows you the real purchasing power you can expect</li>
    </ul>
  </div>

  <p>
    Future COLA increases aren't included in estimates because the actual
    adjustment amounts won't be known until they're announced each year. By
    showing estimates in today's dollars, you can compare your expected benefit
    directly to your current income and expenses.
  </p>

  <h2>Common Questions</h2>

  <div class="faq-section">
    {#each faqs as faq}
      <h3>{faq.question}</h3>
      <p>{faq.answer}</p>
    {/each}
  </div>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/indexing-factors">Wage Indexing Guide</a> — Detailed explanation
      of how indexing factors are calculated and why they matter
    </li>
    <li>
      <a href="/guides/aime">AIME Guide</a> — How your indexed earnings are averaged
      to calculate your benefit base
    </li>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> — How your AIME is
      converted to your monthly benefit
    </li>
    <li>
      <a href="/guides/earnings-cap">Earnings Cap</a> — The maximum earnings subject
      to Social Security tax and benefit calculations
    </li>
  </ul>

  <p>
    Use the <a href="/calculator">SSA.tools calculator</a> to see how your actual
    earnings—adjusted for inflation—translate into your estimated benefit.
  </p>

  <h2>Additional Resources</h2>

  <ul>
    <li>
      <a href="https://www.ssa.gov/cola">
        Cost of Living Adjustment Information</a
      > [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/STATS/cpiw.html">
        Consumer Price Index (CPI-W)</a
      > [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/AWI.html">
        National Average Wage Index</a
      > [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/colaseries.html">
        COLA History Since 1975</a
      > [ssa.gov]
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  .key-takeaways {
    background-color: #e8f5e9;
    border: 1px solid #4caf50;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2e7d32;
    font-size: 1.2em;
  }

  .key-takeaways ul {
    margin: 0;
    padding-left: 20px;
  }

  .key-takeaways li {
    margin: 10px 0;
    line-height: 1.5;
  }

  .example-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px 20px;
    margin: 20px 0;
  }

  .example-box h4 {
    margin-top: 0;
    color: #2c3e50;
  }

  .example-box ul {
    margin-bottom: 0;
  }

  .earnings-table {
    width: auto;
    max-width: 100%;
    border-collapse: collapse;
    margin: 15px auto;
    font-size: 0.9em;
  }

  .earnings-table th,
  .earnings-table td {
    padding: 8px 6px;
    border-bottom: 1px solid #dee2e6;
  }

  .earnings-table th {
    background-color: #e9ecef;
    font-weight: 600;
    color: #2c3e50;
  }

  .earnings-table .year {
    text-align: left;
    padding-left: 8px;
  }

  .earnings-table .age {
    text-align: center;
    padding-right: 12px;
  }

  .earnings-table .taxed {
    text-align: right;
    padding-right: 4px;
  }

  .earnings-table .symbol-x,
  .earnings-table .symbol-eq {
    text-align: center;
    color: #6b6bbf;
    font-weight: 600;
    padding: 8px 10px;
  }

  .earnings-table th.multiplier,
  .earnings-table td.multiplier {
    text-align: center;
    padding: 8px 4px;
  }

  .earnings-table th.indexed,
  .earnings-table th.multiplier {
    text-align: center;
  }

  .earnings-table td.indexed {
    text-align: left;
    padding-left: 4px;
    padding-right: 0;
    font-weight: 500;
    color: #1a1a1a;
  }

  .earnings-table .spacer {
    padding: 0;
  }

  .earnings-table tbody tr:nth-child(odd) {
    background-color: #f8f9fc;
  }

  .earnings-table tbody tr:hover {
    background-color: #eef2ff;
  }

  .highlight-box {
    background-color: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 0 8px 8px 0;
  }

  .highlight-box p {
    margin: 0;
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 0.95em;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  .comparison-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #2c3e50;
  }

  .comparison-table tbody tr:hover {
    background-color: #f8f9fa;
  }

  .comparison-table td:first-child {
    color: #666;
    font-size: 0.9em;
  }

  .faq-section h3 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-size: 1.1em;
  }

  .faq-section p {
    margin-top: 0;
  }

  ol {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    .comparison-table {
      font-size: 0.85em;
    }

    .comparison-table th,
    .comparison-table td {
      padding: 8px 10px;
    }

    .earnings-table {
      font-size: 0.8em;
    }

    .earnings-table th,
    .earnings-table td {
      padding: 6px 3px;
    }

    .earnings-table .year {
      padding-left: 4px;
    }

    .earnings-table .age,
    .earnings-table th.age {
      display: none;
    }

    .earnings-table .symbol-x,
    .earnings-table .symbol-eq {
      padding: 6px 6px;
    }

    .earnings-table td.indexed {
      padding-right: 4px;
    }
  }
</style>
