<script lang="ts">
import {
  type AnnualCola,
  averageCola,
  colaHistory,
  latestAnnouncedCola,
} from '$lib/cola';
import { CURRENT_YEAR, MEDICARE_PART_B_PREMIUM } from '$lib/constants';
import { Money } from '$lib/money';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const headline = latestAnnouncedCola();
const history = colaHistory();
const newestFirst = [...history].reverse();
const recent = newestFirst.slice(0, 10);
const average = averageCola();

// SSA announces in October and the larger payment arrives the following
// January, so for part of every year the newest adjustment is public but has
// not reached anyone's check. Every tense on this page follows this flag.
const isBeingPaid = headline.paymentYear <= CURRENT_YEAR;

const nextPaymentYear = headline.paymentYear + 1;
const nextAnnouncementYear = headline.announcementYear + 1;

function percentText(adjustment: AnnualCola): string {
  return `${adjustment.percent.toFixed(1)}%`;
}

function yearList(years: number[]): string {
  if (years.length <= 1) return years.join('');
  if (years.length === 2) return `${years[0]} and ${years[1]}`;
  return `${years.slice(0, -1).join(', ')}, and ${years[years.length - 1]}`;
}

// Years in which prices did not rise enough to produce any increase.
const zeroYearsText = yearList(
  history.filter((a) => a.percent === 0).map((a) => a.paymentYear)
);

// A round benefit makes the percentage concrete.
const exampleBenefit = Money.from(2000);
const exampleIncrease = exampleBenefit.times(headline.percent / 100);
const exampleTotal = exampleBenefit.plus(exampleIncrease);

// Medicare premiums are set by CMS a month after the COLA is announced, so the
// newest COLA year may not have one yet. Show the most recent year we have and
// label it, rather than attaching a stale figure to the wrong year.
const partBYears = Object.keys(MEDICARE_PART_B_PREMIUM)
  .map(Number)
  .sort((a, b) => a - b)
  .filter((year) => year <= headline.paymentYear);
const partBYear =
  partBYears.length > 0 ? partBYears[partBYears.length - 1] : undefined;
const partBPremium =
  partBYear === undefined ? undefined : MEDICARE_PART_B_PREMIUM[partBYear];
const partBPrior =
  partBYear === undefined ? undefined : MEDICARE_PART_B_PREMIUM[partBYear - 1];
const partBIncrease =
  partBPremium === undefined || partBPrior === undefined
    ? undefined
    : partBPremium.sub(partBPrior);

const sponsorCopy: SponsorCopy = {
  intro:
    'A COLA raises every year of benefits ahead of you, so the bigger the benefit it lands on, the more it is worth. You can work through that with a Social Security specialist at',
  outro: 'before you settle on a filing date.',
  bullets: [
    'They look at how your filing age sets the base that every future adjustment compounds on.',
    'Medicare premiums and the tax thresholds above decide how much of the increase you actually keep.',
    'The first call is free, and you pick the time.',
  ],
};

const title = `Social Security COLA ${headline.paymentYear}: What the ${percentText(headline)} Increase Means`;
const description = `Social Security benefits ${isBeingPaid ? 'rose' : 'will rise'} ${percentText(headline)} in ${headline.paymentYear}. Learn how the cost-of-living adjustment is calculated, when it reaches your check, whether you receive it before you file, and what else changes in January.`;
const publishDate = new Date('2026-09-10T00:00:00+00:00');
const updateDate = new Date('2026-09-10T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/cola';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security calculator showing cost-of-living adjustments';
schema.tags = [
  'Social Security COLA',
  `COLA ${headline.paymentYear}`,
  'cost of living adjustment',
  'CPI-W',
  'Social Security raise',
  'Social Security increase',
  'Medicare Part B premium',
];

const faqs: FAQItem[] = [
  {
    question: `When is the ${nextPaymentYear} COLA announced?`,
    answer: `Social Security announces the ${nextPaymentYear} cost-of-living adjustment in October ${nextAnnouncementYear}, once the Bureau of Labor Statistics publishes September inflation data. The date moves with that release, so it can fall late in the month.`,
  },
  {
    question: 'Do I get the COLA if I have not started benefits yet?',
    answer:
      'Yes. Cost-of-living adjustments are applied to your benefit formula starting with the year you turn 62, whether or not you have filed. Waiting to claim does not cost you any COLA.',
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
  <h1>Social Security COLA {headline.paymentYear}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Social Security benefits {isBeingPaid ? 'rose' : 'will rise'}
    {percentText(headline)} in {headline.paymentYear}. The increase, called a
    cost-of-living adjustment, was announced in October
    {headline.announcementYear} and
    {isBeingPaid ? 'first appeared in' : 'takes effect with'} the payment for
    January {headline.paymentYear}.
  </p>

  <div class="headline-box">
    <h3>The {headline.paymentYear} adjustment</h3>
    <p>
      A gross benefit of {exampleBenefit.wholeDollars()} a month
      {isBeingPaid ? 'became' : 'becomes'}
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
    months of the last year in which a COLA took effect. The percentage change,
    rounded to the nearest tenth of a percent, becomes the COLA.
  </p>

  <p>
    In most years the comparison is simply against the year before. After a
    year with no increase the comparison reaches further back, to the last year
    that produced one, so no inflation is skipped.
  </p>

  <p>
    Because the third quarter ends in September, the figure is announced in
    October and takes effect a few months later. Nothing about your own
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
    {isBeingPaid ? 'arrived' : 'arrives'} in January {headline.paymentYear}.
    Supplemental Security Income works slightly differently. The increase
    applies to the January payment, and January SSI is always issued on the last
    business day of December because the first of the month is a holiday.
  </p>

  <p>
    Social Security posts a personalized COLA notice in the message center of
    your my Social Security account in late November, along with your new
    Medicare premium. Paper notices are mailed starting in early December to
    people who have not opted out of them.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

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
    Earlier in your career a different mechanism does the work. Your past
    earnings are restated relative to the average wage level of the year you
    turn 60, through
    <a href="/guides/indexing-factors">wage indexing</a>, which tracks wages
    rather than prices. Earnings from age 60 onward, including 61 and 62, count
    at face value. Our guide on
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
            <td>{percentText(adjustment)}</td>
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
              <td>{percentText(adjustment)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="footnote">
      Adjustments announced for 1975 through 1982 took effect in June of the
      same year. Since 1983 an adjustment applies to December benefits, which
      arrive the following January, so those rows are listed under the later
      year. Source:
      <a href="https://www.ssa.gov/oact/cola/colaseries.html">
        SSA cost-of-living adjustment series
      </a>.
    </p>
  </details>

  <h2>What Else Changes in January</h2>

  <h3>Medicare Part B</h3>
  {#if partBPremium !== undefined && partBYear !== undefined}
    <p>
      Most people have the Part B premium deducted from their Social Security
      payment, and it is set separately from the COLA. The standard premium is
      {partBPremium.string()} a month in {partBYear}{#if partBIncrease !== undefined}, up
        {partBIncrease.string()} from the year before{/if}. That deduction comes
      out of the same check, so the amount deposited rises by less than the
      headline percentage. Higher earners pay an income-related surcharge on top
      of the standard premium.
    </p>
  {/if}

  <p>
    A rule known as hold harmless protects most beneficiaries from going
    backwards. If your dollar COLA is smaller than the increase in your Part B
    premium, the premium increase is limited so your net payment does not fall
    below the previous year. It does not cover everyone. People paying
    income-related surcharges, those new to Medicare that year, those not yet
    collecting Social Security, and those whose premiums Medicaid pays are all
    outside it.
  </p>

  <h3>Limits That Move With Wages, Not Prices</h3>
  <p>
    Two figures change most Januarys but are driven by average wage growth
    rather than the COLA, so they rise by a different percentage. The first is
    the <a href="/guides/earnings-cap">taxable maximum</a>, the ceiling on
    earnings that count toward Social Security. The second is the
    <a href="/guides/earnings-test">earnings test</a> limit, which affects
    people who work while collecting before Normal Retirement Age. Neither one
    rises in a year when no COLA is payable.
  </p>

  <h3>Tax Thresholds That Never Change</h3>
  <p>
    The income thresholds that determine how much of your benefit is subject to
    federal income tax are not indexed at all. They have been fixed since the
    1984 and 1994 tax years. Each COLA therefore pushes a few more people over
    them, which is why the share of beneficiaries owing tax on benefits keeps
    growing. See our guide on
    <a href="/guides/federal-taxes">federal taxation of benefits</a>.
  </p>

  <h2>Why the Increase Can Feel Too Small</h2>

  <p>
    CPI-W measures spending by working-age wage earners. Retirees spend a
    larger share of their budget on health care and housing and a smaller share
    on gasoline and clothing, so their personal inflation rate can differ.
  </p>

  <p>
    The Bureau of Labor Statistics publishes a research index for people 62 and
    older, CPI-E. It rose faster than CPI-W through the 1980s and 1990s, but the
    gap has narrowed since, and in some years it would have produced a smaller
    increase rather than a larger one. Proposals to switch the COLA to CPI-E
    come up regularly in Congress, as do proposals for a slower-growing measure.
    No change has been enacted, and CPI-W remains the basis today.
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
    benefit it shows already reflects them. Paste your earnings record from
    ssa.gov and it will show your benefit at every possible filing date, in
    today's dollars.
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
