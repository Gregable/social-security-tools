<script lang="ts">
  import { GuidesSchema, renderFAQSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from "../InlineCTA.svelte";

  const title =
    "Social Security Survivor Benefits: Guide for Widows, Widowers & Families";
  const description =
    "Learn about Social Security survivor benefits for widows, widowers, and children. Understand eligibility at age 60, benefit amounts up to 100% of spouse's benefit, and claiming strategies.";
  const publishDate = new Date("2026-01-19T00:00:00+00:00");
  const updateDate = new Date("2026-01-19T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/survivor-benefits";
  schema.title = title;
  schema.image = "/laptop-piggybank.jpg";
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt = "Social Security survivor benefits calculator";
  schema.tags = [
    "survivor benefits",
    "Social Security survivor",
    "widow benefits",
    "widower benefits",
    "surviving spouse",
    "Social Security death benefits",
    "survivor benefit age 60",
    "remarriage survivor benefits",
  ];

  const faqs = [
    {
      question: "How much is the Social Security survivor benefit?",
      answer:
        "The survivor benefit can be up to 100% of the deceased spouse's benefit amount. If you claim at your full survivor retirement age (66-67 depending on birth year), you receive the full amount. Claiming as early as age 60 reduces the benefit to approximately 71.5%. This is significantly higher than spousal benefits, which max out at 50%.",
    },
    {
      question: "Can I collect survivor benefits at age 60?",
      answer:
        "Yes. Widows and widowers can claim survivor benefits as early as age 60. However, claiming at 60 reduces your benefit to approximately 71.5% of the full amount. If you're disabled, you may claim as early as age 50 with a larger reduction. Waiting until your full survivor retirement age (66-67) provides the maximum survivor benefit.",
    },
    {
      question:
        "Can I receive both my own Social Security and survivor benefits?",
      answer:
        "You cannot receive both benefits simultaneously in full. However, you can claim one benefit first and switch to the other later. For example, claim reduced survivor benefits at 60 while your own benefit grows, then switch to your own benefit at 70 for a higher amount. Social Security pays you the higher of the two.",
    },
    {
      question: "Can I remarry and still collect survivor benefits?",
      answer:
        "If you remarry before age 60 (or age 50 if disabled), you generally cannot receive survivor benefits on your deceased spouse's record while married. However, if you remarry at age 60 or later, you can still receive survivor benefits. If the subsequent marriage ends, you may also regain eligibility.",
    },
    {
      question:
        "What is the difference between survivor benefits and spousal benefits?",
      answer:
        "Spousal benefits are for living couples and max out at 50% of your spouse's benefit. Survivor benefits are for widows and widowers and can be up to 100% of the deceased's benefit. Survivor benefits can start at age 60 (vs. 62 for spousal), and have a different full retirement age schedule.",
    },
    {
      question:
        "How long do you have to be married to collect survivor benefits?",
      answer:
        "You must have been married for at least 9 months before your spouse's death to qualify for survivor benefits. Exceptions exist for accidental death, death in military service, or if you were previously married to the same person. For divorced surviving spouses, the marriage must have lasted at least 10 years.",
    },
    {
      question:
        "Do survivor benefits increase if I wait past full retirement age?",
      answer:
        "No. Unlike your own retirement benefit, survivor benefits do not earn delayed retirement credits. Your maximum survivor benefit is reached at your full survivor retirement age (66-67 depending on birth year). Waiting past that age provides no additional increase to survivor benefits.",
    },
  ];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/survivor-benefits" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Social Security Survivor Benefits</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    How much can a surviving spouse receive? Up to 100% of the deceased
    spouse's benefit amount. That's twice the 50% maximum for spousal benefits
    while your spouse was alive.
  </p>

  <p>
    Survivor benefits go to widows and widowers, and sometimes to children and
    dependent parents. The rules are different from regular retirement benefits
    in a few ways that are worth knowing about.
  </p>

  <h2>Who Qualifies for Survivor Benefits?</h2>

  <p>
    Several categories of family members may be eligible for survivor benefits
    when a worker dies:
  </p>

  <div class="requirements-box">
    <h3>Eligible Beneficiaries</h3>

    <h4>Widows and Widowers</h4>
    <ul>
      <li>Age 60 or older (or age 50 if disabled)</li>
      <li>Marriage lasted at least 9 months (with exceptions)</li>
      <li>Currently unmarried, or remarried after age 60</li>
    </ul>

    <h4>Divorced Surviving Spouses</h4>
    <ul>
      <li>Marriage lasted at least 10 years</li>
      <li>Age 60 or older (or age 50 if disabled)</li>
      <li>Currently unmarried, or remarried after age 60</li>
      <li>
        See our <a href="/guides/divorced-spouse"
          >divorced spouse benefits guide</a
        > for more details
      </li>
    </ul>

    <h4>Surviving Children</h4>
    <ul>
      <li>Unmarried and under age 18</li>
      <li>OR age 18-19 and still attending high school full-time</li>
      <li>OR any age if disabled before age 22</li>
      <li>Can receive up to 75% of deceased's benefit</li>
    </ul>

    <h4>Dependent Parents (Age 62+)</h4>
    <ul>
      <li>Must have received at least half their support from the deceased</li>
      <li>One parent: up to 82.5% of deceased's benefit</li>
      <li>Two parents: up to 75% each</li>
    </ul>
  </div>

  <h2>The 9-Month Marriage Requirement</h2>

  <p>
    To qualify for survivor benefits as a widow or widower, your marriage
    generally must have lasted at least 9 months before your spouse's death.
    There are exceptions, though. The 9-month rule doesn't apply if the death
    was accidental, if it occurred in the line of military duty, if you and
    your spouse were previously married, divorced, and then remarried, or if
    you are the parent of the worker's child.
  </p>

  <h2>How Survivor Benefits Are Calculated</h2>

  <p>
    The survivor benefit amount depends on what your spouse was receiving (or
    would have received) and when you claim. The calculation varies based on
    whether your spouse had already filed for benefits.
  </p>

  <h3>Calculation Scenarios</h3>

  <p>The amount you receive depends on your spouse's filing status at death:</p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Scenario</th>
        <th>Survivor Benefit Basis</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Spouse was receiving benefits</td>
        <td
          >The greater of: their benefit at death, or 82.5% of their <a
            href="/guides/pia">PIA</a
          ></td
        >
      </tr>
      <tr>
        <td>Spouse died after <a href="/guides/nra">NRA</a> without filing</td>
        <td>What they would have received if they'd filed at death</td>
      </tr>
      <tr>
        <td>Spouse died before NRA without filing</td>
        <td>100% of their PIA</td>
      </tr>
    </tbody>
  </table>

  <p>
    What if your spouse claimed early and was receiving a reduced amount? You
    have some protection: your survivor benefit will be at least 82.5% of
    their PIA, even if they were receiving less than that due to early
    claiming.
  </p>

  <InlineCTA type="projectionlab" />

  <h2>Survivor Normal Retirement Age</h2>

  <p>
    Survivor benefits have their own full retirement age schedule, which is
    different from the regular retirement age. The survivor NRA determines
    when you can receive 100% of the survivor benefit without reduction.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Year of Birth</th>
        <th>Survivor Full Retirement Age</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1939 or earlier</td><td>65</td></tr>
      <tr><td>1940</td><td>65 and 2 months</td></tr>
      <tr><td>1941</td><td>65 and 4 months</td></tr>
      <tr><td>1942</td><td>65 and 6 months</td></tr>
      <tr><td>1943</td><td>65 and 8 months</td></tr>
      <tr><td>1944</td><td>65 and 10 months</td></tr>
      <tr><td>1945-1956</td><td>66</td></tr>
      <tr><td>1957</td><td>66 and 2 months</td></tr>
      <tr><td>1958</td><td>66 and 4 months</td></tr>
      <tr><td>1959</td><td>66 and 6 months</td></tr>
      <tr><td>1960</td><td>66 and 8 months</td></tr>
      <tr><td>1961</td><td>66 and 10 months</td></tr>
      <tr><td>1962 or later</td><td>67</td></tr>
    </tbody>
  </table>

  <p>
    Compare this to the <a href="/guides/nra">regular retirement NRA</a>, which
    reaches 67 for those born in 1960 or later. The survivor NRA schedule
    transitions more gradually.
  </p>

  <h2>Early Claiming Reductions</h2>

  <p>
    You can claim survivor benefits as early as age 60 (or 50 if disabled), but
    claiming before your survivor NRA reduces your benefit:
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Claiming Age</th>
        <th>Approximate Percentage of Full Benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>60</td><td>71.5%</td></tr>
      <tr><td>61</td><td>75.6%</td></tr>
      <tr><td>62</td><td>79.6%</td></tr>
      <tr><td>63</td><td>83.7%</td></tr>
      <tr><td>64</td><td>87.8%</td></tr>
      <tr><td>65</td><td>91.8%</td></tr>
      <tr><td>66</td><td>95.9%</td></tr>
      <tr><td>67 (Survivor NRA for 1962+)</td><td>100%</td></tr>
    </tbody>
  </table>

  <p class="table-note">
    *Exact percentages vary based on your birth year and corresponding survivor
    NRA. The reduction is approximately 28.5% spread evenly over 84 months from
    age 60 to 67.
  </p>

  <p>
    Note that survivor benefits do not earn delayed retirement credits. The
    maximum is reached at your survivor full retirement age; waiting until 70
    provides no additional increase.
  </p>

  <h2>Strategic Claiming: Switching Between Benefits</h2>

  <p>
    Here's the part most people miss: you can claim one benefit first and
    switch to the other later. That's not allowed with spousal benefits, but
    it is with survivor benefits.
  </p>

  <p>
    Take an example. Maria is 60 when her husband dies. Her own
    <a href="/guides/pia">PIA</a> is $1,800, and her full survivor benefit would
    be $2,400.
  </p>

  <p>
    Option A is survivor first, own later. At 60, Maria claims the survivor
    benefit at 71.5%: $2,400 × 71.5% = $1,716/month. At 70, she switches to her
    own benefit with delayed credits: $1,800 × 124% = $2,232/month.
  </p>

  <p>
    Option B is own first, survivor later. At 62, she claims her own benefit at
    70%: $1,800 × 70% = $1,260/month. At 67, she switches to the full survivor
    benefit of $2,400/month.
  </p>

  <p>
    Which order? Compare your own benefit at 70 against your full survivor
    benefit. Whichever is bigger, save it for later and claim the other one
    early. In Maria's case, the survivor benefit at 67 ($2,400) beats her own
    at 70 ($2,232), so Option B gives her the higher ultimate benefit, while
    Option A provides more money initially. Health, financial needs, and life
    expectancy all factor in.
  </p>

  <h2>Remarriage and Survivor Benefits</h2>

  <p>
    If you remarry before age 60 (or 50 if disabled), you generally cannot
    receive survivor benefits from your deceased spouse while you remain
    married. If that marriage ends, you may regain eligibility.
  </p>

  <p>
    If you remarry at age 60 or later (50 if disabled), you keep your
    eligibility. So if you're considering remarriage and are close to 60,
    waiting until after your 60th birthday preserves your survivor benefit.
  </p>

  <h2>Work Credits Required</h2>

  <p>
    For survivors to receive benefits, the deceased worker must have earned
    enough <a href="/guides/work-credits">work credits</a>. The number required
    depends on the worker's age at death: generally 6 credits for workers under
    age 28, and 1 credit for each year after age 21 for older workers, up to a
    maximum of 40.
  </p>

  <p>
    There's also a special rule: if a worker dies leaving a spouse with
    children, benefits may be payable if the worker had at least 6 credits in
    the 3 years before death, regardless of total credits earned.
  </p>

  <h2>The Lump Sum Death Benefit</h2>

  <p>
    In addition to monthly survivor benefits, Social Security pays a one-time
    lump sum death benefit of $255 to:
  </p>

  <ul>
    <li>A surviving spouse who was living with the deceased, OR</li>
    <li>A surviving spouse eligible for benefits in the month of death, OR</li>
    <li>An eligible child (if no eligible spouse)</li>
  </ul>

  <p>
    You must apply for this benefit within two years of the worker's death.
    Note: This amount has not been increased since 1954.
  </p>

  <h2>Government Pension Offset (GPO) - Now Repealed</h2>

  <p>
    Prior to January 2025, the Government Pension Offset (GPO) reduced survivor
    benefits for those receiving government pensions from work not covered by
    Social Security. The Social Security Fairness Act of 2025 repealed this
    provision.
  </p>

  <p>
    Government workers (teachers, firefighters, state employees, etc.) now
    receive their full survivor benefits without reduction. See our
    <a href="/guides/wep">WEP guide</a> for more information about these historic
    changes.
  </p>

  <h2>Common Misconceptions</h2>

  <p>
    A common one: thinking you have to wait until 62 to claim. Not so. Widows
    and widowers can claim survivor benefits as early as age 60, or 50 if
    disabled. The age-62 minimum applies to retirement and spousal benefits,
    not survivor benefits.
  </p>

  <p>
    Another: assuming survivor benefits are half of your spouse's benefit.
    That's spousal benefits you're thinking of. Survivor benefits can be up to
    100% of your deceased spouse's benefit, not 50%.
  </p>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    <h3>Can I collect survivor benefits at age 60?</h3>
    <p>
      Yes, though claiming at 60 reduces the benefit to about 71.5% of the full
      amount. If you're disabled, you can claim as early as 50.
    </p>

    <h3>Can I receive both my own Social Security and survivor benefits?</h3>
    <p>
      Not both at once; Social Security pays the higher of the two. But you can
      claim one first and switch to the other later, as described above.
    </p>

    <h3>Can I remarry and still collect survivor benefits?</h3>
    <p>
      It depends on when. Remarriage at 60 or later (50 if disabled) doesn't
      affect your eligibility; remarriage before then generally does, at least
      while the new marriage lasts.
    </p>

    <h3>Do survivor benefits increase if I wait past full retirement age?</h3>
    <p>
      They don't. Survivor benefits max out at your survivor NRA; there are no
      delayed retirement credits.
    </p>
  </div>

  <h2>How to Apply for Survivor Benefits</h2>

  <p>
    You can apply by phone at 1-800-772-1213 or in person at your local Social
    Security office. Online options at ssa.gov are limited for survivor
    claims.
  </p>

  <p>You'll need:</p>

  <ul>
    <li>Death certificate</li>
    <li>Your Social Security number and the deceased's</li>
    <li>Your birth certificate</li>
    <li>Marriage certificate (for widow/widower claims)</li>
    <li>Divorce decree (for divorced surviving spouse claims)</li>
    <li>Dependent children's birth certificates and Social Security numbers</li>
  </ul>

  <h2>Calculate Your Benefits</h2>

  <p>
    Use the <a href="/calculator">ssa.tools calculator</a> to estimate your retirement
    benefit based on your earnings history.
  </p>

  <div class="highlight-box">
    <strong>Interactive Survivor Benefits:</strong> When you enter earnings data
    for both you and your spouse in the calculator, it generates an interactive survivor
    benefits report. This shows how much each spouse would receive as a survivor
    at different claiming ages, helping you plan the optimal strategy for your situation.
  </div>

  <p>
    For more information on related topics, see our guides on
    <a href="/guides/divorced-spouse">divorced spouse benefits</a>,
    <a href="/guides/spousal-benefit-filing-date"
      >spousal benefits and filing dates</a
    >, and <a href="/guides/nra">Normal Retirement Age</a>.
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

  .requirements-box h4 {
    color: #e65100;
    margin-bottom: 0.5em;
  }

  .requirements-box ul {
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  .requirements-box ul:last-child {
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
