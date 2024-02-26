<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import * as constants from "$lib/constants";
  import GuideFooter from "../guide-footer.svelte";

  const title = "Social Security Work Credits";
  const description =
    "How do work credits work and how many do I need to qualify for Social Security benefits?";
  const publishDate = new Date("2024-02-26T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/work-credits";
  schema.title = title;
  schema.datePublished = publishDate.toISOString();
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

  <p>
    In order to qualify for Social Security benefits, you need to have earned
    enough work credits. Work credits are earned by working and paying Social
    Security taxes. This mechanism forms a kind of "minimum" required work to
    qualify for benefits.
  </p>

  <h2>How Many Work Credits Do I Need?</h2>

  <p>
    For retirement benefits, you need 40 work credits to qualify. This requires
    at least 10 years of work.
  </p>
  <p>
    For survivor's benefits, for a spouse or child, the number of work credits
    that you must have earned in order for your family members to qualify
    depends on your age at the time of your death. The younger you are, the
    fewer credits are required. However, no one needs more than 40 credits to be
    eligible for any Social Security benefit.
  </p>
  <p>
    This site doesn't currently have support for disability benefits, but the
    number of work credits required for disability benefits depends on your age
    at the time you become disabled. See <a
      href="https://www.ssa.gov/benefits/retirement/planner/credits.html#h3"
      >ssa.gov</a
    > for more information.
  </p>

  <h2>How Do I Earn Work Credits?</h2>

  <p>
    You earn work credits by working and paying Social Security taxes on wages.
    Each calendar year you work, you may be eligible to earn up to 4 work
    credits, but never more.
  </p>
  <p>
    In years before 1987, you could earn one work credit for each calendar
    quarter where you earned at least $250 in wages. Thus the 4 credits per
    year. You may also see "quarters of coverage" (QCs) mentioned in some
    places. This is the same thing as work credits.
  </p>
  <p>
    After 1987, the quarters requirement was removed and instead you earn one
    credit a year for each fixed dollar amount of earnings, up to 4 credits per
    year. The amount of earnings required to earn a credit changes each year. It
    is adjusted to keep pace with wage growth. For example, in year 2000, you
    would earn one credit for each $780 of earnings.
  </p>
  <p>You cannot earn partial credits.</p>

  <h2>Amount of earnings needed per credit</h2>

  <p>
    The amount of earnings needed to earn a credit changes each year. See the
    following table for the amount of earnings needed to earn a credit for each
    year after 1978:
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
    For example, in 1989 the amount of earnings needed to earn a credit was
    $500. Therefore someone with $1,700 in earnings in 1989 would earn 3
    credits. The extra $200 in earnings above $1,500 would not earn partial
    credits.
  </p>

  <h2>Qualifying for Spousal Benefits</h2>

  <p>
    Note that to receive spousal benefits from a spouse's work record, you do
    not need to have earned work credits yourself. You only need to be married
    to someone who has earned enough work credits.
  </p>

  <h2>Additional Links</h2>

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

<style>
  .earnings-container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    width: 100%;
    font-size: 1.3rem;
    padding: 1rem 0;
  }
  .earnings-year {
    padding: 0.5rem;
    flex-grow: 1;
  }
  .year {
    font-weight: bold;
    padding-right: 0.5rem;
    padding-left: 1rem;
  }
  .earnings {
    display: inline-block;
    width: 4em;
  }
</style>
