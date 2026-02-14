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
    <strong>How much can a surviving spouse receive?</strong> Survivor benefits
    can be up to <strong>100% of your deceased spouse's benefit amount</strong>,
    making them significantly more valuable than the 50% maximum for spousal
    benefits while your spouse was alive.
  </p>

  <p>
    Social Security survivor benefits provide crucial financial support for
    widows, widowers, children, and in some cases dependent parents.
    Understanding the rules can help you maximize your benefits during a
    difficult time.
  </p>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        Survivor benefits can be up to <strong>100%</strong> of the deceased's benefit
        (vs. 50% for spousal benefits)
      </li>
      <li>
        Widows and widowers can claim as early as <strong>age 60</strong> (age 50
        if disabled)
      </li>
      <li>
        Remarriage before age 60 generally ends eligibility (with exceptions)
      </li>
      <li>Children may qualify until age 18 (19 if still in high school)</li>
      <li>
        You may be able to <strong>switch</strong> between survivor and your own
        benefits strategically
      </li>
      <li>
        Survivor benefits have a <strong>different retirement age</strong> schedule
        than regular retirement benefits
      </li>
    </ul>
  </div>

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
    generally must have lasted at least <strong>9 months</strong> before your spouse's
    death. However, there are important exceptions:
  </p>

  <div class="highlight-box">
    <strong>Exceptions to the 9-Month Rule:</strong>
    <ul>
      <li>Death was accidental</li>
      <li>Death occurred in the line of military duty</li>
      <li>
        You and your spouse were previously married, divorced, and then
        remarried
      </li>
      <li>You are the parent of the worker's child</li>
    </ul>
    If any of these apply, you may qualify even with a shorter marriage.
  </div>

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

  <div class="highlight-box">
    <strong>The 82.5% Floor:</strong> If your spouse claimed benefits early and received
    a reduced amount, you're protected. Your survivor benefit will be at least 82.5%
    of their PIA, even if they were receiving less than that due to early claiming.
  </div>

  <InlineCTA type="projectionlab" />

  <h2>Survivor Normal Retirement Age</h2>

  <p>
    Survivor benefits have their own <strong
      >full retirement age schedule</strong
    >, which is different from the regular retirement age. The survivor NRA
    determines when you can receive 100% of the survivor benefit without
    reduction.
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

  <div class="warning-box">
    <strong>No Delayed Retirement Credits:</strong> Unlike your own retirement benefit,
    survivor benefits do NOT increase if you wait past your survivor NRA. The maximum
    is reached at your survivor full retirement age. Waiting until 70 provides no
    additional increase for survivor benefits.
  </div>

  <h2>Strategic Claiming: Switching Between Benefits</h2>

  <p>
    One of the most valuable aspects of survivor benefits is the ability to
    <strong>claim one type of benefit first and switch later</strong>. This is
    different from spousal benefits, where such strategies are more limited.
  </p>

  <div class="example-box">
    <h4>Example: Maria's Switching Strategy</h4>
    <p>
      Maria is 60 when her husband dies. Her own <a href="/guides/pia">PIA</a> is
      $1,800, and her full survivor benefit would be $2,400.
    </p>

    <h5>Option A: Survivor First, Own Later</h5>
    <ul>
      <li>
        Age 60: Claim survivor benefit at 71.5% = $2,400 × 71.5% = <strong
          >$1,716/month</strong
        >
      </li>
      <li>
        Age 70: Switch to own benefit with delayed credits = $1,800 × 124% = <strong
          >$2,232/month</strong
        >
      </li>
    </ul>

    <h5>Option B: Own First, Survivor Later</h5>
    <ul>
      <li>
        Age 62: Claim own benefit at 70% = $1,800 × 70% = <strong
          >$1,260/month</strong
        >
      </li>
      <li>
        Age 67: Switch to full survivor benefit = <strong>$2,400/month</strong>
      </li>
    </ul>

    <p>
      The best choice depends on Maria's health, financial needs, and life
      expectancy. Option A provides more money initially; Option B provides a
      higher ultimate benefit.
    </p>
  </div>

  <h3>When Each Strategy Makes Sense</h3>

  <ul>
    <li>
      <strong>Claim survivor first:</strong> If your own benefit at 70 would be higher
      than your full survivor benefit, claim survivor early and let your own benefit
      grow.
    </li>
    <li>
      <strong>Claim own first:</strong> If the full survivor benefit is higher than
      your own benefit at 70, claim your reduced own benefit early and switch to
      the full survivor benefit at your survivor NRA.
    </li>
  </ul>

  <h2>Remarriage and Survivor Benefits</h2>

  <p>
    Remarriage can affect your eligibility for survivor benefits, but the rules
    are flexible:
  </p>

  <div class="requirements-box">
    <h3>Remarriage Rules</h3>

    <h4>Remarriage Before Age 60</h4>
    <p>
      If you remarry before age 60 (or 50 if disabled), you generally cannot
      receive survivor benefits from your deceased spouse while you remain
      married. However, if that marriage ends, you may regain eligibility.
    </p>

    <h4>Remarriage at Age 60 or Later</h4>
    <p>
      If you remarry at age 60 or later (50 if disabled), you can still receive
      survivor benefits from your deceased spouse. This is a significant
      exception that preserves your benefit eligibility.
    </p>
  </div>

  <div class="highlight-box">
    <strong>Planning Tip:</strong> If you're considering remarriage and are close
    to age 60, waiting until after your 60th birthday preserves your survivor benefit
    eligibility from your deceased spouse.
  </div>

  <h2>Work Credits Required</h2>

  <p>
    For survivors to receive benefits, the deceased worker must have earned
    enough <a href="/guides/work-credits">work credits</a>. The number required
    depends on the worker's age at death:
  </p>

  <ul>
    <li><strong>Under age 28:</strong> Generally 6 credits needed</li>
    <li>
      <strong>Age 28 and older:</strong> Generally 1 credit for each year after age
      21, up to 40 credits maximum
    </li>
  </ul>

  <p>
    There's also a special rule: if a worker dies leaving a spouse with
    children, benefits may be payable if the worker had at least 6 credits in
    the 3 years before death, regardless of total credits earned.
  </p>

  <h2>The Lump Sum Death Benefit</h2>

  <p>
    In addition to monthly survivor benefits, Social Security pays a one-time
    <strong>lump sum death benefit of $255</strong> to:
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
    Social Security. The <strong>Social Security Fairness Act of 2025</strong>
    repealed this provision.
  </p>

  <p>
    Government workers (teachers, firefighters, state employees, etc.) now
    receive their full survivor benefits without reduction. See our
    <a href="/guides/wep">WEP guide</a> for more information about these historic
    changes.
  </p>

  <h2>Common Misconceptions</h2>

  <div class="warning-box">
    <strong>Myth: "I have to wait until 62 to claim survivor benefits."</strong>
    <p>
      Reality: Widows and widowers can claim survivor benefits as early as age
      60. If disabled, you can claim as early as age 50. This is different from
      retirement and spousal benefits, which require age 62.
    </p>
  </div>

  <div class="warning-box">
    <strong>Myth: "Survivor benefits are half of my spouse's benefit."</strong>
    <p>
      Reality: That's spousal benefits you're thinking of. Survivor benefits can
      be up to 100% of your deceased spouse's benefit amount, not 50%.
    </p>
  </div>

  <div class="warning-box">
    <strong
      >Myth: "If I claim survivor benefits, I can never get my own."</strong
    >
    <p>
      Reality: You can switch between survivor benefits and your own retirement
      benefit. Many people strategically claim one first and switch to the other
      later to maximize lifetime benefits.
    </p>
  </div>

  <div class="warning-box">
    <strong>Myth: "I remarried, so I can't get survivor benefits."</strong>
    <p>
      Reality: If you remarried at age 60 or later (50 if disabled), you can
      still receive survivor benefits from your deceased spouse. Even if you
      remarried earlier, you may regain eligibility if that marriage ends.
    </p>
  </div>

  <div class="warning-box">
    <strong
      >Myth: "Waiting past my survivor NRA will increase my benefit."</strong
    >
    <p>
      Reality: Survivor benefits do NOT earn delayed retirement credits. Your
      maximum survivor benefit is at your survivor NRA. Unlike your own
      retirement benefit, there's no advantage to waiting past that age.
    </p>
  </div>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    {#each faqs as faq}
      <h3>{faq.question}</h3>
      <p>{faq.answer}</p>
    {/each}
  </div>

  <h2>How to Apply for Survivor Benefits</h2>

  <p>You can apply for survivor benefits:</p>

  <ul>
    <li><strong>By phone:</strong> Call Social Security at 1-800-772-1213</li>
    <li><strong>In person:</strong> Visit your local Social Security office</li>
    <li>
      <strong>Online:</strong> Limited online options available at ssa.gov
    </li>
  </ul>

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
    Understanding your options starts with knowing your own benefit amount. Use
    the <a href="/calculator">SSA.tools calculator</a> to estimate your retirement
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

  .highlight-box ul {
    margin-bottom: 0;
    margin-top: 0.5em;
  }

  .warning-box {
    background-color: #fffde7;
    border-left: 4px solid #fbc02d;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .warning-box p {
    margin: 0.5em 0 0 0;
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

  .example-box h5 {
    color: #555;
    margin-bottom: 0.5em;
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
