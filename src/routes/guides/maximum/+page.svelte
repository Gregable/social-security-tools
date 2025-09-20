<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';

  const title = 'Social Security Maximum';
  const description =
    'What is the maximum monthly social security benefit that someone can reach, and what does it take to reach this maximum?';
  const publishDate = new Date('2019-08-03T00:00:00+00:00');
  const updateDate = new Date('2025-03-19T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/maximum';
  schema.title = title;
  schema.image = '/laptop-piggybank.jpg'; // Added a generic hero image for the schema
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
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>
  <p>
    Few people will receive the maximum possible benefit, but how high is the
    maximum? The short answer is that the maximum monthly Social Security
    benefit that an individual who files a claim in 2025 can receive is:
  </p>
  <blockquote style:font-size="18px">
    <b>$5,108 / month</b>
  </blockquote>
  <p>In order to reach this high of a benefit, someone must have:</p>
  <ul>
    <li>Waited until age 70 to file for benefits</li>
    <li>
      Earned at least the maximum taxable earnings for at least 35 years of
      their life.
    </li>
  </ul>
  <p>
    You can see what the per-year maximum taxable earnings are from the Social
    Security Adminstration's
    <a href="https://www.ssa.gov/OACT/COLA/cbb.html"
      >maximum taxble income table</a
    >.
  </p>

  <h2>Different filing ages</h2>
  <p>At other filing ages, the maximum possible benefit would be smaller:</p>
  <p></p>
  <ul>
    <li>$4,018 / month at age 67</li>
    <li>$2,831 / month at age 62</li>
  </ul>
  <p>
    The <a href="/">social security calculator</a> will allow you to see the benefit
    at any starting age, for any earnings record.
  </p>
  <h2>Spousal benefit</h2>
  <p>
    The spouse of someone earning the maximum monthly benefit would also be
    eligible to earn a spousal benefit on the same record of as much as half of
    the primary earner's benefit at age 67, aka the <a href="/guides/pia"
      >"primary insurance amount"</a
    >.
  </p>
  <p>
    In the case of the primary earner earning the maximum benefit of $5,108 /
    month, the spouse would also be eligible for an additional maximum benefit
    of $2,009 / month. This would take the total benefit for this family to
    $7,117 / month. If the spouse also had maxed out his or her own record, the
    total benefit for the two maximum personal benefits is simply double a
    single personal benefit, which is $10,216 / month.
  </p>
  <GuideFooter />
</div>
