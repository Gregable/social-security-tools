<script lang="ts">
import {
  BENEFIT_TAXATION_THRESHOLDS,
  taxableBenefits,
} from '$lib/benefit-taxation';
import { Money } from '$lib/money';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';
import HeroImage from './taxes.jpg';
import TaxableBenefitsCalculator from './TaxableBenefitsCalculator.svelte';

// The worked example, computed so the prose and the calculator agree.
// benefit-taxation.test.ts pins every figure quoted below.
const exampleAgi = Money.from(30000);
const exampleInterest = Money.from(1200);
const exampleBenefits = Money.from(16000);
const single = taxableBenefits({
  status: 'single',
  agi: exampleAgi,
  taxExemptInterest: exampleInterest,
  benefits: exampleBenefits,
});
const joint = taxableBenefits({
  status: 'joint',
  agi: exampleAgi,
  taxExemptInterest: exampleInterest,
  benefits: exampleBenefits,
});
const thresholds = BENEFIT_TAXATION_THRESHOLDS;
const singleMiddleBand = thresholds.single.second
  .sub(thresholds.single.first)
  .times(0.5);
const jointMiddleBand = thresholds.joint.second
  .sub(thresholds.joint.first)
  .times(0.5);

// The tax torpedo: one more dollar of other income in the 85% band drags
// 85 cents of benefits into taxable income with it.
const torpedoExtra = Money.from(1000);
const torpedo = taxableBenefits({
  status: 'single',
  agi: exampleAgi.plus(torpedoExtra),
  taxExemptInterest: exampleInterest,
  benefits: exampleBenefits,
});
const torpedoBenefits = torpedo.taxable.sub(single.taxable);
const torpedoTaxable = torpedoExtra.plus(torpedoBenefits);
const percent = (share: number) => `${Math.round(share * 100)}%`;

/** Withholding rates Form W-4V allows. */
const W4V_RATES = [7, 10, 12, 22];

const sponsorCopy: SponsorCopy = {
  intro:
    'Provisional income is something you can steer, and your filing date is one of the levers. You can work through it with a Social Security specialist at',
  outro: 'to find the years this tax actually bites.',
  bullets: [
    'They look at how filing age, IRA withdrawals, and Roth conversions move you across the thresholds above.',
    'State tax and the new senior deduction stack on top of this, and the arithmetic differs by household.',
    'The first call is free, and you pick the time.',
  ],
};

const title = 'Federal Taxation of Social Security Benefits';
const description = `How much of your Social Security is taxable: the provisional income formula, the ${thresholds.single.first.wholeDollars()} and ${thresholds.single.second.wholeDollars()} thresholds, a calculator for your own numbers, the tax torpedo, and withholding with Form W-4V.`;
const publishDate = new Date('2022-12-04T00:00:00+00:00');
const updateDate = new Date('2026-10-31T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/federal-taxes';
schema.title = title;
schema.image = HeroImage;
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt = 'Tax forms laid atop some currency';
schema.tags = [
  'Social Security Taxes',
  'Federal Taxes',
  'provisional income',
  'taxable Social Security benefits',
  'Form W-4V',
  'tax torpedo',
  'Retirement Income',
  'Tax Planning',
];

const faqs: FAQItem[] = [
  {
    question: 'Is Social Security still taxed after age 70?',
    answer:
      'Yes. Age never matters; only your provisional income does. A retiree at 85 with a pension and investment income pays tax on benefits under the same formula as one at 63.',
  },
  {
    question: 'Are the income thresholds adjusted for inflation?',
    answer: `No. The ${thresholds.single.first.wholeDollars()} and ${thresholds.joint.first.wholeDollars()} thresholds were set in 1984 and the ${thresholds.single.second.wholeDollars()} and ${thresholds.joint.second.wholeDollars()} thresholds in 1994, and neither has moved since. Each year more retirees cross them as incomes and benefits rise.`,
  },
  {
    question: 'Does the new senior deduction mean Social Security is tax-free?',
    answer:
      'No. The deduction for taxpayers 65 and older, worth up to $6,000 a year for 2025 through 2028, lowers taxable income after the taxable share of benefits is figured. It can bring the tax owed to zero, but the share of benefits counted as income is unchanged.',
  },
  {
    question: 'Can I have federal tax withheld from my Social Security checks?',
    answer: `Yes. File Form W-4V with Social Security to have ${W4V_RATES.slice(0, -1).join('%, ')}%, or ${W4V_RATES[W4V_RATES.length - 1]}% of each payment withheld. Nothing is withheld unless you ask.`,
  },
  {
    question: 'Which benefits count?',
    answer:
      'Every Social Security payment counts: retirement, spousal, survivor, and disability benefits, plus any lump-sum back payment received in the year. Supplemental Security Income does not count. Use box 5 of your SSA-1099.',
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

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="302"
      alt="Clipart depicting a tax form"
    />
  </figure>

  <p>
    Up to 85% of your Social Security benefits can count as taxable income on
    your federal return. Whether any of it does, and how much, depends on one
    number: your <strong>provisional income</strong>, which is your other
    income plus half of your benefits. Below a threshold none of your benefits
    are taxed; above a second threshold most of them are.
  </p>

  <p>
    The thresholds were
    <a href="https://www.ssa.gov/history/taxationofbenefits.html"
      >set in 1984 and 1994</a
    > and have never been adjusted for inflation, so each year more retirees
    cross them. This guide walks through the formula with a worked example,
    lets you apply it to your own numbers, and covers the two things people
    most often miss: the way an extra dollar of income can be taxed almost
    twice over, and how to have tax withheld from your checks.
  </p>

  <h2>The Three Numbers You Need</h2>

  <p>
    <strong>Adjusted gross income before Social Security.</strong> This is
    line 11 of
    <a href="https://www.irs.gov/pub/irs-pdf/f1040.pdf">Form 1040</a>, minus
    the taxable benefits on line 6b. It includes wages, pensions, IRA and
    401(k) withdrawals, interest, dividends, and capital gains, after
    adjustments such as deductible IRA contributions. Leave Social Security
    out: the formula adds half of it back in the next step.
  </p>

  <p>
    <strong>Tax-exempt interest.</strong> Interest that is free of federal
    tax, mostly from municipal bonds, reported on line 2a of Form 1040. It is
    not part of adjusted gross income, but it counts here.
  </p>

  <p>
    <strong>Social Security benefits.</strong> Everything Social Security paid
    you in the year, before any Medicare premiums or withholding were taken
    out. It is box 5 of the SSA-1099 you receive each January, and it includes
    spousal, survivor, and disability benefits.
  </p>

  <h2>Provisional Income</h2>

  <p>
    Add the three together, counting only
    <a href="https://www.ssa.gov/faqs/en/questions/KA-02471.html"
      >half of your benefits</a
    >:
  </p>

  <pre>
Provisional income = Adjusted gross income before Social Security
                   + Tax-exempt interest
                   + Half of your Social Security benefits
  </pre>

  <p>
    Take someone with {exampleAgi.wholeDollars()} of adjusted gross income,
    {exampleInterest.wholeDollars()} of tax-exempt interest, and
    {exampleBenefits.wholeDollars()} of Social Security. Their provisional
    income is {exampleAgi.wholeDollars()} + {exampleInterest.wholeDollars()} +
    {exampleBenefits.times(0.5).wholeDollars()} =
    <strong>{single.provisionalIncome.wholeDollars()}</strong>.
  </p>

  <TaxableBenefitsCalculator
    status="single"
    agi={exampleAgi.value()}
    taxExemptInterest={exampleInterest.value()}
    benefits={exampleBenefits.value()}
  />

  <h2>How Much Is Taxable</h2>

  <p>
    Provisional income is compared with two thresholds that depend on your
    filing status:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Filing status</th>
        <th>Up to half taxable above</th>
        <th>Up to 85% taxable above</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Single, head of household, qualifying surviving spouse</td>
        <td>{thresholds.single.first.wholeDollars()}</td>
        <td>{thresholds.single.second.wholeDollars()}</td>
      </tr>
      <tr>
        <td>Married filing jointly</td>
        <td>{thresholds.joint.first.wholeDollars()}</td>
        <td>{thresholds.joint.second.wholeDollars()}</td>
      </tr>
      <tr>
        <td>Married filing separately, lived with spouse</td>
        <td>$0</td>
        <td>$0</td>
      </tr>
    </tbody>
  </table>

  <p>
    <strong>At or below the first threshold,</strong> none of your benefits
    are taxable.
  </p>

  <p>
    <strong>Between the two thresholds,</strong> half of the amount over the
    first threshold is taxable, but never more than half of your benefits.
    On a joint return, the example above lands here:
    {joint.provisionalIncome.wholeDollars()} is
    {joint.provisionalIncome.sub(thresholds.joint.first).wholeDollars()} over
    {thresholds.joint.first.wholeDollars()}, so
    <strong>{joint.taxable.wholeDollars()}</strong> of the
    {exampleBenefits.wholeDollars()} is taxable, which is
    {percent(joint.taxableShare)}.
  </p>

  <p>
    <strong>Above the second threshold,</strong> 85% of the amount over it is
    taxable, plus the whole middle band at half: {singleMiddleBand.wholeDollars()}
    for a single filer or {jointMiddleBand.wholeDollars()} on a joint return
    (or half of your benefits, if that is less). The total is capped at
    <a href="https://www.ssa.gov/faqs/en/questions/KA-02471.html"
      >85% of your benefits</a
    >. As a single filer, the example lands here:
    {single.provisionalIncome.wholeDollars()} is
    {single.provisionalIncome.sub(thresholds.single.second).wholeDollars()}
    over {thresholds.single.second.wholeDollars()}; 85% of that is
    {single.provisionalIncome
      .sub(thresholds.single.second)
      .times(0.85)
      .wholeDollars()}, plus {singleMiddleBand.wholeDollars()} for the middle
    band, so
    <strong>{single.taxable.wholeDollars()}</strong> is taxable, which is
    {percent(single.taxableShare)} of the benefits and under the
    {single.maximumTaxable.wholeDollars()} cap.
  </p>

  <p>
    The taxable amount goes on line 6b of Form 1040 and is taxed at your
    ordinary rates along with everything else. The formula says how much of
    your benefit counts as income, not what rate it is taxed at, and for
    many retirees the standard deduction absorbs all of it. The IRS's
    <a href="https://www.irs.gov/publications/p915">Publication 915</a>
    has the official worksheet.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>The Tax Torpedo</h2>

  <p>
    Inside the phase-in range, every extra dollar of other income does double
    duty. It is taxable itself, and it raises your provisional income, which
    pulls more of your benefits into taxable income too. Above the second
    threshold each extra dollar drags in 85 cents of benefits, so taxable
    income rises by $1.85. In the 12% bracket that extra dollar is taxed at
    22.2%; in the 22% bracket, at 40.7%.
  </p>

  <p>
    The example shows it. Raising the single filer's other income from
    {exampleAgi.wholeDollars()} to {exampleAgi.plus(torpedoExtra).wholeDollars()}
    lifts the taxable share of benefits from {single.taxable.wholeDollars()} to
    {torpedo.taxable.wholeDollars()}, so {torpedoExtra.wholeDollars()} of
    extra income adds <strong>{torpedoTaxable.wholeDollars()}</strong> to
    taxable income.
  </p>

  <p>
    The torpedo runs out once 85% of your benefits are already counted, after
    which each dollar is taxed once again. It matters most for people with
    moderate income who can choose when to draw it: a Roth conversion or a
    large IRA withdrawal taken in a year before you claim avoids it entirely,
    and spreading withdrawals across years can keep provisional income under
    a threshold. The <a href="/guides/senior-tax-deduction">senior deduction</a>
    lowers the tax on the result but does not change the formula.
  </p>

  <h2>Having Tax Withheld from Your Checks</h2>

  <p>
    Social Security withholds nothing by default, so the tax on your benefits
    is due with your return unless you arrange for it. There are two ways.
    You can make quarterly estimated payments to the IRS, or you can ask
    Social Security to withhold a flat share of each payment by filing
    <a href="https://www.irs.gov/forms-pubs/about-form-w-4-v">Form W-4V</a>.
    The form allows only four rates:
    {W4V_RATES.slice(0, -1).join('%, ')}%, or
    {W4V_RATES[W4V_RATES.length - 1]}% of each payment. Pick the one closest
    to the share you expect to owe; a rough guide is your tax bracket times the
    share of benefits that is taxable. You can change or stop it later with
    another W-4V.
  </p>

  <h2>State Taxes</h2>

  <p>
    Most states do not tax Social Security benefits, but a few do, each with
    its own exemptions. See
    <a href="/guides/state-taxes">State Taxes on Social Security Benefits</a>
    for the full list.
  </p>

  <h2>The Senior Deduction, 2025 Through 2028</h2>

  <p>
    The One Big Beautiful Bill Act created an additional deduction for
    taxpayers age 65 and older, worth up to $6,000 a year for tax years 2025
    through 2028. It does not change the provisional income formula above,
    but it reduces taxable income after the taxable share of benefits is
    figured, and for many retirees that brings the tax owed on benefits to
    zero. See the
    <a href="/guides/senior-tax-deduction">Senior Tax Deduction guide</a> for
    the income phase-outs and planning details.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Additional Resources</h2>

  <ul>
    <li>
      <a href="https://www.irs.gov/publications/p915"
        >IRS Publication 915: Social Security and Equivalent Railroad
        Retirement Benefits</a
      >
    </li>
    <li>
      <a href="https://www.irs.gov/forms-pubs/about-form-w-4-v"
        >IRS Form W-4V: Voluntary Withholding Request</a
      >
    </li>
    <li>
      <a href="https://www.ssa.gov/faqs/en/questions/KA-02471.html"
        >Social Security Administration: Must I pay taxes on Social Security
        benefits?</a
      >
    </li>
    <li>
      <a href="https://www.ssa.gov/history/taxationofbenefits.html"
        >Social Security Administration: Social Security History, Taxation of
        Benefits</a
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
</style>
