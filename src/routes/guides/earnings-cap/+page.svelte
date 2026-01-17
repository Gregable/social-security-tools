<script lang="ts">
import { MAX_CREDITS, MAXIMUM_EARNINGS, MAX_YEAR, SSA_EARNINGS_YEARS } from '$lib/constants';
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';

const currentYear = MAX_YEAR;
const currentYearCap = MAXIMUM_EARNINGS[currentYear];

const title = 'Social Security Earnings Cap: How Much Counts Toward Benefits?';
const description =
  `The Social Security earnings cap limits how much of your income is taxed and counted toward benefits. In ${currentYear}, the cap is ${currentYearCap.wholeDollars()}. See the complete history of earnings caps since 1937.`;
const publishDate = new Date('2020-11-28T00:00:00+00:00');
const updateDate = new Date('2024-02-26T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/earnings-cap';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Laptop with piggybank representing Social Security earnings limits';
schema.tags = [
  'Earnings Cap',
  'Social Security',
  'Maximum Earnings',
  'FICA',
  'Payroll Tax',
  String(currentYear),
];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page earnings-cap-guide">
  <h1>{title}</h1>

  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <div class="key-takeaways">
    <h3>Key Facts</h3>
    <ul>
      <li><strong>{currentYear} earnings cap: {currentYearCap.wholeDollars()}</strong> — the maximum income subject to Social Security tax</li>
      <li><strong>Earnings above the cap</strong> — not taxed for Social Security and don't count toward benefits</li>
      <li><strong>Adjusted annually</strong> — the cap increases each year based on national wage growth</li>
      <li><strong>Applies to both tax and benefits</strong> — same limit for what you pay in and what counts toward your benefit</li>
    </ul>
  </div>

  <h2>What Is the Social Security Earnings Cap?</h2>

  <p>
    There is an annual limit on the amount of personal earnings subject to
    payroll (Social Security) tax. Above that amount, payroll taxes are no
    longer applied to your earnings. This same limit determines how much of
    your earnings count toward your benefit calculation.
  </p>

  <p>
    In {currentYear}, this limit is <strong>{currentYearCap.wholeDollars()}</strong>.
    Earnings above that amount are not subject to the 6.2% Social Security payroll
    tax and do not affect your <a href="/guides/pia"><abbr title="Primary Insurance Amount">PIA</abbr></a> or
    <a href="/guides/aime"><abbr title="Average Indexed Monthly Earnings">AIME</abbr></a>.
  </p>

  <div class="example-box">
    <h4>Example</h4>
    <p>
      If you earn $200,000 in {currentYear}, only {currentYearCap.wholeDollars()} is subject to
      Social Security tax. You pay 6.2% on {currentYearCap.wholeDollars()}, and the remaining
      ${(200000 - currentYearCap.value() / 100).toLocaleString()} is not taxed for Social Security
      (though it is still subject to Medicare tax, which has no cap).
    </p>
  </div>

  <h2>How Is the Cap Determined?</h2>

  <p>
    The cap is updated every year to keep pace with wage growth. The formula
    for a given year X takes the National Average Wage Index (AWI) for year
    (X - 2), divides it by $22,935.42 (the AWI in 1992), and multiplies by
    $60,600 (the cap in 1994).
  </p>

  <p>
    The cap for years 1937–1974 and 1979–1981 was set by statute. For all
    other years, it's calculated automatically as specified by the Social
    Security Act.
  </p>

  <h2>Earnings Cap by Year</h2>

  <p>
    The following table shows the earnings cap for every year since 1937:
  </p>

  <div class="earnings-container">
    {#each Object.entries(MAXIMUM_EARNINGS) as [year, earnings]}
      <div class="earnings-year" class:current-year={Number(year) === currentYear}>
        <span class="year">{year}:</span>
        <span class="earnings">{earnings.wholeDollars()}</span>
      </div>
    {/each}
  </div>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/aime">AIME Guide</a> — Learn how capped earnings are averaged
      to calculate your monthly indexed earnings
    </li>
    <li>
      <a href="/guides/pia">PIA Guide</a> — See how your AIME is converted to your
      Primary Insurance Amount using the bendpoint formula
    </li>
    <li>
      <a href="/guides/maximum">Maximum Benefit</a> — Discover what it takes to reach
      the maximum Social Security benefit by earning at the cap for {SSA_EARNINGS_YEARS} years
    </li>
    <li>
      <a href="/guides/work-credits">Work Credits</a> — Understand how earnings
      also count toward the {MAX_CREDITS} credits needed to qualify for benefits
    </li>
  </ul>

  <p>
    Use the <a href="/calculator">SSA.tools calculator</a> to see exactly how your
    earnings—subject to each year's cap—affect your benefit amount.
  </p>

  <h2>Additional Resources</h2>

  <ul>
    <li>
      <a href="https://www.ssa.gov/oact/cola/cbb.html">
        Contribution and Benefit Base</a> [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/cbbdet.html">
        Contribution and Benefit Base Determination</a> [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/AWI.html">
        Average Wage Index since 1951</a> [ssa.gov]
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
    background-color: #e8f4fd;
    border: 2px solid #4a90e2;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2c5282;
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

  .example-box p {
    margin-bottom: 0;
  }

  .earnings-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    margin: 20px 0;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  .earnings-year {
    display: flex;
    gap: 0.5em;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .earnings-year.current-year {
    background-color: #d4edda;
    font-weight: bold;
  }

  .year {
    color: #666;
  }

  .earnings {
    font-weight: 500;
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
