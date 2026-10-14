<script lang="ts">
import {
  claimAgeComparison,
  EXAMPLE_PIA,
  exampleParent,
  familyPayout,
} from '$lib/child-benefit-example';
import { MAX_YEAR } from '$lib/constants';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const sponsorCopy: SponsorCopy = {
  intro:
    'Whether to claim early so your children can collect depends on your health, your work plans, and what your spouse would be left with. You can talk it through with a Social Security specialist at',
  outro: 'before you file.',
  bullets: [
    'They can run the family maximum for your record and show what each child would actually receive.',
    'They weigh the children’s checks against the permanent reduction and the survivor benefit your spouse would inherit.',
    'The first call is free, and you pick the time.',
  ],
};

const title =
  'Social Security Benefits for Children When a Parent Retires: Who Qualifies, How Much, and Whether to Claim Early';
const description =
  'If you retire while your children are under 18, each child can collect up to half your full benefit, and a spouse caring for them can too. Learn who qualifies, how the family maximum caps the total, when benefits end, and whether claiming at 62 for the kids pays off.';
const publishDate = new Date('2026-10-10T00:00:00+00:00');
const updateDate = new Date('2026-10-14T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/child-benefits';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security benefits for the children of a retired parent';
schema.tags = [
  'social security benefits for children',
  'social security child benefits',
  'can my child get social security when I retire',
  'dependent benefits social security retirement',
  'social security family maximum',
  'child in care spousal benefit',
  'claiming social security early with minor children',
];

// One parent, turning 62 this year with a round PIA, and the children who
// could collect on that record.
const parent = exampleParent();
const parentBirthYear = parent.birthdate.ssaBirthYear();
const fra = parent.normalRetirementAge();
const oneChild = familyPayout(parent, 1);
const twoChildren = familyPayout(parent, 2);
const threeOnRecord = familyPayout(parent, 3);
const bends = oneChild.bendPoints;

// The claim-early comparison follows two of those children.
const CHILD_AGES = [9, 12] as const;
const compare = claimAgeComparison(parent, CHILD_AGES);
// The same parent with a single child near the end of eligibility, for the
// paragraph on how much the children's ages matter.
const soleTeen = claimAgeComparison(parent, [16]);
const catchUpYears = compare.catchUpAge.years();
const catchUpMonths = compare.catchUpAge.modMonths();

const faqs: FAQItem[] = [
  {
    question: 'Can my children get Social Security when I retire?',
    answer:
      'Yes. Once you are receiving Social Security retirement benefits, each unmarried child under 18 can receive a monthly benefit on your record, as can a child who is 18 or 19 and still a full-time high school student, and an adult child whose disability began before 22. Biological, adopted, and dependent stepchildren all qualify, and in some cases a grandchild you are raising.',
  },
  {
    question: 'How much does a child receive?',
    answer:
      'Up to half of your Primary Insurance Amount, the benefit you would get at full retirement age. The total paid on one record is capped by the family maximum, usually 150% to 188% of your full benefit, so with two or more children each one receives less than the full half.',
  },
  {
    question:
      'Is my child’s benefit reduced because I claimed at 62?',
    answer:
      'No. Your own check is permanently reduced for claiming early, but a child’s benefit is figured from your full retirement age amount and is not reduced for your age. That is why claiming early can make financial sense for a parent with young children.',
  },
  {
    question: 'Can my spouse get benefits for taking care of our child?',
    answer:
      'Yes. A spouse of any age who is caring for your child under 16, or a disabled child, can receive a spousal benefit of up to half your full benefit with no reduction for the spouse’s own age. It shares the family maximum with the children and ends the month before the youngest child turns 16, unless the child is disabled.',
  },
  {
    question: 'Do my child’s benefits count as my income for taxes?',
    answer:
      'No. The benefits belong to the child even though you receive the money as the child’s payee, and the IRS says to count only your own benefits when figuring your taxes. The child’s benefits are taxable only if the child’s own income is high enough to cross the thresholds, which is rare for a minor.',
  },
  {
    question: 'When do my child’s benefits stop?',
    answer:
      'The month before the month your child turns 18, unless the child is still a full-time elementary or secondary school student, in which case benefits continue until graduation or two months after the child turns 19, whichever comes first. Benefits also stop if the child marries. A child whose disability began before 22 can continue to collect as an adult.',
  },
  {
    question: 'Can I apply for my child’s benefits online?',
    answer:
      'No. Social Security does not take applications for children’s benefits online. You apply by phone or at a local office and will need the child’s birth certificate and the Social Security numbers of the child and the parent whose record the child is claiming on.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/child-benefits" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Social Security Benefits for Children When a Parent Retires</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Most people picture Social Security as a check for a retiree, and maybe
    a smaller one for a spouse. Fewer know that a retiree with children at
    home gets a third kind of check: a monthly benefit for each child under
    18, worth up to half the parent's full benefit, that starts the month the
    parent's own benefit starts and stops when the child grows up.
  </p>

  <p>
    If you became a parent in your forties or later, adopted, are raising a
    grandchild, or have an adult child with a disability, this matters a
    great deal. Two children can add more to a household's monthly income
    than the parent's own early-retirement reduction takes away, and for a
    while that difference runs into six figures. It also turns the usual
    advice to wait on its head, because every year you delay with children
    under 18 is a year of their benefits that never gets paid.
  </p>

  <p>
    This guide covers who qualifies, how much each child receives and why the
    family maximum means it is often less than half, the benefit a spouse
    caring for the child can collect, what claiming at 62 for the children
    actually costs and earns, and the mechanics of applying. The dollar
    figures are computed with the same code as the
    <a href="/calculator">ssa.tools calculator</a>, so they reflect this
    year's Social Security figures.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>Who Qualifies</h2>

  <p>
    A child can receive benefits on your record once you are entitled to
    retirement benefits yourself. There is no way for the child to collect
    before you file. Three things have to be true of the child:
  </p>

  <ul>
    <li>
      <strong>Related to you in a way Social Security recognizes.</strong>
      A biological child, a legally adopted child, or a stepchild who has
      been your stepchild for at least a year and depends on you for at least
      half their support. A grandchild or step-grandchild can qualify if the
      child's parents are deceased or disabled, the child lives with you and
      has since before turning 18, and you provide at least half their
      support. The rules are in
      <a href="https://www.law.cornell.edu/cfr/text/20/404.354"
        >20 CFR 404.354</a
      >
      through 404.365.
    </li>
    <li>
      <strong>Unmarried.</strong> Marriage ends a child's benefit, with
      narrow exceptions for disabled adult children who marry another Social
      Security beneficiary.
    </li>
    <li>
      <strong>Young, a student, or disabled.</strong> Under 18; or 18 or 19
      and a full-time student at an elementary or secondary school, which
      includes high school but not college; or 18 or older with a disability
      that began before age 22.
    </li>
  </ul>

  <p>
    A child's own work does not disqualify them, and neither does the other
    parent's income. The requirements are listed in
    <a href="https://www.law.cornell.edu/cfr/text/20/404.350"
      >20 CFR 404.350</a
    >, and Social Security's plain-language summaries are on its
    <a href="https://www.ssa.gov/family/eligibility">family benefits page</a>
    and in the publication
    <a href="https://www.ssa.gov/pubs/EN-05-10085.pdf"
      >Benefits for Children</a
    >.
  </p>

  <h2>How Much a Child Receives</h2>

  <p>
    Each eligible child's benefit is 50% of your
    <a href="/guides/pia">Primary Insurance Amount</a>, the figure your own
    benefit would be if you claimed exactly at full retirement age. Two
    things about that sentence surprise people.
  </p>

  <p>
    First, it is half of your <em>full</em> benefit, not half of your
    check. If you claim at 62 your own benefit is permanently reduced, but
    your child's is not; a child's benefit has no age reduction because the
    child has no claiming age. The rule is in
    <a href="https://www.law.cornell.edu/cfr/text/20/404.353"
      >20 CFR 404.353</a
    >.
  </p>

  <p>
    Second, the half is a ceiling that most families with more than one
    child never reach, because of the family maximum.
  </p>

  <h3>The Family Maximum</h3>

  <p>
    Social Security caps the total it will pay each month on one worker's
    record. The cap is a formula on the Primary Insurance Amount, with bend
    points that move each year with average wages, much like the
    <a href="/guides/pia">benefit formula itself</a>. For a worker who turns
    62 in {MAX_YEAR}:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Slice of the Primary Insurance Amount</th>
        <th>Counts toward the maximum at</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Up to {bends.first.wholeDollars()}</td>
        <td>150%</td>
      </tr>
      <tr>
        <td>{bends.first.wholeDollars()} to {bends.second.wholeDollars()}</td>
        <td>272%</td>
      </tr>
      <tr>
        <td>{bends.second.wholeDollars()} to {bends.third.wholeDollars()}</td>
        <td>134%</td>
      </tr>
      <tr>
        <td>Above {bends.third.wholeDollars()}</td>
        <td>175%</td>
      </tr>
    </tbody>
  </table>

  <p class="table-note">
    Bend points from the
    <a href="https://www.ssa.gov/oact/cola/familymax.html"
      >family maximum formula</a
    >
    for {MAX_YEAR}. Once set at 62, the maximum rises with the same
    cost-of-living adjustments as the benefit.
  </p>

  <p>
    For a Primary Insurance Amount of {EXAMPLE_PIA.wholeDollars()}, the
    maximum works out to {oneChild.familyMaximum.string()} a month. Your own
    benefit is never reduced to fit under the cap; everyone else collecting
    on your record shares what is left, which here is
    {oneChild.auxiliaryPool.string()}. That pool is split equally among the
    children, and among a spouse collecting on your record too. Here is what
    each person receives as the record gets more crowded:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th>Collecting on the record</th>
        <th>Each child or spouse</th>
        <th>Family total per month</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>One child</td>
        <td>{oneChild.each.string()}</td>
        <td>{oneChild.familyTotal.string()}</td>
      </tr>
      <tr>
        <td>Two children</td>
        <td>{twoChildren.each.string()}</td>
        <td>{twoChildren.familyTotal.string()}</td>
      </tr>
      <tr>
        <td>Three children, or two children and a spouse</td>
        <td>{threeOnRecord.each.string()}</td>
        <td>{threeOnRecord.familyTotal.string()}</td>
      </tr>
    </tbody>
  </table>

  <p class="table-note">
    Family total includes the worker's own {EXAMPLE_PIA.wholeDollars()}
    benefit at full retirement age. Amounts are rounded down to the dime as
    Social Security does, before the final rounding to the dollar on each
    check.
  </p>

  <p>
    One child gets the full half, {oneChild.each.string()}, because the pool
    is bigger than that. With two children the pool is split, and each gets
    {twoChildren.each.string()} rather than {oneChild.each.string()}. With
    three people on the record the pool is split three ways and the family
    total does not rise at all: a third child, or a spouse joining the
    record, adds nothing to the household's monthly income and only
    redistributes it. A family at the maximum should know that before a
    spouse files, since in some cases the spouse's own retirement benefit
    would be worth more than a share of the pool.
  </p>

  <p>
    Two groups do not count against the maximum. A divorced spouse
    collecting on your record is paid outside it and never reduces what your
    current family receives, which Social Security states on its
    <a href="https://www.ssa.gov/family/amount">benefit amount page</a>. And
    your own benefit, as noted, is always paid in full.
  </p>

  <h2>A Spouse Caring for the Child</h2>

  <p>
    Ordinarily a spouse has to be 62 to collect a
    <a href="/guides/spousal-benefits">spousal benefit</a>, and claiming it
    before full retirement age reduces it. Both rules are waived for a spouse
    who has your child in their care. A spouse of any age who is caring for
    your child under 16, or your disabled child of any age, who is entitled
    to a child's benefit can collect the spousal benefit of up to half your
    Primary Insurance Amount with no reduction for their own age. The
    requirements are in
    <a href="https://www.law.cornell.edu/cfr/text/20/404.330"
      >20 CFR 404.330</a
    >.
  </p>

  <p>
    Three catches. The benefit shares the family maximum with the children,
    so as the table above shows, it may add nothing to the family total. It
    ends the month before the youngest child turns 16, two years before the child's
    own benefit does, and the spouse then waits until 62 to claim again, with
    the usual age reduction. And if the spouse is working, their own earnings
    are subject to the
    <a href="/guides/earnings-test">earnings test</a> before full retirement
    age, which can withhold the whole thing.
  </p>

  <h2>Should You Claim at 62 for the Children?</h2>

  <p>
    This is the question that brings most parents to this guide. Waiting
    past 62 raises your own check for life, which is why the usual advice is
    to wait. But a child's benefit is use-it-or-lose-it: it is paid only for
    the months after you file and before the child turns 18, and nothing you
    do later recovers the months you waited. The question is whether the
    children's checks in those years outweigh the permanent reduction in
    yours.
  </p>

  <p>
    Take a parent born in {parentBirthYear}, turning 62 in {MAX_YEAR} with a
    Primary Insurance Amount of {EXAMPLE_PIA.wholeDollars()} and two
    children aged {Math.min(...CHILD_AGES)} and {Math.max(...CHILD_AGES)}.
    Full retirement age is {fra.years()}. Compare claiming at 62 with
    waiting until then:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th></th>
        <th>Claim at 62</th>
        <th>Claim at {fra.years()}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Parent's own monthly benefit</td>
        <td>{compare.benefitAt62.string()}</td>
        <td>{compare.benefitAtFra.string()}</td>
      </tr>
      <tr>
        <td>Each child's monthly benefit while both are under 18</td>
        <td>{twoChildren.each.string()}</td>
        <td>{twoChildren.each.string()}</td>
      </tr>
      <tr>
        <td>Children's benefits paid between 62 and {fra.years()}</td>
        <td>{compare.childrenBeforeFra.string()}</td>
        <td>$0.00</td>
      </tr>
      <tr>
        <td>Parent's own benefits paid between 62 and {fra.years()}</td>
        <td>{compare.ownBeforeFra.string()}</td>
        <td>$0.00</td>
      </tr>
      <tr>
        <td>Family's lead at {fra.years()}</td>
        <td>{compare.leadAtFra.string()}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <p class="table-note">
    Nominal dollars, before cost-of-living adjustments and taxes. The parent
    is assumed to have stopped working, so the earnings test does not apply.
  </p>

  <p>
    The children's row is the same in both columns because a child's benefit
    is based on the full amount regardless of when the parent claims. What
    differs is how many months it is paid. Claiming at 62, the older child
    collects until age 18 at the parent's
    {compare.parentAgeWhenOldestTurns18.years()} and the younger until the
    parent's {compare.parentAgeWhenYoungestTurns18.years()}, for
    {compare.childrenTotal.string()} in total. Waiting until {fra.years()}
    forfeits every month before then, which is
    {compare.childrenBeforeFra.string()} of that, plus the parent's own
    {compare.ownBeforeFra.string()} of reduced checks.
  </p>

  <p>
    From {fra.years()} on, the children collect the same amounts either way,
    so the only remaining difference is the parent's check:
    {compare.monthlyReduction.string()} a month more for having waited. At
    that rate the larger check needs {compare.timeToCatchUp.asMonths()} months to make
    up the {compare.leadAtFra.string()} lead, which happens at age
    {catchUpYears} and {catchUpMonths} months. Most people will not collect
    that long, and an early claim comes out ahead for this family by a wide
    margin in raw dollars.
  </p>

  <p>
    That is unusually one-sided, and it is worth being clear about what
    tilts it and what the table leaves out:
  </p>

  <ul>
    <li>
      <strong>The children's ages do most of the work.</strong> Two children
      with {compare.childBenefitSpan.years()} and
      {compare.oldestChildBenefitSpan.years()} years of eligibility left are
      a strong case. For the same parent with one child who is already 16,
      the lead at {fra.years()} shrinks to {soleTeen.leadAtFra.string()}
      and the larger check catches up at age {soleTeen.catchUpAge.years()},
      which is close to a coin flip on dollars alone; health, the survivor
      benefit, and whether you are still working decide it. Run it for your
      own children's ages; the <a href="/calculator">calculator</a> gives you
      the Primary Insurance Amount to start from.
    </li>
    <li>
      <strong>Your spouse inherits less.</strong> A survivor benefit is
      normally the deceased worker's full benefit, but when the worker
      claimed early it is capped at the larger of the reduced check and
      82.5% of the Primary Insurance Amount. For this parent that is
      {compare.survivorIfClaimedAt62.string()} a month instead of
      {compare.survivorIfClaimedAtFra.string()}, for the rest of the
      surviving spouse's life. The
      <a href="/guides/survivor-benefits">survivor benefits guide</a> covers
      the rule. A spouse with a larger benefit of their own is unaffected.
    </li>
    <li>
      <strong>Working at 62 can erase the children's checks.</strong> Before
      full retirement age, the <a href="/guides/earnings-test">earnings test</a>
      withholds $1 of benefits for every $2 you earn over an annual limit,
      and the withholding comes out of the <em>total</em> paid on your record,
      children included, under
      <a href="https://www.law.cornell.edu/cfr/text/20/404.415"
        >20 CFR 404.415</a
      >. A parent with a full-time salary who claims at 62
      can have most of the family's benefits withheld for the year. The plan
      only works if you have actually stopped working or earn under the
      limit.
    </li>
    <li>
      <strong>Waiting to 70 is not in the table.</strong>
      <a href="/guides/delayed-retirement-credits">Delayed credits</a> would
      widen the gap in the monthly check further, and widen the lead that has
      to be made up by a corresponding amount. The shape of the answer does
      not change.
    </li>
    <li>
      <strong>Inflation and taxes are left out.</strong> Both columns rise
      with the same cost-of-living adjustments, so the comparison holds in
      real terms; taxes depend on your other income, and a
      <a href="/guides/federal-taxes">larger benefit is taxed more</a>.
    </li>
  </ul>

  <p>
    The <a href="/strategy">filing strategy optimizer</a> on this site does
    not yet model children's benefits, so it will recommend waiting for a
    parent in this position. Until it does, treat its answer as the
    no-children baseline and add the children's checks yourself using the
    figures above.
  </p>

  <h2>Adult Children With a Disability</h2>

  <p>
    A son or daughter whose disability began before age 22 can collect a
    child's benefit on your record at any age, for as long as the disability
    lasts and they remain unmarried. The amount is the same half of your
    Primary Insurance Amount, under the same family maximum, and it does not
    depend on the child ever having worked. Social Security calls this the
    disabled adult child benefit, and it is often larger than the
    Supplemental Security Income the child received before a parent retired.
    After two years of entitlement the child also qualifies for Medicare.
    For a family planning around a disabled child, this benefit is a reason
    to file as soon as the parent is eligible, since it is paid for the
    child's lifetime and the family maximum, not the parent's claiming age,
    sets its size.
  </p>

  <h2>When Benefits Start and Stop</h2>

  <p>
    A child's benefits begin the first month the child meets every
    requirement and an application is on file, but never before the month
    your own entitlement begins. If your benefit has already started and the
    child was eligible all along, Social Security can pay up to six months
    before the month you apply for the child, because a child's benefit
    carries no age reduction to protect.
  </p>

  <p>
    Benefits end with the month before the month the child turns 18, unless
    one of two things is true. A child who is still a full-time elementary
    or secondary school student keeps collecting until they graduate or until
    two months after the month they turn 19, whichever comes first; the
    school certifies attendance on a form Social Security sends before the
    18th birthday. A child whose disability began before 22 keeps collecting
    as described above. Marriage ends the benefit in either case. The rules
    are in
    <a href="https://www.law.cornell.edu/cfr/text/20/404.352"
      >20 CFR 404.352</a
    >.
  </p>

  <p>
    Your own choices can end the child's benefit too. If you suspend your
    retirement benefit after full retirement age to earn delayed credits,
    benefits to everyone on your record, children included, are suspended
    with it. And if you withdraw your application within the first year, any
    benefits the children received must be repaid along with your own.
  </p>

  <h2>How to Apply</h2>

  <p>
    Social Security does not offer an online application for a child's
    benefits. Call Social Security or make an appointment at a local office,
    ideally when you apply for your own benefit so both start together. You
    will need the child's birth certificate or other proof of birth or
    adoption, the child's Social Security number, and your own; a stepchild
    needs proof of your marriage to the child's parent, and a child born
    outside the United States needs proof of citizenship or lawful status.
    The list is on Social Security's page for
    <a href="https://www.ssa.gov/forms/ssa-4.html"
      >Form SSA-4, Application for Child's Insurance Benefits</a
    >. Benefits for a minor are paid to a representative payee, which for a
    child living with you is you, and are to be spent on the child's needs.
  </p>

  <p>
    If the child turns 18 while still in school, watch for the student
    certification form a few months before the birthday; benefits stop at
    18 if it is not returned.
  </p>

  <h2>Taxes on a Child's Benefits</h2>

  <p>
    Even though the money arrives in your account as payee, the benefits are
    the child's income, not yours. The IRS is explicit that you count only
    your own portion when figuring whether your benefits are taxable, even if
    the check for your child was made out in your name; see
    <a href="https://www.irs.gov/taxtopics/tc423">IRS Tax Topic 423</a>. The
    <a href="/guides/federal-taxes">federal taxation</a> thresholds are then
    applied to the child's own income, counting half the benefits plus any
    wages or investment income the child has. A minor with no other income is
    nowhere near the threshold, so in practice the benefits are untaxed, and
    nothing about them is added to your return.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Find Your Own Numbers</h2>

  <p>
    Everything above starts from the Primary Insurance Amount. Paste your
    earnings record into the <a href="/calculator">ssa.tools calculator</a>
    to see yours. Half of it is each child's starting point, and the
    bend-point table above gives the cap on the family total. If your
    children are young and
    you are no longer working, the comparison in this guide is likely to come
    out the same way for you; if a child is close to 18 or you plan to keep
    working, it may not.
  </p>

  <p>
    Related guides:
    <a href="/guides/spousal-benefits">spousal benefits</a>,
    <a href="/guides/survivor-benefits">survivor benefits</a>,
    <a href="/guides/earnings-test">earnings test</a>,
    <a href="/guides/pia">primary insurance amount</a>, and
    <a href="/guides/delayed-retirement-credits"
      >delayed retirement credits</a
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
