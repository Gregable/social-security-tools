<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';

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
    <strong>Why was my Social Security lower than expected?</strong> For 42 years,
    the answer for millions of teachers, firefighters, police officers, and other
    public servants was the <strong>Windfall Elimination Provision</strong> (WEP).
    This rule reduced Social Security benefits for anyone with a pension from
    employment not covered by Social Security—a so-called "non-covered pension."
  </p>

  <p>
    On January 5, 2025, President Biden signed the <strong>Social Security
    Fairness Act</strong>, repealing both WEP and its companion provision, the
    Government Pension Offset (GPO). This guide explains what WEP was, who it
    affected, and what the repeal means for you.
  </p>

  <div class="highlight-box">
    <strong>Why SSA.tools Doesn't Need a WEP Calculator:</strong> Because WEP was
    repealed in January 2025, the SSA.tools calculator uses the standard Social
    Security benefit formula for all users. If you previously would have been
    subject to WEP, your benefits are now calculated the same way as everyone
    else's—no WEP adjustment needed.
  </div>

  <h2>Was WEP Repealed?</h2>

  <p>
    <strong>Yes, WEP was repealed.</strong> The Social Security Fairness Act
    (H.R. 82) eliminated the Windfall Elimination Provision effective January 2024
    (retroactively). The law was signed on January 5, 2025. WEP is no longer in
    effect, and the WEP reduction no longer applies to any Social Security
    beneficiary.
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
    <li><strong>90%</strong> of the first bracket of AIME (for lower earners)</li>
    <li><strong>32%</strong> of the second bracket</li>
    <li><strong>15%</strong> of earnings above that</li>
  </ul>

  <p>
    The problem arose when workers split careers between jobs covered by Social
    Security and jobs that were <em>not</em> covered—such as state government
    positions with separate pension systems. Years in non-covered employment
    showed as zeros in their Social Security earnings records, making them
    <em>appear</em> to be low-wage workers entitled to the generous 90% replacement
    rate, even if their government salaries were substantial.
  </p>

  <p>
    Congress considered this an unintended "windfall." The WEP solution reduced
    the first-bracket factor from 90% to as low as <strong>40%</strong> for
    workers with fewer than 30 years of "substantial" Social Security-covered
    earnings.
  </p>

  <h2>The 30 Years of Substantial Earnings Rule</h2>

  <p>
    Workers with <strong>30 or more years of substantial earnings</strong> under
    Social Security were always exempt from WEP—their benefits were never reduced.
    "Substantial earnings" meant earning above a threshold amount that increased
    each year (about $31,275 in 2024).
  </p>

  <p>
    Workers with 20 or fewer years of substantial covered employment faced the
    maximum WEP reduction—which reached <strong>$587 per month in 2024</strong>.
    Workers with 21-29 years received graduated relief:
  </p>

  <div class="formula-box">
    <h3>WEP Reduction Scale (Before Repeal)</h3>
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
  </div>

  <h2>Who Was Affected by WEP?</h2>

  <p>
    WEP affected approximately <strong>2.1 million beneficiaries</strong> at its
    peak, representing about 4% of all retired-worker beneficiaries. The provision
    targeted workers who received a non-covered pension—a pension from employment
    where they didn't pay Social Security taxes:
  </p>

  <ul>
    <li>
      <strong>Teachers with state pensions</strong> in 15 states (including
      California, Texas, Ohio, Massachusetts, and Illinois)—the "teacher pension
      Social Security" problem was one of the most common WEP scenarios
    </li>
    <li>
      <strong>State and local government employees</strong> in 26 states with
      separate pension systems
    </li>
    <li>
      <strong>Federal employees</strong> hired before January 1, 1984, under the
      Civil Service Retirement System (CSRS)—the CSRS pension triggered WEP for
      these workers
    </li>
    <li><strong>Police officers and firefighters</strong> in many jurisdictions</li>
    <li>
      <strong>Workers with foreign pensions</strong>—a foreign pension from
      non-covered employment could also trigger WEP
    </li>
    <li><strong>Some nonprofit workers</strong> in positions that opted out of Social Security</li>
  </ul>

  <p>
    Contrary to common misconception, approximately <strong>72% of state and local
    public employees</strong> worked in Social Security-covered positions and were
    never affected by WEP. The provision applied only to the roughly 6.5 million
    workers—about 28% of the public sector workforce—whose employers opted out
    of Social Security in favor of separate pension systems.
  </p>

  <h2>What's the Difference Between WEP and GPO?</h2>

  <p>
    Working alongside WEP was the <strong>Government Pension Offset</strong> (GPO),
    enacted even earlier in 1977. While WEP reduced a worker's <em>own</em>
    retirement benefits, GPO targeted <em>spousal and survivor benefits</em>—reducing
    them by <strong>two-thirds</strong> of the recipient's government pension.
  </p>

  <p>
    The GPO's impact was often devastating. A widow receiving a $900 monthly
    government pension would see her Social Security survivor benefit reduced by
    $600. If her survivor benefit would have been $800, the GPO eliminated it
    entirely. By December 2023, <strong>71% of those affected by GPO lost their
    entire Social Security spousal or survivor benefit</strong>.
  </p>

  <p>
    The provision disproportionately affected women: <strong>83%</strong> of the
    approximately 746,000 GPO-affected beneficiaries were female, many of them
    widows of workers who had paid into Social Security their entire careers.
  </p>

  <p>
    Both WEP and GPO were repealed together by the Social Security Fairness Act.
  </p>

  <h2>The Social Security Fairness Act of 2025</h2>

  <p>
    After decades of advocacy, the <strong>Social Security Fairness Act</strong>
    (H.R. 82) finally passed with overwhelming bipartisan support:
  </p>

  <ul>
    <li><strong>House vote (November 12, 2024):</strong> 327-75</li>
    <li><strong>Senate vote (December 21, 2024):</strong> 76-20</li>
    <li><strong>Signed into law:</strong> January 5, 2025</li>
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
    the agency had processed over <strong>3.1 million payments totaling $17
    billion</strong> in retroactive benefits—covering the period from January 2024
    (when the repeal took effect retroactively) through the implementation date.
  </p>

  <p>The benefit increases varied based on individual circumstances:</p>

  <div class="formula-box">
    <h3>Average Monthly Increases After Repeal</h3>
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
  </div>

  <p>
    For workers who faced the maximum WEP reduction, monthly benefits increased
    by $500-600 or more. Retroactive lump-sum payments typically amounted to
    several thousand dollars.
  </p>

  <h2>Why Critics Called WEP Unfair</h2>

  <p>
    Beyond the basic "windfall" rationale, WEP and GPO faced persistent criticism:
  </p>

  <ul>
    <li>
      <strong>Hidden impact:</strong> Annual Social Security statements showed
      projected benefits <em>without</em> accounting for WEP/GPO reductions,
      leaving workers shocked at retirement when their actual benefits were far
      lower than expected.
    </li>
    <li>
      <strong>Perverse incentives:</strong> Workers considering second careers
      in public service faced effective tax rates exceeding 100% on their Social
      Security contributions—they paid taxes into the system but received no
      additional benefits due to WEP.
    </li>
    <li>
      <strong>Double standard:</strong> Private sector workers with pensions
      faced no equivalent reduction. A corporate executive with both a 401(k)
      and Social Security received full benefits from both; a teacher with a
      state pension did not.
    </li>
  </ul>

  <h2>The Fiscal Trade-Off</h2>

  <p>
    The repeal came with a substantial price tag. The Congressional Budget Office
    estimated the 10-year cost at <strong>$195.7 billion</strong>. Critics warned
    the legislation would advance Social Security's projected insolvency date by
    approximately six months.
  </p>

  <p>
    Advocates countered that the cost—roughly 1% of total Social Security
    expenditures over the period—was justified to correct decades of unfairness.
    They noted the provisions had already taken an estimated $60 billion from
    affected workers and their families.
  </p>

  <h2>What This Means for You Today</h2>

  <p>
    If you were previously affected by WEP or GPO:
  </p>

  <ul>
    <li>
      <strong>Already receiving benefits:</strong> Your monthly payment should
      already reflect the increased amount. The SSA automatically recalculated
      benefits and issued retroactive lump-sum payments.
    </li>
    <li>
      <strong>Haven't yet applied:</strong> You can now apply for benefits using
      the standard formula. There is no longer any WEP or GPO reduction.
    </li>
    <li>
      <strong>Using SSA.tools:</strong> The calculator shows your benefits using
      the standard <a href="/guides/pia">PIA formula</a> with no WEP adjustment,
      because WEP no longer exists.
    </li>
  </ul>

  <div class="highlight-box">
    <strong>Tax Note:</strong> If you received a retroactive lump-sum payment in
    2025, that payment is taxable income for 2025 and will be reflected on your
    1099 form issued in January 2026.
  </div>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    <h3>Is WEP still in effect?</h3>
    <p>
      No. WEP was repealed effective January 2024. The Windfall Elimination
      Provision no longer reduces anyone's Social Security benefits.
    </p>

    <h3>Do I need a WEP calculator?</h3>
    <p>
      No. Since WEP was repealed, there is no WEP reduction to calculate. You can
      use the standard <a href="/calculator">SSA.tools calculator</a> to estimate
      your benefits.
    </p>

    <h3>I have a teacher pension. Will my Social Security be reduced?</h3>
    <p>
      No. Before 2025, teachers in certain states with non-covered pensions had
      their Social Security reduced by WEP. This is no longer the case. Your
      teacher pension will not affect your Social Security calculation.
    </p>

    <h3>I have a CSRS pension. Does WEP apply to me?</h3>
    <p>
      No. Federal employees with Civil Service Retirement System (CSRS) pensions
      were previously subject to WEP, but the provision has been repealed. Your
      CSRS pension no longer affects your Social Security benefits.
    </p>

    <h3>I have a foreign pension. Am I affected by WEP?</h3>
    <p>
      No. Foreign pensions from non-covered employment previously triggered WEP,
      but since WEP was repealed, your foreign pension no longer affects your
      Social Security benefits.
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
    <a href="/calculator">SSA.tools calculator</a> to estimate your monthly
    payment. Simply paste your earnings record from ssa.gov, and the calculator
    will compute your <a href="/guides/pia">Primary Insurance Amount</a> using
    the standard formula—the same formula that now applies to everyone, including
    teachers, government employees, and anyone who previously would have been
    subject to WEP.
  </p>

  <GuideFooter />
</div>

<style>
  .formula-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .formula-box h3 {
    margin-top: 0;
    color: #2c3e50;
    text-align: center;
  }

  .wep-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .wep-table th,
  .wep-table td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .wep-table th {
    background-color: #e9ecef;
    font-weight: 600;
  }

  .wep-table tbody tr:hover {
    background-color: #f5f5f5;
  }

  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #4a90e2;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
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
      padding: 6px 8px;
    }
  }
</style>
