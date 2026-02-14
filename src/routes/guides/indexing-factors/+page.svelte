<script lang="ts">
import { GuidesSchema, renderFAQSchema, type FAQItem } from '$lib/schema-org';
import { MAX_YEAR, MAX_WAGE_INDEX_YEAR, WAGE_INDICES } from '$lib/constants';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';
import HeroImage from './hero.png';

const title = 'Social Security Wage Indexing: How Your Earnings Are Adjusted';
const description =
  "Learn how Social Security uses wage indexing to adjust your earnings for inflation. Understand indexing factors, the AWI formula, and why your benefit is shown in today's dollars.";
const publishDate = new Date('2020-12-28T00:00:00+00:00');
const updateDate = new Date('2026-01-21T00:00:00+00:00');

// Calculate example indexing factor
const exampleYear = 1990;
const indexingYear = MAX_WAGE_INDEX_YEAR - 2; // Year someone turning 60 would use
const exampleAWI = WAGE_INDICES[exampleYear];
const indexingAWI = WAGE_INDICES[indexingYear];
const exampleFactor = indexingAWI && exampleAWI ? (indexingAWI.value() / exampleAWI.value()).toFixed(2) : '2.50';

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/indexing-factors';
schema.title = title;
schema.image = HeroImage;
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt = 'A chalkboard with complex equations representing wage indexing calculations';
schema.tags = [
  'Wage Indexing',
  'Social Security',
  'AWI',
  'Average Wage Index',
  'Indexing Factors',
  'Earnings Adjustment',
  String(MAX_YEAR),
];

const faqs: FAQItem[] = [
  {
    question: "Why doesn't the calculator use my actual eligibility year for indexing factors?",
    answer:
      "The calculator uses current-year indexing factors to show your benefit in \"today's dollars.\" Using future estimated factors would show inflated dollar amounts that are harder to compare with your current expenses. This is the same approach the Social Security Administration uses in their benefit estimates.",
  },
  {
    question: 'Will my indexed earnings change over time?',
    answer:
      "Yes. Until you turn 60, your indexed earnings will be recalculated each year using updated Average Wage Index (AWI) values. After age 60, your indexing factors are locked in and won't change.",
  },
  {
    question: 'What is the Average Wage Index (AWI)?',
    answer:
      'The AWI is the average of all wages reported to Social Security in a given year. It measures how much average wages have grown over time and is used to adjust your historical earnings so they reflect current wage levels.',
  },
  {
    question: 'Why do indexing factors stop at age 60 instead of 62?',
    answer:
      "The AWI for any year isn't finalized until the following fall. Since your indexing factors must be determined when you turn 62, the most recent finalized AWI available is from two years prior—when you were 60.",
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

<div class="guide-page indexing-factors-guide">
  <h1>{title}</h1>
  <p class="postdate">
    Published: {publishDate.toLocaleDateString()} · Updated: {updateDate.toLocaleDateString()}
  </p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Chalkboard with mathematical equations representing wage indexing"
    />
  </figure>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        <strong>Wage indexing</strong> adjusts your past earnings to account for
        wage growth over time
      </li>
      <li>
        The <strong>Average Wage Index (AWI)</strong> determines how much each year's
        earnings are adjusted
      </li>
      <li>
        Your indexing factors are <strong>locked in at age 60</strong> and don't change
        after that
      </li>
      <li>
        Benefits are shown in <strong>"today's dollars"</strong> so you can compare
        them to your current expenses
      </li>
    </ul>
  </div>

  <h2>What Is Wage Indexing?</h2>

  <p>
    Social Security uses wage indexing to ensure that your benefit reflects
    changes in the general wage level over your working career. Without
    indexing, someone who earned $20,000 in 1985 would have those earnings
    counted the same as someone earning $20,000 today—even though $20,000 had
    far more purchasing power in 1985.
  </p>

  <p>
    The indexing process multiplies each year's earnings by an <strong
      >indexing factor</strong
    >. This factor is based on how much average wages have grown since that year.
    The result is called your <strong>indexed earnings</strong>.
  </p>

  <div class="example-box">
    <h4>Example</h4>
    <p>
      If you earned $25,000 in {exampleYear} and the indexing factor for that year
      is {exampleFactor}, your indexed earnings would be:
    </p>
    <p class="calculation">
      $25,000 × {exampleFactor} = ${(25000 * parseFloat(exampleFactor)).toLocaleString()}
    </p>
    <p>
      This adjusted amount is what counts toward your benefit calculation,
      making your {exampleYear} earnings comparable to earnings today.
    </p>
  </div>

  <h2>How the Indexing Formula Works</h2>

  <p>
    The indexing factor for any year is calculated using a simple formula based
    on the <a href="https://www.ssa.gov/oact/cola/awidevelop.html"
      >Average Wage Index (AWI)</a
    >:
  </p>

  <div class="formula-box">
    <div class="formula">
      Indexing Factor = <span class="fraction"
        ><span class="numerator">AWI in the year you turn 60</span><span
          class="denominator">AWI in the earnings year</span
        ></span
      >
    </div>
    <p class="formula-note">
      For earnings after age 60, the indexing factor is always 1.0 (no
      adjustment).
    </p>
  </div>

  <p>
    The AWI is the average of all wages reported to Social Security in a given
    year. As of {MAX_WAGE_INDEX_YEAR}, the AWI was {WAGE_INDICES[MAX_WAGE_INDEX_YEAR]?.wholeDollars() ?? 'not yet published'}.
  </p>

  <InlineCTA type="calculator" />

  <h2>Why Benefits Are Shown in "Today's Dollars"</h2>

  <p>
    When you use this calculator or receive a benefit estimate from Social
    Security, the amounts are shown in <strong>"today's dollars"</strong>. This
    means we use the most recent available indexing factors rather than
    estimated future values.
  </p>

  <div class="highlight-box">
    <p>
      <strong>Why this matters:</strong> If we used estimated 2035 indexing factors
      to calculate your benefit, the result would be in "2035 dollars"—inflated amounts
      that are hard to compare with your current income and expenses. By using today's
      factors, you can directly compare your estimated benefit to what you spend now.
    </p>
  </div>

  <p>
    This is the same approach the Social Security Administration uses when they
    send you a benefit estimate. They assume you'll continue earning at your
    current level and apply today's indexing factors, giving you an estimate in
    today's purchasing power.
  </p>

  <h2>What Happens at Age 60?</h2>

  <p>
    Your indexing factors are determined—and permanently locked in—in the year
    you turn 62. However, the formula uses the AWI from the year you turned 60.
    Why?
  </p>

  <p>
    The AWI for any given year isn't published until the following fall. Since
    your benefit calculation must be finalized when you turn 62, the most recent
    available AWI is from two years prior (when you were 60).
  </p>

  <div class="example-box">
    <h4>Timeline Example</h4>
    <p>If you were born in 1965:</p>
    <ul>
      <li><strong>2025:</strong> You turn 60 (AWI for 2025 will be used)</li>
      <li>
        <strong>2026:</strong> AWI for 2025 is published in the fall
      </li>
      <li>
        <strong>2027:</strong> You turn 62 and your indexing factors are calculated
        and locked in
      </li>
    </ul>
  </div>

  <p>
    Earnings after age 60 receive an indexing factor of 1.0—they're counted at
    face value with no adjustment. This means your final few years of earnings
    aren't indexed up for wage growth.
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
      <a href="/guides/aime">AIME Guide</a> — How indexed earnings are averaged to
      calculate your Average Indexed Monthly Earnings
    </li>
    <li>
      <a href="/guides/earnings-cap">Earnings Cap</a> — The annual limit on earnings
      subject to Social Security tax and benefit calculations
    </li>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> — How your AIME is
      converted to your monthly benefit amount
    </li>
    <li>
      <a href="/guides/inflation">Inflation Guide</a> — How wage indexing and COLA
      adjustments protect your benefit from inflation
    </li>
  </ul>

  <p>
    Use the <a href="/calculator">SSA.tools calculator</a> to see your indexed earnings
    based on your actual earnings record.
  </p>

  <h2>Additional Resources</h2>

  <ul>
    <li>
      <a href="https://www.ssa.gov/oact/cola/awifactors.html">
        Index Factors for Earnings</a
      > [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/awidevelop.html">
        Average Wage Index Development</a
      > [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/AWI.html">
        National Average Wage Index</a
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

  .example-box .calculation {
    font-size: 1.1em;
    font-weight: 600;
    text-align: center;
    margin: 15px 0;
  }

  .example-box ul {
    margin-bottom: 0;
  }

  .formula-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    text-align: center;
  }

  .formula {
    font-size: 1.1em;
    font-family: Georgia, 'Times New Roman', serif;
  }

  .fraction {
    display: inline-flex;
    flex-direction: column;
    vertical-align: middle;
    text-align: center;
    margin: 0 0.2em;
  }

  .numerator {
    border-bottom: 1px solid #333;
    padding-bottom: 2px;
  }

  .denominator {
    padding-top: 2px;
  }

  .formula-note {
    margin-top: 12px;
    margin-bottom: 0;
    font-size: 0.9em;
    color: #666;
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

  .faq-section h3 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-size: 1.1em;
  }

  .faq-section p {
    margin-top: 0;
  }

  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }
</style>
