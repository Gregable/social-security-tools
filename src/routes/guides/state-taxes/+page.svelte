<script lang="ts">
  import { GuidesSchema, renderFAQSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from "../InlineCTA.svelte";
  import HeroImage from "./state-taxes.jpg";
import type { SponsorCopy } from '$lib/sponsor';

const sponsorCopy: SponsorCopy = {
  intro: "Keeping your income under a state threshold takes planning several years ahead. You can map that out with a Social Security specialist at",
  outro: "before your next round of withdrawals.",
  bullets: [
    "They look at how withdrawal timing and Roth conversions interact with your state's exemption cutoff.",
    "Federal taxation of your benefit follows its own rules, and the two have to be planned together.",
    "The first call is free, and you pick the time.",
  ],
};

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
      question:
        "Will my benefits be taxed if I move to a different state?",
      answer:
        "State tax depends on where you live, not where you earned your benefits. Move from a taxing state to a non-taxing one and the state tax goes away. Your federal taxes don't change either way.",
    },
    {
      question:
        "Does my state tax Social Security the same way the federal government does?",
      answer:
        "No. Each of the 8 taxing states has its own rules and thresholds, different from the federal formula. Some start from your federal AGI, others use their own income measures.",
    },
  ];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
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
    also take a bite. Most states don't tax Social Security at all — as of
    2026, only 8 do. And that list keeps getting shorter: it was 13 states as
    recently as 2020.
  </p>

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
        <td>Ages 55-64 above AGI threshold; under 55 generally ineligible</td>
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
        <td>$5,500+ deduction for 65+ (inflation-adjusted)</td>
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
    Colorado offers a full exemption for retirees age 65 and older.
    For those age 55-64, benefits are also fully exempt if AGI
    is below $75,000 (single) or $95,000
    (joint); above those thresholds, the deduction is capped at $20,000.
    Taxpayers under age 55 are generally not eligible for the
    Social Security subtraction. This makes Colorado one of the most generous
    taxing states, since the vast majority of Social Security recipients are
    over 65 and pay nothing.
  </p>

  <h3>Connecticut</h3>
  <p>
    Connecticut exempts Social Security benefits for single filers with federal
    AGI below $75,000 and joint filers below
    $100,000. Above those thresholds, up to 25% of benefits
    may be taxed. Connecticut has been gradually increasing these thresholds to
    exempt more retirees.
  </p>

  <h3>Minnesota</h3>
  <p>
    Minnesota offers a Social Security subtraction that phases out at higher
    incomes. The phase-out thresholds are adjusted annually for inflation; for
    2025, they begin at approximately $84,490 for single filers
    and $108,320 for joint filers (2026 amounts have not yet
    been published). Below these thresholds, benefits can be fully or partially
    exempt. Minnesota's subtraction is tied to the federal taxable amount, so
    you only pay state tax on the portion already taxable federally.
  </p>

  <h3>Montana</h3>
  <p>
    Montana allows a deduction of up to $5,500+
    (inflation-adjusted annually) for Social Security and other retirement
    income for taxpayers age 65 and older. The deduction is reduced for
    higher-income filers based on AGI. Montana uses the federal taxable amount
    as the starting point, so only benefits that are taxable federally are
    subject to state tax.
  </p>

  <h3>New Mexico</h3>
  <p>
    New Mexico exempts Social Security benefits for single filers with AGI
    below $100,000 and joint filers below
    $150,000. Above those thresholds, benefits are taxed as
    regular income. This generous threshold means the majority of New Mexico
    retirees pay no state tax on their Social Security.
  </p>

  <h3>Rhode Island</h3>
  <p>
    Rhode Island exempts Social Security benefits for filers who have reached
    full retirement age (typically 66 to 67, depending on birth
    year) and whose federal AGI is below $107,000 for single filers or
    $133,750 for joint filers. Filers who have not reached
    full retirement age, or who exceed the income limits, may owe state tax on
    benefits.
  </p>

  <h3>Utah</h3>
  <p>
    Utah offers a nonrefundable tax credit that offsets the tax on Social
    Security benefits. The credit is available to single filers with a modified
    AGI below $54,000 and joint filers below
    $90,000. The credit phases out above those thresholds. For
    filers below the income limits, the credit effectively eliminates the state
    tax on benefits.
  </p>

  <h3>Vermont</h3>
  <p>
    Vermont provides a full exemption for single filers with AGI below
    $55,000 and joint filers below
    $70,000. Above those thresholds, a partial exemption
    applies that phases out at higher incomes. Vermont has been steadily
    increasing its exemption thresholds in recent years.
  </p>

  <InlineCTA type="calculator" />

  <h2>Recent Changes: States Eliminating Social Security Taxes</h2>

  <p>
    Several states have dropped their Social Security taxes just in the last
    few years:
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
        <td>2023 (fully exempt starting 2024)</td>
      </tr>
    </tbody>
  </table>

  <p>
    In 2020, thirteen states taxed Social Security benefits. By 2026, that
    number has dropped to just eight. If your state is on the list of 8 today,
    there's a reasonable chance it won't be in a few years.
  </p>

  <h2>States That Do Not Tax Social Security</h2>

  <p>
    The following 42 states and Washington, D.C. do not tax Social Security
    benefits. Some of these states have no income tax at all, while others
    specifically exempt Social Security from taxation.
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
    At the federal level, up to 85% of your benefits may be taxable, depending
    on your "provisional income" (AGI + tax-exempt interest + half of your
    Social Security benefits). The federal thresholds have not changed since
    1993.
  </p>

  <p>
    Living in a state that doesn't tax Social Security does not affect your
    federal tax obligation, and vice versa. For a full explanation of the
    federal calculation, see our
    <a href="/guides/federal-taxes"
      >Federal Taxation of Social Security Benefits</a
    > guide.
  </p>

  <p>
    Separately, for 2025 through 2028 there's also a new federal senior tax
    deduction of up to $6,000 for those 65 and older, which can reduce federal
    taxes on benefits. See our
    <a href="/guides/senior-tax-deduction">Senior Tax Deduction guide</a> for
    details.
  </p>

  <h2>Planning Strategies</h2>

  <p>
    Should you move to avoid the tax? Probably not just for this. Even in the
    8 taxing states, most retirees end up exempt, and other costs — property
    tax, sales tax, housing — usually matter more. If you're already choosing
    between states for other reasons, the Social Security tax is one more
    thing to weigh, but it's rarely the deciding factor.
  </p>

  <p>
    If you live in a state with income-based exemptions, keeping your AGI
    below the threshold can eliminate your state tax on Social Security.
    Timing IRA withdrawals, spreading Roth conversions across multiple years,
    and harvesting capital losses can all help. Roth conversions are worth a
    special mention: Roth distributions aren't included in AGI, so converting
    before retirement increases your income now but can keep your AGI below
    exemption thresholds later. That's especially useful in states like
    Connecticut, New Mexico, and Vermont with clear AGI cutoffs.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    <h3>Will my benefits be taxed if I move to a different state?</h3>
    <p>
      State tax depends on where you live, not where you earned your benefits.
      Move from a taxing state to a non-taxing one and the state tax goes
      away. Your federal taxes don't change either way.
    </p>

    <h3>Does my state tax Social Security the same way the federal government does?</h3>
    <p>
      No. Each of the 8 taxing states has its own rules and thresholds,
      different from the federal formula. Some start from your federal AGI,
      others use their own income measures.
    </p>
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
    To see what your own benefit would be, try the
    <a href="/calculator">ssa.tools calculator</a> with your earnings record.
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
