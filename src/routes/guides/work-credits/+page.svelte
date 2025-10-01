<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import * as constants from '$lib/constants';
  import GuideFooter from '../guide-footer.svelte';

  const title = 'Social Security Work Credits';
  const description =
    'How do work credits work and how many do I need to qualify for Social Security benefits?';
  const publishDate = new Date('2024-02-26T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/work-credits';
  schema.title = title;
  schema.image = '/laptop-piggybank.jpg'; // Added a generic hero image for the schema
  schema.datePublished = publishDate.toISOString();
  schema.description = description; // Pass the description to the schema
  schema.imageAlt = 'Laptop with piggybank representing Social Security work credits';
  schema.tags = ['Work Credits', 'Social Security', 'Eligibility', 'Quarters of Coverage'];
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>

  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Understanding work credits is crucial for anyone planning their retirement
    or considering Social Security benefits. This guide explains what work
    credits are, how to earn them, and why they matter for your Social Security
    eligibility.
  </p>

  <h2>What Are Work Credits?</h2>

  <p>
    <strong>Work credits</strong> are the building blocks of your Social Security
    eligibility. They are earned by working and paying Social Security taxes. This
    system ensures a minimum level of work contribution before qualifying for benefits.
  </p>

  <h2>How Many Work Credits Do I Need?</h2>

  <h3>For Retirement Benefits</h3>
  <p>
    <strong>You need 40 work credits to qualify for retirement benefits.</strong
    > This typically requires at least 10 years of work.
  </p>

  <h3>For Survivor's Benefits</h3>
  <p>
    The number of work credits required for your family to qualify for
    survivor's benefits depends on your age at the time of death:
  </p>
  <ul>
    <li>Younger individuals need fewer credits</li>
    <li>The maximum required is 40 credits, regardless of age</li>
  </ul>

  <h3>For Disability Benefits</h3>
  <p>
    The required number of work credits for disability benefits varies based on
    your age when you become disabled. For more details, visit the <a
      href="https://www.ssa.gov/benefits/retirement/planner/credits.html#h3"
      >official SSA website</a
    >.
  </p>

  <h2>How Do I Earn Work Credits?</h2>

  <h3>Basic Rules</h3>
  <ul>
    <li>Work credits are earned by working and paying Social Security taxes</li>
    <li>You can earn up to 4 work credits per calendar year</li>
    <li>Partial credits cannot be earned</li>
  </ul>

  <h3>Before 1987</h3>
  <p>
    One work credit was earned for each calendar quarter with at least $250 in
    wages. These were also known as "quarters of coverage" (QCs).
  </p>

  <h3>After 1987</h3>
  <p>The system changed to a yearly basis:</p>
  <ul>
    <li>One credit is earned for each fixed dollar amount of earnings</li>
    <li>The required amount changes annually to keep pace with wage growth</li>
    <li>
      Example: In 2000, you would earn one credit for each $780 of earnings
    </li>
  </ul>

  <h2>Amount of Earnings Needed per Credit</h2>

  <p>
    The earnings required to earn a credit change yearly. Here's a table showing
    the amount needed for each year since 1978:
  </p>

  <div class="earnings-container">
    {#each Object.entries(constants.EARNINGS_PER_CREDIT) as [year, earnings]}
      <div class="earnings-year">
        <span class="year">{year}:</span>
        <span class="earnings">{earnings.wholeDollars()}</span>
      </div>
    {/each}
  </div>
  <p>
    <strong>Example:</strong> In 1989, $500 earned one credit. With $1,700 in earnings
    that year, you would earn 3 credits. The extra $200 above $1,500 would not count
    towards a partial credit.
  </p>

  <h2>Qualifying for Spousal Benefits</h2>

  <p>
    <strong>Important note:</strong> To receive spousal benefits, you don't need
    to have earned work credits yourself. You only need to be married to someone
    who has earned enough work credits.
  </p>

  <h2>Additional Resources</h2>

  <ul>
    <li>
      <a href="https://www.ssa.gov/benefits/retirement/planner/credits.html"
        >Social Security Administration: How You Earn Credits</a
      >
    </li>
    <li>
      <a href="https://www.ssa.gov/benefits/retirement/planner/credits.html#h3"
        >Social Security Administration: How Many Credits You Need</a
      >
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/QC.html"
        >Social Security Administration: Quarters of Coverage</a
      >
    </li>
  </ul>

  <GuideFooter />
</div>
