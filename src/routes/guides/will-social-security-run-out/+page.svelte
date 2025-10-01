<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';

  const title = 'Will Social Security run out?';
  const description =
    "And what happens if it does? Learn more about the Social Security Trust Fund, how it's slowly running out, and how what happens next could affect your benefits.";
  const publishDate = new Date('2023-08-11T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/will-social-security-run-out';
  schema.title = title;
  schema.image = '/laptop-piggybank.jpg'; // Added a generic hero image for the schema
  schema.datePublished = publishDate.toISOString();
  schema.description = description; // Pass the description to the schema
  schema.imageAlt =
    'Laptop with piggybank representing Social Security program solvency';
  schema.tags = [
    'Social Security Solvency',
    'Trust Fund',
    'Program Future',
    'Retirement Security',
  ];
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

  <h2>Running out of money</h2>
  <p>
    You may have heard that the Social Security program is running out of money.
    This is technically true, but only part of the story. Social Security is
    both paying out money to retirees and also collecting money from workers at
    the same time. Over its 80-year history, the program has collected more
    money than it has paid out. The current surplus is $3 trillion. However, in
    recent years the program is paying out more than it is collecting, and so
    the fund is shrinking. Current estimates are that the fund will run out in
    2034.
  </p>
  <h2>What happens next</h2>
  <p>
    Once the surplus runs out, the program will still be collecting money, and
    those collections will cover all but 26% of the current payments. So, if
    nothing changes by 2034, the calculated benefit may be be reduced by 26%,
    but the payments will still continue. This is probably the 'worst case'
    scenario.
  </p>
  <p>
    More information: <a
      href="https://www.ssa.gov/policy/docs/ssb/v70n3/v70n3p111.html"
      >The Future Financial Status of the Social Security Program</a
    >
  </p>
  <p>
    There are multiple mechanisms by which Congress could conceivably 'fix' the
    Social Security deficit, which would have less of an impact than the 'worst
    case' scenario. What will ultimately happen is unknown. Some of the ideas
    that have been <a
      href="https://www.ssa.gov/OACT/solvency/provisions/index.html">proposed</a
    >
    include:
  </p>
  <ul>
    <li>Increase the payroll tax which funds the program.</li>
    <li>Raise the ages at which benefits begin.</li>
    <li>
      Change the method by which inflation adjustments are made to a more slowly
      rising value.
    </li>
    <li>
      Change the bend points or ratios for the curve of annual indexed earnings.
    </li>
    <li>Reduce the number of years from which benefits are calculated.</li>
    <li>Reduce the spousal benefit.</li>
    <li>Invest a percentage of the fund in equities.</li>
  </ul>
  <p>
    What approach will be taken is unknown. It is up to Congress to decide how
    to address the issue. It is likely that some combination of the above will
    be used. It is also unlikely that the program will go away entirely, due to
    it's popularity.
  </p>
  <GuideFooter />
</div>
