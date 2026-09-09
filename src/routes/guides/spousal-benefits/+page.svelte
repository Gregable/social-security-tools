<script lang="ts">
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';
import type { SponsorCopy } from '$lib/sponsor';

const title =
  'Social Security Spousal Benefits: Eligibility, How Much You Get, and When to Claim';
const description =
  'Can you get Social Security from your spouse? Learn who qualifies for spousal benefits, how the 50% rule really works, how filing age changes the amount, and whether you can claim if you never worked.';
const publishDate = new Date('2026-09-09T00:00:00+00:00');
const updateDate = new Date('2026-09-09T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/spousal-benefits';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt = 'Social Security calculator for spousal benefits';
schema.tags = [
  'spousal benefits Social Security',
  'Social Security spouse benefits',
  '50% spousal benefit',
  'Social Security if I never worked',
  'husband wife Social Security',
  'deemed filing',
  'spousal benefit age 62',
];

const sponsorCopy: SponsorCopy = {
  intro:
    'Spousal benefits mean two filing dates that have to work together. You can schedule a free call with a Social Security specialist at',
  outro: "to talk through how your claiming age and your spouse's fit together.",
  bullets: [
    "They look at both records side by side, including the survivor benefit that depends on the higher earner's choice.",
    "They cover what this guide can't, like taxes, pensions, and health.",
    'The first call is free, and you pick the time.',
  ],
};

const faqs: FAQItem[] = [
  {
    question: 'Can I get Social Security spousal benefits if I never worked?',
    answer:
      'Yes. Spousal benefits do not require any work history of your own. If you have been married at least one year, are at least 62, and your spouse is receiving retirement or disability benefits, you can receive up to 50% of their full retirement benefit. The amount is reduced if you claim before your own full retirement age.',
  },
  {
    question: "Is the spousal benefit 50% of my spouse's monthly check?",
    answer:
      "No. It is 50% of your spouse's Primary Insurance Amount, which is the benefit they would receive at their full retirement age. If your spouse filed early and receives less than their PIA, or delayed and receives more, your spousal benefit is still based on the PIA.",
  },
  {
    question: 'Can I claim spousal benefits before my spouse files?',
    answer:
      'No. You cannot receive spousal benefits until your spouse has filed for their own retirement or disability benefits. The one exception is for divorced spouses, who can claim on an ex-spouse who is eligible but has not filed, as long as the divorce was at least two years ago.',
  },
  {
    question: 'Can both spouses collect spousal benefits?',
    answer:
      'Not at the same time. Social Security pays each person their own retirement benefit first. Only the spouse whose own benefit is less than half of the other spouse\'s full benefit receives a spousal top-up. The higher earner never receives a spousal benefit.',
  },
  {
    question: 'Do spousal benefits increase if I wait past full retirement age?',
    answer:
      'No. Spousal benefits reach their maximum at your full retirement age and do not earn delayed retirement credits. Waiting past full retirement age to claim a spousal benefit only forfeits payments.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/spousal-benefits" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Social Security Spousal Benefits</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    If you are married, you may be able to collect a Social Security benefit
    based on your spouse's earnings record, worth up to half of their full
    retirement benefit. Your spouse must already be collecting their own
    benefit, and your spousal benefit does not reduce their check.
  </p>

  <p>
    This guide covers who qualifies, how the amount is calculated when you do
    and do not have your own work record, how claiming age changes it, and
    what happens in situations like remarriage or the death of your spouse.
  </p>

  <h2>Who Qualifies for Spousal Benefits</h2>

  <p>To receive benefits on your spouse's record, all of these must be true:</p>

  <div class="requirements-box">
    <h3>The Three Requirements</h3>
    <ol>
      <li>
        Married at least one year: Your marriage must have lasted at least one
        continuous year before you apply. There are two exceptions. The
        one-year rule is waived if you are the parent of your spouse's child,
        or if you were entitled to certain Social Security benefits in the
        month before you married.
      </li>
      <li>
        Age 62 or older: You must be at least 62. There is no age requirement
        if you are caring for your spouse's child who is under 16 or who has
        a disability that began before 22.
      </li>
      <li>
        Spouse already collecting: Your spouse must be receiving Social
        Security retirement or disability benefits. If they have not filed
        yet, you must wait until they do.
      </li>
    </ol>
  </div>

  <p>
    You do not need any work history of your own. Divorced spouses have a
    different set of rules, including a 10-year marriage requirement, covered
    in the <a href="/guides/divorced-spouse">divorced spouse benefits guide</a>.
  </p>

  <h2>How Much You Get</h2>

  <p>
    The full spousal benefit is 50% of your spouse's
    <a href="/guides/pia">Primary Insurance Amount (PIA)</a>. The PIA is the
    monthly benefit your spouse would receive at their
    <a href="/guides/nra">Normal Retirement Age</a>, which is 67 for anyone
    born in 1960 or later.
  </p>

  <p>
    This is not 50% of your spouse's actual check. If your spouse claimed at
    62 and receives a reduced benefit, your spousal benefit is still based on
    their full PIA. If they waited until 70 and earn
    <a href="/guides/delayed-retirement-credits">delayed retirement credits</a>,
    those credits do not increase your spousal benefit either.
  </p>

  <h3>Example Calculation</h3>

  <p>
    Alex has a PIA of $2,400. Alex's spouse Chris never worked outside the home.
    Both have a Normal Retirement Age of 67.
  </p>

  <ul>
    <li>Chris's full spousal benefit is 50% of $2,400, or $1,200 per month.</li>
    <li>
      If Alex claims at 62 and receives $1,680, Chris's spousal benefit is
      still $1,200 at 67.
    </li>
    <li>
      If Alex waits until 70 and receives $2,976, Chris's spousal benefit is
      still $1,200 at 67.
    </li>
  </ul>

  <p>
    Chris's amount depends on Chris's own claiming age, covered below, not on
    Alex's.
  </p>

  <h2>If You Have Your Own Work Record</h2>

  <p>
    Most people qualify for a retirement benefit on their own record. In that
    case Social Security does not pay you both benefits in full. It pays your
    own benefit first, then adds a spousal top-up only if half of your
    spouse's PIA is more than your own PIA.
  </p>

  <p>
    Using the same example, suppose Chris worked part time and has a PIA of
    $800. Half of Alex's PIA is $1,200, so Chris's spousal top-up is $1,200
    minus $800, or $400. At 67 Chris receives $800 from their own record plus
    $400 spousal, for a total of $1,200.
  </p>

  <p>
    If Chris's own PIA were $1,300, which is more than half of Alex's, Chris
    would receive no spousal benefit at all. Chris would simply collect their own
    $1,300.
  </p>

  <div class="callout">
    <h3>What if I never worked?</h3>
    <p>
      You still qualify. With no benefit of your own, the spousal benefit is
      the entire 50% of your spouse's PIA, reduced only if you claim before
      your Normal Retirement Age.
    </p>
  </div>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>How Claiming Age Changes the Amount</h2>

  <p>
    The 50% figure applies only if you claim at your Normal Retirement Age.
    Claiming earlier permanently reduces the spousal benefit. The reduction
    is 25/36 of 1% for each of the first 36 months before your Normal
    Retirement Age, and 5/12 of 1% for each month beyond that. That is
    steeper than the reduction on your own retirement benefit.
  </p>

  <table class="reduction-table">
    <thead>
      <tr>
        <th>Claiming age (NRA 67)</th>
        <th>Months early</th>
        <th>Share of full spousal benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>62</td><td>60</td><td>65.0%</td></tr>
      <tr><td>63</td><td>48</td><td>70.0%</td></tr>
      <tr><td>64</td><td>36</td><td>75.0%</td></tr>
      <tr><td>65</td><td>24</td><td>83.3%</td></tr>
      <tr><td>66</td><td>12</td><td>91.7%</td></tr>
      <tr><td>67</td><td>0</td><td>100%</td></tr>
    </tbody>
  </table>

  <p>
    When you have your own work record, each part is reduced by its own
    schedule. Chris's own $800 benefit claimed at 62 is reduced by 30% to $560.
    The $400 spousal top-up is reduced by 35% to $260. The total at 62 is
    $820, compared with $1,200 at 67.
  </p>

  <p>
    Waiting past Normal Retirement Age does not help. Spousal benefits do not
    earn delayed retirement credits, so the full spousal benefit is the
    maximum. If you are caring for your spouse's young or disabled child, the
    spousal benefit is not reduced for age at all.
  </p>

  <p>
    For charts showing how each spouse's filing date interacts with the
    other's, see
    <a href="/guides/spousal-benefit-filing-date">Spousal Benefits and Filing Dates</a>.
  </p>

  <h2>Deemed Filing: No Switching Later</h2>

  <p>
    You cannot claim a spousal benefit now and switch to your own larger
    benefit later. When you file for either benefit, Social Security treats
    you as filing for both. This rule, called deemed filing, applies to
    everyone born on or after January 2, 1954. Earlier birth years could file
    a restricted application for spousal benefits only, but everyone in that
    group is now past 70, so the strategy no longer exists in practice.
  </p>

  <p>
    Deemed filing does not apply if you receive spousal benefits because you
    are caring for a child, or if you receive Social Security disability
    benefits on your own record.
  </p>

  <h2>Working While Collecting Spousal Benefits</h2>

  <p>
    If you are under Normal Retirement Age and still working, the
    <a href="/guides/earnings-test">earnings test</a> applies to spousal
    benefits the same way it applies to retirement benefits. Earnings above
    the annual limit cause some of your benefit to be withheld until you
    reach Normal Retirement Age.
  </p>

  <p>
    The test also works in the other direction. If the spouse whose record
    you are claiming on is under Normal Retirement Age and earns above the
    limit, Social Security withholds benefits paid on their record, including
    yours.
  </p>

  <h2>When Your Spouse Dies</h2>

  <p>
    Spousal benefits end when your spouse dies. In their place you can
    receive a <a href="/guides/survivor-benefits">survivor benefit</a> of up
    to 100% of what your spouse was receiving, including any delayed
    retirement credits they earned. Survivor benefits can start as early as
    60, or 50 if you have a disability.
  </p>

  <p>
    This is one reason a higher earner may choose to delay. Delaying does
    nothing for the spousal benefit, but it raises the survivor benefit the
    lower earner will eventually receive.
  </p>

  <h2>Special Situations</h2>

  <h3>Remarriage</h3>
  <p>
    If you remarry, you can claim spousal benefits on your new spouse's
    record once the marriage has lasted one year. The one-year wait is waived
    only if you were entitled to certain benefits in the month before the
    marriage, such as spouse's, widow's or widower's, parent's, or childhood
    disability benefits. Receiving your own retirement benefit does not waive
    it.
  </p>

  <h3>Same-Sex and Common-Law Marriages</h3>
  <p>
    Social Security recognizes same-sex marriages in every state. Common-law
    marriages count if they were valid under the law of the state where they
    were established.
  </p>

  <h3>Family Maximum</h3>
  <p>
    Total benefits paid on one worker's record, including spousal and
    children's benefits, are capped by the family maximum, which is between
    150% and 188% of the worker's PIA. If children are also collecting, the
    spousal benefit may be reduced to stay under the cap. The worker's own
    benefit is never reduced.
  </p>

  <h3>Medicare</h3>
  <p>
    Your Medicare eligibility at 65 is separate from spousal benefits and is
    not affected by when you claim.
  </p>

  <h3>Cost-of-Living Adjustments</h3>
  <p>
    Spousal benefits receive the same annual
    <a href="/guides/inflation">cost-of-living adjustment</a> as retirement
    benefits.
  </p>

  <h2>How to Apply for Spousal Benefits</h2>

  <p>
    You can apply online at ssa.gov, by phone at 1-800-772-1213, or in person
    at a Social Security office. If you also qualify on your own record, one
    application covers both. Have these ready:
  </p>

  <ul>
    <li>Your marriage certificate</li>
    <li>Your birth certificate or other proof of age</li>
    <li>Your Social Security number and your spouse's</li>
    <li>Your bank account information for direct deposit</li>
  </ul>

  <p>
    If you apply after Normal Retirement Age, you can request up to six
    months of retroactive benefits. No retroactive benefits are paid for
    months before Normal Retirement Age, because those months would have
    carried an early-claiming reduction.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Calculate Your Benefits</h2>

  <p>
    The <a href="/calculator">SSA.tools calculator</a> models spousal benefits
    directly. Enter both spouses' earnings records and it shows each person's
    own benefit, the spousal top-up, and how the combined amount changes with
    every filing date. The
    <a href="/strategy">strategy optimizer</a> then finds the pair of filing
    dates that maximizes your expected lifetime benefits, including the
    survivor benefit that depends on the higher earner's choice.
  </p>

  <GuideFooter />
</div>

<style>
  .requirements-box {
    background-color: #fff3e0;
    border: 1px solid #ff9800;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .requirements-box h3 {
    margin-top: 0;
    color: #e65100;
  }

  .requirements-box ol {
    margin-bottom: 0;
  }

  .requirements-box li {
    margin-bottom: 1rem;
  }

  .requirements-box li:last-child {
    margin-bottom: 0;
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

  .reduction-table {
    width: fit-content;
    max-width: 80%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .reduction-table th,
  .reduction-table td {
    border: 1px solid #ccc;
    padding: 8px 16px;
    text-align: left;
  }

  .reduction-table th {
    background-color: #f5f5f5;
  }
</style>
