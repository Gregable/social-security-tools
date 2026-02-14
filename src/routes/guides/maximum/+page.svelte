<script lang="ts">
  import {
    MAX_YEAR,
    MAXIMUM_EARNINGS,
    SSA_EARNINGS_YEARS,
  } from "$lib/constants";
  import { createMaxEarnerForBirthYear } from "$lib/max-earner";
  import { Money } from "$lib/money";
  import { MonthDuration } from "$lib/month-time";
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from '../InlineCTA.svelte';

  // Current year from constants
  const currentYear = MAX_YEAR;

  // Earnings cap for current year
  const earningsCap = MAXIMUM_EARNINGS[currentYear];

  // Create a maximum earner turning 70 in current year (for PIA and delayed credits)
  const maxEarner = createMaxEarnerForBirthYear(currentYear - 70);
  const maxPIA = maxEarner.pia().primaryInsuranceAmount();

  // Filing age data for table - each row uses correct birth year for that filing age
  type FilingRow = {
    age: MonthDuration;
    benefit: Money;
    isMax: boolean;
    isFRA: boolean;
  };

  // Common age constants
  const age70 = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });

  // Find the FRA for someone reaching FRA this year (approximately born currentYear - 67)
  const fraBirthYear = currentYear - 67;
  const fraRecipient = createMaxEarnerForBirthYear(fraBirthYear);
  const fra = fraRecipient.normalRetirementAge();

  // Build list of filing ages - whole years plus FRA if it's not a whole year
  // Note: 62 uses 1 month because you can't file until the month AFTER turning 62
  const wholeYearAges = [
    MonthDuration.initFromYearsMonths({ years: 62, months: 1 }),
    ...[63, 64, 65, 66, 67, 68, 69, 70].map((y) =>
      MonthDuration.initFromYearsMonths({ years: y, months: 0 })
    ),
  ];
  const filingAges =
    fra.modMonths() === 0
      ? wholeYearAges
      : [...wholeYearAges, fra].sort((a, b) => a.asMonths() - b.asMonths());

  const filingData: FilingRow[] = filingAges.map((age) => {
    // Someone filing at this age in currentYear was born in (currentYear - age.years)
    // For fractional ages like 66y 10m, we use the rounded year for birth year calculation
    const birthYear = currentYear - age.roundedYears();
    const recipient = createMaxEarnerForBirthYear(birthYear);
    const benefit = recipient.benefitAtAge(age);

    return {
      age,
      benefit,
      isMax: age.asMonths() === age70.asMonths(),
      isFRA: age.asMonths() === fra.asMonths(),
    };
  });

  // Maximum benefit at age 70 (from the person turning 70 in currentYear)
  const maxBenefitAt70 = maxEarner.benefitAtAge(age70);

  // Spousal benefit (50% of PIA at FRA)
  const maxSpousalBenefit = maxPIA.div(2).floorToDollar();
  const combinedHousehold = maxBenefitAt70.plus(maxSpousalBenefit);
  const dualMaxBenefit = maxBenefitAt70.times(2);

  // Historical earnings caps for display - pick decade years going back
  const mostRecentDecade = Math.floor(currentYear / 10) * 10;
  const decadeYears = [
    mostRecentDecade - 30,
    mostRecentDecade - 20,
    mostRecentDecade - 10,
    mostRecentDecade,
  ].filter((year) => MAXIMUM_EARNINGS[year]);
  // Add current year if it's not already a decade year
  const historicalCapYears = decadeYears.includes(currentYear)
    ? decadeYears
    : [...decadeYears, currentYear];
  const historicalCaps = historicalCapYears.map((year) => ({
    year,
    cap: MAXIMUM_EARNINGS[year],
  }));

  // Delayed retirement increase percentage
  const delayedIncreasePercent = Math.round(
    maxEarner.delayedRetirementIncrease() * 100
  );

  // Function to compute maximum benefits for a given year
  // at70: for someone turning 70 in that year
  // atFRA: for someone reaching FRA in that year
  function computeMaxBenefitForYear(year: number): {
    at70: Money;
    atFRA: Money;
  } {
    // Someone turning 70 in this year
    const at70BirthYear = year - 70;
    const at70Recipient = createMaxEarnerForBirthYear(at70BirthYear, year);

    // Someone reaching FRA in this year (approximately born year - 67)
    const atFRABirthYear = year - 67;
    const atFRARecipient = createMaxEarnerForBirthYear(atFRABirthYear, year);
    const recipientFRA = atFRARecipient.normalRetirementAge();

    return {
      at70: at70Recipient.benefitAtAge(age70),
      atFRA: atFRARecipient.benefitAtAge(recipientFRA),
    };
  }

  // Historical maximum benefits - show recent years with some spacing
  // Pattern: 6 years ago, 4 years ago, 2 years ago, last year, current year
  const historyYears = [
    currentYear - 6,
    currentYear - 4,
    currentYear - 2,
    currentYear - 1,
    currentYear,
  ].filter((year) => year >= 2015);
  const historicalBenefits = historyYears.map((year) => ({
    year,
    ...computeMaxBenefitForYear(year),
  }));

  const title = `Maximum Social Security Benefit ${currentYear}`;
  const description = `The maximum Social Security benefit in ${currentYear} is ${maxBenefitAt70.wholeDollars()}/month at age 70. Learn what it takes to reach the maximum, how filing age affects your benefit, and the requirements for the highest possible payment.`;
  const publishDate = new Date("2019-08-03T00:00:00+00:00");
  const updateDate = new Date("2026-01-16T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/maximum";
  schema.title = title;
  schema.image = "/laptop-piggybank.jpg";
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt =
    "Laptop with piggybank representing maximum Social Security benefits";
  schema.tags = [
    "Maximum Benefits",
    "Social Security",
    "High Earners",
    "Earnings Cap",
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

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">
    Published: {publishDate.toLocaleDateString()}<br />
    Updated: {updateDate.toLocaleDateString()}
  </p>

  <p>
    The maximum monthly Social Security benefit is a number that most retirees
    will never reach—but understanding what it takes to get there can help you
    maximize your own benefit. Here's everything you need to know about the
    highest possible Social Security payment in {currentYear}.
  </p>

  <div class="max-benefit-box">
    <h3>{currentYear} Maximum Monthly Benefit</h3>
    <p class="max-amount">{maxBenefitAt70.wholeDollars()} / month</p>
    <p class="max-note">For someone filing at age 70</p>
  </div>

  <h2>Requirements to Reach the Maximum</h2>

  <p>To receive the maximum Social Security benefit, you must:</p>

  <ol>
    <li>
      <strong>Wait until age 70 to claim benefits.</strong> Filing at 70
      maximizes your delayed retirement credits, increasing your benefit by {delayedIncreasePercent *
        3}% compared to claiming at Full Retirement Age.
    </li>
    <li>
      <strong
        >Earn at or above the earnings cap for at least {SSA_EARNINGS_YEARS} years.</strong
      >
      Your benefit is based on your highest {SSA_EARNINGS_YEARS} years of earnings.
      Each year must be at or above the
      <a href="/guides/earnings-cap">maximum taxable earnings</a> to contribute
      to the maximum <a href="/guides/aime">AIME</a>.
    </li>
  </ol>

  <h2>Maximum Benefit by Filing Age</h2>

  <p>
    Your filing age dramatically affects your maximum possible benefit. Here's
    how the {currentYear} maximum breaks down:
  </p>

  <div class="filing-age-table">
    <table>
      <thead>
        <tr>
          <th>Filing Age</th>
          <th>Maximum Monthly Benefit</th>
        </tr>
      </thead>
      <tbody>
        {#each filingData as row}
          <tr class:max-row={row.isMax} class:fra-row={row.isFRA}>
            <td>
              {row.age.toYearsAndMonthsString()}
              {#if row.isFRA}(FRA){/if}
            </td>
            <td>{row.benefit.wholeDollars()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p>
    The <a href="/calculator">Social Security calculator</a> will show you the benefit
    at any starting age based on your actual earnings record.
  </p>

  <InlineCTA type="calculator" />

  <h2>How the Maximum Changes Each Year</h2>

  <p>
    The maximum benefit isn't fixed—it increases each year due to two factors:
  </p>

  <ul>
    <li>
      <strong>Earnings cap increases:</strong> The maximum taxable earnings
      rises annually (it's {earningsCap.wholeDollars()} in {currentYear}),
      allowing future retirees to have higher indexed earnings.
    </li>
    <li>
      <strong>Bend point adjustments:</strong> The
      <a href="/guides/pia">PIA formula bend points</a> increase with average wages,
      gradually raising the maximum possible PIA.
    </li>
  </ul>

  <p>Here's how the maximum benefit has changed over recent years:</p>

  <div class="history-table">
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Maximum at 70</th>
          <th>Maximum at FRA</th>
        </tr>
      </thead>
      <tbody>
        {#each historicalBenefits as row}
          <tr>
            <td>{row.year}</td>
            <td>{row.at70.wholeDollars()}</td>
            <td>{row.atFRA.wholeDollars()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <h2>Spousal and Family Benefits</h2>

  <p>
    A spouse can receive up to 50% of the primary earner's
    <a href="/guides/pia">Primary Insurance Amount (PIA)</a>—not 50% of their
    actual benefit. This distinction matters when the primary earner delays past
    Full Retirement Age. See our <a href="/guides/spousal-benefit-filing-date">spousal
    benefits guide</a> for a detailed explanation of how filing dates affect spousal
    benefits.
  </p>

  <p>For a maximum earner in {currentYear}:</p>

  <ul>
    <li>
      <strong>Primary earner at 70:</strong>
      {maxBenefitAt70.wholeDollars()} / month
    </li>
    <li>
      <strong>Spousal benefit (at spouse's FRA):</strong>
      {maxSpousalBenefit.wholeDollars()} / month
    </li>
    <li>
      <strong>Combined household:</strong>
      {combinedHousehold.wholeDollars()} / month
    </li>
  </ul>

  <p>
    If both spouses independently earned the maximum, their combined benefit
    would be <strong
      >{dualMaxBenefit.floorToDollar().wholeDollars()} / month</strong
    >.
  </p>

  <h2>How Common is the Maximum Benefit?</h2>

  <p>
    Very few retirees actually receive the maximum benefit. To qualify, you'd
    need to have earned at or above the earnings cap for {SSA_EARNINGS_YEARS} years—a
    feat that requires consistently high income throughout your career. (Of course,
    you also need the <a href="/guides/work-credits">40 work credits</a> required
    to qualify for any retirement benefits, but that's easily achieved by anyone
    earning at the cap.)
  </p>

  <p>Consider that the earnings cap in various years was:</p>

  <ul>
    {#each historicalCaps as item}
      <li>{item.year}: {item.cap.wholeDollars()}</li>
    {/each}
  </ul>

  <p>
    Someone reaching maximum benefits in {currentYear} would have needed to earn
    these amounts (or more) every year for {SSA_EARNINGS_YEARS} years. Less than
    1% of Social Security beneficiaries receive the maximum benefit.
  </p>

  <h2>Calculate Your Benefit</h2>

  <p>
    While the maximum benefit is interesting to know, your actual benefit
    depends on your specific earnings history and filing age. Use the
    <a href="/calculator">SSA.tools calculator</a> to see your personalized estimate
    based on your actual Social Security earnings record.
  </p>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/earnings-cap">Earnings Cap</a> — The annual limit you must
      reach to maximize your benefit
    </li>
    <li>
      <a href="/guides/aime">AIME Guide</a> — How maximum earnings translate to
      maximum AIME
    </li>
    <li>
      <a href="/guides/pia">PIA Guide</a> — How AIME is converted to your Primary
      Insurance Amount
    </li>
    <li>
      <a href="/guides/spousal-benefit-filing-date">Spousal Benefits</a> — How
      maximum earners' spouses can optimize their benefits
    </li>
    <li>
      <a href="/guides/filing-date-chart">Filing Date Chart Guide</a> — How to
      read the interactive chart showing benefits at different filing ages
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
  .max-benefit-box {
    background-color: #e8f4fd;
    border: 2px solid #4a90e2;
    border-radius: 12px;
    padding: 25px;
    margin: 25px 0;
    text-align: center;
  }

  .max-benefit-box h3 {
    margin: 0 0 10px 0;
    font-size: 1.1em;
    color: #2c5282;
  }

  .max-amount {
    font-size: 2.5em;
    font-weight: bold;
    margin: 10px 0;
    color: #2c5282;
  }

  .max-note {
    margin: 0;
    font-size: 0.95em;
    color: #555;
  }

  .filing-age-table,
  .history-table {
    margin: 20px 0;
    overflow-x: auto;
  }

  .filing-age-table table,
  .history-table table {
    width: 100%;
    border-collapse: collapse;
  }

  .filing-age-table th,
  .filing-age-table td,
  .history-table th,
  .history-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  .filing-age-table th,
  .history-table th {
    background-color: #f8f9fa;
    font-weight: bold;
    color: #2c3e50;
  }

  .filing-age-table tbody tr:hover,
  .history-table tbody tr:hover {
    background-color: #f5f5f5;
  }

  .max-row {
    background-color: #d4edda;
    font-weight: bold;
  }

  .fra-row {
    background-color: #fff3cd;
    font-style: italic;
  }

  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  ol li {
    margin: 1rem 0;
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    .max-amount {
      font-size: 2em;
    }

    .filing-age-table th,
    .filing-age-table td,
    .history-table th,
    .history-table td {
      padding: 8px 10px;
      font-size: 14px;
    }
  }
</style>
