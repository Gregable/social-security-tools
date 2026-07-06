<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from "../InlineCTA.svelte";

  const title =
    "Working While Receiving Social Security: The Earnings Test Explained";
  const description =
    "Can you work while collecting Social Security? Learn about the earnings test, 2025 and 2026 income limits, how benefits are reduced, and why withheld benefits are returned at full retirement age.";
  const publishDate = new Date("2026-01-26T00:00:00+00:00");
  const updateDate = new Date("2026-01-26T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/earnings-test";
  schema.title = title;
  schema.image = "/laptop-piggybank.jpg";
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt = "Social Security earnings test calculator";
  schema.tags = [
    "Social Security earnings test",
    "working while on Social Security",
    "Social Security income limit",
    "earnings limit 2025",
    "earnings limit 2026",
    "can I work and collect Social Security",
    "Social Security benefit reduction",
    "retirement earnings limit",
  ];

</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/earnings-test" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>Working While Receiving Social Security</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    A lot of people believe that if they work while collecting Social Security,
    they'll permanently lose part of their benefit. That's not how it works.
    If you're under <a href="/guides/nra">full retirement age</a> and earn
    above certain limits, some of your benefit is withheld for now — but the
    money that gets withheld comes back to you later. Once you understand this,
    the decision about whether to keep working while claiming looks quite
    different.
  </p>

  <h2>2025 and 2026 Earnings Limits</h2>

  <p>
    The Social Security Administration adjusts the earnings limits annually
    based on changes in national average wages.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Situation</th>
        <th>2025 Limit</th>
        <th>2026 Limit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Under FRA all year</td>
        <td>$23,400</td>
        <td>$24,480</td>
      </tr>
      <tr>
        <td>Year you reach FRA</td>
        <td>$62,160</td>
        <td>$65,160</td>
      </tr>
      <tr>
        <td>Month you reach FRA and after</td>
        <td colspan="2">No limit</td>
      </tr>
    </tbody>
  </table>

  <h2>How the Earnings Test Works</h2>

  <p>
    The earnings test has different rules depending on your age relative to your
    <a href="/guides/nra">full retirement age (FRA)</a>:
  </p>

  <h3>Under Full Retirement Age All Year</h3>

  <p>
    If you won't reach FRA at any point during the year, Social Security
    deducts $1 from your benefits for every $2 you earn above the annual limit.
  </p>

  <p>
    Take Sarah, age 63, with a benefit of $1,500 per month ($18,000 per year).
    She earns $34,480 in 2026 — that's $10,000 over the $24,480 limit. Half of
    the excess, $5,000, is withheld from her benefits, so she receives $13,000
    for the year instead of $18,000. In practice, Social Security withholds
    whole checks starting in January until the $5,000 is recovered: Sarah gets
    no checks for the first 3-4 months, then full checks the rest of the year.
  </p>

  <h3>Year You Reach Full Retirement Age</h3>

  <p>
    In the year you turn FRA, the rules are more generous. Social Security
    only counts earnings from months before your birthday month, and deducts
    just $1 for every $3 over a higher limit.
  </p>

  <p>
    Say Tom turns 67 — his FRA — in August 2026, and his benefit is $2,000 per
    month. He earns $70,000 from January through July, which is $4,840 over
    the $65,160 limit. One third of that, about $1,613, is withheld — roughly
    one month of benefits. Starting in August, the earnings test no longer
    applies to him at all.
  </p>

  <p>
    And once you're at full retirement age or older, the earnings test
    disappears entirely. You can earn any amount from working without any
    reduction to your benefits.
  </p>

  <InlineCTA type="calculator" />

  <h2>Your Withheld Benefits Are Returned</h2>

  <p>
    So what happens to the money that was withheld? You get it back. When you
    reach full retirement age, Social Security recalculates your benefit as if
    you had claimed later than you actually did, giving you credit for the
    months when benefits were withheld.
  </p>

  <p>
    For example, Lisa claimed benefits at 62 and had benefits withheld for 24
    months before reaching her FRA of 67. Her original reduction for claiming
    at 62 was 30% — she got 70% of her PIA. At FRA, Social Security credits her
    for those 24 withheld months, and her reduction shrinks to roughly 20%. She
    now gets about 80% of PIA, and that higher amount continues for the rest of
    her life.
  </p>

  <p>
    The payback isn't immediate, though. You won't receive a lump sum. Instead,
    your monthly benefit is increased, and over time — typically 12 to 15 years
    — you recover the full amount that was withheld.
  </p>

  <h2>What Counts as "Earnings"?</h2>

  <p>
    Not all income counts. The earnings test only looks at money you earn from
    working.
  </p>

  <div class="two-column">
    <div class="count-box">
      <h3>Income That COUNTS</h3>
      <ul>
        <li>Wages from employment</li>
        <li>Net self-employment income</li>
        <li>Bonuses</li>
        <li>Commissions</li>
        <li>Vacation pay</li>
        <li>Severance pay (in some cases)</li>
      </ul>
    </div>

    <div class="not-count-box">
      <h3>Income That Does NOT Count</h3>
      <ul>
        <li>Investment income (dividends, interest)</li>
        <li>Capital gains</li>
        <li>Pension payments</li>
        <li>Annuity income</li>
        <li>401(k) or IRA withdrawals</li>
        <li>Rental income (if not a business)</li>
        <li>Social Security benefits</li>
        <li>Veterans benefits</li>
        <li>Other government benefits</li>
      </ul>
    </div>
  </div>

  <p>
    This distinction matters if you're under FRA and want to reduce the impact
    of the earnings test. Because only work income counts, drawing more from
    retirement accounts while working less can give you the same total income
    while keeping your Social Security benefits intact.
  </p>

  <h2>The Monthly Earnings Test (First Year Rule)</h2>

  <p>
    In your first year of receiving benefits, Social Security offers an
    alternative monthly test. This helps people who retire mid-year after
    earning a lot earlier in the year.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Situation</th>
        <th>2025 Monthly Limit</th>
        <th>2026 Monthly Limit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Under FRA all year</td>
        <td>$1,950</td>
        <td>$2,040</td>
      </tr>
      <tr>
        <td>Year you reach FRA</td>
        <td>$5,180</td>
        <td>$5,430</td>
      </tr>
    </tbody>
  </table>

  <p>
    Here's how it helps. Mike, age 64, earned $80,000 from January through June
    2026, then retired and started Social Security in July. Under the annual
    test, $80,000 is way over the $24,480 limit. But under the monthly test, he
    earns $0 per month from July through December — well under the $2,040
    monthly limit — so he receives full benefits for those months. The monthly
    test only applies in the first year you receive benefits; after that, only
    the annual test applies.
  </p>

  <h2>Special Situations</h2>

  <h3>Self-Employment</h3>

  <p>
    If you're self-employed, Social Security counts your net earnings
    (profit after business expenses). In your first year of retirement, they may
    also apply a "services test" - if you work more than 45 hours per month in your
    business (or 15-45 hours in a highly skilled occupation), you may not be considered
    retired for that month regardless of income.
  </p>

  <h3>Working Outside the United States</h3>

  <p>
    Different rules apply if you work outside the U.S. The "foreign work test"
    may suspend benefits for any month you work more than 45 hours, regardless
    of earnings amount. See our
    <a href="/guides/international-agreements">international agreements guide</a>
    for more information.
  </p>

  <h3>Family Benefits</h3>

  <p>
    If your spouse or children receive benefits on your record, your excess
    earnings can reduce their benefits too - but only up to the maximum family
    benefit. Their own earnings don't affect your benefit.
  </p>

  <h2>Common Misconceptions</h2>

  <p>
    Does working permanently reduce your Social Security? No. Benefits withheld
    by the earnings test are credited back to you at full retirement age
    through higher monthly payments, so you eventually recover the withheld
    amounts.
  </p>

  <p>
    Does all your income count toward the test? Also no. Only wages and
    self-employment income count. Investment income, pensions, retirement
    account withdrawals, and other passive income don't trigger the earnings
    test at all. And once you reach full retirement age, the test simply stops
    applying — you can earn any amount without affecting your benefits.
  </p>

  <p>
    So should you wait until FRA to claim if you're still working? Not
    necessarily. Because withheld benefits are returned, claiming early while
    working can still make sense. The math depends on your expected earnings,
    life expectancy, and other factors.
  </p>

  <h2>Strategic Considerations</h2>

  <p>
    If you're deciding whether to claim while still working, start by
    estimating how much would be withheld using the limits above. Then weigh
    the usual claiming factors: a longer life expectancy favors delaying,
    working income plus Social Security may push you into a higher tax bracket,
    and your claiming decision affects the survivor benefit your spouse could
    receive later. If you can cover expenses without Social Security, waiting
    is often the simpler choice.
  </p>

  <p>
    Timing within the year matters too. Retiring early in the year means fewer
    months of earnings count against you, the monthly test can help in your
    first year if you retire mid-year, and earnings after your FRA birthday
    month don't count at all.
  </p>

  <h2>Calculate Your Benefits</h2>

  <p>
    To see what your own benefit would be, try the
    <a href="/calculator">ssa.tools calculator</a> with your earnings record.
  </p>

  <p>
    For more information on related topics, see our guides on
    <a href="/guides/nra">Normal Retirement Age</a>,
    <a href="/guides/federal-taxes">federal taxation of benefits</a>, and
    <a href="/guides/pia">Primary Insurance Amount</a>.
  </p>

  <GuideFooter />
</div>

<style>
  .benefit-table {
    width: fit-content;
    max-width: 80%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .benefit-table th,
  .benefit-table td {
    padding: 10px 25px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .benefit-table th:first-child,
  .benefit-table td:first-child {
    text-align: right;
  }

  .benefit-table th {
    background-color: #e9ecef;
    font-weight: 600;
  }

  .benefit-table tbody tr:hover {
    background-color: #f5f5f5;
  }

  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
  }

  .count-box {
    background-color: #ffebee;
    border: 1px solid #ef5350;
    border-radius: 8px;
    padding: 15px;
  }

  .count-box h3 {
    margin-top: 0;
    color: #c62828;
    font-size: 1em;
  }

  .count-box ul {
    margin-bottom: 0;
  }

  .not-count-box {
    background-color: #e8f5e9;
    border: 1px solid #66bb6a;
    border-radius: 8px;
    padding: 15px;
  }

  .not-count-box h3 {
    margin-top: 0;
    color: #2e7d32;
    font-size: 1em;
  }

  .not-count-box ul {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    .two-column {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .benefit-table {
      font-size: 14px;
    }

    .benefit-table th,
    .benefit-table td {
      padding: 8px 10px;
    }
  }
</style>
