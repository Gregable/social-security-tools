<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import HeroImage from "./hero.png";

  import EarningsRecordExampleImage from "./example-earnings-record-simplified.jpg";

  const title = "Social Security and Inflation";
  const description =
    "Learn how two different types of inflation, wage increase and consumer price index, each interact to affect your social security benefit.";
  const publishDate = new Date("2018-11-23T00:00:00+00:00");
  const updateDate = new Date("2020-07-19T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/inflation";
  schema.title = title;
  schema.image = HeroImage; // Added HeroImage to schema
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description; // Pass the description to the schema
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>
  {@html schema.render()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">November 23, 2018</p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Chalkboard with unintelligble mathematics writing"
    />
  </figure>

  <p>
    Many people know that the inflation rate reduces the real value of their
    savings every year. For example, using CPI data, $1 had the same spending
    power in year 1950 as $7.13 did in year 2000. Therefore, when considering
    social security benefits over multiple decades, it is worth understanding
    how the inflation index will impact those benefits.
  </p>
  <p>
    The short answer is that the Social Security program is designed to account
    for inflation, as is this site's
    <a href="/">social security calculator tool</a>. The benefit estimates that
    the Social Security Administration and this tool will give you are in
    "today's dollars" meaning that the actual benefits will be higher to match
    the increase in inflation between today and the benefit date, but will have
    the same purchasing power at that time as the estimate has today.
  </p>
  <p>
    For example, if this tool estimates your benefit at $1,000 per year starting
    in 20 years, but there is 350% inflation during those 20 years, then the
    actual benefit will be $3,500 ($1,000 x 350%).
  </p>
  <p>
    If you want to understand this in even more detail, read on below to
    understand how different measures of inflation affect different parts of the
    social security computation.
  </p>
  <h2>Wage Growth Adjustments during your working years</h2>
  <p>Consider the following example earnings record from 2005 to 2017:</p>
  <img
    src={EarningsRecordExampleImage}
    style:margin="auto" style:display="block"
    alt="Example earnings record"
  />
  <p>
    This person receives a 2.5% raise every year to keep up with inflation. In
    2005, they earned $40,000 and in 2016 they earned $56,483, a 31.2% increase.
  </p>
  <p>
    The "Primary Insurance Amount" for this person, which is the earnings
    computation upon which their benefit is based, is computed from the
    rightmost column, labelled Indexed Earnings. Note that the indexed earnings
    value in 2005 is roughly the same as in 2016.
  </p>
  <p>
    This difference in Indexed Earnings is because of the multiplier applied.
    That multiplier is 1.32 in 2005, representing the fact that there has been
    ~32% inflation between 2005 and 2016. As such, older earnings records get
    adjusted upwards for inflation. Every year until you first collect your
    benefit, the multiplier for all previous years will be adjusted upwards
    further.
  </p>
  <p>
    This adjustment is made based on the
    <a href="https://www.ssa.gov/oact/cola/awidevelop.html">
      Average Wage Index (AWI).
    </a> That is, if the average wage increased by 3% in a year, so will the Average
    Wage Index and thus all of the prior year's indexed earnings values.
  </p>
  <p>
    The Social Security Administration maintains estimated (a guess) indexing
    factors for future years. You can see the estimates
    <a href="https://www.ssa.gov/oact/TR/TRassum.html">here</a> and calculate
    your estimated indexing factors based on your year of eligibility
    <a href="https://www.ssa.gov/oact/cola/awifactors.html">here</a>. If you
    don't know which year you are eligible for benefits, use the
    <a href="/">social security calculator tool</a> to compute it.
  </p>
  <h2>Cost of Living Adjustments during your benefit years</h2>
  <p>
    Once you have filed for your benefit, you no longer receive additional Wage
    Growth Adjustments. At this point, your Primary Insurance amount, and thus
    your benefit, are adjusted annually by
    <a href="https://www.ssa.gov/cola">Cost of Living Adjustments</a>.
  </p>
  <p>
    These adjustments are based on the
    <a href="https://www.ssa.gov/oact/STATS/cpiw.html">
      Consumer Price Index (CPI-W)</a
    >. Every year, benefits are increased by a few percent. There has never been
    a decrease, but there have been years with no increase when there was little
    to no actual inflation.
  </p>
  <p>
    Future Cost of Living Adjustments are not shown in the
    <a href="/">social security calculator tool</a> since the actual adjustment value
    won't be known until the future. Therefore any benefits shown by this calculator
    are displayed in "today's dollars".
  </p>
  <GuideFooter />
</div>
