<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import {
    MAX_WAGE_INDEX_YEAR,
    MAX_YEAR,
    SSA_EARNINGS_YEARS,
    WAGE_INDICES,
  } from "$lib/constants";
  import { createMaxEarnerForBirthYear } from "$lib/max-earner";
  import { Money } from "$lib/money";
  import { Recipient } from "$lib/recipient";
  import { GuidesSchema, renderFAQSchema, type FAQItem } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";

  // Current year from constants
  const currentYear = MAX_YEAR;

  // Create a representative recipient turning 62 in the current year
  // Born Jan 2 to avoid SSA birthday edge cases
  const birthYearFor62 = currentYear - 62;
  const recipient = new Recipient();
  recipient.birthdate = Birthdate.FromYMD(birthYearFor62, 0, 2);

  // Create a max earner turning 62 this year to calculate maximum possible AIME
  const maxEarner = createMaxEarnerForBirthYear(birthYearFor62);
  const maxAIME = maxEarner.monthlyIndexedEarnings();

  // Get PIA calculator and bend points from the Recipient
  const pia = maxEarner.pia();
  const firstBendPoint = pia.firstBendPoint();
  const secondBendPoint = pia.secondBendPoint();

  // Indexing year is the year the recipient turns 60
  const indexingYear = maxEarner.indexingYear();
  const effectiveIndexingYear = Math.min(indexingYear, MAX_WAGE_INDEX_YEAR);

  // Helper function to compute indexing factor for a given year
  function indexFactor(earningsYear: number): number {
    if (earningsYear >= effectiveIndexingYear) return 1.0;
    if (earningsYear < 1951) return 0.0;
    return WAGE_INDICES[effectiveIndexingYear].div$(WAGE_INDICES[earningsYear]);
  }

  // Example years for indexing factor table
  const indexingExampleYears = [1990, 2000, 2010, 2020];
  const exampleEarnings = Money.from(50000);

  // AIME values for the AIME to PIA table
  const aimeTableValues = [
    1000,
    2000,
    3000,
    4000,
    5000,
    6000,
    Math.round(secondBendPoint.value()),
    8000,
    10000,
    Math.round(maxAIME.value()),
  ];

  // Calculate the total months for AIME calculation
  const totalMonths = SSA_EARNINGS_YEARS * 12;

  const title = "Averaged Indexed Monthly Earnings (AIME)";
  const description =
    "Learn how AIME (Average Indexed Monthly Earnings) is calculated and why it matters for your Social Security benefits. Comprehensive guide with examples.";
  const publishDate = new Date("2025-09-19T00:00:00+00:00");
  const updateDate = new Date("2025-09-19T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/aime";
  schema.title = title;
  schema.image = "/laptop-piggybank.jpg";
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt =
    "Laptop with piggybank representing Social Security AIME calculations";
  schema.tags = [
    "AIME",
    "Average Indexed Monthly Earnings",
    "Social Security",
    "Benefits Calculation",
  ];

  // FAQ structured data for featured snippets
  const faqs: FAQItem[] = [
    {
      question: "What is AIME in Social Security?",
      answer: `AIME (Averaged Indexed Monthly Earnings) is the monthly average of your highest ${SSA_EARNINGS_YEARS} years of earnings, adjusted for wage growth over time. It's the foundation for calculating your Primary Insurance Amount (PIA), which determines your Social Security benefit.`,
    },
    {
      question: "How is AIME calculated?",
      answer: `AIME is calculated in three steps: 1) Index your historical earnings using wage growth factors to bring them to current dollar values; 2) Select your highest ${SSA_EARNINGS_YEARS} years of indexed earnings; 3) Divide the total by ${SSA_EARNINGS_YEARS * 12} months to get your monthly average. The result is rounded down to the nearest dollar.`,
    },
    {
      question: "What is a good AIME?",
      answer: `There's no single "good" AIME—it depends on your career earnings. An AIME below the first bendpoint (${firstBendPoint.wholeDollars()}) means lower lifetime earnings with 90% replacement. An AIME between ${firstBendPoint.wholeDollars()} and ${secondBendPoint.wholeDollars()} represents moderate to above-average earnings. An AIME above ${secondBendPoint.wholeDollars()} indicates high lifetime earnings.`,
    },
    {
      question: `Why does Social Security use ${SSA_EARNINGS_YEARS} years for AIME?`,
      answer: `Social Security uses your highest ${SSA_EARNINGS_YEARS} years to balance between rewarding consistent work history and not penalizing people for low-earning years early in their careers or time out of the workforce. This means your lowest earning years beyond ${SSA_EARNINGS_YEARS} are ignored in the calculation.`,
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

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Your Social Security benefits are fundamentally based on a single key
    calculation: your <strong>Averaged Indexed Monthly Earnings</strong> (AIME).
    Understanding how this number is calculated is crucial to understanding your
    Social Security benefits and how different earning patterns throughout your career
    affect your retirement income.
  </p>

  <h2>What is AIME?</h2>

  <p>
    The Averaged Indexed Monthly Earnings (AIME) is the monthly average of your
    highest {SSA_EARNINGS_YEARS} years of earnings, adjusted over time by wage growth.
    This single number forms the foundation for calculating your Primary Insurance
    Amount (PIA), which determines your actual Social Security benefit amount.
  </p>

  <div class="highlight-box">
    <strong>Key Point:</strong> AIME is calculated using your top {SSA_EARNINGS_YEARS}
    years of
    <em>indexed</em> earnings, not your raw earnings. This indexing process adjusts
    your historical earnings to account for wage growth over time.
  </div>

  <h2>The Three-Step AIME Calculation Process</h2>

  <h3>Step 1: Index Your Earnings</h3>

  <p>
    Social Security doesn't use your raw earnings from each year. Instead, it
    applies <strong>wage indexing multipliers</strong> to adjust your historical
    earnings to reflect wage growth. These multipliers scale your earnings from each
    year to be equivalent to wages in the year you turn 60.
  </p>

  <p>
    For example, if you earned $30,000 in 1995 and the indexing factor for 1995
    is 2.1, your indexed earnings for that year would be $63,000 ($30,000 x 2.1
    = $63,000). This adjustment ensures that your earlier career earnings aren't
    diminished by years of wage inflation.
  </p>

  <div class="indexing-example">
    <h4>{currentYear} Indexing Factor Examples</h4>
    <p>
      For someone turning 62 in {currentYear}, here are sample indexing factors:
    </p>
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Approx. Factor</th>
          <th>{exampleEarnings.wholeDollars()} Earnings Becomes</th>
        </tr>
      </thead>
      <tbody>
        {#each indexingExampleYears as year}
          <tr>
            <td>{year}</td>
            <td>{indexFactor(year).toFixed(2)}</td>
            <td
              >{exampleEarnings
                .times(indexFactor(year))
                .roundToDollar()
                .wholeDollars()}</td
            >
          </tr>
        {/each}
        <tr>
          <td>{effectiveIndexingYear}+</td>
          <td>1.00</td>
          <td>{exampleEarnings.wholeDollars()} (no indexing)</td>
        </tr>
      </tbody>
    </table>
    <p class="table-note">
      Note: Exact factors depend on your birth year. These are approximate
      values for illustration.
    </p>
  </div>

  <p>
    The indexing multipliers increase every year until you reach age 60, after
    which point they are fixed. Years after age 60 use a 1.0 multiplier (no
    indexing). For more detailed information about how these indexing factors
    work and why SSA.tools uses current year factors for younger recipients, see
    our
    <a href="/guides/indexing-factors">Indexing Factors guide</a>.
  </p>

  <p>
    It's important to note that your earnings in any given year are also subject
    to the <strong>annual earnings cap</strong>. Only earnings up to this cap
    count toward your Social Security benefits. For detailed information about
    how these caps work and their historical values, see our
    <a href="/guides/earnings-cap">Earnings Cap guide</a>.
  </p>

  <h3>Step 2: Select Your Top {SSA_EARNINGS_YEARS} Years</h3>

  <p>
    Once all your earnings are indexed, Social Security takes your highest {SSA_EARNINGS_YEARS}
    years of indexed earnings. If you have fewer than {SSA_EARNINGS_YEARS} years
    of earnings, zeros are used for the missing years.
  </p>

  <p>
    This means that if you have more than {SSA_EARNINGS_YEARS} years of earnings,
    only your highest {SSA_EARNINGS_YEARS} count toward your benefit calculation.
    Lower earning years are effectively ignored. Conversely, if you have fewer than
    {SSA_EARNINGS_YEARS} years, every additional year you work will likely increase
    your AIME.
  </p>

  <div class="example-box">
    <h4>Example: Impact of the {SSA_EARNINGS_YEARS}-Year Rule</h4>
    <p>
      Consider someone with 40 years of earnings. Their top {SSA_EARNINGS_YEARS}
      years have indexed earnings ranging from $45,000 to $75,000, while their bottom
      5 years have indexed earnings of $20,000 to $35,000. Only the top {SSA_EARNINGS_YEARS}
      years count toward their AIME calculation—the lower 5 years are completely
      ignored.
    </p>
  </div>

  <h3>Step 3: Calculate the Monthly Average</h3>

  <p>
    Your AIME is calculated by summing your top {SSA_EARNINGS_YEARS} years of indexed
    earnings and dividing by {totalMonths} months ({SSA_EARNINGS_YEARS} years × 12
    months). The formula is straightforward:
  </p>

  <div class="formula-box">
    <strong
      >AIME = Total of Top {SSA_EARNINGS_YEARS} Indexed Earnings ÷ {SSA_EARNINGS_YEARS}
      years ÷ 12 months</strong
    >
  </div>

  <p>
    The result is always rounded down to the nearest dollar. For example, if
    your calculation yields $3,847.83, your AIME would be $3,847.
  </p>

  <h2>Why AIME Matters</h2>

  <p>
    Your AIME directly determines your <a href="/guides/pia"
      >Primary Insurance Amount (PIA)</a
    > through a progressive benefit formula. The Social Security Administration applies
    different percentage rates to different portions of your AIME:
  </p>

  <ul>
    <li>
      90% of the first portion of your AIME (up to the first "bend point")
    </li>
    <li>
      32% of the middle portion (between the first and second bend points)
    </li>
    <li>15% of any remaining amount above the second bend point</li>
  </ul>

  <p>
    For a detailed explanation of how these bend points work and their
    implications for your benefits, see our comprehensive
    <a href="/guides/pia">Primary Insurance Amount (PIA) guide</a>.
  </p>

  <p>
    This progressive structure means that Social Security provides higher
    replacement rates for lower earners while still providing meaningful
    benefits for higher earners.
  </p>

  <h2>What is a Good AIME?</h2>

  <p>
    There's no single "good" AIME—it depends on your career earnings and
    retirement goals. However, understanding where you fall relative to typical
    values can help with planning:
  </p>

  <ul>
    <li>
      <strong>Below {firstBendPoint.wholeDollars()}:</strong> Lower lifetime earnings;
      Social Security replaces 90% of this portion
    </li>
    <li>
      <strong
        >{firstBendPoint.wholeDollars()} - {secondBendPoint.wholeDollars()}:</strong
      >
      Moderate to above-average earnings; the 32% replacement bracket
    </li>
    <li>
      <strong>Above {secondBendPoint.wholeDollars()}:</strong> High lifetime earnings;
      only 15% replacement on amounts above this bend point
    </li>
  </ul>

  <p>
    The maximum possible AIME depends on your birth year and earnings history.
    For someone who consistently earned at or above the <a
      href="/guides/earnings-cap">earnings cap</a
    >
    for {SSA_EARNINGS_YEARS} years, the maximum AIME in {currentYear} is {maxAIME.wholeDollars()}.
    This maximum AIME leads to the <a href="/guides/maximum">maximum Social Security benefit</a>.
  </p>

  <h3>AIME to PIA Conversion Table</h3>

  <p>
    Here's how different AIME levels translate to monthly PIA amounts using {currentYear}
    bend points ({firstBendPoint.wholeDollars()} and {secondBendPoint.wholeDollars()}):
  </p>

  <div class="aime-table">
    <table>
      <thead>
        <tr>
          <th>AIME</th>
          <th>Estimated PIA</th>
          <th>Replacement Rate</th>
        </tr>
      </thead>
      <tbody>
        {#each aimeTableValues as aimeValue}
          {@const aimeMoney = Money.from(aimeValue)}
          {@const piaAmount = pia.piaFromAIME(aimeMoney)}
          {@const replacementRate = Math.round(piaAmount.div$(aimeMoney) * 100)}
          <tr>
            <td>${aimeValue.toLocaleString()}</td>
            <td>{piaAmount.wholeDollars()}</td>
            <td>{replacementRate}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p>
    Notice how the replacement rate decreases as AIME increases—this is the
    progressive nature of Social Security in action. Lower earners receive back
    a larger percentage of their earnings as benefits.
  </p>

  <h2>Strategies to Maximize Your AIME</h2>

  <h3>Work at Least {SSA_EARNINGS_YEARS} Years</h3>

  <p>
    Since AIME is based on {SSA_EARNINGS_YEARS} years of earnings, working fewer
    than {SSA_EARNINGS_YEARS} years means zeros are averaged into your calculation.
    Each additional year of work (up to {SSA_EARNINGS_YEARS}) will replace a
    zero and increase your AIME.
  </p>

  <h3>Continue Working After {SSA_EARNINGS_YEARS} Years</h3>

  <p>
    If you already have {SSA_EARNINGS_YEARS} years of earnings, additional years
    can still help if your current earnings exceed your lowest indexed earning years.
    Each high-earning year can replace a lower earning year in your top {SSA_EARNINGS_YEARS}.
  </p>

  <h3>Maximize Earnings Within the Cap</h3>

  <p>
    Since only earnings up to the annual cap count toward Social Security,
    there's no benefit calculation advantage to earning above the cap in any
    given year. However, consistently earning at or near the cap will maximize
    your AIME.
  </p>

  <h2>Common AIME Misconceptions</h2>

  <h3>"My Recent High Earnings Will Dramatically Boost My Benefits"</h3>

  <p>
    While recent high earnings can help, remember that AIME is an average over
    {SSA_EARNINGS_YEARS} years. A few high-earning years late in your career may
    improve your AIME, but the impact is diluted across the entire {SSA_EARNINGS_YEARS}-year
    period.
  </p>

  <h3>"Working Past Age 60 Doesn't Affect Indexing"</h3>

  <p>
    While it's true that earnings after age 60 aren't indexed (they use a 1.0
    multiplier), they can still improve your AIME if they're higher than your
    lowest earning years in your top {SSA_EARNINGS_YEARS}.
  </p>

  <h3>"I Need to Work Until 65 to Maximize My Benefits"</h3>

  <p>
    Your AIME calculation is independent of when you choose to claim benefits.
    You could stop working at 55 and your AIME would be fixed based on your
    earnings history through that point. However, continuing to work and earn
    can improve your AIME by replacing lower earning years.
  </p>

  <h2>Using SSA.tools to Understand Your AIME</h2>

  <p>
    The <a href="/">SSA.tools calculator</a> provides detailed information about
    your AIME calculation. When you input your earnings record, you can see:
  </p>

  <ul>
    <li>Your indexed earnings for each year</li>
    <li>Which years are included in your top {SSA_EARNINGS_YEARS}</li>
    <li>Your total indexed earnings and resulting AIME</li>
    <li>How future earnings scenarios might affect your AIME</li>
  </ul>

  <p>
    The calculator also shows you the "cutoff" indexed earnings amount—the
    lowest indexed earning year in your top {SSA_EARNINGS_YEARS}. Any future
    year where your indexed earnings exceed this amount will improve your AIME.
  </p>

  <h2>Conclusion</h2>

  <p>
    Understanding your AIME is fundamental to understanding your Social Security
    benefits. This single number, representing your average monthly earnings
    over your highest {SSA_EARNINGS_YEARS} years (adjusted for wage growth), determines
    your Primary Insurance Amount and ultimately your benefit payments.
  </p>

  <p>
    By understanding how AIME is calculated, you can make more informed
    decisions about your career, retirement timing, and overall financial
    planning. Whether you're early in your career or approaching retirement,
    knowing how your earning patterns affect this crucial calculation can help
    you optimize your Social Security benefits.
  </p>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> — How your AIME
      is converted to your monthly benefit using the bendpoint formula
    </li>
    <li>
      <a href="/guides/earnings-cap">Earnings Cap</a> — The annual limit on
      earnings that count toward your AIME
    </li>
    <li>
      <a href="/guides/work-credits">Work Credits</a> — The 40 credits you need
      before your AIME matters for benefits
    </li>
    <li>
      <a href="/guides/maximum">Maximum Benefit</a> — What happens when you
      maximize your AIME by earning at the cap for {SSA_EARNINGS_YEARS} years
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #0066cc;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .example-box {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .example-box h4 {
    margin-top: 0;
    color: #333;
  }

  .formula-box {
    background-color: #fff5ee;
    border: 2px solid #ff8c00;
    border-radius: 4px;
    padding: 1rem;
    margin: 1.5rem 0;
    text-align: center;
    font-size: 1.1em;
  }

  .guide-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    line-height: 1.6;
  }

  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 2rem;
  }

  h1 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
  }

  h2 {
    color: #34495e;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  h3 {
    color: #555;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  a {
    color: #3498db;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
  }

  .indexing-example {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .indexing-example h4 {
    margin-top: 0;
    color: #2c3e50;
  }

  .indexing-example table,
  .aime-table table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }

  .indexing-example th,
  .indexing-example td,
  .aime-table th,
  .aime-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  .indexing-example th,
  .aime-table th {
    background-color: #e9ecef;
    font-weight: bold;
    color: #2c3e50;
  }

  .indexing-example tbody tr:hover,
  .aime-table tbody tr:hover {
    background-color: #f5f5f5;
  }

  .table-note {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
    margin-top: 10px;
  }

  .aime-table {
    background-color: #f0f8ff;
    border: 1px solid #4a90e2;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
    overflow-x: auto;
  }

  @media (max-width: 768px) {
    .guide-page {
      padding: 1rem;
    }

    .indexing-example table,
    .aime-table table {
      font-size: 14px;
    }

    .indexing-example th,
    .indexing-example td,
    .aime-table th,
    .aime-table td {
      padding: 8px 6px;
    }
  }
</style>
