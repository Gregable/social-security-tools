<script lang="ts">
import {
  DIVORCED_EXAMPLE,
  divorcedRemarriage,
  REMARRIAGE_SAFE_AGE,
  WIDOW_EXAMPLE,
  widowRemarriage,
} from '$lib/remarriage-example';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import GuideByline from '../GuideByline.svelte';
import InlineCTA from '../InlineCTA.svelte';

const sponsorCopy: SponsorCopy = {
  intro:
    'A wedding date can decide which Social Security records you are allowed to draw on. You can talk your situation through with a Social Security specialist at',
  outro: 'before you set one.',
  bullets: [
    'They work out which of your records pays the most: your own, a former spouse, a late spouse, or the person you are marrying.',
    'They know the exceptions, such as marrying someone who is already on benefits, that keep a benefit from ending.',
    'The first call is free, and you pick the time.',
  ],
};

const title =
  'How Remarriage Affects Social Security Benefits: What Ends, What Continues, and the Age 60 Rule';
const description =
  'Getting remarried can end Social Security benefits paid on a former spouse, and before 60 it blocks survivor benefits on a late spouse. Your own retirement benefit and your children are not affected. The rules, the exceptions, and two worked examples.';
const publishDate = new Date('2026-11-11T00:00:00+00:00');
const updateDate = new Date('2026-11-11T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/remarriage';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt = 'How remarriage affects Social Security benefits';
schema.tags = [
  'remarriage social security benefits',
  'does remarriage affect social security',
  'remarry after 60 survivor benefits',
  'widow remarriage social security',
  'divorced spouse benefits remarriage',
  'lose social security if I remarry',
  'social security new spouse benefits',
];

const widow = widowRemarriage();
const divorced = divorcedRemarriage();
const safeAge = REMARRIAGE_SAFE_AGE;
const fra = widow.fullRetirementAge.years();

// The percentages and ages below are hand-written; re-read them each year
// alongside src/test/remarriage-example.test.ts.
const faqs: FAQItem[] = [
  {
    question: 'Will I lose my own Social Security if I remarry?',
    answer:
      'No. A retirement or disability benefit based on your own work record is never affected by marriage, divorce, or remarriage. Only benefits paid on someone else\'s record can change.',
  },
  {
    question: 'Can I remarry and keep my survivor benefits?',
    answer: `Yes, if you marry at ${safeAge} or later, or at 50 or later while you are disabled. A marriage before that age blocks widow's or widower's benefits on your late spouse for as long as the new marriage lasts, even after you turn ${safeAge}. If that marriage ends through death, divorce, or annulment, you can qualify again.`,
  },
  {
    question:
      'I collect on my ex-spouse\'s record. What happens if I remarry?',
    answer:
      'If your former spouse is living, the benefit paid on their record ends with the month before the month you marry. It continues only if the person you marry is entitled to certain benefits on someone else\'s record: widow\'s or widower\'s, mother\'s or father\'s, divorced spouse\'s, parent\'s, or childhood disability benefits. If your former spouse has died and you collect as a surviving divorced spouse, the age 60 rule for widows and widowers applies instead.',
  },
  {
    question: 'Does it matter if my ex-spouse remarries?',
    answer:
      'No. Your eligibility on a former spouse\'s record depends on your own marital status, not theirs. Their new spouse can also be paid on the same record without reducing your benefit.',
  },
  {
    question:
      'How long do I have to be married to collect on my new spouse\'s record?',
    answer:
      'Normally one year for spousal benefits and nine months for survivor benefits. Both waits are waived if you were entitled to benefits as a spouse, divorced spouse, widow, or widower in the month before the wedding, or would have been had you applied and been old enough. They are also waived if the two of you are the parents of a child together.',
  },
  {
    question:
      'Can I collect on my late spouse and my new spouse at the same time?',
    answer:
      'You can be eligible on both records, but you are paid only the largest benefit, not the sum. Marrying again never lets you stack benefits from two spouses.',
  },
  {
    question: 'How much can remarrying before 60 cost?',
    answer: `It depends on the records involved. In this guide's example, a widow whose late husband had a full benefit of ${WIDOW_EXAMPLE.lateSpousePia.wholeDollars()} a month and whose own is ${WIDOW_EXAMPLE.ownPia.wholeDollars()} is paid ${widow.survivorAtFra.wholeDollars()} a month at ${fra} if she marries at ${safeAge} or later and ${widow.marriedEarlyTotalAtFra.wholeDollars()} if she marries sooner, a difference of ${widow.annualCostAtFra.wholeDollars()} a year.`,
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/remarriage" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>How Remarriage Affects Social Security Benefits</h1>
  <GuideByline {publishDate} {updateDate} />

  <p>
    Whether getting married again changes your Social Security depends on
    one thing: whose work record your benefit is paid on. A benefit you
    earned yourself is yours whatever your marital status. A benefit paid on
    a former spouse's record, living or dead, comes with a condition about
    being unmarried, and the condition is different for each kind of
    benefit.
  </p>

  <p>
    This guide goes through each benefit in turn, says what the new marriage
    can add, and works two examples with real numbers: a widow deciding
    whether to marry before or after {safeAge}, and a divorced retiree paid
    on a former spouse's record. The figures are computed with the same
    code as the <a href="/calculator">ssa.tools calculator</a>.
  </p>

  <h2>At a Glance</h2>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">The benefit you receive</th>
        <th scope="col">If you remarry</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Retirement or disability on your own record</td>
        <td>No change</td>
      </tr>
      <tr>
        <td>Divorced spouse's benefit on a living former spouse</td>
        <td>
          Ends, unless your new spouse is on certain benefits. Can resume if
          the new marriage ends.
        </td>
      </tr>
      <tr>
        <td>
          Widow's or widower's benefit on a late spouse or late former spouse
        </td>
        <td>
          No change if you marry at {safeAge} or later (50 if disabled).
          Blocked while the marriage lasts if you marry sooner.
        </td>
      </tr>
      <tr>
        <td>
          Mother's or father's benefit for caring for a late spouse's child
        </td>
        <td>Ends, unless your new spouse receives Social Security</td>
      </tr>
      <tr>
        <td>Your children's benefits on a parent's record</td>
        <td>No change</td>
      </tr>
    </tbody>
  </table>

  <p>
    The reverse case is simpler. If your former spouse remarries, nothing
    happens to your benefit, whatever kind it is. The rules look only at
    your own marital status.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>Your Own Retirement or Disability Benefit</h2>

  <p>
    A benefit based on your own earnings does not depend on your marital
    status, so marrying, divorcing, or marrying again leaves it alone. This
    is true of retirement benefits and of Social Security Disability
    Insurance. If your own benefit is larger than anything you could be paid
    on a spouse's record, remarriage cannot cost you anything while you are
    both alive, though it can still change what you would be paid as a
    survivor.
  </p>

  <h2>Benefits on a Living Former Spouse's Record</h2>

  <p>
    If you were married for at least ten years, you can be paid a
    <a href="/guides/divorced-spouse">divorced spouse's benefit</a> of up to
    half your former spouse's full benefit. One of the requirements is that
    you are
    <a href="https://www.ecfr.gov/current/title-20/section-404.331"
      >not married</a
    >. When you marry, that benefit
    <a href="https://www.ecfr.gov/current/title-20/section-404.332"
      >ends with the month before the month of the wedding</a
    >.
  </p>

  <p>There are two ways it continues or comes back:</p>

  <ul>
    <li>
      <strong>Your new spouse is on certain benefits.</strong> The benefit
      does not end if the person you marry is entitled to
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0300202045"
        >widow's or widower's, mother's or father's, divorced spouse's,
        parent's, or childhood disability benefits</a
      >. Marrying someone who receives only a retirement benefit on their
      own record does not qualify.
    </li>
    <li>
      <strong>The new marriage ends.</strong> Once you are unmarried again,
      whether through death, divorce, or annulment, you meet the requirement
      again and can go back to your first former spouse's record.
    </li>
  </ul>

  <p>
    In exchange, you become eligible on your new spouse's record. Whether
    that is a good trade depends on how the two records compare.
  </p>

  <h3>Example: Dana, {DIVORCED_EXAMPLE.age}, paid on a former spouse's record</h3>

  <p>
    Dana's own full benefit is {DIVORCED_EXAMPLE.ownPia.wholeDollars()} a
    month. Her former husband's is
    {DIVORCED_EXAMPLE.formerSpousePia.wholeDollars()}, so at full retirement
    age she is paid up to half of his,
    {divorced.totalUnmarried.wholeDollars()}: her own
    {divorced.own.wholeDollars()} plus
    {divorced.formerSpouseTopUp.wholeDollars()} on his record. She is
    planning to marry Paul, whose full benefit is
    {DIVORCED_EXAMPLE.newSpousePia.wholeDollars()} and who has already
    claimed it.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th></th>
        <th scope="col">Unmarried</th>
        <th scope="col">Married to Paul</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Her own benefit</td>
        <td>{divorced.own.wholeDollars()}</td>
        <td>{divorced.own.wholeDollars()}</td>
      </tr>
      <tr>
        <td>Added on her former husband's record</td>
        <td>{divorced.formerSpouseTopUp.wholeDollars()}</td>
        <td>$0</td>
      </tr>
      <tr>
        <td>Added on Paul's record</td>
        <td>$0</td>
        <td>{divorced.newSpouseTopUp.wholeDollars()}</td>
      </tr>
      <tr>
        <td><strong>Monthly total</strong></td>
        <td><strong>{divorced.totalUnmarried.wholeDollars()}</strong></td>
        <td><strong>{divorced.totalRemarried.wholeDollars()}</strong></td>
      </tr>
    </tbody>
  </table>

  <p>
    Marrying Paul costs Dana {divorced.monthlyCost.wholeDollars()} a month.
    Half of Paul's benefit is less than half of her former husband's, and
    she can be paid on only one of them. Because she was receiving a
    divorced spouse's benefit before the wedding, she does not have to wait
    a year to be paid on Paul's record. Had Paul's benefit been the larger
    of the two, the marriage would have raised her check instead.
  </p>

  <p>
    The picture changes if Dana's former husband dies. She would then be a
    surviving divorced spouse, eligible for up to his full
    {divorced.survivorOnFormerSpouse.wholeDollars()}, and because she
    married Paul after {safeAge}, the marriage does not count against her.
    That is the rule the next section covers.
  </p>

  <h2>Survivor Benefits on a Late Spouse's Record</h2>

  <p>
    A widow or widower can be paid a
    <a href="/guides/survivor-benefits">survivor benefit</a> of up to the
    late spouse's full benefit, starting as early as {safeAge}. The same
    benefit is available on a late former spouse after a marriage of at
    least ten years. For both, the regulation says you must be
    <a href="https://www.ecfr.gov/current/title-20/section-404.335"
      >unmarried, unless you remarried after you became {safeAge}</a
    >.
  </p>

  <ul>
    <li>
      <strong>Marry at {safeAge} or later</strong> and the marriage is
      disregarded. You keep the survivor benefit if you are already
      receiving it and can still claim it if you are not.
    </li>
    <li>
      <strong>Marry before {safeAge}</strong> and you cannot be paid as a
      widow or widower on your late spouse while the new marriage lasts.
      Turning {safeAge} afterward does not help: what counts is your age on
      the wedding day.
    </li>
    <li>
      <strong>If that marriage ends</strong>, through death, divorce, or
      annulment, you can be
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0300207003"
        >entitled again from the month it ended</a
      >.
    </li>
    <li>
      <strong>If you are disabled</strong>, the age is 50. A marriage after
      50 is disregarded if you met the requirements for a disabled widow's
      or widower's benefit when you married.
    </li>
  </ul>

  <div class="callout">
    <h3>The day before your birthday counts</h3>
    <p>
      Social Security treats you as reaching an age on the day before your
      birthday. Its manual gives the example of a widow born on March 16,
      who can marry on March 15 of the year she turns {safeAge}, or any day
      after, and have the marriage disregarded. One day earlier and it is
      not.
    </p>
  </div>

  <h3>Example: Carol, {widow.ageNow}, deciding when to marry</h3>

  <p>
    Carol was born in {widow.birthYear}. Her husband died before claiming,
    with a full benefit of {WIDOW_EXAMPLE.lateSpousePia.wholeDollars()} a
    month. Her own full benefit is {WIDOW_EXAMPLE.ownPia.wholeDollars()}.
    She plans to marry Sam, who is her age and whose full benefit is
    {WIDOW_EXAMPLE.newSpousePia.wholeDollars()}. Her full retirement age is
    {fra} for both retirement and survivor benefits.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">What Carol can be paid each month</th>
        <th scope="col">Marries before {safeAge}</th>
        <th scope="col">Marries at {safeAge} or later</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>From {safeAge}: survivor benefit, claimed early</td>
        <td>Not available</td>
        <td>{widow.survivorAtSixty.wholeDollars()}</td>
      </tr>
      <tr>
        <td>From 62: her own benefit, claimed early</td>
        <td>{widow.ownAtSixtyTwo.wholeDollars()}</td>
        <td>{widow.ownAtSixtyTwo.wholeDollars()}</td>
      </tr>
      <tr>
        <td>At {fra}: her own benefit</td>
        <td>{widow.ownAtFra.wholeDollars()}</td>
        <td>{widow.ownAtFra.wholeDollars()}</td>
      </tr>
      <tr>
        <td>At {fra}: added on Sam's record</td>
        <td>{widow.newSpouseTopUpAtFra.wholeDollars()}</td>
        <td>{widow.newSpouseTopUpAtFra.wholeDollars()}</td>
      </tr>
      <tr>
        <td>At {fra}: survivor benefit</td>
        <td>Not available</td>
        <td>{widow.survivorAtFra.wholeDollars()}</td>
      </tr>
      <tr>
        <td><strong>The most she can be paid at {fra}</strong></td>
        <td><strong>{widow.marriedEarlyTotalAtFra.wholeDollars()}</strong></td>
        <td><strong>{widow.survivorAtFra.wholeDollars()}</strong></td>
      </tr>
    </tbody>
  </table>

  <p>
    The rows do not all add together. Her own benefit and the amount on
    Sam's record are paid together, but a survivor benefit replaces both
    rather than adding to them. If Carol marries before {safeAge}, the most she can be paid at
    {fra} is {widow.marriedEarlyTotalAtFra.wholeDollars()}, her own benefit
    brought up to half of Sam's. If she marries at {safeAge} or later, the
    survivor benefit of {widow.survivorAtFra.wholeDollars()} is still hers.
    The difference is {widow.monthlyCostAtFra.wholeDollars()} a month, or
    {widow.annualCostAtFra.wholeDollars()} a year, for as long as she and
    Sam are both alive.
  </p>

  <p>
    The gap opens earlier than {fra}. A survivor benefit can start at
    {safeAge}, two years before any retirement benefit. Married before
    {safeAge}, Carol has nothing to claim until 62. Married after, she could
    take {widow.survivorAtSixty.wholeDollars()} a month from {safeAge},
    which comes to
    {widow.survivorForgoneBeforeSixtyTwo.wholeDollars()} over those
    {widow.monthsBeforeOwnBenefit} months, though starting that early fixes
    the survivor benefit at the reduced amount. The
    <a href="/guides/survivor-benefits">survivor benefits guide</a> covers
    when to claim which benefit.
  </p>

  <p>
    If Sam dies first, Carol is unmarried again and can be paid as a widow
    on either husband's record, whichever is larger, regardless of when she
    married Sam.
  </p>

  <h2>Benefits for Caring for a Late Spouse's Child</h2>

  <p>
    A surviving parent of any age who is caring for the late worker's child
    under 16, or disabled, can be paid a mother's or father's benefit. It
    <a href="https://www.ecfr.gov/current/title-20/section-404.341"
      >ends when you remarry</a
    >, whatever your age, with one exception: it continues if the person you
    marry is entitled to Social Security benefits of nearly any kind,
    including an ordinary retirement or disability benefit. The child's own
    benefit is separate and is not affected.
  </p>

  <h2>Children's Benefits</h2>

  <p>
    A child's benefit on a parent's record, whether that parent is retired,
    disabled, or has died, does not depend on the other parent's marital
    status. Your remarriage does not end it. The details of who qualifies
    and for how much are in our guide to
    <a href="/guides/child-benefits">children's benefits</a>.
  </p>

  <p>
    A new marriage can add a record for the child. A stepchild can be paid
    on a stepparent's record once the marriage has
    <a href="https://www.ecfr.gov/current/title-20/section-404.357"
      >lasted a year</a
    >
    (nine months if the stepparent has died), provided the stepparent
    <a href="https://www.ecfr.gov/current/title-20/section-404.363"
      >supplies at least half the child's support</a
    >. A child eligible on two records is paid on the one that gives the
    higher benefit.
  </p>

  <p>
    A child's own marriage is a different matter. Benefits paid to a child,
    including an adult child disabled since before 22,
    <a href="https://www.ecfr.gov/current/title-20/section-404.352"
      >end when the child marries</a
    >, unless a disabled adult child marries another Social Security
    beneficiary.
  </p>

  <h2>What the New Marriage Adds</h2>

  <p>
    Marriage also opens your new spouse's record to you, and yours to them.
  </p>

  <ul>
    <li>
      <strong>Spousal benefits.</strong> Once your new spouse has claimed,
      you can be paid up to half their full benefit, less your own. The
      marriage must have
      <a href="https://www.ecfr.gov/current/title-20/section-404.330"
        >lasted one year</a
      >, unless you are the parents of a child together, or you were
      entitled to benefits as a spouse, divorced spouse, widow, or widower
      in the month before the wedding, or would have been had you applied
      and been old enough. Most people in this guide's situations meet that last
      exception and do not have to wait. See our guide to
      <a href="/guides/spousal-benefits">spousal benefits</a>.
    </li>
    <li>
      <strong>Survivor benefits.</strong> If your new spouse dies, you can be
      paid up to their full benefit as a widow or widower. The marriage must
      have lasted nine months, with the same exceptions and a few more, such
      as an accidental death.
    </li>
    <li>
      <strong>One benefit at a time.</strong> Being eligible on several
      records, your own, a late spouse's, and a new spouse's, does not mean
      being paid on all of them. You receive your own benefit plus whatever
      it takes to bring you up to
      <a href="https://www.ecfr.gov/current/title-20/section-404.407"
        >the largest of the others</a
      >.
    </li>
  </ul>

  <h2>Supplemental Security Income Is Different</h2>

  <p>
    Everything above concerns Social Security benefits, which are based on
    work records. Supplemental Security Income is a separate program based
    on need, and marriage affects it directly at any age: a spouse's
    <a href="https://www.ecfr.gov/current/title-20/section-416.1160"
      >income is counted</a
    >
    when your payment is figured, which can reduce or end it.
  </p>

  <h2>What to Do</h2>

  <ol>
    <li>
      Find out whose record each of your benefits is paid on. Your award
      letter or your online Social Security account will say. If all of it
      is on your own record, remarriage will not reduce it.
    </li>
    <li>
      If you are a widow, widower, or surviving divorced spouse under
      {safeAge}, compare your late spouse's benefit with what you would
      have without it. If the survivor benefit is the larger, a wedding on
      or after the day before your {safeAge}th birthday keeps it.
    </li>
    <li>
      If you are paid on a living former spouse's record, compare half of
      their full benefit with half of your intended spouse's. You will be
      paid on the new record, not the old one.
    </li>
    <li>
      Enter your own earnings record and your intended spouse's in the
      <a href="/calculator">calculator</a> to see the spousal and survivor
      amounts on the new record.
    </li>
    <li>
      Tell Social Security when you marry. A benefit paid for a month after
      it should have ended is an overpayment, which you will be asked to
      repay.
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
      <a href="https://www.ecfr.gov/current/title-20/section-404.330"
        >20 CFR 404.330: Who is entitled to wife's or husband's benefits</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.331"
        >20 CFR 404.331: Who is entitled to wife's or husband's benefits as a
        divorced spouse</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.332"
        >20 CFR 404.332: When wife's and husband's benefits begin and end</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.335"
        >20 CFR 404.335: How do I become entitled to widow's or widower's
        benefits?</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.336"
        >20 CFR 404.336: How do I become entitled to widow's or widower's
        benefits as a surviving divorced spouse?</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.341"
        >20 CFR 404.341: When mother's and father's benefits begin and end</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.352"
        >20 CFR 404.352: When does my entitlement to child's benefits begin
        and end?</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.357"
        >20 CFR 404.357: Who is the insured's stepchild?</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.407"
        >20 CFR 404.407: Reduction because of entitlement to other benefits</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0300202045"
        >SSA POMS RS 00202.045: Remarriage of a Divorced Spouse</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0300207003"
        >SSA POMS RS 00207.003: How Remarriage Affects Widow(er)'s Benefits</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0300202001"
        >SSA POMS RS 00202.001: Definitions and Requirements for Spouse
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
