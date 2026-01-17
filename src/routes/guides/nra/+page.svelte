<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import { FULL_RETIREMENT_AGE } from '$lib/constants';
import GuideFooter from '../guide-footer.svelte';

const title = 'Normal Retirement Age (NRA): What It Means for Your Benefits';
const description =
  'Learn about Normal Retirement Age (NRA), also called Full Retirement Age (FRA), ' +
  'how it varies by birth year, and why it matters for calculating your Social Security benefits.';
const publishDate = new Date('2026-01-17T00:00:00+00:00');
const updateDate = new Date('2026-01-17T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/nra';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Laptop with piggybank representing Social Security retirement planning';
schema.tags = [
  'Normal Retirement Age',
  'Full Retirement Age',
  'NRA',
  'FRA',
  'Social Security',
  'Retirement Planning',
];

// Build a display-friendly table from the constants
interface AgeRow {
  birthYears: string;
  ageDisplay: string;
  delayedCredit: string;
}

const fraTable: AgeRow[] = FULL_RETIREMENT_AGE.filter(
  (row) => row.minYear >= 1938 && row.maxYear <= 1960
).map((row) => {
  const yearRange =
    row.minYear === row.maxYear
      ? `${row.minYear}`
      : `${row.minYear}–${row.maxYear}`;

  const ageDisplay =
    row.ageMonths === 0
      ? `${row.ageYears}`
      : `${row.ageYears} and ${row.ageMonths} months`;

  const delayedCredit = `${(row.delayedIncreaseAnnual * 100).toFixed(1)}%`;

  return { birthYears: yearRange, ageDisplay, delayedCredit };
});

// Add the 1960+ row
fraTable.push({
  birthYears: '1960 or later',
  ageDisplay: '67',
  delayedCredit: '8.0%',
});
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

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        <strong>Normal Retirement Age</strong> (NRA) is the age at which you receive
        your full <a href="/guides/pia">Primary Insurance Amount (PIA)</a> with no
        reduction or increase
      </li>
      <li>
        NRA ranges from <strong>65 to 67</strong> depending on your birth year
      </li>
      <li>
        Filing before NRA permanently <strong>reduces</strong> your benefit
      </li>
      <li>
        Filing after NRA <strong>increases</strong> your benefit through delayed
        retirement credits, up to age 70
      </li>
      <li>
        The Social Security Administration uses both "Normal Retirement Age" and
        "Full Retirement Age" interchangeably
      </li>
    </ul>
  </div>

  <h2>What Is Normal Retirement Age?</h2>

  <p>
    <strong>Normal Retirement Age</strong> (NRA), also called
    <strong>Full Retirement Age</strong>
    (FRA), is the age at which you're entitled to receive 100% of your calculated
    Social Security benefit, known as your
    <a href="/guides/pia">Primary Insurance Amount (PIA)</a>.
  </p>

  <p>
    The Social Security Administration officially uses both terms. "Full
    Retirement Age" appears more frequently in public-facing materials, while
    "Normal Retirement Age" is common in technical documents and benefit
    calculations. This site primarily uses NRA because "full" can be misleading:
    you can actually receive <em>more</em> than your "full" benefit by delaying
    past NRA up to age 70.
  </p>

  <div class="highlight-box">
    <strong>Why "Normal" Instead of "Full"?</strong>
    <p>
      The term "Full Retirement Age" suggests you receive your maximum benefit
      at that age. In reality, delaying benefits until age 70 results in a
      benefit that's 24–32% higher than your NRA benefit (depending on your
      birth year). NRA is simply the reference point: the age where there's no
      reduction for early filing and no increase for delayed filing.
    </p>
  </div>

  <h2>NRA by Birth Year</h2>

  <p>
    Your Normal Retirement Age depends entirely on when you were born. Congress
    gradually increased NRA from 65 to 67 through legislation passed in 1983,
    affecting those born in 1938 and later.
  </p>

  <div class="table-container">
    <table class="fra-table">
      <thead>
        <tr>
          <th>Year of Birth</th>
          <th>Normal Retirement Age</th>
          <th>Delayed Credit per Year</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1937 or earlier</td>
          <td>65</td>
          <td>6.5%</td>
        </tr>
        {#each fraTable as row}
          <tr>
            <td>{row.birthYears}</td>
            <td>{row.ageDisplay}</td>
            <td>{row.delayedCredit}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p>
    For those born in 1960 or later, NRA is 67. This has been stable since 1983
    and there are no currently scheduled changes, though future legislation
    could adjust this.
  </p>

  <h2>Filing Before Normal Retirement Age</h2>

  <p>
    You can file for Social Security retirement benefits as early as age 62, but
    doing so permanently reduces your monthly benefit. The reduction is
    calculated based on how many months early you file:
  </p>

  <div class="formula-box">
    <h3>Early Filing Reduction Formula</h3>
    <ul>
      <li>
        <strong>First 36 months early:</strong> Benefit reduced by 5/9 of 1% per
        month (6.67% per year)
      </li>
      <li>
        <strong>Additional months beyond 36:</strong> Benefit reduced by 5/12 of
        1% per month (5% per year)
      </li>
    </ul>
  </div>

  <h3>Example: Filing at 62 with NRA of 67</h3>

  <p>If your NRA is 67 and you file at exactly 62, you're filing 60 months early:</p>

  <div class="calculation-example">
    <table>
      <tbody>
        <tr>
          <td>First 36 months: 36 × (5/9 of 1%)</td>
          <td>= 20.0% reduction</td>
        </tr>
        <tr>
          <td>Next 24 months: 24 × (5/12 of 1%)</td>
          <td>= 10.0% reduction</td>
        </tr>
        <tr class="total-row">
          <td><strong>Total reduction:</strong></td>
          <td><strong>30.0%</strong></td>
        </tr>
      </tbody>
    </table>
    <p class="example-note">
      If your PIA is $2,000, filing at 62 gives you $1,400/month permanently.
    </p>
  </div>

  <p>
    This reduction is permanent. Your benefit will still receive annual
    <a href="/guides/inflation">cost-of-living adjustments (COLA)</a>, but the
    base amount remains reduced for life.
  </p>

  <h2>Filing After Normal Retirement Age</h2>

  <p>
    If you delay filing past your NRA, you earn <strong>delayed retirement
    credits</strong> that increase your benefit. These credits accrue monthly
    until age 70, after which there's no additional benefit to waiting.
  </p>

  <div class="formula-box">
    <h3>Delayed Retirement Credits</h3>
    <p>
      For those born in 1943 or later, the credit is <strong>8% per year</strong>
      (2/3 of 1% per month) for each year you delay past NRA, up to age 70.
    </p>
  </div>

  <h3>Example: Delaying to 70 with NRA of 67</h3>

  <div class="calculation-example">
    <table>
      <tbody>
        <tr>
          <td>Delay of 3 years (36 months): 36 × (2/3 of 1%)</td>
          <td>= 24% increase</td>
        </tr>
        <tr class="total-row">
          <td><strong>Benefit at 70:</strong></td>
          <td><strong>124% of PIA</strong></td>
        </tr>
      </tbody>
    </table>
    <p class="example-note">
      If your PIA is $2,000, delaying to 70 gives you $2,480/month.
    </p>
  </div>

  <div class="highlight-box">
    <strong>Note:</strong> If you're already receiving benefits and delay past NRA,
    your delayed credits are applied in January of the following year, not immediately.
    See our guide on the <a href="/guides/delayed-january-bump">delayed January bump</a>
    for more details.
  </div>

  <h2>Why NRA Matters Beyond Personal Benefits</h2>

  <p>Your NRA affects more than just your own retirement benefit:</p>

  <h3>Spousal Benefits</h3>
  <p>
    <a href="/guides/spousal-benefit-filing-date">Spousal benefits</a> are also
    reduced if filed before your NRA. However, unlike personal benefits, spousal
    benefits do <em>not</em> increase if you delay past NRA. There are no delayed
    credits for spousal benefits.
  </p>

  <h3>Survivor Benefits</h3>
  <p>
    Survivors have a different NRA schedule (typically 2 years earlier than
    retirement NRA for the same birth year). Survivor benefits can be filed as
    early as age 60 (or 50 if disabled), with corresponding reductions.
  </p>

  <h3>The Earnings Test</h3>
  <p>
    If you work while receiving benefits before NRA, your benefits may be
    temporarily reduced due to the <strong>earnings test</strong>. In 2025, if
    you earn more than $23,400 while receiving benefits before NRA, $1 is
    withheld for every $2 over the limit. This reduction ends once you reach
    NRA.
  </p>

  <h2>Common Misconceptions</h2>

  <div class="warning-box">
    <h4>Misconception: "I should file at my Full Retirement Age to get my full benefit"</h4>
    <p>
      NRA is not the age at which you receive the most money. If you can afford
      to wait, delaying until 70 provides a significantly higher lifetime
      benefit if you live past your early 80s. The "full" in Full Retirement Age
      simply means no reduction or increase. It's the neutral reference point.
    </p>
  </div>

  <div class="warning-box">
    <h4>Misconception: "Everyone's NRA is 65"</h4>
    <p>
      This was true for those born before 1938, but NRA has been gradually
      increasing. For anyone born in 1960 or later, NRA is 67. Using 65 as your
      NRA could lead to significant miscalculations in retirement planning.
    </p>
  </div>

  <div class="warning-box">
    <h4>Misconception: "The early filing reduction goes away at NRA"</h4>
    <p>
      If you file early, the reduction is permanent. Your benefit will never
      increase to what it would have been had you waited until NRA (though it
      will still receive annual COLA adjustments).
    </p>
  </div>

  <h2>Calculate Your Specific Situation</h2>

  <p>
    Your optimal filing age depends on many personal factors: your health, other
    income sources, spousal considerations, and more. Use the
    <a href="/calculator">SSA.tools calculator</a> to see exactly how different
    filing ages affect your benefits based on your actual earnings record.
  </p>

  <p>
    The calculator shows your NRA based on your birth date and displays how your
    benefit changes at every possible filing age from 62 to 70.
  </p>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> – The benefit
      amount you receive at NRA
    </li>
    <li>
      <a href="/guides/maximum">Maximum Social Security Benefit</a> – What it
      takes to receive the highest possible benefit
    </li>
    <li>
      <a href="/guides/spousal-benefit-filing-date">Spousal Benefits and Filing Dates</a>
      – How NRA affects spousal benefit calculations
    </li>
    <li>
      <a href="/guides/delayed-january-bump">Delayed January Bump</a> – How
      delayed credits are applied after NRA
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
  .key-takeaways {
    background-color: #e8f4fd;
    border: 2px solid #4a90e2;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2c3e50;
  }

  .key-takeaways ul {
    margin-bottom: 0;
  }

  .key-takeaways li {
    margin-bottom: 8px;
  }

  .key-takeaways li:last-child {
    margin-bottom: 0;
  }

  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #4a90e2;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .highlight-box p {
    margin: 10px 0 0 0;
  }

  .table-container {
    overflow-x: auto;
    margin: 20px 0;
  }

  .fra-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .fra-table th,
  .fra-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .fra-table th {
    background-color: #2c3e50;
    color: white;
    font-weight: 600;
  }

  .fra-table tbody tr:hover {
    background-color: #f8f9fa;
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

  .formula-box ul {
    list-style: none;
    padding-left: 0;
    margin-bottom: 0;
  }

  .formula-box li {
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }

  .formula-box li:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .formula-box p {
    margin-bottom: 0;
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

  .example-note {
    margin-top: 15px;
    margin-bottom: 0;
    font-style: italic;
    color: #555;
  }

  .warning-box {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .warning-box h4 {
    margin-top: 0;
    color: #856404;
  }

  .warning-box p {
    margin-bottom: 0;
  }

  @media (max-width: 600px) {
    .fra-table th,
    .fra-table td {
      padding: 8px 12px;
      font-size: 14px;
    }

    .calculation-example table {
      font-size: 14px;
    }

    .calculation-example td {
      padding: 6px 8px;
    }
  }
</style>
