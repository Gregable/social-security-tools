<script lang="ts">
import {
  breakEven,
  claimAgeRows,
  DISCOUNT_RATES,
  discountedBreakEvens,
  EXAMPLE_PIA,
  exampleRetiree,
} from '$lib/break-even-example';
import { MAX_YEAR } from '$lib/constants';
import { MonthDuration } from '$lib/month-time';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const sponsorCopy: SponsorCopy = {
  intro:
    'A break-even age is arithmetic; the decision behind it turns on your health, your spouse, and what else you have to live on. You can talk it through with a Social Security specialist at',
  outro: 'before you settle on a claiming age.',
  bullets: [
    'They look at both spouses together, which is where the break-even math most often misleads.',
    'They weigh the survivor benefit, taxes, and your other income alongside the monthly check.',
    'The first call is free, and you pick the time.',
  ],
};

const title =
  'Social Security Break-Even Age: Claiming at 62 vs 67 vs 70';
const description =
  'How long you have to live for a later Social Security claim to pay off. The break-even ages for 62 vs 67, 62 vs 70, and 67 vs 70, a table for every claiming age, how the arithmetic works, and why the break-even age is the wrong place to stop.';
const publishDate = new Date('2026-10-11T00:00:00+00:00');
const updateDate = new Date('2026-10-11T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/break-even-age';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security break-even age for claiming at 62, 67, or 70';
schema.tags = [
  'social security break even age',
  'social security break even calculator',
  'claim social security at 62 or 67',
  'social security 62 vs 70',
  'when to take social security',
  'delayed retirement credits break even',
  'social security claiming age',
];

const age = (years: number) =>
  MonthDuration.initFromYearsMonths({ years, months: 0 });

// One retiree, three comparisons, and a row for every claiming age.
const retiree = exampleRetiree();
const birthYear = retiree.birthdate.ssaBirthYear();
const fra = retiree.normalRetirementAge();
const vs6267 = breakEven(retiree, age(62), fra);
const vs6270 = breakEven(retiree, age(62), age(70));
const vs6770 = breakEven(retiree, fra, age(70));
const rows = claimAgeRows(retiree);
// The same three comparisons with the early checks earning a real return.
const discounted = discountedBreakEvens(retiree);
const percent = (rate: number): string => `${(rate * 100).toFixed(0)}%`;
const RATE_2 = DISCOUNT_RATES.indexOf(0.02);
const RATE_4 = DISCOUNT_RATES.indexOf(0.04);
const RATE_6 = DISCOUNT_RATES.indexOf(0.06);

const ageText = (a: MonthDuration): string => {
  const months = a.modMonths();
  if (months === 0) return `${a.years()}`;
  return `${a.years()} and ${months} ${months === 1 ? 'month' : 'months'}`;
};
const ageOrNever = (a: MonthDuration | null): string =>
  a === null ? 'Never' : ageText(a);
// The 62 vs 67 row, used in prose.
const d6267 = discounted[0].byRate;

// Delaying is a purchase: the forgone checks are the premium and the larger
// check is the income it buys. The ratio of annual income gained to the
// premium is the payout rate a private annuity would have to match.
const payoutRate = (b: typeof vs6770): string =>
  `${(b.monthlyGain.times(12).div$(b.headStart) * 100).toFixed(1)}%`;

const faqs: FAQItem[] = [
  {
    question: 'What is the Social Security break-even age?',
    answer:
      'The age at which the total benefits from claiming later catch up with the total from claiming earlier. Claiming early gives you a head start of several years of smaller checks; claiming later gives you a larger check that slowly repays that head start. The break-even age is when the repayment is complete. Beyond it, the later claim pays more in total for every month you live.',
  },
  {
    question: 'What is the break-even age for claiming at 62 versus 67?',
    answer: `About ${ageText(vs6267.breakEvenAge)} for someone whose full retirement age is 67. The 62 claim collects five years of checks at 70% of the full amount; the 67 claim then earns 30% of the full amount more each month, and needs just under twelve years to make up the difference.`,
  },
  {
    question: 'What is the break-even age for claiming at 62 versus 70?',
    answer: `About ${ageText(vs6270.breakEvenAge)}. The head start is eight years long, but the age-70 check is 124% of the full amount against 70% at 62, so the gap closes faster per month than in the 62 versus 67 comparison.`,
  },
  {
    question: 'Does the cost-of-living adjustment change the break-even age?',
    answer:
      'No. Cost-of-living adjustments apply from age 62 whether or not you have claimed, and they raise both the early check and the delayed check by the same percentage. The dollar figures grow but the break-even age does not move.',
  },
  {
    question:
      'Does investing the early checks change the break-even age?',
    answer: `Yes, and it is the one factor that favors claiming earlier. If the checks from a claim at 62 earn a 2% real return, the break-even against claiming at 67 moves from ${ageText(vs6267.breakEvenAge)} to ${ageOrNever(d6267[RATE_2])}; at 4% it moves to ${ageOrNever(d6267[RATE_4])}, and at 6% to ${ageOrNever(d6267[RATE_6])}. The same applies if the early checks let you leave savings invested instead of drawing them down.`,
  },
  {
    question: 'Is the break-even age the right way to decide when to claim?',
    answer:
      'It is a starting point, not an answer. It ignores how likely you are to live past it, what a surviving spouse would inherit, taxes, and what the early checks could earn if invested. For a married couple the higher earner’s claiming age sets the survivor benefit for whichever spouse lives longer, which usually matters more than either spouse’s own break-even.',
  },
  {
    question: 'Is there a break-even age after 70?',
    answer:
      'No. Delayed retirement credits stop at 70, so waiting past 70 gives up checks and adds nothing. Every month past 70 is a month of lost benefits.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/break-even-age" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Social Security Break-Even Age: Claiming at 62 vs 67 vs 70</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Claim Social Security at 62 and the checks start now but stay smaller
    for life. Wait until 70 and each check is far larger, but you give up
    eight years of them. Somewhere in between is an age at which the two
    choices have paid out the same total, and the question nearly everyone
    asks is: where?
  </p>

  <p>For someone whose full retirement age is {fra.years()}:</p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Claiming at</th>
        <th>Instead of</th>
        <th>Pays more in total once you reach</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{fra.years()}</td>
        <td>62</td>
        <td>{ageText(vs6267.breakEvenAge)}</td>
      </tr>
      <tr>
        <td>70</td>
        <td>62</td>
        <td>{ageText(vs6270.breakEvenAge)}</td>
      </tr>
      <tr>
        <td>70</td>
        <td>{fra.years()}</td>
        <td>{ageText(vs6770.breakEvenAge)}</td>
      </tr>
    </tbody>
  </table>

  <p>
    This guide shows where those numbers come from, gives the break-even age
    for every claiming year, and then explains what the arithmetic leaves
    out, which is most of what should actually drive the decision. The
    figures are computed with the same code as the
    <a href="/calculator">ssa.tools calculator</a>.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>How the Arithmetic Works</h2>

  <p>
    Take a worker born in {birthYear}, turning 62 in {MAX_YEAR}, with a
    <a href="/guides/pia">Primary Insurance Amount</a> of
    {EXAMPLE_PIA.wholeDollars()}. That is the monthly benefit at full
    retirement age, {fra.years()}. Claiming at 62 reduces it by 30% to
    {vs6267.earlierBenefit.string()} for life, following the
    <a href="/guides/nra">early filing reduction</a> of five-ninths of one
    percent a month for the first 36 months and five-twelfths of one percent
    for each month beyond, as
    <a href="https://www.ssa.gov/oact/quickcalc/early_late.html"
      >Social Security's actuaries describe it</a
    >. Compare that with waiting for the full
    {vs6267.laterBenefit.string()} at {fra.years()}.
  </p>

  <p>
    By {fra.years()}, the early claimer has collected
    {vs6267.headStart.string()} that the other has not: five years of
    {vs6267.earlierBenefit.string()}. From then on the later claimer
    receives {vs6267.monthlyGain.string()} more every month. Dividing the
    head start by the monthly gain gives
    {vs6267.timeToBreakEven.asMonths()} months, which is
    {vs6267.timeToBreakEven.years()} years and
    {vs6267.timeToBreakEven.modMonths()} months after {fra.years()}: age
    {ageText(vs6267.breakEvenAge)}. Live past that and waiting paid more in
    total; die before it and claiming early did.
  </p>

  <p>
    The same arithmetic covers any pair of ages. Claiming at 70 earns
    <a href="/guides/delayed-retirement-credits">delayed retirement credits</a>
    of
    <a href="https://www.ssa.gov/benefits/retirement/planner/delayret.html"
      >two-thirds of one percent a month</a
    >, 8% a year, past {fra.years()}, for {vs6270.laterBenefit.string()} a
    month, 124% of the full amount. Against 62 the head start is eight years
    of {vs6270.earlierBenefit.string()}, or {vs6270.headStart.string()}, and
    the monthly gain is {vs6270.monthlyGain.string()}, so the break-even
    falls at {ageText(vs6270.breakEvenAge)}. Against {fra.years()}, the head
    start is three years of {vs6770.earlierBenefit.string()} and the gain is
    {vs6770.monthlyGain.string()} a month, which takes until
    {ageText(vs6770.breakEvenAge)}.
  </p>

  <h2>Break-Even Age for Every Claiming Year</h2>

  <p>
    Each row compares claiming at that age with claiming at full retirement
    age, {fra.years()}. For ages before {fra.years()}, the break-even is
    when the full benefit catches up with the early one; for ages after, it
    is when the delayed benefit catches up with the full one.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Claim at</th>
        <th>Monthly benefit</th>
        <th>Head start vs. {fra.years()}</th>
        <th>Break-even vs. {fra.years()}</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td>{row.age.years()}</td>
          <td>{row.benefit.string()}</td>
          <td>
            {#if row.versusFra}
              {row.versusFra.headStart.string()}
              {row.age.lessThan(fra) ? 'ahead' : 'behind'}
            {:else}
              Full retirement age
            {/if}
          </td>
          <td>
            {#if row.versusFra}
              {ageText(row.versusFra.breakEvenAge)}
            {:else}
              &mdash;
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="table-note">
    Primary Insurance Amount of {EXAMPLE_PIA.wholeDollars()}, full
    retirement age {fra.years()}, nominal dollars before cost-of-living
    adjustments. Benefits are rounded down to the dollar as Social Security
    does.
  </p>

  <p>
    Two things stand out. The break-even ages all sit in the late 70s to
    early 80s, a few years short of the average remaining lifespan for
    someone who has already reached 62. And the break-even for waiting past
    full retirement age arrives later than the one for not claiming early,
    because delayed credits accrue at 8% a year while the early reduction
    runs closer to 6% to 7%. Both facts are why the usual advice is to avoid
    62 if you can, while the case for 70 depends more on the factors below.
  </p>

  <h2>What the Break-Even Age Leaves Out</h2>

  <p>
    The arithmetic above is correct and incomplete. Social Security itself
    used to show claimants a break-even comparison and stopped in 2008,
    because, in the words of its
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204039"
      >operations manual</a
    >, the computation "did not consider the changes in life expectancy,
    mortality rates, and the personal factors that the claimant should
    evaluate." Its researchers later found that
    <a href="https://www.ssa.gov/policy/docs/ssb/v71n4/v71n4p15.html"
      >showing people a break-even age</a
    >
    nudged them toward claiming about a year earlier than other framings
    did. The reduction for claiming early exists, as Social Security puts
    it, "to account for the longer time you receive benefits." What makes
    the decision personal is everything that average hides.
  </p>

  <h3>How likely you are to get there</h3>

  <p>
    A break-even at {ageText(vs6267.breakEvenAge)} is only interesting
    alongside the odds of living past it, and those odds are better than
    most people guess. Someone who has reached 62 is already past the
    causes of death that pull the overall life expectancy down. Social
    Security's own guide to
    <a href="https://www.ssa.gov/pubs/EN-05-10147.pdf"
      >when to start benefits</a
    >
    puts it this way: about one in three 65-year-olds today will live to at
    least 90, one in seven to at least 95, and a married couple at 65 has
    better than even odds that one of them lives past 90. Waiting is
    insurance against the case that costs the most, which is living a long
    time on a small check. The
    <a href="/guides/mortality">mortality guide</a> covers how this site's
    strategy tool turns that into probabilities for your own birth year and
    sex.
  </p>

  <h3>What your spouse inherits</h3>

  <p>
    When a married worker dies, the surviving spouse can step up to the
    worker's benefit, and the worker's claiming age sets how large that is.
    For this worker, a spouse would inherit {vs6270.survivorIfEarlier.string()}
    a month after a claim at 62, which is the
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0300615320"
      >floor of 82.5% of the full amount</a
    >
    that applies after an early claim;
    {vs6267.survivorIfLater.string()} after a claim at {fra.years()}; and
    {vs6270.survivorIfLater.string()} after a claim at 70, with the
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0300615702"
      >delayed credits carried over</a
    >. That difference lasts for the rest of the
    survivor's life, and for a couple where one spouse earned much more than
    the other it routinely outweighs the higher earner's own break-even. The
    <a href="/guides/survivor-benefits">survivor benefits guide</a> covers
    the rules.
  </p>

  <h3>Cost-of-living adjustments</h3>

  <p>
    The <a href="/guides/cola">annual adjustment</a> applies
    <a href="https://www.ssa.gov/policy/docs/statcomps/supplement/2024/apnc.html"
      >from age 62 whether or not you have claimed</a
    >, and it raises the early check and the
    delayed check by the same percentage. The dollar figures in the table
    will all be larger in practice, in the same proportion, so the
    break-even ages do not move. Inflation is not a reason to claim early.
  </p>

  <h3>What the early checks could earn</h3>

  <p>
    The comparison so far counts a dollar received at 62 the same as a
    dollar received at 85. If the early checks could be invested rather than
    spent, or if they let you leave savings invested instead of drawing them
    down, the money arriving earlier is worth more than its face value, and
    the break-even moves later. Here are the same three comparisons when
    the early checks earn a real return, meaning a return above inflation,
    at several rates:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Comparison</th>
        {#each DISCOUNT_RATES as rate}
          <th>{percent(rate)} real return</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each discounted as row}
        <tr>
          <td>{row.earlier.years()} vs. {row.later.years()}</td>
          {#each row.byRate as at}
            <td>{ageOrNever(at)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <p class="table-note">
    Break-even age at which the discounted value of the later claim's checks
    matches the earlier claim's. "Never" means it does not happen before age
    100.
  </p>

  <p>
    At the {percent(DISCOUNT_RATES[RATE_2])} real return a cautious
    portfolio might earn, each break-even slips two to three years. At
    {percent(DISCOUNT_RATES[RATE_4])} the case for waiting from 62 to 67
    needs you to reach {ageOrNever(d6267[RATE_4])}, and the case for waiting
    from 67 to 70 pushes into the late 80s. At
    {percent(DISCOUNT_RATES[RATE_6])}, a stock-market return with no bad
    years, waiting barely pays back within a normal lifespan. This is the
    one factor that leans toward claiming earlier, and it matters most for
    people who do not need the checks to live on. Two cautions: a return
    assumed in advance is not a return earned, and Social Security's larger
    check is inflation-adjusted and guaranteed for life, which no portfolio
    is. The <a href="/strategy">strategy optimizer</a> lets you set this
    rate yourself and see the effect on your own record.
  </p>

  <h3>Taxes and working</h3>

  <p>
    If you work before full retirement age, the
    <a href="/guides/earnings-test">earnings test</a> can withhold most or
    all of an early benefit, which makes the head start smaller than the
    table assumes. And a larger benefit later can be
    <a href="/guides/federal-taxes">taxed more heavily</a> if it lands on
    top of other retirement income. Neither changes the break-even arithmetic
    itself; both change what you actually keep.
  </p>

  <h3>Spousal benefits</h3>

  <p>
    A <a href="/guides/spousal-benefits">spousal benefit</a> on your record
    is figured from your full amount regardless of when you claim, and it
    does not grow with your delayed credits. If your spouse will collect
    mainly on your record while you are both alive, your waiting past full
    retirement age raises your own check but not theirs, and the spousal
    benefit cannot start until you file. That can argue for the higher
    earner claiming at full retirement age rather than 70, even though the
    survivor benefit argues the other way; the two have to be weighed
    together.
  </p>

  <h2>Claiming Later as Longevity Insurance</h2>

  <p>
    The break-even frame treats the claiming decision as a bet: wait, and
    you win if you live past the break-even age and lose if you do not.
    There is another way to see the same choice. Delaying your claim is
    buying insurance against living a long time, and insurance is not
    judged by whether you collect on it.
  </p>

  <p>
    Consider the four ways it can turn out. Claim early and die early, and
    you came out slightly ahead, though you are not around to enjoy it.
    Claim late and die early, and you gave up some checks you turned out not
    to need; your heirs are a little poorer. Claim early and live to 95,
    and you spend three decades on a check 30% smaller than it could have
    been, at exactly the ages when savings run thin and medical costs rise.
    Claim late and live to 95, and the larger check is there for all of it.
    The two outcomes where you live long are the ones that matter most to
    your standard of living, and delaying improves both of them. The two
    where you die early are the ones you will not experience. That asymmetry
    is the case for waiting, and the break-even age cannot see it.
  </p>

  <p>
    It also helps to see delaying as a purchase. Waiting from {fra.years()}
    to 70 costs this worker {vs6770.headStart.string()} in forgone checks
    and buys {vs6770.monthlyGain.string()} a month more for life, which is
    {payoutRate(vs6770)} of the price per year. Waiting from 62 to 70 costs
    {vs6270.headStart.string()} and buys {vs6270.monthlyGain.string()} a
    month, {payoutRate(vs6270)} a year. That income is adjusted for
    inflation every year, continues as long as you live, and passes to a
    surviving spouse. An insurance company selling an inflation-indexed
    income for life to a healthy 67-year-old charges considerably more for
    the same monthly amount, because it has to cover its costs and its own
    risk of you living long, and Social Security charges neither. For
    someone who already has enough to live on until 70, the forgone checks
    are the cheapest longevity insurance available.
  </p>

  <p>
    Insurance has a price, and the price here is real: the money is gone if
    you die at 72, and spending down savings to bridge the gap is
    uncomfortable even when it is the right call. But the question to ask
    is not whether you will live past 80. It is whether you could afford to
    be wrong in the other direction.
  </p>

  <h2>A Better Question Than Break-Even</h2>

  <p>
    The question the break-even age tries to answer is really: given how
    long I might live, and given what my spouse would be left with, which
    claiming age gives my household the most? That is a probability-weighted
    calculation across every possible lifespan, not a single crossover
    point. The <a href="/strategy">filing strategy optimizer</a> on this
    site does that calculation, using Social Security's own life tables for
    your birth year, an adjustment for your health, the survivor rules, and
    a discount rate for the time value of money. It reports the claiming
    ages with the highest expected lifetime value for one person or for a
    couple together, and shows how much each alternative gives up. If you
    have read this far, that is the right next page.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Find Your Own Numbers</h2>

  <p>
    Every figure above scales with the Primary Insurance Amount, so the
    break-even ages in the table apply to anyone whose full retirement age
    is {fra.years()}, whatever their benefit. For a different full
    retirement age, or to see the dollar amounts for your own record, paste
    your earnings history into the
    <a href="/calculator">ssa.tools calculator</a> and read the benefit at
    each claiming age from the
    <a href="/guides/filing-date-chart">filing date chart</a>.
  </p>

  <p>
    Related guides:
    <a href="/guides/delayed-retirement-credits">delayed retirement credits</a>,
    <a href="/guides/nra">normal retirement age</a>,
    <a href="/guides/survivor-benefits">survivor benefits</a>,
    <a href="/guides/mortality">mortality tables</a>, and
    <a href="/guides/strategy-vs-opensocialsecurity"
      >how this site's strategy tool compares with OpenSocialSecurity</a
    >.
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
