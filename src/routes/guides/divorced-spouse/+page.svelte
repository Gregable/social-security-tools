<script lang="ts">
import { GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const title = 'Social Security Benefits for Divorced Spouses: Eligibility, Rules & How to Claim';
const description =
  'Can you collect Social Security from your ex-spouse? Learn the divorced spouse benefit rules, including the 10-year marriage requirement, how benefits are calculated, and whether your ex needs to know.';
const publishDate = new Date('2026-01-18T00:00:00+00:00');
const updateDate = new Date('2026-01-18T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/divorced-spouse';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security calculator for divorced spouse benefits';
schema.tags = [
  'divorced spouse Social Security',
  'ex-spouse Social Security benefits',
  'Social Security after divorce',
  '10 year marriage rule',
  'divorced spouse benefit',
  'Social Security ex-husband',
  'Social Security ex-wife',
  'spousal benefits divorce',
];

const faqs = [
  {
    question: 'What if my ex-spouse remarried?',
    answer:
      "It doesn't matter. Your ex's marital status has no effect on your eligibility, and their new spouse can claim spousal benefits independently.",
  },
  {
    question: 'Can I receive divorced spouse benefits if I remarried?',
    answer:
      "Generally no, unless your later marriage ended through death, divorce, or annulment. Remarriage after age 60 (50 if disabled) doesn't block divorced spouse survivor benefits.",
  },
  {
    question: "Can I collect divorced spouse benefits if my ex hasn't filed yet?",
    answer:
      "Yes, as long as you've been divorced at least 2 years and your ex is at least 62.",
  },
  {
    question: 'What happens to my divorced spouse benefits if my ex-spouse dies?',
    answer:
      'You may switch to divorced spouse survivor benefits, worth up to 100% of their benefit rather than 50%.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/divorced-spouse" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Social Security Benefits for Divorced Spouses</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    If you were married for at least 10 years before divorcing, you may be able
    to collect a Social Security benefit based on your ex-spouse's earnings
    record, up to half of their full benefit. Your ex doesn't need to know, and
    it doesn't reduce their check.
  </p>

  <p>
    Divorce doesn't necessarily end your connection to Social Security benefits earned
    during your marriage. This guide walks through who qualifies, how the
    benefit is calculated, and how to apply.
  </p>

  <h2>Eligibility Requirements for Divorced Spouse Benefits</h2>

  <p>
    To qualify for Social Security benefits based on your ex-spouse's work record,
    you must meet all of the following requirements:
  </p>

  <div class="requirements-box">
    <h3>The Five Requirements</h3>
    <ol>
      <li>
        10-year marriage: Your marriage must have lasted at least 10 years,
        measured from the date of marriage to the date the divorce was
        finalized, even if you were separated before then.
      </li>
      <li>
        Currently unmarried: You must be currently unmarried. If you remarried
        but that marriage ended (through divorce, annulment, or death), you may
        regain eligibility.
      </li>
      <li>
        Age 62 or older: You must be at least 62 years old to claim divorced
        spouse retirement benefits.
      </li>
      <li>
        Ex-spouse eligible: Your ex-spouse must be entitled to Social Security
        retirement or disability benefits. They don't need to have filed yet
        (see below).
      </li>
      <li>
        Your own benefit is lower: If you're entitled to your own Social
        Security benefit, it must be less than what you'd receive as a divorced
        spouse. Social Security automatically pays you the higher amount.
      </li>
    </ol>
  </div>

  <h2>The 10-Year Marriage Rule Explained</h2>

  <p>
    The 10-year marriage requirement is the most common reason people don't
    qualify for divorced spouse benefits. Social Security counts from your
    wedding date to the date your divorce was legally finalized. The rule is
    strict: if your marriage lasted 9 years and 364 days, you don't qualify.
    If you're close to 10 years and considering divorce, when you finalize it
    matters.
  </p>

  <p>
    Periods of separation do not count against you. What matters is the legal duration
    of the marriage, not how long you lived together.
  </p>

  <h3>Multiple Marriages</h3>

  <p>
    If you were married multiple times, each lasting at least 10 years, you may
    have options. You can only receive benefits based on one ex-spouse's record at
    a time, but you can choose the one that provides the highest benefit.
  </p>

  <h2>How Divorced Spouse Benefits Are Calculated</h2>

  <p>
    The divorced spouse benefit is based on your ex-spouse's
    <a href="/guides/pia">Primary Insurance Amount (PIA)</a>, which is the benefit
    they would receive at their <a href="/guides/nra">Normal Retirement Age (NRA)</a>.
    The maximum divorced spouse benefit is 50% of your ex-spouse's PIA, which
    you'd receive if you claim at your own full retirement age. Claiming
    earlier reduces your benefit:
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Your Claiming Age</th>
        <th>Percentage of Maximum</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>62</td><td>32.5% - 35%*</td></tr>
      <tr><td>63</td><td>35% - 37.5%*</td></tr>
      <tr><td>64</td><td>37.5% - 41.7%*</td></tr>
      <tr><td>65</td><td>41.7% - 45.8%*</td></tr>
      <tr><td>66</td><td>45.8% - 50%*</td></tr>
      <tr><td>67 (NRA for those born 1960+)</td><td>50%</td></tr>
    </tbody>
  </table>

  <p class="table-note">
    *Exact percentage depends on your birth year and corresponding Normal Retirement Age.
  </p>

  <p>
    Unlike your own retirement benefit, divorced spouse benefits do not
    increase if you wait past your full retirement age. The maximum is always
    50% of your ex-spouse's PIA, so there's no advantage to delaying past your
    NRA.
  </p>

  <h3>Example Calculation</h3>

  <p>
    Say Alex was married to Chris for 15 years before divorcing. Chris's PIA is
    $2,400 per month, so Alex's divorced spouse benefit at NRA would be half of
    that, or $1,200. Alex's own PIA based on their work history is $900. Since
    the divorced spouse benefit is higher, Alex receives $1,200. If Alex claims
    at 62 instead, the divorced spouse benefit drops to roughly $840 per month
    (about a 30% reduction for early claiming).
  </p>

  <InlineCTA type="projectionlab" />

  <h2>Does My Ex-Spouse Know If I Claim Benefits?</h2>

  <p>
    Worried your ex will find out? They won't. Social Security doesn't notify
    them, doesn't need their consent, and doesn't touch their benefit. Your ex
    can't block or prevent your claim.
  </p>

  <p>
    The divorced spouse benefit is paid from Social Security's general trust fund,
    not deducted from your ex-spouse's payment. Their monthly check remains exactly
    the same whether you claim or not.
  </p>

  <h2>What If My Ex-Spouse Hasn't Filed Yet?</h2>

  <p>
    Under the independently entitled divorced spouse rule, you can claim
    benefits even if your ex-spouse hasn't filed for their own benefits, as
    long as:
  </p>

  <ul>
    <li>You have been divorced for at least 2 years</li>
    <li>Your ex-spouse is at least 62 years old</li>
    <li>Your ex-spouse is entitled to benefits (has enough work credits)</li>
  </ul>

  <p>
    This rule was created specifically to prevent an ex-spouse from deliberately
    delaying their filing to block their former spouse's benefits. Once the 2-year
    waiting period passes, you can file independently.
  </p>

  <h2>What If My Ex-Spouse Remarried?</h2>

  <p>
    Your ex-spouse's current marital status has no effect on your eligibility.
    You can claim even if they've remarried, even if their current spouse is
    also claiming spousal benefits, and even if other ex-spouses from 10+ year
    marriages are claiming too. Social Security allows unlimited divorced
    spouse beneficiaries on one worker's record. Each person's benefit is
    calculated independently, and none affects the others.
  </p>

  <h2>Can I Claim If I Remarried?</h2>

  <p>
    Generally, remarriage ends your eligibility for divorced spouse benefits,
    but there are exceptions. If your subsequent marriage ended through
    divorce, annulment, or your spouse's death, you may regain eligibility for
    benefits from your first ex-spouse (assuming the 10-year requirement was
    met). And if you remarry after age 60 (or age 50 if disabled), you can
    still receive divorced spouse <em>survivor</em> benefits if your ex-spouse
    has died.
  </p>

  <h2>Divorced Spouse Survivor Benefits</h2>

  <p>
    If your ex-spouse dies, you may be eligible for <a href="/guides/survivor-benefits">survivor benefits</a>,
    which are more generous than divorced spouse retirement benefits. The
    maximum survivor benefit is 100% of your ex-spouse's benefit, compared to
    50% while they were alive.
  </p>

  <h3>Survivor Benefit Requirements</h3>

  <ul>
    <li>Marriage lasted at least 10 years</li>
    <li>You are at least 60 years old (or 50 if disabled)</li>
    <li>You are unmarried, OR you remarried after age 60 (50 if disabled)</li>
  </ul>

  <p>
    Survivor benefits can be claimed as early as age 60, though claiming before
    your full retirement age results in a reduction. At age 60, you'd receive
    approximately 71.5% of the full survivor benefit.
  </p>

  <p>
    If you qualify for both your own retirement benefit and a divorced spouse
    survivor benefit, you may be able to claim one first and switch to the
    other later. See our
    <a href="/guides/survivor-benefits">survivor benefits guide</a> for
    claiming strategies.
  </p>

  <h2>Divorced Spouse Benefits vs. Your Own Benefits</h2>

  <p>
    If you're entitled to both your own retirement benefit and a divorced spouse
    benefit, Social Security effectively pays you the higher amount. Technically,
    you receive your own benefit first, and if the divorced spouse benefit is
    higher, you receive an additional amount to bring you up to that level.
    You cannot receive both benefits in full; it's always the higher of the two.
  </p>

  <p>
    Your own benefit might be the higher one if you had substantial earnings
    throughout your career, if your ex-spouse had relatively low lifetime
    earnings, or if you delay claiming past your full retirement age (your own
    benefit grows with delay, but the divorced spouse benefit doesn't).
  </p>

  <h2>How to Apply for Divorced Spouse Benefits</h2>

  <p>
    To apply for divorced spouse benefits, you'll need:
  </p>

  <ul>
    <li>Your ex-spouse's Social Security number (or enough information for SSA to locate their record)</li>
    <li>Your marriage certificate</li>
    <li>Your final divorce decree</li>
    <li>Proof of your age (birth certificate or passport)</li>
  </ul>

  <p>
    You can apply online at ssa.gov, by phone at 1-800-772-1213, or in person
    at your local Social Security office. In practice, divorced spouse claims
    often require a phone or in-person appointment, as the online system may
    not fully support them.
  </p>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    <h3>What if my ex-spouse remarried?</h3>
    <p>
      It doesn't matter. Your ex's marital status has no effect on your
      eligibility, and their new spouse can claim spousal benefits
      independently.
    </p>

    <h3>Can I receive divorced spouse benefits if I remarried?</h3>
    <p>
      Generally no, unless your later marriage ended through death, divorce, or
      annulment. Remarriage after age 60 (50 if disabled) doesn't block
      divorced spouse survivor benefits.
    </p>

    <h3>Can I collect divorced spouse benefits if my ex hasn't filed yet?</h3>
    <p>
      Yes, as long as you've been divorced at least 2 years and your ex is at
      least 62.
    </p>

    <h3>What happens to my divorced spouse benefits if my ex-spouse dies?</h3>
    <p>
      You may switch to divorced spouse survivor benefits, worth up to 100% of
      their benefit rather than 50%.
    </p>
  </div>

  <h2>Calculate Your Benefits</h2>

  <p>
    Use the <a href="/calculator">ssa.tools calculator</a> to estimate your own
    Social Security benefit based on your earnings record. If you know your ex-spouse's
    approximate benefit amount, you can compare to see whether your own benefit or
    the divorced spouse benefit would be higher.
  </p>

  <p>
    For a deeper understanding of how benefits are calculated, see our guides on
    <a href="/guides/pia">Primary Insurance Amount (PIA)</a> and
    <a href="/guides/spousal-benefit-filing-date">Spousal Benefits and Filing Dates</a>.
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

  .benefit-table {
    width: fit-content;
    max-width: 80%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .benefit-table th,
  .benefit-table td {
    padding: 10px 25px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .benefit-table th:first-child,
  .benefit-table td:first-child {
    text-align: right;
  }

  .benefit-table th {
    background-color: #e9ecef;
    font-weight: 600;
  }

  .benefit-table tbody tr:hover {
    background-color: #f5f5f5;
  }

  .table-note {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
    margin-top: -10px;
    text-align: center;
  }

  .faq h3 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  .faq p {
    margin-top: 0;
  }

  @media (max-width: 600px) {
    .benefit-table {
      font-size: 14px;
    }

    .benefit-table th,
    .benefit-table td {
      padding: 8px 10px;
    }
  }
</style>
