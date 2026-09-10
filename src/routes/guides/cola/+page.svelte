<script lang="ts">
import { averageCola, colaHistory, latestCola } from '$lib/cola';
import { Money } from '$lib/money';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const latest = latestCola();
const history = colaHistory();
const newestFirst = [...history].reverse();
const recent = newestFirst.slice(0, 10);
const average = averageCola();

// Years in which prices did not rise enough to produce any increase.
const zeroYears = history
  .filter((adjustment) => adjustment.percent === 0)
  .map((adjustment) => adjustment.paymentYear);
const zeroYearsText = `${zeroYears.slice(0, -1).join(', ')}, and ${zeroYears[zeroYears.length - 1]}`;

// The adjustment that has not been announced yet at publication time.
const nextAnnouncementYear = latest.announcementYear + 1;
const nextPaymentYear = latest.paymentYear + 1;

// A round benefit makes the percentage concrete.
const exampleBenefit = Money.from(2000);
const exampleIncrease = exampleBenefit.times(latest.percent / 100);
const exampleTotal = exampleBenefit.plus(exampleIncrease);

// Medicare figures are published each November and are not part of
// constants.ts. Update these alongside the annual SSA constants.
const partBPremium = Money.from(202.9);
const partBIncrease = Money.from(17.9);

const title = `Social Security COLA ${latest.paymentYear}: What the ${latest.percent}% Increase Means`;
const description = `Social Security benefits rose ${latest.percent}% in ${latest.paymentYear}. Learn how the cost-of-living adjustment is calculated, when it reaches your check, whether you receive it before you file, and what else changes in January.`;
const publishDate = new Date('2026-09-10T00:00:00+00:00');
const updateDate = new Date('2026-09-10T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/cola';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt = 'Social Security calculator showing cost-of-living adjustments';
schema.tags = [
  'Social Security COLA',
  `COLA ${latest.paymentYear}`,
  'cost of living adjustment',
  'CPI-W',
  'Social Security raise',
  'Social Security increase',
  'Medicare Part B premium',
];

const faqs: FAQItem[] = [
  {
    question: `When is the ${nextPaymentYear} COLA announced?`,
    answer: `Social Security announces the ${nextPaymentYear} cost-of-living adjustment in mid-October ${nextAnnouncementYear}, once the Bureau of Labor Statistics publishes September inflation data. The figure is set by the CPI-W for July, August, and September compared with the same three months a year earlier.`,
  },
  {
    question: 'Do I get the COLA if I have not started benefits yet?',
    answer:
      'Yes. Cost-of-living adjustments are applied to your benefit formula starting with the year you turn 62, whether or not you have filed. Waiting to claim does not cost you any COLA. Before 62, your earnings are protected by wage indexing instead.',
  },
  {
    question: 'Can a COLA ever reduce my benefit?',
    answer: `No. If consumer prices fall, the adjustment is zero rather than negative, and your benefit stays where it is. That has happened in ${zeroYearsText}.`,
  },
  {
    question: 'Does the COLA apply to spousal and survivor benefits?',
    answer:
      'Yes. The same percentage applies to every kind of Social Security payment, including spousal, survivor, disability, and Supplemental Security Income.',
  },
  {
    question: 'Why is my raise smaller than the announced percentage?',
    answer:
      'For most people the Medicare Part B premium is deducted from the same check, and it usually rises in January too. The announced percentage applies to your gross benefit, so the amount deposited grows by less.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/cola" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Social Security COLA {latest.paymentYear}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Social Security benefits rose {latest.percent}% in {latest.paymentYear}.
    The increase, called a cost-of-living adjustment, was announced in October
    {latest.announcementYear} and first appeared in the payment for January
    {latest.paymentYear}.
  </p>

  <div class="headline-box">
    <h3>The {latest.paymentYear} adjustment</h3>
    <p>
      A gross benefit of {exampleBenefit.wholeDollars()} a month becomes
      {exampleTotal.wholeDollars()}, an increase of
      {exampleIncrease.wholeDollars()} a month. Your own increase is the same
      percentage applied to whatever you were receiving in December.
    </p>
  </div>

  <p>
    This guide covers how the figure is calculated, when it reaches your check,
    why you receive it even if you have not filed yet, and what else changes at
    the same time.
  </p>

  <h2>How the COLA Is Calculated</h2>

  <p>
    The adjustment is tied to the Consumer Price Index for Urban Wage Earners
    and Clerical Workers, known as CPI-W. Social Security averages that index
    for July, August, and September, then compares it with the same three
    months of the previous year. The percentage change, rounded to the nearest
    tenth of a percent, becomes the COLA.
  </p>

  <p>
    Because the third quarter ends in September, the figure is announced in
    mid-October and takes effect a few months later. Nothing about your own
    earnings or filing age enters the calculation. Every beneficiary receives
    the same percentage.
  </p>

  <p>
    A COLA can never be negative. If prices fall, the adjustment is zero and
    benefits stay flat rather than dropping. That has happened in {zeroYearsText}.
  </p>

  <h2>When It Reaches Your Check</h2>

  <p>
    The adjustment officially applies to benefits for December, and Social
    Security pays December benefits in January. So the first larger payment
    arrives in January {latest.paymentYear}. Supplemental Security Income
    recipients see it slightly earlier, at the end of December.
  </p>

  <p>
    Social Security posts a personalized COLA notice in early December showing
    your new amount. It appears in the message center of your my Social
    Security account, and is mailed to people who have not opted out of paper
    notices.
  </p>

  <InlineCTA type="calculator" />

  <h2>You Get the COLA Before You File</h2>

  <p>
    This is the most common misunderstanding about cost-of-living adjustments.
    You do not have to be receiving benefits to get one. Adjustments are
    applied to your
    <a href="/guides/pia">Primary Insurance Amount</a> starting with the year
    you turn 62, whether or not you have claimed.
  </p>

  <p>
    Delaying your filing date therefore costs you nothing in COLAs. Every
    adjustment announced between 62 and the month you file is already built
    into your first payment. This is separate from
    <a href="/guides/delayed-retirement-credits">delayed retirement credits</a>,
    which are an additional increase for waiting past your
    <a href="/guides/nra">Normal Retirement Age</a>.
  </p>

  <p>
    Before you turn 62, your record is protected a different way. Past earnings
    are restated in current terms through
    <a href="/guides/indexing-factors">wage indexing</a>, which tracks average
    wages rather than prices. Our guide on
    <a href="/guides/inflation">inflation and Social Security</a> covers the
    handoff between the two.
  </p>

  <h2>COLA History</h2>

  <p>
    Automatic annual adjustments began in 1975. The average since then is
    {average.toFixed(1)}%, though the range is wide. The table below shows the
    last ten years by the year each increase was first paid.
  </p>

  <div class="table-scroll">
    <table class="cola-table">
      <thead>
        <tr>
          <th>First paid</th>
          <th>Increase</th>
        </tr>
      </thead>
      <tbody>
        {#each recent as adjustment}
          <tr>
            <td>{adjustment.paymentYear}</td>
            <td>{adjustment.percent.toFixed(1)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p>
    The years with no increase at all were {zeroYearsText}. In each case
    consumer prices had fallen or barely moved over the measuring period,
    usually following a drop in energy prices.
  </p>

  <details class="full-history">
    <summary>Show every adjustment since 1975</summary>
    <div class="table-scroll">
      <table class="cola-table">
        <thead>
          <tr>
            <th>First paid</th>
            <th>Increase</th>
          </tr>
        </thead>
        <tbody>
          {#each newestFirst as adjustment}
            <tr>
              <td>{adjustment.paymentYear}</td>
              <td>{adjustment.percent.toFixed(1)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Adjustments announced for 1975 through 1982 took effect in June of the
      same year. Since 1983 an adjustment applies to December benefits, which
      arrive the following January, so those rows are listed under the later
      year.
    </p>
  </details>

  <h2>What Else Changes in January</h2>

  <h3>Medicare Part B</h3>
  <p>
    Most people have the Part B premium deducted from their Social Security
    payment, and it is set separately from the COLA. The standard premium is
    {partBPremium.string()} a month in {latest.paymentYear}, up
    {partBIncrease.string()} from the year before. That deduction comes out of
    the same check, so the amount deposited rises by less than the headline
    percentage.
  </p>

  <p>
    A rule known as hold harmless protects most beneficiaries from going
    backwards. If your dollar COLA is smaller than the increase in your Part B
    premium, the premium increase is limited so your net payment does not fall
    below the previous year. It does not apply to people paying
    income-related premium surcharges or those new to Medicare that year.
  </p>

  <h3>Limits That Move With Wages, Not Prices</h3>
  <p>
    Two figures change every January but are driven by average wage growth
    rather than the COLA, so they rise by a different percentage. The first is
    the <a href="/guides/earnings-cap">taxable maximum</a>, the ceiling on
    earnings that count toward Social Security. The second is the
    <a href="/guides/earnings-test">earnings test</a> limit, which affects
    people who work while collecting before Normal Retirement Age.
  </p>

  <h3>Tax Thresholds That Never Change</h3>
  <p>
    The income thresholds that determine how much of your benefit is subject to
    federal income tax are not indexed at all. They have been fixed since 1984
    and 1993. Each COLA therefore pushes a few more people over them, which is
    why the share of beneficiaries owing tax on benefits keeps growing. See our
    guide on <a href="/guides/federal-taxes">federal taxation of benefits</a>.
  </p>

  <h2>Why the Increase Can Feel Too Small</h2>

  <p>
    CPI-W measures spending by working-age wage earners. Retirees spend a
    larger share of their budget on health care and housing and a smaller share
    on gasoline and clothing, so their personal inflation rate can differ.
  </p>

  <p>
    The Bureau of Labor Statistics publishes an experimental index for people
    62 and older, CPI-E, which has usually risen slightly faster than CPI-W.
    Proposals to switch the COLA to CPI-E come up regularly in Congress. Others
    propose a slower-growing measure instead. No change has been enacted, and
    CPI-W remains the basis today.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>See Your Own Numbers</h2>

  <p>
    The <a href="/calculator">SSA.tools calculator</a> applies every
    cost-of-living adjustment on record to your earnings history, so the
    benefit it shows already reflects the {latest.paymentYear} increase. Paste
    your earnings record from ssa.gov and it will show your benefit at every
    possible filing date, in today's dollars.
  </p>

  <GuideFooter />
</div>

<style>
  .headline-box {
    background-color: #fff3e0;
    border: 1px solid #ff9800;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .headline-box h3 {
    margin-top: 0;
    color: #e65100;
  }

  .headline-box p {
    margin-bottom: 0;
  }

  .table-scroll {
    overflow-x: auto;
    margin: 20px 0;
  }

  .cola-table {
    width: fit-content;
    min-width: 260px;
    border-collapse: collapse;
    margin: 0 auto;
  }

  .cola-table th,
  .cola-table td {
    border: 1px solid #ccc;
    padding: 8px 24px;
    text-align: left;
  }

  .cola-table th {
    background-color: #f5f5f5;
  }

  .full-history {
    margin: 20px 0;
  }

  .full-history summary {
    cursor: pointer;
    font-weight: bold;
    padding: 8px 0;
  }

  .footnote {
    font-size: 0.9em;
    color: #555;
  }
</style>
