<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import InlineCTA from "../InlineCTA.svelte";
  import HeroImage from "./senior-tax-deduction.jpg";

  const title =
    "The New Senior Tax Deduction: What It Means for Social Security Recipients";
  const description =
    "The One Big Beautiful Bill Act created a new $6,000 tax deduction for seniors 65+. Learn who qualifies, income phase-outs, how it interacts with Social Security benefit taxation, and planning strategies for 2025-2028.";
  const publishDate = new Date("2026-02-02T00:00:00+00:00");
  const updateDate = new Date("2026-02-02T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/senior-tax-deduction";
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt = "Senior couple reviewing tax documents";
  schema.tags = [
    "senior tax deduction",
    "OBBB",
    "One Big Beautiful Bill",
    "Social Security taxes 2026",
    "senior standard deduction",
    "no tax on Social Security",
  ];

</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link
    rel="canonical"
    href="https://ssa.tools/guides/senior-tax-deduction"
  />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>The New Senior Tax Deduction</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="1312"
      height="736"
      alt="Senior couple reviewing tax documents"
    />
  </figure>

  <p>
    You may have heard the promise of "no tax on Social Security." What
    Congress actually passed, as part of the One Big Beautiful Bill (OBBB)
    Act, is something different: a new $6,000 deduction for people 65 and
    older, available for tax years 2025 through 2028. It doesn't change how
    benefits are taxed, but for many retirees it has a similar effect.
  </p>

  <h2>Who Qualifies</h2>

  <p>
    To claim the new senior tax deduction, you must be age 65 or older by the
    end of the tax year (the same rule used for the existing additional
    standard deduction for seniors) and provide a valid Social Security
    number. If you're married, you must file a joint return — married filing
    separately does not qualify.
  </p>

  <h2>Deduction Amount</h2>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Tax Year</th>
        <th>Per Person</th>
        <th>Joint (Both 65+)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>2025-2028</td>
        <td>$6,000</td>
        <td>$12,000</td>
      </tr>
    </tbody>
  </table>

  <p>
    If only one spouse in a joint return is 65 or older, the couple receives
    half the joint amount ($6,000 instead of $12,000).
  </p>

  <h2>Income Phase-Outs</h2>

  <p>
    The deduction is reduced for higher-income filers based on modified
    adjusted gross income (MAGI). It phases out by $60 for every $1,000 of
    MAGI above the threshold.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Filing Status</th>
        <th>Phase-Out Begins</th>
        <th>Fully Phased Out</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Single</td>
        <td>$75,000</td>
        <td>$175,000</td>
      </tr>
      <tr>
        <td>Married Filing Jointly</td>
        <td>$150,000</td>
        <td>$250,000</td>
      </tr>
    </tbody>
  </table>

  <p>
    For example, Carol is single, age 68, with a MAGI of $95,000 in 2026.
    That's $20,000 over the $75,000 threshold, so her deduction is reduced by
    20 x $60 = $1,200. She can deduct $4,800 instead of the full $6,000.
  </p>

  <InlineCTA type="calculator" />

  <h2>How It Stacks with Existing Deductions</h2>

  <p>
    The new senior tax deduction is in addition to both the regular standard
    deduction and the existing additional standard deduction for taxpayers 65
    and older. It does not replace either.
  </p>

  <p>
    A single filer age 67 in 2026 would get the standard deduction (estimated
    ~$16,150), plus the existing additional senior deduction (~$2,000), plus
    the new $6,000 — a total of about $24,150. A single senior with gross
    income at or below that amount would owe zero federal income tax.
  </p>

  <p>
    A married couple filing jointly, both age 66, would get the standard
    deduction (~$32,300), plus two existing senior additions (~$3,200), plus
    two of the new deductions ($12,000) — about $47,500 in total.
  </p>

  <h2>Impact on Social Security Benefit Taxation</h2>

  <p>
    Does this mean Social Security is no longer taxed? Not exactly. The
    <a href="/guides/federal-taxes">provisional income formula</a> that decides
    how much of your benefit is taxable hasn't changed at all. Up to 85% of
    benefits can still be included in taxable income under the same rules that
    have been in place since 1993.
  </p>

  <p>
    What the deduction does is reduce your overall taxable income after that
    calculation. Your provisional income (AGI + tax-exempt interest + half of
    Social Security) is figured the same way as before, and so is the taxable
    portion of your benefits. The new deduction then reduces your taxable
    income, potentially to zero.
  </p>

  <p>
    In practice, most retirees — roughly 90% of Social Security recipients —
    will end up owing no federal tax on their benefits while this deduction is
    in effect, even though the benefits are still technically taxable.
  </p>

  <p>
    Consider Bob, single, age 68, in 2026, with $20,000 in Social Security
    benefits and $15,000 in pension income. His provisional income is $15,000
    + ($20,000 / 2) = $25,000, which is at the threshold for single filers, so
    none of his Social Security is taxable. That leaves an AGI of $15,000
    against roughly $24,150 in total deductions. His taxable income is $0, and
    he owes no federal tax.
  </p>

  <h2>Planning Strategies</h2>

  <p>
    If your income is near the phase-out thresholds, it's worth paying
    attention to what counts toward MAGI. Roth conversions, required minimum
    distributions, and realized capital gains all increase it. If you're
    planning Roth conversions, you might keep them small enough to stay below
    the threshold — or do larger conversions in years when you wouldn't
    qualify for the deduction anyway. The same thinking applies to spreading
    asset sales across multiple years, harvesting capital losses, and timing
    your first RMD if you have flexibility there.
  </p>

  <p>
    Going the other direction, if you're still working at 65 or older,
    contributions to a traditional 401(k) or IRA reduce your MAGI and can
    help keep you under the threshold.
  </p>

  <h2>This Is a Temporary Provision</h2>

  <p>
    The deduction applies only to tax years 2025 through 2028. Congress could
    extend it, but as the law stands today, 2028 is the last year. Don't build
    a long-term plan around it.
  </p>

  <h2>Learn More</h2>

  <p>
    For the official IRS guidance on this provision, see the
    <a
      href="https://www.irs.gov/newsroom/one-big-beautiful-bill-act-tax-deductions-for-working-americans-and-seniors"
      >IRS newsroom announcement</a
    >.
  </p>

  <p>
    For a detailed explanation of how Social Security benefits are taxed
    federally, including the provisional income formula, see our
    <a href="/guides/federal-taxes"
      >Federal Taxation of Social Security Benefits</a
    > guide. For information about working while receiving benefits, see our
    <a href="/guides/earnings-test">Earnings Test</a> guide.
  </p>

  <p>
    To see what your own benefit would be, try the
    <a href="/calculator">ssa.tools calculator</a> with your earnings record.
  </p>

  <GuideFooter />
</div>

<style>
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
