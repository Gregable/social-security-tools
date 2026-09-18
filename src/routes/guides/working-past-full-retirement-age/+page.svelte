<script lang="ts">
import { MAX_YEAR, MAXIMUM_EARNINGS, SSA_EARNINGS_YEARS } from '$lib/constants';
import { Money } from '$lib/money';
import {
  exampleWorker,
  recomputationExample,
} from '$lib/recomputation-example';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const sponsorCopy: SponsorCopy = {
  intro:
    'Whether another year of work is worth more to you as a bigger check or as an earlier retirement is a judgment call, not a formula. You can talk it through with a Social Security specialist at',
  outro: 'before you decide how long to keep going.',
  bullets: [
    'They can read your earnings record and tell you whether one more year will actually displace a low year.',
    'They weigh the raise against delayed credits, taxes on your benefit, and what a higher record means for your spouse.',
    'The first call is free, and you pick the time.',
  ],
};

const title =
  'Working Past Full Retirement Age: Will Your Social Security Benefit Go Up?';
const description =
  'Still working at or after full retirement age? Learn the two ways your Social Security check can rise, when Social Security recalculates it, why the earnings test no longer applies, and how much one more year of work is really worth.';
const publishDate = new Date('2026-09-18T00:00:00+00:00');
const updateDate = new Date('2026-09-18T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/working-past-full-retirement-age';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security benefit recalculation for people working past full retirement age';
schema.tags = [
  'working past full retirement age',
  'working after full retirement age social security',
  'does social security increase if you keep working',
  'social security recalculation after retirement',
  'working while collecting social security after 67',
  'social security benefit recomputation',
  'earnings test after full retirement age',
];

// One worker, several careers. The worker is past full retirement age in
// MAX_YEAR and adds one more year of earnings in that year.
const wage = Money.from(60_000);
const fullCareer = recomputationExample({ careerYears: 35, wage });
const shortCareer = recomputationExample({ careerYears: 22, wage });
const maxCareer = recomputationExample({
  careerYears: 35,
  wage: MAXIMUM_EARNINGS[MAX_YEAR],
  shape: 'flat',
});
const lowYear = recomputationExample({
  careerYears: 35,
  wage,
  extraYearWage: Money.from(15_000),
});

const worker = exampleWorker();
const fra = worker.normalRetirementAge();
const monthsFraTo70 = 70 * 12 - fra.asMonths();
const drcAt70Percent = (worker.delayedRetirementIncrease() / 12) * monthsFraTo70 * 100;
// Early-claiming reduction: 5/9 of 1% for each of the first 36 months, then
// 5/12 of 1% for each month beyond that.
const monthsEarlyAt62 = fra.asMonths() - 62 * 12;
const reductionAt62Percent =
  Math.min(36, monthsEarlyAt62) * (5 / 9) +
  Math.max(0, monthsEarlyAt62 - 36) * (5 / 12);

const raiseIfClaimedAt62 = fullCareer.monthlyIncrease.times(
  1 - reductionAt62Percent / 100
);
const raiseIfClaimedAt70 = fullCareer.monthlyIncrease.times(
  1 + drcAt70Percent / 100
);

const percent = (value: number): string => `${value.toFixed(1)}%`;

const faqs: FAQItem[] = [
  {
    question:
      'If I keep working after full retirement age, will my Social Security check go up?',
    answer:
      'Usually a little, and never down. Social Security recalculates your benefit every year you have new earnings. If the new year is higher than the lowest of the 35 years already counted, your benefit rises; if not, nothing changes. If you have not claimed yet, waiting also adds delayed retirement credits of 8% a year until 70.',
  },
  {
    question:
      'Do I have to ask Social Security to recalculate my benefit after I work?',
    answer:
      'No. The recomputation is automatic. Social Security receives your earnings from your W-2 or tax return and recalculates the following year. The increase is effective the January after the year you earned the money, and any months already paid at the old rate are made up in a lump sum.',
  },
  {
    question:
      'When does the increase from working show up in my check?',
    answer:
      'Earnings from one year raise your benefit starting the following January, but Social Security usually does not finish the recalculation until later that year, after the earnings are posted to your record. When it does, it pays the difference back to January.',
  },
  {
    question:
      'Does the earnings test still apply after full retirement age?',
    answer:
      'No. Starting with the month you reach full retirement age, you can earn any amount and no benefits are withheld. Only the months before full retirement age are subject to the earnings test.',
  },
  {
    question:
      'Do I still pay Social Security tax on my wages after I start collecting benefits?',
    answer:
      'Yes. There is no age exemption. The 6.2% Social Security tax and 1.45% Medicare tax come out of your paycheck for as long as you work, whether or not you are collecting a benefit and whether or not the new earnings raise it.',
  },
  {
    question:
      'Can working after retirement age lower my benefit?',
    answer:
      'No. A year of low earnings simply does not make your top 35 and is ignored. What can happen is that higher income makes more of your benefit subject to income tax and, two years later, raises your Medicare Part B premium. Your Social Security benefit itself never goes down because you worked.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link
    rel="canonical"
    href="https://ssa.tools/guides/working-past-full-retirement-age"
  />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Working Past Full Retirement Age</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    You have reached full retirement age, or you are about to, and you are
    still working. Maybe your Social Security check has already started;
    maybe you are holding off. Either way the question is the same: does
    the work you are doing now make the benefit any bigger?
  </p>

  <p>
    Yes, in two separate ways. Every year of new earnings gets folded into
    your record, and if it beats one of the years already counted, your
    benefit is recalculated upward. And if you have not claimed yet, each
    month you wait past full retirement age adds a delayed retirement
    credit on top. The earnings test, which holds back benefits from people
    who work before full retirement age, stops applying the month you reach
    it.
  </p>

  <p>
    This guide covers how the recalculation works, how much one more year
    is worth in dollars, how it combines with delayed credits, and what
    changes for you depending on whether your benefit has started. The
    numbers below are computed with the same code as the
    <a href="/calculator">ssa.tools calculator</a>, so they reflect this
    year's Social Security figures.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>How the Recalculation Works</h2>

  <p>
    Your retirement benefit rests on your highest {SSA_EARNINGS_YEARS} years
    of earnings, each one adjusted for wage growth and then averaged. That
    average is your
    <a href="/guides/aime">Average Indexed Monthly Earnings</a>, and the
    benefit formula turns it into your
    <a href="/guides/pia">Primary Insurance Amount</a>. Nothing about that
    formula freezes when you claim. Each year, Social Security looks at the
    earnings you just added and asks one question: is this year higher than
    the lowest year currently in your top {SSA_EARNINGS_YEARS}?
  </p>

  <p>
    If it is, the new year replaces that lowest year, your average rises,
    and your benefit is recomputed from the higher average. If it is not,
    the year is ignored and your benefit stays exactly where it was. There
    is no scenario in which a year of earnings lowers your benefit.
  </p>

  <p>Three details matter for people working late in life:</p>

  <ul>
    <li>
      <strong>Earnings after age 60 are not adjusted for wage growth.</strong>
      Years before your age-60 year are scaled up to today's wage levels
      before they are compared; years from 60 on count at face value. Since
      the wage level keeps rising, a late year counts at full weight against
      early years that were scaled up to an older standard. That is why one
      more year at your usual salary often edges out a year from the 1980s
      or 1990s. See the
      <a href="/guides/indexing-factors">indexing factors guide</a> for the
      mechanics.
    </li>
    <li>
      <strong>Fewer than {SSA_EARNINGS_YEARS} years means zeros.</strong>
      If your record has gaps, the "lowest year" being replaced is a zero,
      and every additional year of work replaces one. The raise is roughly
      twice as large as for someone with a full record, as the examples
      below show.
    </li>
    <li>
      <strong>Your claiming adjustment carries over.</strong> If you claimed
      early, your benefit is a reduced percentage of your Primary Insurance
      Amount; if you claimed late, it is an increased percentage. The
      recomputation raises the Primary Insurance Amount, and the same
      percentage is applied to the new figure. The raise shows up in your
      check scaled by the same factor as everything else.
    </li>
  </ul>

  <p>
    The rules are in
    <a href="https://www.law.cornell.edu/cfr/text/20/404.285"
      >20 CFR 404.285</a
    >
    and the sections around it, and Social Security summarizes them in
    <a href="https://www.ssa.gov/pubs/EN-05-10069.pdf"
      >How Work Affects Your Benefits</a
    >.
  </p>

  <h2>How Much One More Year Is Worth</h2>

  <p>
    Take a worker born in {fullCareer.birthYear}, whose full retirement age
    is {fra.years()} and {fra.modMonths()} months. They reached it late last
    year and are working through {fullCareer.extraYear} earning
    {wage.wholeDollars()}. What does that one year do to a monthly
    benefit, for a few different work histories?
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Work history before {fullCareer.extraYear}</th>
        <th>Benefit before</th>
        <th>Benefit after</th>
        <th>Monthly raise</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{SSA_EARNINGS_YEARS} years, rising to {wage.wholeDollars()}</td>
        <td>{fullCareer.piaBefore.string()}</td>
        <td>{fullCareer.piaAfter.string()}</td>
        <td>{fullCareer.monthlyIncrease.string()}</td>
      </tr>
      <tr>
        <td>22 years, rising to {wage.wholeDollars()}</td>
        <td>{shortCareer.piaBefore.string()}</td>
        <td>{shortCareer.piaAfter.string()}</td>
        <td>{shortCareer.monthlyIncrease.string()}</td>
      </tr>
      <tr>
        <td>{SSA_EARNINGS_YEARS} years at the taxable maximum</td>
        <td>{maxCareer.piaBefore.string()}</td>
        <td>{maxCareer.piaAfter.string()}</td>
        <td>{maxCareer.monthlyIncrease.string()}</td>
      </tr>
      <tr>
        <td>
          {SSA_EARNINGS_YEARS} years, but {fullCareer.extraYear} pays only
          {lowYear.extraYearWage.wholeDollars()}
        </td>
        <td>{lowYear.piaBefore.string()}</td>
        <td>{lowYear.piaAfter.string()}</td>
        <td>{lowYear.monthlyIncrease.string()}</td>
      </tr>
    </tbody>
  </table>

  <p class="table-note">
    Benefits are the Primary Insurance Amount, which is what a person who
    claims exactly at full retirement age receives. The "rising" careers
    start at half the final salary and grow steadily, which is typical; a
    perfectly flat career would gain nothing from repeating the same wage.
  </p>

  <p>
    The first row is the common case. The {fullCareer.extraYear} year
    displaces the lowest counted year, which after wage adjustment was worth
    about {fullCareer.lowestCountedYear.wholeDollars()}. The difference
    is spread across {SSA_EARNINGS_YEARS} years of months and then run
    through a formula that keeps only 32 cents of each extra dollar at this
    income, so the raise is {fullCareer.monthlyIncrease.string()} a month.
    Real, permanent, and inflation-adjusted from then on, but small.
  </p>

  <p>
    The second row is the case where working late pays best. With 22 years
    on record, the new year replaces a zero rather than a low year, and the
    raise is {shortCareer.monthlyIncrease.string()} a month. Anyone who
    took years out of the workforce, immigrated mid-career, or spent time
    in work not covered by Social Security is in this position.
  </p>

  <p>
    The third row surprises people. Even someone who paid in at the maximum
    every year gains {maxCareer.monthlyIncrease.string()} from one more
    maximum year, because the taxable maximum for {maxCareer.extraYear} is
    counted at face value while the old maximums were adjusted only up to
    the age-60 wage level.
  </p>

  <p>
    The last row is the guarantee: a year that earns less than your lowest
    counted year does nothing, in either direction.
  </p>

  <h3>If You Claimed Early or Late</h3>

  <p>
    Those figures assume a claim at full retirement age. The same
    {fullCareer.monthlyIncrease.string()} raise in the Primary Insurance
    Amount would show up as about {raiseIfClaimedAt62.roundToDollar().string()}
    for this worker if they had claimed at 62 (a
    {percent(reductionAt62Percent)} reduction), and about
    {raiseIfClaimedAt70.roundToDollar().string()} if they wait until 70 (a
    {percent(drcAt70Percent)} increase). The recomputation changes the base;
    the claiming adjustment does what it always did.
  </p>

  <h2>When the Raise Arrives</h2>

  <p>
    You do not apply for the recomputation. Social Security does it on its
    own once your earnings for the year are posted, which happens after
    your employer files your W-2 or you file a tax return with
    self-employment income. The increase is effective the January after the
    year you earned the money. In practice the recalculation is usually
    finished later in that year, and when it lands you receive the
    difference for the months already paid at the old rate.
  </p>

  <p>
    So earnings from {fullCareer.extraYear} raise your benefit as of
    January {fullCareer.extraYear + 1}, and you will most likely see the
    new amount, with a small catch-up payment, sometime during
    {fullCareer.extraYear + 1}. If you keep working, the same thing happens
    every year.
  </p>

  <h2>If You Have Not Claimed Yet: Delayed Retirement Credits</h2>

  <p>
    Recomputation happens whether or not your benefit has started. A second,
    larger effect applies only if it has not: every month you wait past full
    retirement age, up to 70, adds a delayed retirement credit of two-thirds
    of one percent, which is 8% a year. For the worker above, with a full
    retirement age of {fra.years()} and {fra.modMonths()} months, waiting
    all the way to 70 adds {percent(drcAt70Percent)}.
  </p>

  <p>
    The two effects stack. The credits multiply whatever Primary Insurance
    Amount you have when you claim, and the recomputation keeps raising that
    amount as long as you work. Working while you wait is the one situation
    where both are pushing your check up at the same time.
  </p>

  <p>
    There is a timing wrinkle: credits earned in one year are not applied
    until the following January, unless you claim at 70. The
    <a href="/guides/delayed-retirement-credits"
      >delayed retirement credits guide</a
    >
    covers how the credits work and the
    <a href="/guides/delayed-january-bump">delayed January bump guide</a>
    covers the timing.
  </p>

  <h2>Already Claiming vs. Not Yet: What Actually Differs</h2>

  <table class="rule-table">
    <thead>
      <tr>
        <th></th>
        <th>Benefit already started</th>
        <th>Not claimed yet</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>New earnings recomputed</td>
        <td>Yes, automatically, effective the next January</td>
        <td>Yes, folded in when you claim and each year after</td>
      </tr>
      <tr>
        <td>Delayed retirement credits</td>
        <td>No, unless you suspend your benefit</td>
        <td>Yes, 8% a year until 70</td>
      </tr>
      <tr>
        <td>Earnings test</td>
        <td>None from the month you reach full retirement age</td>
        <td>None from the month you reach full retirement age</td>
      </tr>
      <tr>
        <td>Social Security and Medicare payroll tax</td>
        <td>Still withheld</td>
        <td>Still withheld</td>
      </tr>
    </tbody>
  </table>

  <p>
    If your benefit has started and you now wish you had waited, you can
    ask Social Security to suspend it. From full retirement age until 70 a
    suspended benefit earns delayed credits exactly as if you had never
    claimed. That is a decision with its own tradeoffs, especially for a
    spouse collecting on your record, and it is worth understanding before
    you make the call.
  </p>

  <h2>The Earnings Test Stops at Full Retirement Age</h2>

  <p>
    Before full retirement age, Social Security withholds $1 of benefits for
    every $2 you earn above an annual limit, with a gentler rule in the year
    you reach full retirement age. Starting with the month you reach full
    retirement age, none of that applies: you can earn any amount, from any
    job, with no benefit withheld. If you had benefits withheld in earlier
    years, Social Security also adjusts your benefit upward at full
    retirement age to give those months back.
  </p>

  <p>
    The
    <a href="/guides/earnings-test">earnings test guide</a> covers the limit,
    the year-you-reach-FRA rule, and how withheld benefits are returned. If
    you arrived here from that guide, the short version is: after full
    retirement age, working affects your benefit only through the
    recomputation described above, and only upward.
  </p>

  <h2>What Keeps Happening When You Work</h2>

  <p>
    A few things do not change just because you are past full retirement
    age, and they are worth knowing before you count the raise:
  </p>

  <ul>
    <li>
      <strong>Payroll tax continues.</strong> Social Security and Medicare
      tax come out of every paycheck for as long as you work, with no
      exemption for age or for already collecting a benefit. The
      recomputation is what you get for those contributions.
    </li>
    <li>
      <strong>More of your benefit may be taxed.</strong> Wages count
      toward the income figure that decides how much of your Social
      Security benefit is subject to federal income tax. A job that pays
      well can move you from having none of your benefit taxed to having
      most of it taxed. The
      <a href="/guides/federal-taxes">federal taxes guide</a> walks through
      the thresholds.
    </li>
    <li>
      <strong>Medicare premiums look back two years.</strong> Part B and
      Part D premiums are set from your tax return two years earlier. A
      high-earning year at 67 can raise your premiums at 69.
    </li>
    <li>
      <strong>Your family's benefits rise too.</strong> Spousal and
      survivor benefits on your record are percentages of your Primary
      Insurance Amount, so a recomputation that raises yours raises theirs.
      For a couple where one spouse will eventually collect a survivor
      benefit, this is often the more valuable half of the raise. See the
      <a href="/guides/spousal-benefits">spousal benefits</a> and
      <a href="/guides/survivor-benefits">survivor benefits</a> guides.
    </li>
  </ul>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Calculate Your Own Raise</h2>

  <p>
    The examples above are for one made-up worker. Your own answer depends
    on which of your years is currently the lowest, and only your earnings
    record can tell you that. Paste it into the
    <a href="/calculator">ssa.tools calculator</a>, then add a year or more
    of future earnings at your current salary and watch the benefit change.
    The calculator applies the same top-{SSA_EARNINGS_YEARS} rule, wage
    adjustment, and formula described here.
  </p>

  <p>
    Related guides:
    <a href="/guides/earnings-test">earnings test</a>,
    <a href="/guides/delayed-retirement-credits"
      >delayed retirement credits</a
    >,
    <a href="/guides/aime">average indexed monthly earnings</a>,
    <a href="/guides/indexing-factors">indexing factors</a>, and
    <a href="/guides/nra">normal retirement age</a>.
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

  .table-note {
    font-size: 0.9em;
    color: #555;
    margin-top: -8px;
  }
</style>
