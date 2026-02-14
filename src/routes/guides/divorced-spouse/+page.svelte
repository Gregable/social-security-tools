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
    question: 'Can I collect Social Security from my ex-spouse?',
    answer:
      'Yes, if your marriage lasted at least 10 years, you are currently unmarried (or remarried after age 60), you are at least 62 years old, and your ex-spouse is entitled to Social Security benefits. You can receive up to 50% of your ex-spouse\'s benefit amount.',
  },
  {
    question: 'Does my ex-spouse need to know I\'m claiming benefits on their record?',
    answer:
      'No. The Social Security Administration does not notify your ex-spouse when you claim divorced spouse benefits. Your claim is completely confidential and has no effect on their benefit amount.',
  },
  {
    question: 'Will claiming divorced spouse benefits reduce my ex\'s Social Security?',
    answer:
      'No. Your divorced spouse benefit is paid from Social Security\'s general funds, not from your ex-spouse\'s benefit. Their monthly payment remains exactly the same regardless of whether you claim.',
  },
  {
    question: 'What if my ex-spouse remarried?',
    answer:
      'Your ex-spouse\'s marital status does not affect your eligibility. You can still claim divorced spouse benefits even if your ex has remarried. Their new spouse can also claim spousal benefits independently.',
  },
  {
    question: 'Can I receive divorced spouse benefits if I remarried?',
    answer:
      'Generally no, unless your subsequent marriage ended through death, divorce, or annulment. However, if you remarry after age 60 (or age 50 if disabled), you can still receive divorced spouse survivor benefits.',
  },
  {
    question: 'What is the 10-year marriage rule for Social Security?',
    answer:
      'To qualify for divorced spouse benefits, your marriage must have lasted at least 10 years. This is measured from the date of marriage to the date the divorce was finalized. Even one day short of 10 years disqualifies you.',
  },
  {
    question: 'Can I collect divorced spouse benefits if my ex hasn\'t filed yet?',
    answer:
      'Yes, under the independently entitled divorced spouse rule. If you have been divorced for at least 2 years and your ex-spouse is at least 62, you can claim benefits even if they haven\'t filed. This prevents an ex from deliberately delaying to block your benefits.',
  },
  {
    question: 'What happens to my divorced spouse benefits if my ex-spouse dies?',
    answer:
      'You may be eligible for divorced spouse survivor benefits, which can be up to 100% of your ex-spouse\'s benefit amount (compared to 50% while they were alive). You must have been married for at least 10 years and be at least 60 years old (or 50 if disabled).',
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
    <strong>Can I collect Social Security from my ex-husband or ex-wife?</strong> Yes,
    you may be entitled to divorced spouse benefits worth up to <strong>50% of your
    ex-spouse's benefit amount</strong>, even if they've remarried and even without
    their knowledge or consent.
  </p>

  <p>
    Divorce doesn't necessarily end your connection to Social Security benefits earned
    during your marriage. If you were married for at least 10 years, you may have
    valuable benefit options that many people don't know about.
  </p>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>You can receive up to <strong>50%</strong> of your ex-spouse's full retirement benefit</li>
      <li>Your marriage must have lasted at least <strong>10 years</strong></li>
      <li>You must be <strong>currently unmarried</strong> (with some exceptions)</li>
      <li>Your ex-spouse's benefit is <strong>not reduced</strong> by your claim</li>
      <li>Your ex-spouse is <strong>not notified</strong> when you claim</li>
      <li>If your ex dies, you may receive up to <strong>100%</strong> as a survivor benefit</li>
    </ul>
  </div>

  <h2>Eligibility Requirements for Divorced Spouse Benefits</h2>

  <p>
    To qualify for Social Security benefits based on your ex-spouse's work record,
    you must meet all of the following requirements:
  </p>

  <div class="requirements-box">
    <h3>The Five Requirements</h3>
    <ol>
      <li>
        <strong>10-Year Marriage:</strong> Your marriage must have lasted at least
        10 years. This is measured from the date of marriage to the date the divorce
        was finalized, even if you were separated before then.
      </li>
      <li>
        <strong>Currently Unmarried:</strong> You must be currently unmarried. If you
        remarried but that marriage ended (through divorce, annulment, or death), you
        may regain eligibility.
      </li>
      <li>
        <strong>Age 62 or Older:</strong> You must be at least 62 years old to claim
        divorced spouse retirement benefits.
      </li>
      <li>
        <strong>Ex-Spouse Eligible:</strong> Your ex-spouse must be entitled to Social
        Security retirement or disability benefits. They don't need to have filed yet
        (see below).
      </li>
      <li>
        <strong>Your Own Benefit Is Lower:</strong> If you're entitled to your own
        Social Security benefit, it must be less than what you'd receive as a divorced
        spouse. Social Security automatically pays you the higher amount.
      </li>
    </ol>
  </div>

  <h2>The 10-Year Marriage Rule Explained</h2>

  <p>
    The <strong>10-year marriage requirement</strong> is the most common reason people
    don't qualify for divorced spouse benefits. Social Security counts from your
    wedding date to the date your divorce was legally finalized.
  </p>

  <div class="highlight-box">
    <strong>Important:</strong> The 10-year rule is strict. If your marriage lasted
    9 years and 364 days, you don't qualify. If you're close to 10 years and considering
    divorce, the timing of when you finalize can have significant financial implications.
  </div>

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
    The maximum divorced spouse benefit is <strong>50% of your ex-spouse's PIA</strong>,
    which you'd receive if you claim at your own full retirement age. Claiming
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

  <div class="highlight-box">
    <strong>No Delayed Credits:</strong> Unlike your own retirement benefit, divorced
    spouse benefits do not increase if you wait past your full retirement age. The
    maximum is always 50% of your ex-spouse's PIA, so there's no advantage to
    delaying past your NRA.
  </div>

  <h3>Example Calculation</h3>

  <div class="example-box">
    <h4>Example: Alex's Divorced Spouse Benefit</h4>
    <p>
      Alex was married to Chris for 15 years before divorcing. Chris's PIA is $2,400
      per month. Alex's own PIA based on their work history is $900 per month.
    </p>
    <ul>
      <li><strong>Alex's divorced spouse benefit at NRA:</strong> $2,400 × 50% = $1,200</li>
      <li><strong>Alex's own benefit at NRA:</strong> $900</li>
      <li><strong>Alex receives:</strong> $1,200 (the higher amount)</li>
    </ul>
    <p>
      If Alex claims at 62, their divorced spouse benefit would be reduced to
      approximately $840 per month (assuming a 30% reduction for early claiming).
    </p>
  </div>

  <InlineCTA type="projectionlab" />

  <h2>Does My Ex-Spouse Know If I Claim Benefits?</h2>

  <p>
    <strong>No.</strong> The Social Security Administration maintains strict
    confidentiality. When you apply for divorced spouse benefits:
  </p>

  <ul>
    <li>Your ex-spouse is not contacted or notified</li>
    <li>Your ex-spouse does not need to consent or sign anything</li>
    <li>Your ex-spouse's benefit amount is completely unaffected</li>
    <li>Your ex-spouse cannot block or prevent your claim</li>
  </ul>

  <p>
    The divorced spouse benefit is paid from Social Security's general trust fund,
    not deducted from your ex-spouse's payment. Their monthly check remains exactly
    the same whether you claim or not.
  </p>

  <h2>What If My Ex-Spouse Hasn't Filed Yet?</h2>

  <p>
    Under the <strong>independently entitled divorced spouse</strong> rule, you can
    claim benefits even if your ex-spouse hasn't filed for their own benefits, as
    long as:
  </p>

  <ul>
    <li>You have been divorced for at least <strong>2 years</strong></li>
    <li>Your ex-spouse is at least <strong>62 years old</strong></li>
    <li>Your ex-spouse is entitled to benefits (has enough work credits)</li>
  </ul>

  <p>
    This rule was created specifically to prevent an ex-spouse from deliberately
    delaying their filing to block their former spouse's benefits. Once the 2-year
    waiting period passes, you can file independently.
  </p>

  <h2>What If My Ex-Spouse Remarried?</h2>

  <p>
    Your ex-spouse's current marital status has <strong>no effect</strong> on your
    eligibility for divorced spouse benefits. You can claim even if they:
  </p>

  <ul>
    <li>Have remarried once or multiple times</li>
    <li>Have a current spouse also claiming spousal benefits</li>
    <li>Have other ex-spouses from 10+ year marriages claiming benefits</li>
  </ul>

  <p>
    Social Security allows unlimited divorced spouse beneficiaries on one worker's
    record. Each person's benefit is calculated independently, and none affects
    the others.
  </p>

  <h2>Can I Claim If I Remarried?</h2>

  <p>
    Generally, remarriage ends your eligibility for divorced spouse benefits. However,
    there are important exceptions:
  </p>

  <ul>
    <li>
      <strong>Marriage ended:</strong> If your subsequent marriage ended through
      divorce, annulment, or your spouse's death, you may regain eligibility for
      benefits from your first ex-spouse (assuming the 10-year requirement was met).
    </li>
    <li>
      <strong>Survivor benefits after age 60:</strong> If you remarry after age 60
      (or age 50 if disabled), you can still receive divorced spouse
      <em>survivor</em> benefits if your ex-spouse has died.
    </li>
  </ul>

  <h2>Divorced Spouse Survivor Benefits</h2>

  <p>
    If your ex-spouse dies, you may be eligible for <a href="/guides/survivor-benefits">survivor benefits</a>,
    which are significantly more generous than divorced spouse retirement benefits.
    The maximum survivor benefit is <strong>100% of your ex-spouse's benefit</strong>,
    compared to 50% while they were alive.
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

  <div class="highlight-box">
    <strong>Strategy:</strong> If you qualify for both your own retirement benefit
    and a divorced spouse survivor benefit, you may be able to claim one first and
    switch to the other later to maximize your lifetime benefits. See our
    <a href="/guides/survivor-benefits">survivor benefits guide</a> for detailed
    claiming strategies.
  </div>

  <h2>Divorced Spouse Benefits vs. Your Own Benefits</h2>

  <p>
    If you're entitled to both your own retirement benefit and a divorced spouse
    benefit, Social Security effectively pays you the higher amount. Technically,
    you receive your own benefit first, and if the divorced spouse benefit is
    higher, you receive an additional amount to bring you up to that level.
  </p>

  <p>
    You cannot receive both benefits in full. It's always the higher of the two.
  </p>

  <h3>When Your Own Benefit Might Be Higher</h3>

  <ul>
    <li>You had substantial earnings throughout your career</li>
    <li>Your ex-spouse had relatively low lifetime earnings</li>
    <li>You delay claiming past your full retirement age (your own benefit grows, but divorced spouse benefit doesn't)</li>
  </ul>

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
    You can apply:
  </p>

  <ul>
    <li><strong>Online:</strong> Through ssa.gov (limited for divorced spouse claims)</li>
    <li><strong>By phone:</strong> Call 1-800-772-1213</li>
    <li><strong>In person:</strong> At your local Social Security office</li>
  </ul>

  <p>
    Divorced spouse benefit applications often require a phone or in-person
    appointment, as the online system may not fully support these claims.
  </p>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    {#each faqs as faq}
      <h3>{faq.question}</h3>
      <p>{faq.answer}</p>
    {/each}
  </div>

  <h2>Calculate Your Benefits</h2>

  <p>
    Understanding your divorced spouse benefit options starts with knowing the numbers.
    Use the <a href="/calculator">SSA.tools calculator</a> to estimate your own
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
  .key-takeaways {
    background-color: #e8f5e9;
    border: 1px solid #4caf50;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2e7d32;
  }

  .key-takeaways ul {
    margin-bottom: 0;
  }

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

  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #4a90e2;
    padding: 15px;
    margin: 20px auto;
    border-radius: 4px;
    width: fit-content;
    max-width: 70%;
  }

  .example-box {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .example-box h4 {
    margin-top: 0;
    color: #333;
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
