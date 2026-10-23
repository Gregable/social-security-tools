<script lang="ts">
import { MAX_YEAR } from '$lib/constants';
import { MonthDuration } from '$lib/month-time';
import {
  costFreeMonths,
  EXAMPLE_PIA,
  exampleRetiree,
  MAX_RETROACTIVE_MONTHS,
  PAST_SEVENTY_EXAMPLE_AGE,
  type Payback,
  paybackRows,
  retroactiveChoice,
} from '$lib/retroactive-retirement-example';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const sponsorCopy: SponsorCopy = {
  intro:
    'Whether to take the back pay is a decision you make once, on the application, and cannot undo. You can talk it through with a Social Security specialist at',
  outro: 'before you choose a start month.',
  bullets: [
    'They weigh the lump sum against the smaller check for you and a surviving spouse, who inherits whichever amount you choose.',
    'They know how the January crediting rule and the tax on a lump sum change the picture for your filing month.',
    'The first call is free, and you pick the time.',
  ],
};

const title =
  'Retroactive Social Security Retirement Benefits: Six Months of Back Pay, and What It Costs';
const description =
  'Filing for Social Security after full retirement age? You can ask for up to six months of back pay, but every month you take back permanently lowers your check. How the six-month rule works, what the lump sum costs, when it is free, and how to decide.';
const publishDate = new Date('2026-10-22T00:00:00+00:00');
const updateDate = new Date('2026-10-22T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/retroactive-retirement-benefits';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security retroactive retirement benefits and back pay calculator';
schema.tags = [
  'retroactive social security benefits',
  'social security back pay retirement',
  'social security six months retroactive',
  'social security lump sum after full retirement age',
  'retroactive benefits delayed retirement credits',
  'how far back will social security pay',
  'social security month of election',
];

const age = (years: number, months = 0) =>
  MonthDuration.initFromYearsMonths({ years, months });

// One retiree and the filing ages the guide walks through.
const retiree = exampleRetiree();
const birthYear = retiree.birthdate.ssaBirthYear();
const fra = retiree.normalRetirementAge();
const sixMonthsPast = fra.add(new MonthDuration(MAX_RETROACTIVE_MONTHS));
const threeMonthsPast = fra.add(new MonthDuration(3));
const pastSeventy = PAST_SEVENTY_EXAMPLE_AGE;
// Filing six months past full retirement age and taking all six back.
const six = retroactiveChoice(retiree, sixMonthsPast, MAX_RETROACTIVE_MONTHS);
// Filing at 69 and taking six months back.
const at69 = retroactiveChoice(retiree, age(69), MAX_RETROACTIVE_MONTHS);
// Filing three months past full retirement age: only three are available.
const three = retroactiveChoice(
  retiree,
  threeMonthsPast,
  MAX_RETROACTIVE_MONTHS
);
// Filing past 70 and taking only the months back to 70, which are free.
const freeMonths = costFreeMonths(retiree, pastSeventy);
const at70 = retroactiveChoice(retiree, pastSeventy, freeMonths);
// Filing past 70 and reaching back before 70 anyway.
const at70TooFar = retroactiveChoice(
  retiree,
  pastSeventy,
  MAX_RETROACTIVE_MONTHS
);
const rows = paybackRows(retiree);

// A span of time in prose, e.g. "12 years and 6 months" or "14 years".
const durationText = (d: MonthDuration): string => {
  const years = d.years();
  const months = d.modMonths();
  const yearPart = `${years} ${years === 1 ? 'year' : 'years'}`;
  const monthPart = `${months} ${months === 1 ? 'month' : 'months'}`;
  if (months === 0) return yearPart;
  if (years === 0) return monthPart;
  return `${yearPart} and ${monthPart}`;
};
// An age in prose: whole years alone, otherwise years and months.
const ageText = (a: MonthDuration): string =>
  a.modMonths() === 0 ? `${a.years()}` : a.toYearsAndMonthsString();
const ageOrFree = (p: Payback | null): string =>
  p === null ? 'Never: the back pay is free' : ageText(p.age);
const monthsText = (n: number): string =>
  `${n} ${n === 1 ? 'month' : 'months'}`;

// The percentages below are hand-written for a two-thirds of one percent
// monthly credit and a full retirement age of 67; re-read them each year
// alongside src/test/retroactive-retirement-example.test.ts.
const faqs: FAQItem[] = [
  {
    question: 'How far back will Social Security pay retirement benefits?',
    answer:
      'Up to six months before the month you apply, but never for a month before you reached full retirement age. Before full retirement age there is no back pay at all: your benefit starts with the month you apply, or a later month you choose.',
  },
  {
    question: 'Does taking retroactive benefits lower my monthly check?',
    answer: `Yes, unless you are past 70. Every month of back pay is a month you are no longer counted as having delayed, and each one costs two-thirds of one percent of your full benefit for life. Six months of back pay means a check smaller by 4% of your full benefit, for life. For a full benefit of ${EXAMPLE_PIA.wholeDollars()}, that is ${six.monthlyCost.string()} less every month in exchange for ${six.lumpSum.string()} now.`,
  },
  {
    question: 'When is Social Security back pay free?',
    answer:
      'When the months you take back are all at or after age 70. Delayed retirement credits stop at 70, so filing at 70 and four months and asking for benefits back to the month you turned 70 costs nothing. Months before 70 always cost credits.',
  },
  {
    question: 'Is it better to take the lump sum or the higher monthly benefit?',
    answer: `It depends mostly on how long you expect to collect. The larger checks catch up with the lump sum after about ${durationText(six.payback?.time ?? new MonthDuration(0))} if your back pay reaches to full retirement age, and one month longer for each month your back pay starts after that. Someone filing at ${ageText(six.filingAge)} comes out ahead by declining the back pay if they live past ${ageText(six.payback?.age ?? six.filingAge)}. A surviving spouse inherits whichever monthly amount you choose, which usually tips the balance toward declining.`,
  },
  {
    question: 'Is a retroactive Social Security payment taxable?',
    answer:
      'It is taxed like any other Social Security benefit, in the year you receive it. If the back pay includes months from the previous year, IRS Publication 915 describes a lump-sum election that lets you figure the taxable part of that share using the earlier year\'s income, without amending that return.',
  },
  {
    question: 'Can I get back pay if I am under full retirement age?',
    answer:
      'Not in the ordinary case. Social Security does not pay retroactive retirement benefits for any month that would be paid at a reduced rate, and every month before full retirement age is reduced; the regulation has narrow exceptions, such as someone already entitled to disability benefits. If you contact Social Security and say you intend to file, that date is protected for six months while you complete the application, so a delay in the paperwork does not cost you the month.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link
    rel="canonical"
    href="https://ssa.tools/guides/retroactive-retirement-benefits"
  />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Retroactive Social Security Retirement Benefits</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    You are past full retirement age and finally filing for Social Security.
    Partway through the application comes a question that sounds like free
    money: do you want your benefits to begin six months ago? Say yes and a
    lump sum for those months arrives with your first check.
  </p>

  <p>
    It is not free. Every month of back pay is a month you are no longer
    credited with waiting, and waiting past full retirement age is what earns
    <a href="/guides/delayed-retirement-credits">delayed retirement credits</a
    >. Six months of back pay means a check smaller by 4% of your full
    benefit, for the rest of your life and for a surviving spouse after
    that. The trade can still be
    worth making. This guide explains the six-month rule, puts numbers on
    what the lump sum costs, shows the one case in which it costs nothing,
    and gives a simple way to decide. The figures are computed with the
    same code as the <a href="/calculator">ssa.tools calculator</a>.
  </p>

  <p>
    This guide is about your own retirement benefit. Back pay for a widow or
    widower follows different rules, covered in our guide to
    <a href="/guides/retroactive-survivor-benefits"
      >retroactive survivor benefits</a
    >.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>The Rule: Six Months, Never Before Full Retirement Age</h2>

  <p>
    Social Security can pay retirement benefits for up to six months before
    the month you apply. A second rule overrides the first: no month can be
    paid retroactively if paying it would reduce your benefit because of
    your age. Every month before
    <a href="/guides/nra">full retirement age</a> is a reduced month, so the
    back pay cannot reach further back than the month you reached that age.
    The regulation has narrow exceptions, for someone already entitled to
    disability benefits for example, but none that apply to an ordinary
    retirement claim.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">Your age when you apply</th>
        <th scope="col">Back pay available</th>
        <th scope="col">What it costs</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Before full retirement age</td>
        <td>None</td>
        <td></td>
      </tr>
      <tr>
        <td>Within six months after full retirement age</td>
        <td>Back to the month you reached full retirement age</td>
        <td>Two-thirds of 1% of your full benefit per month taken</td>
      </tr>
      <tr>
        <td>Six months after full retirement age to 70</td>
        <td>Up to 6 months</td>
        <td>Two-thirds of 1% of your full benefit per month taken</td>
      </tr>
      <tr>
        <td>Past 70</td>
        <td>Up to 6 months</td>
        <td>Nothing for months at or after 70; the usual cost for any month before</td>
      </tr>
    </tbody>
  </table>

  <p>
    The choice is yours. The application asks which month you want your
    benefits to begin, and that month, which Social Security calls your
    month of election, is written into your record. Choosing the month you
    apply, or any month in between, is as valid as choosing the earliest
    one.
  </p>

  <div class="callout">
    <h3>Where this comes from</h3>
    <p>
      The six-month limit and the bar on retroactive reduced months are in
      <a href="https://www.ecfr.gov/current/title-20/section-404.621"
        >20 CFR 404.621</a
      >, and Social Security's internal manual restates them in
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204030"
        >POMS GN 00204.030</a
      >. The credit for each month of delay, and the fact that no credit is
      earned for a month in which you receive a benefit, are in
      <a href="https://www.ecfr.gov/current/title-20/section-404.313"
        >20 CFR 404.313</a
      >.
    </p>
  </div>

  <h2>What the Back Pay Costs</h2>

  <p>
    Take a worker born in {birthYear}, reaching full retirement age,
    {fra.years()}, in {MAX_YEAR}, with a
    <a href="/guides/pia">Primary Insurance Amount</a> of
    {EXAMPLE_PIA.wholeDollars()}. They file at {ageText(six.filingAge)},
    six months past full retirement age. Social Security offers benefits
    starting at {ageText(six.startAge)} instead.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th></th>
        <th scope="col">Start at {ageText(six.filingAge)}</th>
        <th scope="col">Start at {ageText(six.startAge)}, with back pay</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Months of delayed credit</td>
        <td>{six.filingAge.subtract(fra).asMonths()}</td>
        <td>{six.startAge.subtract(fra).asMonths()}</td>
      </tr>
      <tr>
        <td>Monthly benefit</td>
        <td>{six.benefitWithoutBackPay.string()}</td>
        <td>{six.benefitWithBackPay.string()}</td>
      </tr>
      <tr>
        <td>Lump sum with the first check</td>
        <td>$0</td>
        <td>{six.lumpSum.string()} ({six.monthsBack} × {six.benefitWithBackPay.string()})</td>
      </tr>
    </tbody>
  </table>

  <p>
    Delayed retirement credits are
    <a href="https://www.ssa.gov/benefits/retirement/planner/delayret.html"
      >two-thirds of one percent of the full benefit for each month</a
    >
    of delay past full retirement age, 8% a year, for anyone born in 1943 or
    later. Six months of delay is worth 4%, which on
    {EXAMPLE_PIA.wholeDollars()} is {six.monthlyCost.string()} a month.
    Taking the back pay means giving those six months up. The worker gets
    {six.lumpSum.string()} now and {six.monthlyCost.string()} less in every
    check from then on.
  </p>

  <p>
    Dividing the lump sum by the monthly cost tells you how long the larger
    checks take to catch up: {six.lumpSum.string()} divided by
    {six.monthlyCost.string()} is {six.payback?.time.asMonths()} months,
    {durationText(six.payback?.time ?? new MonthDuration(0))} after filing,
    at age {ageOrFree(six.payback)}. Live past that and declining the back
    pay paid more in total; die before it and the lump sum did. It is the
    same arithmetic as the
    <a href="/guides/break-even-age">break-even age</a> for claiming later
    rather than earlier, in miniature. The figures are in today's dollars.
    In actual dollars the picture tilts a little each way: the
    <a href="/guides/cola">cost-of-living adjustment</a> raises the monthly
    gap every year while the lump sum is paid once, which brings the payback
    sooner, and anything the lump sum earns in the meantime pushes it later.
  </p>

  <p>
    The payback has a simple shape. Because the lump sum is paid at the rate
    for the backdated start, and the monthly cost is always two-thirds of
    one percent of the full benefit per month taken, the catch-up takes
    {six.payback?.time.asMonths()} months plus however many months past
    full retirement age the back pay starts. The later you file, the larger
    the lump sum, but the longer it takes the bigger checks to overtake it.
    One rule, covered below, is left out of these figures: credits earned in
    the year you file are not paid until the following January, which for a
    mid-year filer can push the real payback up to a year later.
  </p>

  <h2>Payback Age by Filing Age</h2>

  <p>
    Each row files at the age shown and takes the full six months of back
    pay, except the last, which files past 70 and takes only the months back
    to 70. Full retirement age is {fra.years()} and the full benefit is
    {EXAMPLE_PIA.wholeDollars()}.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">File at</th>
        <th scope="col">Back pay starts at</th>
        <th scope="col">Lump sum</th>
        <th scope="col">Monthly check without back pay</th>
        <th scope="col">Monthly check with back pay</th>
        <th scope="col">Declining pays more once you reach</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td>{ageText(row.filingAge)}</td>
          <td>{ageText(row.startAge)}</td>
          <td>{row.lumpSum.string()}</td>
          <td>{row.benefitWithoutBackPay.string()}</td>
          <td>{row.benefitWithBackPay.string()}</td>
          <td>{ageOrFree(row.payback)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <p>
    If you file less than six months after full retirement age, the window
    is shorter. Filing at {ageText(three.filingAge)}, the worker can go back
    only {monthsText(three.monthsBack)}, to {ageText(three.startAge)}: a lump
    sum of {three.lumpSum.string()} for a check {three.monthlyCost.string()}
    smaller, which the larger check repays by age
    {ageOrFree(three.payback)}.
  </p>

  <h2>When the Back Pay Is Free</h2>

  <p>
    Delayed retirement credits
    <a href="https://www.ecfr.gov/current/title-20/section-404.313"
      >stop at 70</a
    >. Every month you wait past 70 is a month of benefits lost for nothing,
    and retroactivity is how you get some of them back. Filing at
    {ageText(at70.filingAge)} and asking for benefits from the month you
    turned 70 pays {at70.lumpSum.string()} for those
    {monthsText(at70.monthsBack)}, and the monthly check is
    {at70.benefitWithBackPay.string()} either way.
  </p>

  <p>
    Do not reach back further than 70, even though the application allows
    it. The same worker asking for the full six months would start at
    {ageText(at70TooFar.startAge)}, two months before 70, and give up
    {at70TooFar.monthlyCost.string()} a month for life to collect two more
    months of back pay. More than six months past 70, the six-month limit
    means the earliest months are simply lost; nothing can recover them.
  </p>

  <p>
    If you are approaching 70 and have not filed, the practical lesson is
    that there is a six-month grace period after 70 but no grace at all
    before it. File in the month you turn 70, or within six months after and
    ask for the start month to be 70.
  </p>

  <h2>What Else the Choice Affects</h2>

  <h3>A surviving spouse inherits your choice</h3>

  <p>
    When you die, a widow or widower at their survivor full retirement age
    receives
    <a href="/guides/survivor-benefits">the benefit you were receiving</a>,
    delayed credits included. The {six.monthlyCost.string()} a month that
    the back pay costs in the example comes out of their check too, for as
    long as they live. For a couple, the payback age in the table is really
    measured against the longer of the two lifetimes, which makes the
    larger check easier to justify than it is for a single person.
  </p>

  <h3>Your spouse's benefit on your record</h3>

  <p>
    A <a href="/guides/spousal-benefits">spousal benefit</a> cannot begin
    before your own benefit does, so backdating your start also lets your
    spouse's start earlier, if they have applied. Spousal benefits do not
    earn delayed credits, so if your spouse is past their own full
    retirement age, those months add to their total without lowering their
    spousal amount. Two cautions: the backdated months must be at or after
    your spouse's own full retirement age too, and under deemed filing a
    spouse's application also covers their own retirement benefit, so if
    they have one, back pay costs them delayed credits on it just as it
    costs you.
  </p>

  <h3>The January crediting rule</h3>

  <p>
    Credits for months you delayed in the year you file are
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0300615690"
      >not added until the following January</a
    >. Someone filing in {ageText(six.filingAge)} in the middle of a year
    is paid at first on only the credits earned through the previous
    December, and the rest arrive as a raise in January. This makes the
    first few checks look closer to the back-pay figure than they really
    are; the full difference shows up after the January adjustment. In the
    example above, a worker who reached full retirement age in January and
    filed in July is paid {six.benefitWithBackPay.string()} either way until
    the next January, so the real payback comes about six months after the
    age in the table. Our guide to the
    <a href="/guides/delayed-january-bump">January bump</a> explains the
    quirk. It does not apply at 70, when all credits are paid at once.
  </p>

  <h3>Taxes on the lump sum</h3>

  <p>
    A lump sum of back pay is taxed like any other Social Security benefit,
    and it counts in the year you receive it, which can push more of your
    benefits into the <a href="/guides/federal-taxes">taxable range</a> for
    that year. Your SSA-1099 breaks out how much of the payment was for each
    earlier year, and
    <a href="https://www.irs.gov/publications/p915">IRS Publication 915</a>
    describes a lump-sum election that lets you figure the taxable part of
    the earlier year's share using that year's income, without amending the
    earlier return. You use it only if it lowers your tax.
  </p>

  <h3>The earnings test does not apply</h3>

  <p>
    Because no retroactive month can fall before full retirement age, the
    <a href="/guides/earnings-test">earnings test</a> never touches
    retirement back pay. You can have been working full time in every one of
    the retroactive months and still be paid for all of them.
  </p>

  <h2>Three Examples</h2>

  <p>
    Each example uses a full retirement age of {fra.years()} and a full
    benefit of {EXAMPLE_PIA.wholeDollars()} a month.
  </p>

  <h3>Marta, filing at {ageText(six.filingAge)}</h3>

  <p>
    Marta meant to file at {fra.years()} and let six months slip by. Social
    Security offers to start her benefit at {fra.years()}, with
    {six.lumpSum.string()} in back pay, at {six.benefitWithBackPay.string()}
    a month. Declining gives her {six.benefitWithoutBackPay.string()} a
    month and no lump sum. The {six.monthlyCost.string()} a month she gives
    up takes until age {ageOrFree(six.payback)} to add up to
    {six.lumpSum.string()}. Marta is in good health and her husband, who
    earned less, will rely on her record as a survivor. She declines the
    back pay.
  </p>

  <h3>Leon, filing at {ageText(at69.filingAge)}</h3>

  <p>
    Leon has been delaying on purpose and files at {ageText(at69.filingAge)}.
    The six months back to {ageText(at69.startAge)} pay
    {at69.lumpSum.string()} at {at69.benefitWithBackPay.string()} a month,
    against {at69.benefitWithoutBackPay.string()} a month with no back pay.
    The cost is the same {at69.monthlyCost.string()} a month as in Marta's
    case, but the lump sum is larger, so the payback stretches to age
    {ageOrFree(at69.payback)}. Leon is single, has a heart condition, and
    wants the cash to replace a roof. He takes it, understanding that he is
    trading 4% of his full benefit, for life, for a payment he can use now.
  </p>

  <h3>Grace, filing at {ageText(at70.filingAge)}</h3>

  <p>
    Grace planned to file at 70 and forgot until four months later. She asks
    for her benefit to begin in the month she turned 70, collects
    {at70.lumpSum.string()} for the {monthsText(at70.monthsBack)} she
    missed, and keeps the full {at70.benefitWithBackPay.string()} a month.
    The representative offers six months instead; she says no, because the
    two months before 70 would cost her {at70TooFar.monthlyCost.string()} a
    month for life.
  </p>

  <h2>What to Do</h2>

  <ol>
    <li>
      If you are under full retirement age, back pay is not available, so
      there is nothing to weigh; file for the month you actually want your
      benefit to start.
    </li>
    <li>
      If you are between full retirement age and 70, decide before you apply
      whether you want the lump sum or the larger check. Use the payback age
      above as a starting point, then ask whether a spouse will depend on
      your record and whether you need the cash now.
    </li>
    <li>
      If you are past 70, ask for your benefit to begin in the month you
      turned 70, and no earlier. If more than six months have passed, ask
      for the full six.
    </li>
    <li>
      If you cannot finish the application right away, contact Social
      Security and say you intend to file. Under
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204010"
        >POMS GN 00204.010</a
      >, that date is protected for six months while you complete the
      paperwork.
    </li>
    <li>
      Run your own figures in the
      <a href="/calculator">calculator</a>: set the filing date to the month
      you reached full retirement age and to the month you plan to file, and
      compare the two benefits. The difference is the monthly cost of the
      back pay.
    </li>
  </ol>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Sources</h2>

  <ul>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.621"
        >20 CFR 404.621: What happens if I file after the first month I meet
        the requirements for benefits?</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.313"
        >20 CFR 404.313: What are delayed retirement credits and how do they
        increase my old-age benefit amount?</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204030"
        >SSA POMS GN 00204.030: Retroactivity for Title II Benefits</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0300615690"
        >SSA POMS RS 00615.690: Delayed Retirement Credits</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204010"
        >SSA POMS GN 00204.010: Protective Filing</a
      >
    </li>
    <li>
      <a href="https://www.ssa.gov/benefits/retirement/planner/delayret.html"
        >SSA: Delayed Retirement Credits</a
      >
    </li>
    <li>
      <a href="https://www.irs.gov/publications/p915"
        >IRS Publication 915: Social Security and Equivalent Railroad
        Retirement Benefits</a
      >
    </li>
  </ul>

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

  .callout {
    background-color: #e8f4fd;
    border: 1px solid #4a90d9;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .callout h3 {
    margin-top: 0;
    color: #2a6db0;
  }

  .callout p {
    margin-bottom: 0;
  }
</style>
