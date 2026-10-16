<script lang="ts">
import {
  colaGrowthExample,
  EXAMPLE_PIA,
  medicareDeductionExample,
  spousalExample,
  stopWorkingExample,
} from '$lib/estimate-differences-example';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const title = "Why Your Social Security Benefit Doesn't Match the Estimate";
const description =
  'The common reasons a Social Security payment differs from the estimate on your Statement or from what an agent told you: assumed future earnings, cost-of-living adjustments since 62, Medicare premiums, delayed credits paid in January, spousal benefits, the earnings test, and errors in your record. With worked examples and how to check your own number.';
const publishDate = new Date('2026-10-16T00:00:00+00:00');
const updateDate = new Date('2026-10-16T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/benefit-estimate-differences';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Comparing a Social Security estimate with the benefit actually paid';
schema.tags = [
  'social security estimate wrong',
  'social security benefit less than estimate',
  'social security statement estimate',
  'why is my social security check different',
  'social security estimate vs actual benefit',
  'is my social security benefit correct',
  'social security check lower than expected',
];

const stop = stopWorkingExample();
const cola = colaGrowthExample();
const medicare = medicareDeductionExample();
const spousal = spousalExample();
const firstColaRow = cola.rows[0];
const lastColaRow = cola.rows[cola.rows.length - 1];

const faqs: FAQItem[] = [
  {
    question: 'Why is my Social Security check less than my estimate?',
    answer: `The most common reasons are that the estimate assumed you would keep working until you claimed, that you claimed a few months earlier than the age the estimate showed, and that the Medicare Part B premium (${medicare.premium.string()} a month in ${medicare.premiumYear}) is deducted from the payment, along with any federal tax you asked Social Security to withhold. The benefit amount on your award letter is the figure before those deductions.`,
  },
  {
    question: 'Why is my Social Security check more than my estimate?',
    answer:
      'Estimates do not include future cost-of-living adjustments, which apply from the year you turn 62 even if you have not claimed yet, so by the time you start benefits the amount can be well above an estimate made years earlier. Earnings after the estimate that replaced a low year in your 35-year average also raise it.',
  },
  {
    question: 'Does my Social Security Statement assume I keep working?',
    answer:
      'Yes. The retirement estimates assume you keep earning about what you earned most recently until the age shown. If you stop working sooner, the benefit can be noticeably lower, especially when you have fewer than 35 years of earnings.',
  },
  {
    question: 'Is my spousal benefit half of my spouse’s check?',
    answer: `It is up to half of your spouse’s full-retirement-age amount, their Primary Insurance Amount, not half of what they actually receive. If your spouse waited until 70 and gets ${spousal.workerBenefitAt70.wholeDollars()} on a ${spousal.workerPia.wholeDollars()} PIA, the most you can receive as a spouse is ${spousal.spousalAtFra.wholeDollars()}, not ${spousal.halfOfWorkerCheck.wholeDollars()}. It is reduced further if you claim before your own full retirement age.`,
  },
  {
    question: 'What should I do if I think Social Security calculated my benefit wrong?',
    answer:
      'First check your earnings record for missing or wrong years, since that is the most common real error. Then ask Social Security for the computation behind your award. If it is still wrong, you can request reconsideration in writing, generally within 60 days of the notice you are disputing.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link
    rel="canonical"
    href="https://ssa.tools/guides/benefit-estimate-differences"
  />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Your Social Security Statement shows one number, the agent on the phone
    gave you another, and the deposit in your bank account is a third. Most
    of the time none of them is wrong: each one answers a slightly different
    question. This guide walks through the reasons the figures disagree, in
    roughly the order they catch people out, with worked examples computed
    by the same code as the
    <a href="/calculator">ssa.tools calculator</a>.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>What you see</th>
        <th>Most likely reason</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Lower than the Statement, before you claim</td>
        <td>
          <a href="#keep-working">The estimate assumes you keep working</a>
        </td>
      </tr>
      <tr>
        <td>Higher than an estimate from a few years ago</td>
        <td>
          <a href="#cola">Cost-of-living adjustments since 62</a>
        </td>
      </tr>
      <tr>
        <td>The deposit is less than the award letter</td>
        <td>
          <a href="#deductions">Medicare premiums and tax withholding</a>
        </td>
      </tr>
      <tr>
        <td>Lower than the estimate for the age you claimed</td>
        <td>
          <a href="#claiming-month">The exact month you claimed</a>
        </td>
      </tr>
      <tr>
        <td>Claimed after full retirement age, and the raise is missing</td>
        <td>
          <a href="#january">Delayed credits arrive in January</a>
        </td>
      </tr>
      <tr>
        <td>Spousal benefit lower than half your spouse’s check</td>
        <td>
          <a href="#spousal">Spousal benefits use the full-retirement-age amount</a>
        </td>
      </tr>
      <tr>
        <td>Checks stopped or shrank while you work</td>
        <td><a href="#earnings-test">The earnings test</a></td>
      </tr>
      <tr>
        <td>Much lower than you expected from your career</td>
        <td>
          <a href="#record">Missing or wrong years on your earnings record</a>
        </td>
      </tr>
    </tbody>
  </table>

  <InlineCTA type="calculator" />

  <h2 id="keep-working">The Estimate Assumes You Keep Working</h2>

  <p>
    The retirement estimates on your
    <a href="https://www.ssa.gov/myaccount/statement.html"
      >Social Security Statement</a
    >
    assume that you keep earning about what you earned most recently, every
    year, until the age you start benefits. The
    <a
      href="https://www.ssa.gov/myaccount/assets/materials/statement-redesign-online.pdf"
      >sample Statement</a
    >
    puts it plainly: the estimates “assume you continue to earn” your latest
    year’s amount “per year until you start your benefits.” For someone in their fifties who
    is still working, that is a reasonable guess. For someone who has already
    stopped, or plans to stop well before claiming, the estimate includes
    years of earnings that will never happen.
  </p>

  <p>
    It matters because your benefit is based on your highest
    <a href="/guides/aime">35 years of indexed earnings</a>, and any of those
    35 years you did not work counts as zero. Take a worker born in
    {stop.birthYear} who has earned the equivalent of
    {stop.wage.wholeDollars()} a year for {stop.careerYears} years. Their
    Statement assumes {stop.projectedYears} more years at that salary, through
    {stop.fraYear}, the year they reach full retirement age:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>If they</th>
        <th>Years of earnings counted</th>
        <th>Benefit at full retirement age (today’s dollars)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Keep working, as the Statement assumes</td>
        <td>35</td>
        <td>{stop.piaIfKeepWorking.string()}</td>
      </tr>
      <tr>
        <td>Stop working now</td>
        <td>
          {stop.careerYears}, plus {stop.missingYearsIfStopped} years of $0
        </td>
        <td>{stop.piaIfStopNow.string()}</td>
      </tr>
    </tbody>
  </table>

  <p>
    Stopping now costs {stop.difference.string()} a month for life, before
    any cost-of-living adjustments. The {stop.missingYearsIfStopped} empty
    years pull down the 35-year average, and at this income level each
    dollar of that average is worth 32 cents of monthly benefit under the
    <a href="/guides/pia">benefit formula</a>. A worker who already had 35
    good years would lose much less, because the extra years would only
    have replaced other years of similar earnings.
  </p>

  <p>
    The calculator starts from the same assumption as the Statement, so its
    first answer should be close to yours. Then set its future earnings
    sliders to the years and salary you actually expect, including zero, to
    see the benefit you are really on track for.
  </p>

  <h2 id="cola">Estimates Leave Out Future Cost-of-Living Adjustments</h2>

  <p>
    A Statement estimate does not include future
    <a href="/guides/cola">cost-of-living adjustments</a>. The actual
    benefit does, and the adjustments
    <a href="https://www.ecfr.gov/current/title-20/part-404/section-404.271"
      >start in the year you turn 62</a
    >, whether or not you have claimed. Someone who checks an estimate in their late
    fifties and claims at 70 will see a far larger number than they wrote
    down, even though nothing was wrong with either figure.
  </p>

  <p>
    Here is a full-retirement-age benefit of {EXAMPLE_PIA.wholeDollars()}
    for a worker who turned 62 in {cola.turned62In}, followed through every
    adjustment since:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>COLA announced</th>
        <th>Increase</th>
        <th>Benefit afterward</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Turned 62 in {cola.turned62In}</td>
        <td></td>
        <td>{cola.piaAt62.string()}</td>
      </tr>
      {#each cola.rows as row}
        <tr>
          <td>{row.year}</td>
          <td>{row.cola}%</td>
          <td>{row.piaAfter.string()}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="table-note">
    Each adjustment is rounded down to the dime, as Social Security does,
    and first reaches checks in the January after it is announced.
  </p>

  <p>
    Over those {cola.rows.length} adjustments the benefit grew by
    {cola.increase.string()}, or {cola.percentIncrease.toFixed(1)}%. From
    January {lastColaRow.firstPaidYear} this worker’s full-retirement-age
    amount is {cola.piaAfterNewestCola.string()}, not the
    {EXAMPLE_PIA.wholeDollars()} they saw at 62, and any early-claiming
    reduction or delayed credits apply on top of the larger figure. A COLA announced in October takes effect with the December benefit,
    which is paid in January, so in October through December the new figure
    is known but not yet in your check. The
    {firstColaRow.year} adjustment above, for example, first reached bank
    accounts in January {firstColaRow.firstPaidYear}.
  </p>

  <p>
    One more wrinkle for anyone under 62: the
    <a href="/guides/indexing-factors">wage indexing</a> of your earnings is
    fixed by the national average wage in the year you turn 60, and the
    <a href="https://www.ssa.gov/oact/cola/bendpoints.html"
      >bend points of the benefit formula</a
    >
    are fixed in the year you turn 62. Until then, estimates use the latest
    published values, so the estimate can shift a little each year even if
    your record does not change.
  </p>

  <h2 id="deductions">The Deposit Is Smaller Than the Benefit</h2>

  <p>
    The benefit amount on your award letter is a gross figure. Social
    Security deducts the Medicare Part B premium before paying it, along with
    any federal income tax you asked it to withhold. A
    {medicare.benefit.wholeDollars()} benefit with the standard
    {medicare.premiumYear} Part B premium of {medicare.premium.string()}
    arrives as a deposit of {medicare.deposit.wholeDollars()}: Social
    Security takes out the premium and then rounds the payment down to a
    whole dollar.
  </p>

  <ul>
    <li>
      <strong>Medicare Part B:</strong>
      <a href="https://www.ssa.gov/OP_Home/handbook/handbook.01/handbook-0127.html"
        >deducted from your benefit</a
      >
      once you are enrolled in Medicare and receiving Social Security. Higher earners pay
      an income-related surcharge based on their tax return from two years
      earlier, and some people pay less than the standard premium because a
      COLA was too small to cover a premium increase. The
      <a href="/guides/cola">COLA guide</a> explains that hold-harmless rule.
    </li>
    <li>
      <strong>Medicare Part D or Medicare Advantage premiums:</strong> can
      also be deducted if you chose that when you enrolled.
    </li>
    <li>
      <strong>Federal income tax:</strong> withheld only if you asked for it,
      at 7%, 10%, 12%, or 22%, using
      <a href="https://www.ssa.gov/manage-benefits/request-withhold-taxes"
        >Form W-4V</a
      >. The <a href="/guides/federal-taxes">federal taxes guide</a> explains
      how much of your benefit is taxable.
    </li>
  </ul>

  <p>
    Rounding explains small gaps too. The
    <a href="https://www.ssa.gov/OP_Home/handbook/handbook.07/handbook-0738.html"
      >benefit computation is rounded down to the dime</a
    >
    at each step, and the amount paid is rounded down to the dollar after
    the Medicare premium comes out. An award letter can show a benefit
    ending in dimes and a payment that is the benefit less the premium with
    the cents dropped. Federal tax withholding is taken after that rounding,
    so a deposit with tax withheld can end in cents.
  </p>

  <h2 id="claiming-month">The Exact Month You Claimed</h2>

  <p>
    Estimates are shown at whole ages, but benefits change every month. Each
    month you claim before full retirement age reduces the benefit by
    five-ninths of one percent for the first 36 months and five-twelfths of
    one percent for each month beyond that, under
    <a href="https://www.ecfr.gov/current/title-20/part-404/section-404.410"
      >Social Security’s rules</a
    >. Claiming three months before full retirement age costs about
    1.7% of the full amount. Each month you wait past full retirement age
    adds two-thirds of one percent, up to 70. The
    <a href="/guides/filing-date-chart">filing date chart</a> shows the
    benefit for every month.
  </p>

  <p>
    Calendar rules also move the start date. To claim at 62 you must be 62
    for the whole month, so most people’s first month of benefits is the
    month after their 62nd birthday. Social Security considers you to reach
    an age the day before your birthday, so someone born on the 1st or 2nd
    is 62 for their entire birthday month and can start a month sooner, and
    someone born on the 1st also reaches full retirement age a month early,
    which changes how many months of reduction or credit apply, as the
    <a href="/guides/1st-and-2nd-of-month">guide to those birthdays</a>
    explains. And benefits are paid the month after they are due: the
    benefit for March arrives in April, on a Wednesday that depends on your
    birthday, according to the
    <a href="https://www.ssa.gov/pubs/calendar.htm">payment calendar</a>.
    That last rule does not change the amount, but it makes the first check
    arrive later than many people expect.
  </p>

  <h2 id="january">Delayed Credits Arrive in January</h2>

  <p>
    If you claim after full retirement age but before 70, the
    <a href="/guides/delayed-retirement-credits">delayed retirement credits</a>
    you earned in the calendar year you claim are not added until the
    following January. Your first checks are lower than the estimate for your
    claiming age, and the difference arrives, without back pay for the
    earlier months, with the January payment. Claiming at exactly 70 avoids
    this. The <a href="/guides/delayed-january-bump">January bump guide</a>
    works through the timing.
  </p>

  <h2 id="spousal">Spousal Benefits Use the Full-Retirement-Age Amount</h2>

  <p>
    The <a href="/guides/spousal-benefits">spousal benefit</a> is up to half
    of the worker’s Primary Insurance Amount, their benefit at full
    retirement age, not half of whatever check they actually receive. The
    worker’s delayed retirement credits
    <a href="https://www.ssa.gov/blog/en/posts/2024-07-11.html"
      >do not pass through to a spouse</a
    >.
  </p>

  <p>
    Take a worker born in {spousal.workerBirthYear} with a PIA of
    {spousal.workerPia.wholeDollars()} who waits until 70 and receives
    {spousal.workerBenefitAt70.wholeDollars()} a month, and a spouse born in
    {spousal.spouseBirthYear} with no benefit of their own:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Spouse claims at</th>
        <th>Spousal benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Full retirement age</td>
        <td>{spousal.spousalAtFra.wholeDollars()}</td>
      </tr>
      <tr>
        <td>62</td>
        <td>{spousal.spousalAt62.wholeDollars()}</td>
      </tr>
    </tbody>
  </table>

  <p>
    Neither is the {spousal.halfOfWorkerCheck.wholeDollars()} that half of the
    worker’s check would suggest. A spouse who also has their own benefit
    receives their own amount plus only the difference, so the combined
    total can look lower still. The delay is not wasted: a
    <a href="/guides/survivor-benefits">survivor benefit</a> does include the
    worker’s delayed credits.
  </p>

  <h2 id="earnings-test">Working While You Collect</h2>

  <p>
    If you claim before full retirement age and keep working, the
    <a href="/guides/earnings-test">earnings test</a> withholds benefits
    when your earnings pass an annual limit. Social Security usually
    withholds whole months at the start of the year, so it can look as if
    your checks stopped. The withheld months are not lost: at full
    retirement age
    <a href="https://www.ssa.gov/benefits/retirement/planner/whileworking.html"
      >your benefit is recalculated</a
    > as if you had claimed later
    by the number of months withheld.
  </p>

  <p>
    Working after you claim can also raise the benefit. Each year Social
    Security checks whether your latest earnings replace a lower year in your
    35-year average and, if so, increases the benefit, usually late in the
    following year. The
    <a href="/guides/working-past-full-retirement-age"
      >working past full retirement age guide</a
    > shows how large those raises are.
  </p>

  <h2 id="record">Missing or Wrong Years on Your Earnings Record</h2>

  <p>
    Every estimate is only as good as the earnings record behind it, and an
    error there is the one difference that is actually a mistake. Look for:
  </p>

  <ul>
    <li>
      <strong>A recent year missing or too low.</strong> Earnings take time
      to post after employers file W-2s, so last year may show as zero or
      partial for months. That is normal and corrects itself; Social
      Security
      <a href="https://www.ssa.gov/pubs/EN-05-10081.pdf"
        >suggests checking again in August</a
      >.
    </li>
    <li>
      <strong>An older year that is zero or too low.</strong> A missing W-2,
      an employer that reported under the wrong number, or self-employment
      tax that was never filed. These do not correct themselves. You can ask
      Social Security to fix them with
      <a href="https://www.ssa.gov/forms/ssa-7008.pdf">Form SSA-7008</a>,
      generally within
      <a href="https://www.ecfr.gov/current/title-20/part-404/section-404.802"
        >3 years, 3 months, and 15 days</a
      >
      after the year in question, though some errors can be corrected later
      with proof such as W-2s or tax returns.
    </li>
    <li>
      <strong>Earnings above the taxable maximum.</strong> Income above the
      <a href="/guides/earnings-cap">earnings cap</a> for each year never
      counts toward benefits, so a high earner’s record can look lower than
      their pay.
    </li>
  </ul>

  <p>
    You can see your record by signing in to
    <a href="https://www.ssa.gov/myaccount/">my Social Security</a>. To see
    what each year contributes, copy it into the calculator, as the
    <a href="/guides/earnings-record-paste">pasting guide</a> describes; it
    shows which 35 years count toward your benefit.
  </p>

  <h2>If You Still Think the Number Is Wrong</h2>

  <ol>
    <li>
      Rebuild the figure yourself with the
      <a href="/calculator">calculator</a>, using your own earnings record,
      your exact claiming month, and the future earnings you actually expect.
    </li>
    <li>
      Compare the benefit before deductions, not the deposit, and remember
      that an award letter is in the dollars of the month it describes,
      including every cost-of-living adjustment since you turned 62.
    </li>
    <li>
      If the gap is still there, ask Social Security for the computation
      behind your benefit: the earnings, the average, and the formula it
      used. Most real errors turn out to be a missing year of earnings.
    </li>
    <li>
      If you disagree with a decision, you can ask for reconsideration in
      writing with
      <a href="https://www.ssa.gov/forms/ssa-561.html">Form SSA-561</a>,
      generally
      <a href="https://www.ecfr.gov/current/title-20/part-404/section-404.909"
        >within 60 days</a
      >
      of receiving the notice.
    </li>
  </ol>

  <p>
    Before 2025, many teachers, police officers, and other public employees
    with a pension from work outside Social Security had their estimates
    reduced by the Windfall Elimination Provision or the Government Pension
    Offset. The
    <a href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >Social Security Fairness Act</a
    >
    ended both for benefits payable after December 2023. If your estimate
    still reflects either reduction, the
    <a href="/guides/wep">guide to the repeal</a> explains what changed.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <p>
    Related guides:
    <a href="/guides/pia">Primary Insurance Amount</a>,
    <a href="/guides/cola">cost-of-living adjustments</a>,
    <a href="/guides/filing-date-chart">filing date chart</a>,
    <a href="/guides/spousal-benefits">spousal benefits</a>, and
    <a href="/guides/earnings-test">the earnings test</a>.
  </p>

  <GuideFooter />
</div>

<style>
  .rule-table {
    width: fit-content;
    max-width: 100%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .rule-table th,
  .rule-table td {
    border: 1px solid #ccc;
    padding: 8px 16px;
    text-align: left;
    vertical-align: top;
  }

  .rule-table th {
    background-color: #f5f5f5;
  }

  @media (max-width: 480px) {
    .rule-table th,
    .rule-table td {
      padding: 6px 8px;
    }
  }

  .table-note {
    font-size: 0.9em;
    color: #555;
    margin-top: -8px;
  }
</style>
