<script lang="ts">
  import { GuidesSchema, renderFAQSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from "../InlineCTA.svelte";
  import HeroImage from "./state-taxes.jpg";

  const title =
    "State Taxes on Social Security Benefits: Which States Tax Your Benefits?";
  const description =
    "Most states don't tax Social Security benefits. Learn which 8 states still tax benefits in 2026, exemption thresholds, recent changes, and planning strategies.";
  const publishDate = new Date("2026-02-15T00:00:00+00:00");
  const updateDate = new Date("2026-02-15T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/state-taxes";
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt =
    "Map of the United States highlighting states that tax Social Security benefits";
  schema.tags = [
    "state taxes Social Security",
    "Social Security state tax",
    "states that tax Social Security",
    "Social Security tax by state",
    "retirement tax planning",
  ];

  const faqs = [
    {
      question: "How many states tax Social Security benefits?",
      answer:
        "As of 2026, only 8 states tax Social Security benefits: Colorado, Connecticut, Minnesota, Montana, New Mexico, Rhode Island, Utah, and Vermont. The remaining 42 states and Washington, D.C. do not tax Social Security benefits at all.",
    },
    {
      question:
        "Will my Social Security benefits be taxed if I move to a different state?",
      answer:
        "Your state tax on Social Security depends on where you live, not where you earned your benefits. If you move from a state that taxes Social Security to one that doesn't, you will no longer owe state tax on your benefits. Your federal tax obligations remain the same regardless of which state you live in.",
    },
    {
      question:
        "Are states eliminating their taxes on Social Security benefits?",
      answer:
        "Yes, there is a clear trend of states eliminating Social Security taxes. West Virginia stopped taxing benefits in 2026, Nebraska in 2025, and Missouri in 2024. The number of states taxing benefits has dropped from 13 in 2020 to just 8 in 2026.",
    },
    {
      question:
        "Do I have to pay both state and federal taxes on Social Security?",
      answer:
        "Potentially, yes. Federal taxation of Social Security is separate from state taxation. Up to 85% of your benefits may be federally taxable depending on your provisional income. If you also live in one of the 8 states that tax benefits, you may owe state income tax as well, though most of these states offer exemptions or deductions that reduce or eliminate the state tax for lower-income retirees.",
    },
    {
      question:
        "Does my state tax Social Security the same way the federal government does?",
      answer:
        "No. Each state that taxes Social Security has its own rules, thresholds, and exemptions that are different from the federal formula. Some states use your federal AGI, others use state-specific income measures. The exemption thresholds and deduction amounts vary widely between states.",
    },
    {
      question:
        "Can I reduce my state taxes on Social Security by managing my income?",
      answer:
        "Yes. In states with income-based exemptions, keeping your adjusted gross income below the exemption threshold can eliminate your state tax on Social Security benefits. Strategies include timing Roth conversions, managing capital gains, and coordinating retirement account withdrawals. Consult a tax professional for advice specific to your state and situation.",
    },
  ];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/state-taxes" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>State Taxes on Social Security Benefits</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <figure class="hero-map">
    <img
      src={HeroImage}
      width="1024"
      height="787"
      alt="Map of the United States highlighting states that tax Social Security benefits in orange"
    />
  </figure>

  <p>
    When planning for retirement, most people focus on federal taxes on their
    Social Security benefits. But depending on where you live, your state may
    also take a bite. The good news: the vast majority of states do not tax
    Social Security income. The even better news: the list of states that do
    tax benefits keeps shrinking.
  </p>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        <strong>42 states + D.C.</strong> do not tax Social Security benefits at
        all
      </li>
      <li>
        Only <strong>8 states</strong> tax Social Security benefits in 2026
      </li>
      <li>
        Most taxing states offer <strong>generous exemptions</strong> based on
        age or income
      </li>
      <li>
        The trend is clear: states are <strong>eliminating</strong> their Social
        Security taxes (down from 13 states in 2020)
      </li>
      <li>
        State taxes are <strong>separate from</strong> federal taxes on benefits
      </li>
    </ul>
  </div>

  <h2>The 8 States That Tax Social Security in 2026</h2>

  <p>
    The following states still tax Social Security benefits in some form.
    However, each offers exemptions or deductions that reduce or eliminate the
    tax for many retirees.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>State</th>
        <th>Key Exemption</th>
        <th>Who Pays</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Colorado</td>
        <td>Fully exempt at age 65+</td>
        <td>Under 65 with limited deduction</td>
      </tr>
      <tr>
        <td>Connecticut</td>
        <td>Exempt below $75K / $100K AGI</td>
        <td>Higher-income filers</td>
      </tr>
      <tr>
        <td>Minnesota</td>
        <td>Exemption phases out above thresholds</td>
        <td>Higher-income filers</td>
      </tr>
      <tr>
        <td>Montana</td>
        <td>$5,500 deduction for 65+</td>
        <td>Most filers with higher incomes</td>
      </tr>
      <tr>
        <td>New Mexico</td>
        <td>Exempt below $100K / $150K AGI</td>
        <td>Higher-income filers</td>
      </tr>
      <tr>
        <td>Rhode Island</td>
        <td>Exempt at FRA with income limits</td>
        <td>Higher-income or early filers</td>
      </tr>
      <tr>
        <td>Utah</td>
        <td>Credit below $54K / $90K</td>
        <td>Higher-income filers</td>
      </tr>
      <tr>
        <td>Vermont</td>
        <td>Exempt below $55K / $70K AGI</td>
        <td>Higher-income filers</td>
      </tr>
    </tbody>
  </table>

  <h3>Colorado</h3>
  <p>
    Colorado offers a full exemption for retirees <strong>age 65 and older</strong>.
    If you are under 65, you can still deduct a portion of your Social Security
    benefits: up to $20,000 for those under age 55, and up to $24,000 for those
    age 55-64. This makes Colorado one of the most generous taxing states,
    since the vast majority of Social Security recipients are over 65 and pay
    nothing.
  </p>

  <h3>Connecticut</h3>
  <p>
    Connecticut exempts Social Security benefits for single filers with federal
    AGI below <strong>$75,000</strong> and joint filers below
    <strong>$100,000</strong>. Above those thresholds, up to 25% of benefits
    may be taxed. Connecticut has been gradually increasing these thresholds to
    exempt more retirees.
  </p>

  <h3>Minnesota</h3>
  <p>
    Minnesota offers a Social Security subtraction that phases out at higher
    incomes. For 2025, the phase-out begins at approximately
    <strong>$84,490</strong> for single filers and
    <strong>$108,320</strong> for joint filers. Below these thresholds, benefits
    can be fully or partially exempt. Minnesota's subtraction is tied to the
    federal taxable amount, so you only pay state tax on the portion already
    taxable federally.
  </p>

  <h3>Montana</h3>
  <p>
    Montana allows a deduction of up to <strong>$5,500</strong> for Social
    Security and other retirement income for taxpayers age 65 and older. The
    deduction is reduced for higher-income filers based on AGI. Montana uses
    the federal taxable amount as the starting point, so only benefits that are
    taxable federally are subject to state tax.
  </p>

  <h3>New Mexico</h3>
  <p>
    New Mexico exempts Social Security benefits for single filers with AGI
    below <strong>$100,000</strong> and joint filers below
    <strong>$150,000</strong>. Above those thresholds, benefits are taxed as
    regular income. This generous threshold means the majority of New Mexico
    retirees pay no state tax on their Social Security.
  </p>

  <h3>Rhode Island</h3>
  <p>
    Rhode Island exempts Social Security benefits for filers who have reached
    <strong>full retirement age</strong> (as defined by Social Security) and
    whose federal AGI is below <strong>$107,000</strong> for single filers or
    <strong>$133,750</strong> for joint filers. Filers who have not reached
    full retirement age, or who exceed the income limits, may owe state tax on
    benefits.
  </p>

  <h3>Utah</h3>
  <p>
    Utah offers a nonrefundable tax credit that offsets the tax on Social
    Security benefits. The credit is available to single filers with a modified
    AGI below <strong>$54,000</strong> and joint filers below
    <strong>$90,000</strong>. The credit phases out above those thresholds. For
    filers below the income limits, the credit effectively eliminates the state
    tax on benefits.
  </p>

  <h3>Vermont</h3>
  <p>
    Vermont provides a full exemption for single filers with AGI below
    <strong>$55,000</strong> and joint filers below
    <strong>$70,000</strong>. Above those thresholds, a partial exemption
    applies that phases out at higher incomes. Vermont has been steadily
    increasing its exemption thresholds in recent years.
  </p>

  <InlineCTA type="calculator" />

  <h2>Recent Changes: States Eliminating Social Security Taxes</h2>

  <p>
    The trend is unmistakable: states are dropping their taxes on Social
    Security benefits. Here are the most recent changes:
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>State</th>
        <th>Last Year Taxed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>West Virginia</td>
        <td>2025 (exempt starting 2026)</td>
      </tr>
      <tr>
        <td>Nebraska</td>
        <td>2024 (exempt starting 2025)</td>
      </tr>
      <tr>
        <td>Missouri</td>
        <td>2023 (exempt starting 2024)</td>
      </tr>
      <tr>
        <td>Kansas</td>
        <td>2023 (exempt for AGI under $75K starting 2024)</td>
      </tr>
    </tbody>
  </table>

  <p>
    In 2020, thirteen states taxed Social Security benefits. By 2026, that
    number has dropped to just eight. This trend reflects growing recognition
    that taxing retirement benefits places a disproportionate burden on
    fixed-income seniors.
  </p>

  <h2>States That Do Not Tax Social Security</h2>

  <p>
    The following <strong>42 states and Washington, D.C.</strong> do not tax
    Social Security benefits. Some of these states have no income tax at all,
    while others specifically exempt Social Security from taxation.
  </p>

  <div class="state-grid">
    <ul>
      <li>Alabama</li>
      <li>Alaska *</li>
      <li>Arizona</li>
      <li>Arkansas</li>
      <li>California</li>
      <li>Delaware</li>
      <li>Florida *</li>
      <li>Georgia</li>
      <li>Hawaii</li>
      <li>Idaho</li>
      <li>Illinois</li>
      <li>Indiana</li>
      <li>Iowa</li>
      <li>Kansas</li>
      <li>Kentucky</li>
      <li>Louisiana</li>
      <li>Maine</li>
      <li>Maryland</li>
      <li>Massachusetts</li>
      <li>Michigan</li>
      <li>Mississippi</li>
      <li>Missouri</li>
      <li>Nebraska</li>
      <li>Nevada *</li>
      <li>New Hampshire *</li>
      <li>New Jersey</li>
      <li>New York</li>
      <li>North Carolina</li>
      <li>North Dakota</li>
      <li>Ohio</li>
      <li>Oklahoma</li>
      <li>Oregon</li>
      <li>Pennsylvania</li>
      <li>South Carolina</li>
      <li>South Dakota *</li>
      <li>Tennessee *</li>
      <li>Texas *</li>
      <li>Virginia</li>
      <li>Washington *</li>
      <li>Washington, D.C.</li>
      <li>West Virginia</li>
      <li>Wisconsin</li>
      <li>Wyoming *</li>
    </ul>
    <p class="note">* No state income tax</p>
  </div>

  <h2>Interaction with Federal Taxes</h2>

  <p>
    State and federal taxation of Social Security are completely independent.
    At the federal level, up to <strong>85%</strong> of your benefits may be
    taxable, depending on your "provisional income" (AGI + tax-exempt interest
    + half of your Social Security benefits). The federal thresholds have not
    changed since 1993.
  </p>

  <p>
    Living in a state that doesn't tax Social Security does not affect your
    federal tax obligation, and vice versa. For a full explanation of the
    federal calculation, see our
    <a href="/guides/federal-taxes"
      >Federal Taxation of Social Security Benefits</a
    > guide.
  </p>

  <div class="highlight-box">
    <strong>New for 2025-2028:</strong> The One Big Beautiful Bill Act created a
    new senior tax deduction of $4,000-$6,000 for those age 65+. This can
    significantly reduce federal taxes on benefits. See our
    <a href="/guides/senior-tax-deduction">Senior Tax Deduction guide</a> for
    details.
  </div>

  <h2>Planning Strategies</h2>

  <h3>Consider State Taxes When Choosing Where to Retire</h3>
  <p>
    If you are deciding where to retire, state tax treatment of Social Security
    is one factor to consider. Moving from a taxing state to a non-taxing state
    can save hundreds or thousands of dollars per year. However, don't let
    Social Security tax be the only factor; also consider overall state income
    tax rates, property taxes, sales taxes, and cost of living.
  </p>

  <h3>Manage Your Income to Stay Below Exemption Thresholds</h3>
  <p>
    If you live in a state with income-based exemptions, keeping your AGI below
    the threshold can eliminate your state tax on Social Security. Strategies
    include timing IRA withdrawals, spreading Roth conversions across multiple
    years, and harvesting capital losses to offset gains.
  </p>

  <h3>Coordinate Roth Conversions</h3>
  <p>
    Roth IRA distributions are not included in AGI. Converting traditional IRA
    funds to a Roth before retirement increases your income now but can help
    keep your AGI below exemption thresholds in retirement. This is especially
    valuable in states like Connecticut, New Mexico, and Vermont with clear AGI
    cutoffs.
  </p>

  <InlineCTA type="projectionlab" />

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    {#each faqs as faq}
      <h3>{faq.question}</h3>
      <p>{faq.answer}</p>
    {/each}
  </div>

  <h2>Learn More</h2>

  <p>
    For a detailed explanation of how Social Security benefits are taxed at the
    federal level, see our
    <a href="/guides/federal-taxes"
      >Federal Taxation of Social Security Benefits</a
    > guide. For information about the new senior tax deduction, see our
    <a href="/guides/senior-tax-deduction">Senior Tax Deduction</a> guide.
  </p>

  <p>
    Use the <a href="/calculator">SSA.tools calculator</a> to estimate your
    Social Security benefits based on your earnings history.
  </p>

  <GuideFooter />
</div>

<style>
  .hero-map {
    text-align: center;
    margin: 1em auto 2em auto;
    float: none;
    width: 100%;
    max-width: 700px;
  }

  .hero-map :global(img) {
    width: 100%;
    height: auto;
  }

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
    max-width: 90%;
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

  .state-grid {
    margin: 20px 0;
  }

  .state-grid ul {
    column-count: 3;
    column-gap: 2em;
    list-style: none;
    padding: 0;
  }

  .state-grid li {
    padding: 4px 0;
    break-inside: avoid;
  }

  .state-grid .note {
    font-size: 0.9em;
    color: #666;
    font-style: italic;
    margin-top: 10px;
  }

  .faq h3 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  .faq p {
    margin-top: 0;
  }

  @media (max-width: 768px) {
    .highlight-box {
      max-width: 100%;
    }

    .state-grid ul {
      column-count: 2;
    }
  }

  @media (max-width: 600px) {
    .benefit-table {
      font-size: 14px;
    }

    .benefit-table th,
    .benefit-table td {
      padding: 8px 10px;
    }

    .state-grid ul {
      column-count: 1;
    }
  }
</style>
