<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';
import type { SponsorCopy } from '$lib/sponsor';

const sponsorCopy: SponsorCopy = {
  intro: "If WEP once cut your benefit, your corrected amount and any back pay are worth a second look. You can review them with a Social Security specialist at",
  outro: "to confirm the repeal was applied to your record.",
  bullets: [
    "They can tell whether your payment reflects the repeal, and what to do if it does not.",
    "A pension alongside Social Security also reshapes your tax picture, which this guide doesn't cover.",
    "The first call is free, and you pick the time.",
  ],
};

const title = 'Windfall Elimination Provision (WEP): What It Was and Why It No Longer Applies';
const description =
  'Was WEP repealed? Yes! Learn about the Windfall Elimination Provision, the Social Security rule that reduced benefits for teachers and public employees for 42 years before its repeal in January 2025.';
const publishDate = new Date('2026-01-16T00:00:00+00:00');
const updateDate = new Date('2026-01-16T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/wep';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Social Security calculator showing benefit estimates without WEP reduction';
schema.tags = [
  'Windfall Elimination Provision',
  'WEP',
  'WEP repeal',
  'Social Security',
  'Government Pension Offset',
  'GPO',
  'Social Security Fairness Act',
  'teacher pension',
  'non-covered pension',
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    For 42 years, teachers, firefighters, police officers, and other public
    employees would look at their Social Security check and wonder why it was
    smaller than expected. The answer was usually the Windfall Elimination
    Provision, or WEP. This rule reduced Social Security benefits for anyone
    with a pension from employment not covered by Social Security, a so-called
    "non-covered pension."
  </p>

  <p>
    On January 5, 2025, President Biden signed the Social Security Fairness
    Act, repealing both WEP and its companion provision, the Government Pension
    Offset (GPO). This guide explains what WEP was, who it affected, and what
    the repeal means for you.
  </p>

  <p>
    This is also why this site doesn't have a WEP calculator: there's nothing
    left to calculate. The ssa.tools calculator uses the standard Social
    Security benefit formula for everyone. If you previously would have been
    subject to WEP, your benefit is now computed the same way as anyone else's.
  </p>

  <h2>Was WEP Repealed?</h2>

  <p>
    Yes. The Social Security Fairness Act (H.R. 82) eliminated the Windfall
    Elimination Provision effective January 2024 (retroactively). The law was
    signed on January 5, 2025. WEP is no longer in effect, and the WEP
    reduction no longer applies to any Social Security beneficiary.
  </p>

  <p>
    If you're searching for a "WEP calculator" to estimate your benefit reduction,
    you no longer need one. Your Social Security benefits are now calculated using
    the standard formula that applies to all workers.
  </p>

  <h2>What Was the Windfall Elimination Provision?</h2>

  <p>
    The WEP was enacted as part of the Social Security Amendments of 1983, signed
    by President Reagan. Congress designed it to address what it viewed as an
    unintended flaw in the benefit formula.
  </p>

  <p>
    Social Security's formula is deliberately progressive, using a tiered system
    based on your <a href="/guides/aime">Averaged Indexed Monthly Earnings (AIME)</a>:
  </p>

  <ul>
    <li>90% of the first bracket of AIME (for lower earners)</li>
    <li>32% of the second bracket</li>
    <li>15% of earnings above that</li>
  </ul>

  <p>
    The problem arose when workers split careers between jobs covered by Social
    Security and jobs that were <em>not</em> covered, such as state government
    positions with separate pension systems. Years in non-covered employment
    showed as zeros in their Social Security earnings records, making them
    <em>appear</em> to be low-wage workers entitled to the generous 90% replacement
    rate, even if their government salaries were substantial.
  </p>

  <p>
    Congress considered this an unintended "windfall." The WEP solution reduced
    the first-bracket factor from 90% to as low as 40% for workers with fewer
    than 30 years of "substantial" Social Security-covered earnings.
  </p>

  <h2>The 30 Years of Substantial Earnings Rule</h2>

  <p>
    Workers with 30 or more years of substantial earnings under Social Security
    were always exempt from WEP. Their benefits were never reduced.
    "Substantial earnings" meant earning above a threshold amount that increased
    each year (about $31,275 in 2024).
  </p>

  <p>
    Workers with 20 or fewer years of substantial covered employment faced the
    maximum WEP reduction, which reached $587 per month in 2024. Workers with
    21-29 years received graduated relief:
  </p>

  <table class="wep-table">
    <thead>
      <tr>
        <th>Years of Substantial Earnings</th>
        <th>First Bracket Factor</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>30 or more</td><td>90% (no reduction)</td></tr>
      <tr><td>29</td><td>85%</td></tr>
      <tr><td>28</td><td>80%</td></tr>
      <tr><td>27</td><td>75%</td></tr>
      <tr><td>26</td><td>70%</td></tr>
      <tr><td>25</td><td>65%</td></tr>
      <tr><td>24</td><td>60%</td></tr>
      <tr><td>23</td><td>55%</td></tr>
      <tr><td>22</td><td>50%</td></tr>
      <tr><td>21</td><td>45%</td></tr>
      <tr><td>20 or fewer</td><td>40% (maximum reduction)</td></tr>
    </tbody>
  </table>

  <h2>Who Was Affected by WEP?</h2>

  <p>
    WEP affected approximately 2.1 million beneficiaries at its peak, about 4%
    of all retired-worker beneficiaries. The provision applied to workers who
    received a pension from employment where they didn't pay Social Security
    taxes:
  </p>

  <ul>
    <li>
      Teachers with state pensions in 15 states (including California, Texas,
      Ohio, Massachusetts, and Illinois). This was one of the most common WEP
      scenarios.
    </li>
    <li>
      State and local government employees in 26 states with separate pension
      systems
    </li>
    <li>
      Federal employees hired before January 1, 1984, under the Civil Service
      Retirement System (CSRS)
    </li>
    <li>Police officers and firefighters in many jurisdictions</li>
    <li>Workers with foreign pensions from non-covered employment</li>
    <li>Some nonprofit workers in positions that opted out of Social Security</li>
  </ul>

  <p>
    Contrary to common misconception, approximately 72% of state and local
    public employees worked in Social Security-covered positions and were
    never affected by WEP. The provision applied only to the roughly 6.5 million
    workers (about 28% of the public sector workforce) whose employers opted out
    of Social Security in favor of separate pension systems.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>What's the Difference Between WEP and GPO?</h2>

  <p>
    Working alongside WEP was the Government Pension Offset (GPO), enacted even
    earlier in 1977. While WEP reduced a worker's <em>own</em> retirement
    benefits, GPO targeted <em>spousal and survivor benefits</em>, reducing
    them by two-thirds of the recipient's government pension.
  </p>

  <p>
    The GPO could take a big bite. A widow with a $900 monthly government
    pension would see her Social Security survivor benefit cut by $600. If her
    survivor benefit would have been $800, the GPO eliminated it entirely. By
    December 2023, 71% of those affected by GPO lost their entire Social
    Security spousal or survivor benefit.
  </p>

  <p>
    The provision disproportionately affected women: 83% of the approximately
    746,000 GPO-affected beneficiaries were female, many of them widows of
    workers who had paid into Social Security their entire careers.
  </p>

  <p>
    Both WEP and GPO were repealed together by the Social Security Fairness Act.
  </p>

  <h2>The Social Security Fairness Act of 2025</h2>

  <p>
    After decades of advocacy, the Social Security Fairness Act (H.R. 82)
    finally passed with overwhelming bipartisan support:
  </p>

  <ul>
    <li>House vote (November 12, 2024): 327-75</li>
    <li>Senate vote (December 21, 2024): 76-20</li>
    <li>Signed into law: January 5, 2025</li>
  </ul>

  <p>
    President Biden called it "a matter of honoring the promise that we made to
    public servants."
  </p>

  <h2>How Do I Get My WEP Money Back?</h2>

  <p>
    If you were already receiving reduced benefits due to WEP or GPO, you don't
    need to do anything. The Social Security Administration automatically
    recalculated benefits and issued retroactive lump-sum payments.
  </p>

  <p>
    The SSA completed implementation five months ahead of schedule. By July 2025,
    the agency had processed over 3.1 million payments totaling $17 billion in
    retroactive benefits, covering the period from January 2024 (when the
    repeal took effect retroactively) through the implementation date.
  </p>

  <p>The benefit increases varied based on individual circumstances:</p>

  <table class="wep-table">
    <thead>
      <tr>
        <th>Beneficiary Type</th>
        <th>Average Monthly Increase</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>WEP-affected workers</td><td>~$360</td></tr>
      <tr><td>GPO-affected spouses</td><td>~$700</td></tr>
      <tr><td>GPO-affected survivors</td><td>~$1,190</td></tr>
    </tbody>
  </table>

  <p>
    For workers who faced the maximum WEP reduction, monthly benefits increased
    by $500-600 or more. Retroactive lump-sum payments typically amounted to
    several thousand dollars.
  </p>

  <p>
    One tax note: if you received a retroactive lump-sum payment in 2025, that
    payment is taxable income for 2025 and will be reflected on your 1099 form
    issued in January 2026.
  </p>

  <h2>Why Critics Called WEP Unfair</h2>

  <p>
    Beyond the basic "windfall" rationale, WEP and GPO drew persistent
    criticism. The reductions were largely invisible until retirement: annual
    Social Security statements showed projected benefits <em>without</em>
    accounting for WEP or GPO, so workers often didn't find out until their
    first check arrived smaller than the statement had promised. Workers who
    took second careers in public service also got a raw deal, paying Social
    Security taxes on their covered work but receiving little or no additional
    benefit for it.
  </p>

  <p>
    Critics also pointed to a double standard: private sector workers with
    pensions faced no equivalent reduction. A corporate executive with both a
    401(k) and Social Security received full benefits from both; a teacher with
    a state pension did not.
  </p>

  <h2>The Fiscal Trade-Off</h2>

  <p>
    The repeal came with a substantial price tag. The Congressional Budget Office
    estimated the 10-year cost at $195.7 billion. Critics warned the
    legislation would advance Social Security's projected insolvency date by
    approximately six months.
  </p>

  <p>
    Advocates countered that the cost (roughly 1% of total Social Security
    expenditures over the period) was justified to correct decades of unfairness.
    They noted the provisions had already taken an estimated $60 billion from
    affected workers and their families.
  </p>

  <h2>If You Were Affected by WEP or GPO</h2>

  <p>
    If you were already receiving benefits, your monthly payment should already
    reflect the increased amount, and your retroactive lump sum should have
    arrived. If you haven't yet applied, you can now apply for benefits using
    the standard formula; there is no longer any WEP or GPO reduction. The
    ssa.tools calculator shows your benefits using the standard
    <a href="/guides/pia">PIA formula</a> with no WEP adjustment, because WEP no
    longer exists.
  </p>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    <h3>Is WEP still in effect?</h3>
    <p>
      No. WEP was repealed effective January 2024 and no longer reduces
      anyone's Social Security benefits.
    </p>

    <h3>Do I need a WEP calculator?</h3>
    <p>
      Not anymore. There is no WEP reduction to calculate. The standard
      <a href="/calculator">ssa.tools calculator</a> will estimate your
      benefits.
    </p>

    <h3>I have a teacher pension, CSRS pension, or foreign pension. Will my Social Security be reduced?</h3>
    <p>
      No. All of these non-covered pensions used to trigger WEP, but since the
      repeal they no longer affect your Social Security calculation.
    </p>

    <h3>Will I get back pay for WEP?</h3>
    <p>
      If you were already receiving benefits before the repeal, the SSA
      automatically sent retroactive payments covering January 2024 through mid-2025.
      Most affected beneficiaries received these payments by July 2025.
    </p>
  </div>

  <h2>Calculate Your Benefits</h2>

  <p>
    Ready to see your Social Security benefits? Use the
    <a href="/calculator">ssa.tools calculator</a> to estimate your monthly
    payment. Simply paste your earnings record from ssa.gov, and the calculator
    will compute your <a href="/guides/pia">Primary Insurance Amount</a> using
    the standard formula, the same formula that now applies to everyone, including
    teachers, government employees, and anyone who previously would have been
    subject to WEP.
  </p>

  <GuideFooter />
</div>

<style>
  .wep-table {
    width: fit-content;
    max-width: 80%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .wep-table th,
  .wep-table td {
    padding: 10px 25px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .wep-table th:first-child,
  .wep-table td:first-child {
    text-align: right;
  }

  .wep-table th {
    background-color: #e9ecef;
    font-weight: 600;
  }

  .wep-table tbody tr:hover {
    background-color: #f5f5f5;
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
    .wep-table {
      font-size: 14px;
    }

    .wep-table th,
    .wep-table td {
      padding: 8px 10px;
    }
  }
</style>
