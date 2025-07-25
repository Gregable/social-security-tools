<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";

  import HeroImage from "./taxes.jpg";

  const title = "Federal Taxation of Social Security Benefits";
  const description =
    "A Comprehensive Guide to Calculating the Taxability of Social Security Benefits Based on AGI.";
  const publishDate = new Date("2022-12-04T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/federal-taxes";
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
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
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="302"
      alt="Clipart depicting a tax form"
    />
  </figure>

  <p>
    As Americans, we all know that paying taxes is an important part of our
    civic duty and a crucial way to support the programs and services provided
    by our government. But when it comes to taxes and social security benefits,
    many of us are unsure of how these two things work together and how they
    impact our finances. This comprehensive guide will help you understand the
    basics of federal taxes and social security benefits, and provide you with
    the information you need to make informed decisions about your own taxes and
    benefits.
  </p>

  <h3>State Taxes</h3>

  <p>
    Your Social Security benefits can be taxed at both the state and federal
    levels. The laws differ between each state. This guide does not cover the
    state tax rules, but does explain how Social Security benefits can be taxed
    federally. If you live in one of the following 38 states, you are in luck,
    as the state does not tax Social Security benefits at all:
  </p>

  <ul class="state-list">
    <li>Alabama</li>
    <li>Alaska</li>
    <li>Arizona</li>
    <li>Arkansas</li>
    <li>California</li>
    <li>Delaware</li>
    <li>Florida</li>
    <li>Georgia</li>
    <li>Hawaii</li>
    <li>Idaho</li>
    <li>Illinois</li>
    <li>Indiana</li>
    <li>Iowa</li>
    <li>Kentucky</li>
    <li>Louisiana</li>
    <li>Maine</li>
    <li>Maryland</li>
    <li>Massachusetts</li>
    <li>Michigan</li>
    <li>Mississippi</li>
    <li>Nevada</li>
    <li>New Hampshire</li>
    <li>New Jersey</li>
    <li>New York</li>
    <li>North Carolina</li>
    <li>North Dakota</li>
    <li>Ohio</li>
    <li>Oklahoma</li>
    <li>Oregon</li>
    <li>Pennsylvania</li>
    <li>South Carolina</li>
    <li>South Dakota</li>
    <li>Tennessee</li>
    <li>Texas</li>
    <li>Virginia</li>
    <li>Washington</li>
    <li>Washington DC</li>
    <li>Wisconsin</li>
    <li>Wyoming</li>
  </ul>

  <h3>Federal Taxes</h3>

  <p>
    To compute your federal taxes, you will need to know your Adjusted Gross
    Income, Tax-exempt interest, and Social Security benefit amounts.
  </p>

  <p>
    <b>Adjusted Gross Income (AGI)</b> is a measure of an individual's total
    taxable income, calculated by taking the person's gross income (which
    includes all income from wages, salaries, investments, and other sources)
    and then subtracting certain allowable deductions, such as contributions to
    retirement accounts and certain business expenses. AGI is used by the
    Internal Revenue Service (IRS) to determine an individual's eligibility for
    certain tax deductions and credits, as well as their tax liability. AGI is
    reported on line 11 of
    <a href="https://www.irs.gov/pub/irs-pdf/f1040.pdf">Form 1040</a>, the
    standard individual income tax return form used by most taxpayers.
  </p>

  <p>
    Note that your final AGI includes the taxable portion of your Social
    Security Benefits, line 6b of <a
      href="https://www.irs.gov/pub/irs-pdf/f1040.pdf">Form 1040</a
    >. The formula for calculating the taxable portion uses the AGI minus the
    line 6b part, so as an input AGI does not include social security.
  </p>

  <p>
    <b>Tax-exempt interest</b> is interest income that is not subject to federal
    income tax. This can include interest earned on certain types of
    investments, such as municipal bonds, as well as interest income from
    certain life insurance policies. Non-taxable interest is reported on on line
    2a of
    <a href="https://www.irs.gov/pub/irs-pdf/f1040.pdf">Form 1040</a>.
    Tax-exempt interest is not added to Adjusted Gross Income (AGI), but it will
    be added back in for the purposes of computing the taxable percentage of
    Social Security Benefits.
  </p>

  <p>
    The <b>Social Security benefit</b> amount is simply the amount of money received
    from the SSA over the course of the year.
  </p>

  <p>
    With these 3 numbers in hand, one can calculate the portion of Social
    Security subject to federal taxes. The following infographic shows the
    steps, which we will then go through in detail.
  </p>

  <img
    src="/Federal_Taxation_of_SSA.png"
    width="961"
    height="359"
    style:box-shadow="0px 0px 8px rgba(0,0,0,1)" style:margin="40px auto 40px auto" style:display="block"
    alt="Infographic showing the steps to calculate the taxable portion of Social Security Benefits"
  />

  <p>(Relative size of the boxes will differ in your situation)</p>

  <p>
    The first step is to calculate a number called "Provisional Income" (PI).
    Provisional Income is your AGI (less taxable Social Security) with a few
    things added back in. Add to the AGI any Tax-exempt interest and 1/2 of your
    total Social Security Benefits.
  </p>

  <pre>
        Provisional Income = Adjusted Gross Income (AGI) before Social Security
                           + Tax-exempt interest
                           + 1/2 of total Social Security Benefits
      </pre>

  <p>
    For example, if your AGI was $30,000, Tax-exempt interest of $1,200 and
    $16,000 Social Security, your Provisional Income would be $30,000 + $1,200 +
    ($16,000 / 2) = $39,200.
  </p>

  <h3>Single Filer Calculation</h3>

  <p>For a single filer, use break points of $25,000 and $34,000.</p>

  <p>
    If your provisional income is less than the first break point, $25,000, none
    of your Social Security Benefits are federally taxable.
  </p>

  <p>
    Any provisional income between $25,000 and $34,000 is federally taxable at
    50%. If your total provisional income is between these two points, calculate
    the federally taxable amount as (PI - $25,0000) x 0.5.
  </p>

  <p>
    Any provisional income above $34,000 is federally taxable at 85%. If your
    total provisional income is above $34,000 these two points, calculate the
    federally taxable amount as (PI - $34,0000) x 0.85 + $4,500. The $4,500
    number is 50% of the the provisional income between $25,000 and $34,000.
  </p>

  <p>
    At most 85% of your Social Security Benefits are taxable, so if the above
    formula produces a result that is greater than 85% of your Social Security
    Benefits, then exactly 85% of your Social Security benefits are taxable.
  </p>

  <h3>Joint Filer Calculation</h3>

  <p>For a joint filer, use break points of $32,000 and $44,000.</p>

  <p>
    If your provisional income is less than the first break point, $32,000, none
    of your Social Security Benefits are federally taxable.
  </p>

  <p>
    Any provisional income between $32,000 and $44,000 is federally taxable at
    50%. If your total provisional income is between these two points, calculate
    the federally taxable amount as (PI - $32,0000) x 0.5.
  </p>

  <p>
    Any provisional income above $44,000 is federally taxable at 85%. If your
    total provisional income is above $34,000 these two points, calculate the
    federally taxable amount as (PI - $44,0000) x 0.85 + $6,000. The $6,000
    number is 50% of the the provisional income between $32,000 and $44,000.
  </p>

  <p>
    At most 85% of your Social Security Benefits are taxable, so if the above
    formula produces a result that is greater than 85% of your Social Security
    Benefits, then exactly 85% of your Social Security benefits are taxable.
  </p>

  <h3>Last word</h3>

  <p>
    It is important to understand how federal taxes and social security benefits
    interact and how they can impact your finances. By using the formulas and
    information provided in this guide, you can better understand your own tax
    situation and make informed decisions about your benefits. Keep in mind that
    taxes and social security benefits can be complex, so it may be helpful to
    consult with a tax professional or the Social Security Administration for
    more information and assistance.
  </p>
  <GuideFooter />
</div>

<style>
  .state-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 columns on desktop */
    gap: 10px 20px; /* Gap between rows and columns */
    padding-left: 1.5em; /* Add padding for bullets */
    margin: 1em 0; /* Adjust margin */
  }

  .state-list li {
    padding: 5px 0;
  }

  @media (max-width: 768px) {
    .state-list {
      grid-template-columns: repeat(2, 1fr); /* 2 columns on tablet */
    }
  }

  @media (max-width: 480px) {
    .state-list {
      grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile */
    }
    .state-list li {
      font-size: 0.9em; /* Smaller font size for list items on mobile */
    }
  }
</style>
