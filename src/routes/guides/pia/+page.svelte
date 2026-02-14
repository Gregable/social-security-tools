<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import BendpointChart from "$lib/components/BendpointChart.svelte";
  import {
    AFTER_BENDPOINT2_MULTIPLIER,
    BEFORE_BENDPOINT1_MULTIPLIER,
    BEFORE_BENDPOINT2_MULTIPLIER,
    MAX_YEAR,
    SSA_EARNINGS_YEARS,
  } from "$lib/constants";
  import { Money } from "$lib/money";
  import averagePaste from "$lib/pastes/averagepaste.txt?raw";
  import { Recipient } from "$lib/recipient";
  import { GuidesSchema, renderFAQSchema, type FAQItem } from "$lib/schema-org";
  import { parsePaste } from "$lib/ssa-parse";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from "../InlineCTA.svelte";

  // Current year from constants
  const currentYear = MAX_YEAR;

  // Create a representative recipient turning 62 in the current year
  // This gives us the bend points for someone first eligible in this year
  const birthYearFor62 = currentYear - 62;
  const representative = new Recipient();
  representative.birthdate = Birthdate.FromYMD(birthYearFor62, 0, 2);

  // Get PIA object and bend points from the Recipient
  const pia = representative.pia();
  const firstBendPoint = pia.firstBendPoint();
  const secondBendPoint = pia.secondBendPoint();

  // Convert multipliers to percentages for display
  const firstBracketPercent = Math.round(BEFORE_BENDPOINT1_MULTIPLIER * 100);
  const secondBracketPercent = Math.round(BEFORE_BENDPOINT2_MULTIPLIER * 100);
  const thirdBracketPercent = Math.round(AFTER_BENDPOINT2_MULTIPLIER * 100);

  // Example calculation with AIME of $5,000
  const exampleAIME = Money.from(5000);
  const exampleBracket1 = Money.min(exampleAIME, firstBendPoint).times(
    BEFORE_BENDPOINT1_MULTIPLIER
  );
  const exampleBracket2Amount = Money.max(
    Money.zero(),
    Money.min(exampleAIME, secondBendPoint).sub(firstBendPoint)
  );
  const exampleBracket2 = exampleBracket2Amount.times(
    BEFORE_BENDPOINT2_MULTIPLIER
  );
  const examplePIAUnrounded = exampleBracket1.plus(exampleBracket2);
  const examplePIA = pia.piaFromAIME(exampleAIME);

  // For the late-career earnings examples
  const midBracketAIME = Money.from(6000);
  const midBracketIncrease = Money.from(500);
  const highBracketAIME = Money.from(8000);
  const midBracketBenefit = midBracketIncrease.times(
    BEFORE_BENDPOINT2_MULTIPLIER
  );
  const highBracketBenefit = midBracketIncrease.times(
    AFTER_BENDPOINT2_MULTIPLIER
  );

  // AIME values for the AIME to PIA conversion table
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
    12500,
  ];

  // Create a demo recipient with sample earnings for the bendpoint chart
  const demoRecipient = new Recipient();
  demoRecipient.earningsRecords = parsePaste(averagePaste);
  demoRecipient.birthdate = Birthdate.FromYMD(birthYearFor62, 0, 2);

  const title = "Primary Insurance Amount (PIA)";
  const description = `Learn how Social Security calculates your Primary Insurance Amount (PIA) in ${currentYear}. Understand the bendpoint formula (${firstBendPoint.wholeDollars()} and ${secondBendPoint.wholeDollars()}), calculate your monthly benefit, and discover strategies to maximize your PIA.`;
  const publishDate = new Date("2025-09-19T00:00:00+00:00");
  const updateDate = new Date("2025-09-19T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/pia";
  schema.title = title;
  schema.image = "/laptop-piggybank.jpg";
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt =
    "Laptop with piggybank representing Social Security calculations";
  schema.tags = [
    "Primary Insurance Amount",
    "PIA",
    "Social Security",
    "Bendpoints",
  ];

  // FAQ structured data for featured snippets
  const faqs: FAQItem[] = [
    {
      question: "What is a good PIA?",
      answer: `A "good" PIA depends on your income needs and lifestyle expectations. A PIA above $2,500 puts you in the upper tier of beneficiaries, while the maximum PIA requires earning at or above the taxable maximum for ${SSA_EARNINGS_YEARS} years. Most financial planners suggest Social Security should replace about 40% of pre-retirement income for average earners.`,
    },
    {
      question: "How is PIA different from my actual benefit?",
      answer:
        "Your PIA is your benefit amount only if you claim at your Full Retirement Age. If you claim early (as young as 62), your benefit is permanently reduced—up to 30% less than your PIA. If you delay past FRA (up to age 70), you earn delayed retirement credits that increase your benefit by 8% per year, potentially receiving up to 124-132% of your PIA.",
    },
    {
      question: "Does my PIA change after I start receiving benefits?",
      answer:
        "Yes, but only through Cost-of-Living Adjustments (COLA). Once you turn 62, your PIA is locked in and protected against inflation through annual COLA increases. However, if you continue working while receiving benefits, additional high-earning years could potentially increase your AIME and thus your PIA.",
    },
    {
      question: `What if I don't have ${SSA_EARNINGS_YEARS} years of work history?`,
      answer: `Social Security uses your highest ${SSA_EARNINGS_YEARS} years of indexed earnings to calculate your AIME. If you have fewer than ${SSA_EARNINGS_YEARS} years, zeros are averaged in for the missing years, which significantly lowers your AIME and PIA. Each additional year of work replaces a zero, boosting your benefit.`,
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
    Your <strong>Primary Insurance Amount</strong> (PIA) is the most important number
    in Social Security. It's the dollar amount you'll receive each month if you start
    collecting benefits at your Normal Retirement Age (NRA). Understanding how PIA
    is calculated helps you make informed decisions about your career, retirement
    timing, and overall Social Security strategy.
  </p>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        <strong>PIA = Your benefit at Full Retirement Age (FRA)</strong> - File early
        and you get less; delay and you get more
      </li>
      <li>
        <strong>Based on your highest {SSA_EARNINGS_YEARS} years</strong> - Your
        AIME (average indexed earnings) feeds into the PIA formula
      </li>
      <li>
        <strong>Progressive formula</strong> - Lower earners replace more of
        their income ({firstBracketPercent}%) than higher earners ({thirdBracketPercent}%)
      </li>
      <li>
        <strong
          >{currentYear} bendpoints: {firstBendPoint.wholeDollars()} and {secondBendPoint.wholeDollars()}</strong
        > - These thresholds determine your benefit calculation brackets
      </li>
    </ul>
  </div>

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
    <h3>{currentYear} PIA Formula</h3>
    <ul class="bendpoint-formula">
      <li>
        <strong>{firstBracketPercent}%</strong> of the first {firstBendPoint.wholeDollars()}
        of AIME
      </li>
      <li>
        <strong>{secondBracketPercent}%</strong> of AIME over {firstBendPoint.wholeDollars()}
        up to {secondBendPoint.wholeDollars()}
      </li>
      <li>
        <strong>{thirdBracketPercent}%</strong> of AIME over {secondBendPoint.wholeDollars()}
      </li>
    </ul>
  </div>

  <p>
    These bendpoints are adjusted annually for <a href="/guides/inflation"
      >wage inflation</a
    >, ensuring they maintain their purchasing power over time. The percentages
    ({firstBracketPercent}%, {secondBracketPercent}%, {thirdBracketPercent}%)
    have remained constant since 1979.
  </p>

  <h3>Example Calculation</h3>

  <p>
    Let's walk through an example with an AIME of {exampleAIME.wholeDollars()}:
  </p>

  <div class="calculation-example">
    <table>
      <tbody>
        <tr>
          <td
            ><strong>First bracket:</strong>
            {firstBracketPercent}% of {firstBendPoint.wholeDollars()}</td
          >
          <td>= {exampleBracket1.string()}</td>
        </tr>
        <tr>
          <td
            ><strong>Second bracket:</strong>
            {secondBracketPercent}% of ({exampleAIME.wholeDollars()} - {firstBendPoint.wholeDollars()})</td
          >
          <td
            >= {secondBracketPercent}% of {exampleBracket2Amount.wholeDollars()}
            = {exampleBracket2.string()}</td
          >
        </tr>
        <tr>
          <td
            ><strong>Third bracket:</strong>
            {thirdBracketPercent}% of ({exampleAIME.wholeDollars()} - {secondBendPoint.wholeDollars()})</td
          >
          <td>= $0 (AIME doesn't reach third bracket)</td>
        </tr>
        <tr class="total-row">
          <td><strong>Total PIA:</strong></td>
          <td><strong>{examplePIAUnrounded.string()}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p>
    The final step is rounding: Social Security rounds the PIA <strong
      >down</strong
    >
    to the nearest dime, so this would become {examplePIA.string()} per month.
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

  <h3>Interactive Bendpoint Chart</h3>

  <p>
    This chart visualizes how the PIA formula works. The green marker shows a
    sample earner's position on the curve. Move your mouse over the chart to
    explore how different AIME values translate to different PIA amounts. Notice
    how the slope changes at each bendpoint—steeper at the left ({firstBracketPercent}%),
    then flatter ({secondBracketPercent}%), and flattest at the right ({thirdBracketPercent}%).
  </p>

  <div class="chart-wrapper">
    <BendpointChart recipient={demoRecipient} />
  </div>

  <InlineCTA type="calculator" />

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
    If you're already earning above the second bendpoint ({secondBendPoint.wholeDollars()}
    AIME in {currentYear}), any additional earnings that increase your AIME will
    only increase your PIA by {thirdBracketPercent} cents for every additional dollar
    of monthly AIME.
  </p>

  <div class="insight-box">
    <h4>Example: Late-Career Bonus Impact</h4>
    <p>
      Suppose you're 64 and considering whether to accept a high-paying position
      for your final working year. If this job would increase your AIME by {midBracketIncrease.wholeDollars()}
      (from {midBracketAIME.wholeDollars()} to {midBracketAIME
        .plus(midBracketIncrease)
        .wholeDollars()}), your PIA would increase by:
    </p>
    <p>
      <strong
        >{midBracketIncrease.wholeDollars()} × {secondBracketPercent}% = {midBracketBenefit.wholeDollars()}
        per month</strong
      >
    </p>
    <p>
      However, if your AIME was already {highBracketAIME.wholeDollars()} and increased
      to {highBracketAIME.plus(midBracketIncrease).wholeDollars()}, your PIA
      would only increase by:
    </p>
    <p>
      <strong
        >{midBracketIncrease.wholeDollars()} × {thirdBracketPercent}% = {highBracketBenefit.wholeDollars()}
        per month</strong
      >
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
    This doesn't mean late-career earnings are worthless. They still increase
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
    <li>
      <strong><a href="/guides/spousal-benefit-filing-date">Spousal benefits</a>:</strong>
      Up to 50% of your PIA (not 50% of your actual benefit if you delay past FRA)
    </li>
    <li><strong>Survivor benefits:</strong> Up to 100% of your PIA</li>
    <li>
      <strong>Disability benefits:</strong> Your PIA without age adjustments
    </li>
  </ul>

  <h2>Maximizing Your PIA</h2>

  <p>
    First, ensure you have enough <a href="/guides/work-credits">work credits</a>
    to qualify—you need 40 credits (about 10 years of work). Then focus on maximizing
    your PIA:
  </p>

  <ol>
    <li>
      <strong>Work for {SSA_EARNINGS_YEARS} years:</strong> PIA is based on your
      highest {SSA_EARNINGS_YEARS} years, so each year of work can potentially replace
      a zero-earning year
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

  <h2>Frequently Asked Questions</h2>

  <div class="faq-section">
    <h3>What is a good PIA?</h3>
    <p>
      A "good" PIA depends on your income needs and lifestyle expectations. A
      PIA above $2,500 puts you in the upper tier of beneficiaries, while the
      <a href="/guides/maximum">maximum PIA</a> requires earning at or above the
      taxable maximum for {SSA_EARNINGS_YEARS} years. Most financial planners suggest
      Social Security should replace about 40% of pre-retirement income for average
      earners.
    </p>

    <h3>How is PIA different from my actual benefit?</h3>
    <p>
      Your PIA is your benefit amount <em>only if</em> you claim at your Full Retirement
      Age. If you claim early (as young as 62), your benefit is permanently reduced—up
      to 30% less than your PIA. If you delay past FRA (up to age 70), you earn delayed
      retirement credits that increase your benefit by 8% per year, potentially receiving
      up to 124-132% of your PIA.
    </p>

    <h3>Does my PIA change after I start receiving benefits?</h3>
    <p>
      Yes, but only through Cost-of-Living Adjustments (COLA). Once you turn 62,
      your PIA is locked in and protected against inflation through annual COLA
      increases. However, if you continue working while receiving benefits,
      additional high-earning years could potentially increase your AIME and
      thus your PIA.
    </p>

    <h3>What if I don't have {SSA_EARNINGS_YEARS} years of work history?</h3>
    <p>
      Social Security uses your highest {SSA_EARNINGS_YEARS} years of indexed earnings
      to calculate your AIME. If you have fewer than {SSA_EARNINGS_YEARS} years,
      zeros are averaged in for the missing years, which significantly lowers your
      AIME and PIA. Each additional year of work replaces a zero, boosting your benefit.
    </p>
  </div>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/aime">AIME Guide</a> — How your earnings are indexed and
      averaged to calculate your AIME
    </li>
    <li>
      <a href="/guides/spousal-benefit-filing-date">Spousal Benefits</a> — How
      filing dates affect spousal benefits based on your PIA
    </li>
    <li>
      <a href="/guides/divorced-spouse">Divorced Spouse Benefits</a> — How
      ex-spouses can receive up to 50% of your PIA
    </li>
    <li>
      <a href="/guides/work-credits">Work Credits</a> — The 40 credits you need
      to qualify for benefits before your PIA matters
    </li>
    <li>
      <a href="/guides/maximum">Maximum Benefit</a> — What it takes to reach the
      highest possible PIA
    </li>
    <li>
      <a href="/guides/filing-date-chart">Filing Date Chart Guide</a> — How to
      read the interactive chart showing benefits at different filing ages
    </li>
  </ul>

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

  .aime-table {
    background-color: #f0f8ff;
    border: 1px solid #4a90e2;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
    overflow-x: auto;
  }

  .aime-table table {
    width: 100%;
    border-collapse: collapse;
  }

  .aime-table th,
  .aime-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  .aime-table th {
    background-color: #e9ecef;
    font-weight: bold;
    color: #2c3e50;
  }

  .aime-table tbody tr:hover {
    background-color: #e8f4fd;
  }

  .chart-wrapper {
    margin: 20px 0;
    overflow-x: auto;
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
    font-size: 0.95em;
  }

  .faq-section h3 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-size: 1.1em;
  }

  .faq-section p {
    margin-top: 0;
    line-height: 1.6;
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
