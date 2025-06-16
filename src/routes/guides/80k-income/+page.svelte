<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  const HeroImage = "/thoughtful_person.png"; // Using a specific image for all guides

  const title = "How much Social Security will I get if I make $80,000 / year?";
  const description =
    "Understand how your Social Security benefits are calculated if you consistently earn $80,000 per year.";
  const publishDate = new Date("2025-06-15T00:00:00+00:00"); // Current date
  const updateDate = new Date("2025-06-15T00:00:00+00:00"); // Current date

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/80k-income";
  schema.title = title;
  schema.image = HeroImage;
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
  <p class="postdate">
    Published: {publishDate.toLocaleDateString()}<br />
    Updated: {updateDate.toLocaleDateString()}
  </p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Laptop with a piggy bank, symbolizing financial planning"
    />
  </figure>

  <p>
    This guide provides an estimate of your potential Social Security benefits
    if you consistently earn $80,000 per year throughout your career.
    Understanding how your earnings translate into future benefits is crucial
    for retirement planning. We'll walk through the assumptions and calculations
    to help you get a clearer picture.
  </p>

  <h2>Assumptions for this Calculation</h2>
  <p>
    To calculate your estimated Social Security benefit, we'll make the
    following assumptions:
  </p>
  <ul>
    <li>
      You have 35 years of income at the equivalent value of today's
      <strong>$80,000</strong> per year.
    </li>
    <li>
      After indexing, your <strong
        >Average Indexed Monthly Earnings (AIME)</strong
      >
      will be $80,000 / 12 = <strong>$6,666.67</strong>.
    </li>
  </ul>

  <h2>Calculating Your Primary Insurance Amount (PIA)</h2>
  <p>
    Your <strong>Primary Insurance Amount (PIA)</strong> is the benefit you
    would receive if you start collecting Social Security at your
    <strong>Normal Retirement Age</strong>. It's calculated using a formula that
    applies "<strong>bend points</strong>" to your AIME. For 2025, the bend
    points are <strong>$1,226</strong> and <strong>$7,391</strong>.
  </p>
  <p>Here's how the calculation works for an AIME of $6,666.67:</p>
  <ul>
    <li>
      <strong>90% of the first $1,226:</strong>
      0.90 * $1,226 = <strong>$1,103.40</strong>
    </li>
    <li>
      <strong>32% of the amount over $1,226 up to $7,391:</strong>
      The amount between $1,226 and $6,666.67 is $6,666.67 - $1,226 = $5,440.67.
      0.32 * $5,440.67 = <strong>$1,741.01</strong>
    </li>
    <li>
      <strong>15% of the amount over $7,391:</strong>
      Since your AIME ($6,666.67) is not over $7,391, this portion is
      <strong>$0.00</strong>.
    </li>
  </ul>
  <p>
    <strong
      >Your estimated Primary Insurance Amount (PIA) = $1,103.40 + $1,741.01 +
      $0.00 = $2,844.41 per month.</strong
    >
  </p>

  <h2>When to Start Benefits</h2>
  <p>
    The PIA is the amount you would earn if you started benefits at your Normal
    Retirement Age. However, your actual benefit may be higher or lower based on
    when you choose to start receiving benefits.
  </p>
  <ul>
    <li>
      <strong>Starting Early:</strong> If you start benefits before your
      <strong>Normal Retirement Age</strong>
      (as early as age 62), your monthly benefit will be
      <strong>permanently reduced</strong>.
    </li>
    <li>
      <strong>Starting Later:</strong> If you delay starting benefits past your
      <strong>Normal Retirement Age</strong>
      (up to age 70), your monthly benefit will be
      <strong>permanently increased</strong>
      through <strong>delayed retirement credits</strong>.
    </li>
  </ul>

  <h2>Get Your Personalized Result</h2>
  <p>
    This guide provides an estimate based on specific assumptions. For a
    personalized calculation based on your actual earnings record and specific
    filing date choices, visit the calculator at <a href="https://ssa.tools"
      >ssa.tools</a
    >.
  </p>

  <GuideFooter />
</div>
