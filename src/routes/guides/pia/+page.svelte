<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';

const title = 'Primary Insurance Amount (PIA)';
const description =
  'Learn how Social Security calculates your Primary Insurance Amount (PIA) using bendpoints, the implications of earning more money late in your career, and how PIA forms the foundation of all Social Security benefits.';
const publishDate = new Date('2025-09-19T00:00:00+00:00');
const updateDate = new Date('2025-09-19T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/pia';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Laptop with piggybank representing Social Security calculations';
schema.tags = [
  'Primary Insurance Amount',
  'PIA',
  'Social Security',
  'Bendpoints',
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Your <strong>Primary Insurance Amount</strong> (PIA) is the most important number
    in Social Security. It's the dollar amount you'll receive each month if you start
    collecting benefits at your Normal Retirement Age (NRA). Understanding how PIA
    is calculated helps you make informed decisions about your career, retirement
    timing, and overall Social Security strategy.
  </p>

  <h2>What is the Primary Insurance Amount?</h2>

  <p>
    The Primary Insurance Amount is the foundation for all Social Security
    benefit calculations. Whether you're calculating retirement benefits,
    spousal benefits, survivor benefits, or disability benefits, they all start
    with your PIA.
  </p>

  <div class="highlight-box">
    <strong>Key Point:</strong> Your PIA is what you receive at your Normal Retirement
    Age. If you file earlier, you get less than your PIA. If you file later, you
    get more than your PIA.
  </div>

  <p>
    Your PIA is calculated from your <a href="/guides/aime"
      >Averaged Indexed Monthly Earnings (AIME)</a
    > using a progressive formula with "bendpoints" that ensures lower-income workers
    receive a higher percentage of their pre-retirement income from Social Security.
  </p>

  <h2>The Bendpoint Formula</h2>

  <p>
    Social Security uses a three-tiered progressive formula to calculate your
    PIA from your AIME. This formula uses two "bendpoints" that divide your AIME
    into three brackets, each with its own replacement rate:
  </p>

  <div class="formula-box">
    <h3>2025 PIA Formula</h3>
    <ul class="bendpoint-formula">
      <li><strong>90%</strong> of the first $1,226 of AIME</li>
      <li><strong>32%</strong> of AIME over $1,226 up to $7,391</li>
      <li><strong>15%</strong> of AIME over $7,391</li>
    </ul>
  </div>

  <p>
    These bendpoints are adjusted annually for <a href="/guides/inflation"
      >wage inflation</a
    >, ensuring they maintain their purchasing power over time. The percentages
    (90%, 32%, 15%) have remained constant since 1979.
  </p>

  <h3>Example Calculation</h3>

  <p>Let's walk through an example with an AIME of $5,000:</p>

  <div class="calculation-example">
    <table>
      <tbody>
        <tr>
          <td><strong>First bracket:</strong> 90% of $1,226</td>
          <td>= $1,103.40</td>
        </tr>
        <tr>
          <td><strong>Second bracket:</strong> 32% of ($5,000 - $1,226)</td>
          <td>= 32% of $3,774 = $1,207.68</td>
        </tr>
        <tr>
          <td><strong>Third bracket:</strong> 15% of ($5,000 - $7,391)</td>
          <td>= $0 (AIME doesn't reach third bracket)</td>
        </tr>
        <tr class="total-row">
          <td><strong>Total PIA:</strong></td>
          <td><strong>$2,311.08</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p>
    The final step is rounding: Social Security rounds the PIA <strong
      >down</strong
    >
    to the nearest dime, so this would become $2,311.00 per month.
  </p>

  <h2>Progressive Nature of the Formula</h2>

  <p>
    The bendpoint formula is intentionally progressive, meaning it provides
    higher replacement rates for lower earners:
  </p>

  <ul>
    <li>
      <strong>Lower earners</strong> receive up to 90% replacement of their AIME
    </li>
    <li>
      <strong>Middle earners</strong> receive a blend of 90% and 32% rates
    </li>
    <li>
      <strong>Higher earners</strong> receive a blend of all three rates, with their
      highest earnings replaced at only 15%
    </li>
  </ul>

  <p>
    This design ensures Social Security provides a stronger safety net for
    workers with lower lifetime earnings while still providing meaningful
    benefits to higher earners.
  </p>

  <h2>Implications of Higher Late-Career Earnings</h2>

  <p>
    Understanding the bendpoint formula helps explain why earning more money
    late in your career has diminishing returns for your Social Security
    benefits:
  </p>

  <h3>Marginal Return on Additional Earnings</h3>

  <p>
    If you're already earning above the second bendpoint ($7,391 AIME in 2025),
    any additional earnings that increase your AIME will only increase your PIA
    by 15 cents for every additional dollar of monthly AIME.
  </p>

  <div class="insight-box">
    <h4>Example: Late-Career Bonus Impact</h4>
    <p>
      Suppose you're 64 and considering whether to accept a high-paying position
      for your final working year. If this job would increase your AIME by $500
      (from $6,000 to $6,500), your PIA would increase by:
    </p>
    <p>
      <strong>$500 × 32% = $160 per month</strong>
    </p>
    <p>
      However, if your AIME was already $8,000 and increased to $8,500, your PIA
      would only increase by:
    </p>
    <p>
      <strong>$500 × 15% = $75 per month</strong>
    </p>
  </div>

  <h3>Why This Matters for Career Planning</h3>

  <p>The progressive formula means that:</p>

  <ul>
    <li>
      <strong>Early career earnings</strong> may have the highest impact on your
      PIA if they help you reach 35 years of substantial earnings
    </li>
    <li>
      <strong>Mid-career earnings</strong> often provide good returns, especially
      if they push you into the 32% bracket
    </li>
    <li>
      <strong>Late-career earnings</strong> provide the lowest marginal returns,
      especially if you're already above the second bendpoint
    </li>
  </ul>

  <p>
    This doesn't mean late-career earnings are worthless—they still increase
    your benefits and your overall retirement income. But the Social Security
    benefit increase may be smaller than you might intuitively expect.
  </p>

  <h2>Cost-of-Living Adjustments (COLA)</h2>

  <p>
    Once you reach age 62, your PIA is protected against <a
      href="/guides/inflation"
    >
      inflation</a
    > through annual Cost-of-Living Adjustments (COLA). These adjustments:
  </p>

  <ul>
    <li>
      Are applied every December based on the Consumer Price Index (CPI-W)
    </li>
    <li>Continue even after you start collecting benefits</li>
    <li>
      Apply to your PIA, which then affects all benefits based on your record
    </li>
  </ul>

  <h2>PIA and Other Benefits</h2>

  <p>Your PIA serves as the foundation for calculating:</p>

  <ul>
    <li>
      <strong>Retirement benefits:</strong> Your PIA adjusted for filing age
    </li>
    <li><strong>Spousal benefits:</strong> Up to 50% of your PIA</li>
    <li><strong>Survivor benefits:</strong> Up to 100% of your PIA</li>
    <li>
      <strong>Disability benefits:</strong> Your PIA without age adjustments
    </li>
  </ul>

  <h2>Maximizing Your PIA</h2>

  <p>To maximize your PIA:</p>

  <ol>
    <li>
      <strong>Work for 35 years:</strong> PIA is based on your highest 35 years,
      so each year of work can potentially replace a zero-earning year
    </li>
    <li>
      <strong>Maximize early and mid-career earnings:</strong> These often provide
      the best return due to the progressive formula
    </li>
    <li>
      <strong
        >Be aware of the <a href="/guides/earnings-cap">earnings cap</a
        >:</strong
      >
      Earnings above the annual cap don't count toward Social Security
    </li>
    <li>
      <strong
        >Consider the <a href="/guides/maximum">maximum benefit</a>:</strong
      >
      Understand what it takes to reach the highest possible PIA
    </li>
  </ol>

  <h2>Calculate Your PIA</h2>

  <p>
    Rather than calculating your PIA by hand, you can use the <a
      href="/calculator">SSA.tools Social Security calculator</a
    > to determine your exact Primary Insurance Amount. Simply paste your earnings
    record from ssa.gov, and the calculator will compute your PIA automatically using
    the current year's bendpoints and your complete earnings history.
  </p>

  <p>
    The calculator also shows you how different future earning scenarios and
    filing dates affect your actual monthly benefits, which are based on your
    PIA.
  </p>

  <GuideFooter />
</div>

<style>
  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #4a90e2;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .formula-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .formula-box h3 {
    margin-top: 0;
    color: #2c3e50;
  }

  .bendpoint-formula {
    list-style: none;
    padding-left: 0;
    font-size: 16px;
    text-align: left;
  }

  .bendpoint-formula li {
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }

  .bendpoint-formula li:last-child {
    border-bottom: none;
  }

  .calculation-example {
    background-color: #fff9e6;
    border: 1px solid #ffc107;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .calculation-example table {
    width: 100%;
    border-collapse: collapse;
  }

  .calculation-example td {
    padding: 8px 12px;
    border-bottom: 1px solid #e9ecef;
  }

  .calculation-example .total-row {
    border-top: 2px solid #2c3e50;
    font-weight: bold;
  }

  .calculation-example .total-row td {
    border-bottom: none;
    padding-top: 12px;
  }

  .insight-box {
    background-color: #e8f5e8;
    border-left: 4px solid #28a745;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .insight-box h4 {
    margin-top: 0;
    color: #155724;
  }

  @media (max-width: 600px) {
    .calculation-example table {
      font-size: 14px;
    }

    .calculation-example td {
      padding: 6px 8px;
    }
  }
</style>
