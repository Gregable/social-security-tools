<script lang="ts">
import { GuidesSchema, renderFAQSchema, type FAQItem } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';

const title = 'Will Social Security Run Out of Money?';
const description =
  "Social Security's trust fund is projected to be depleted by 2034, but benefits won't disappear. Learn what happens when the fund runs out, how much benefits might be reduced, and what Congress could do to fix it.";
const publishDate = new Date('2023-08-11T00:00:00+00:00');
const updateDate = new Date('2023-08-11T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/will-social-security-run-out';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Laptop with piggybank representing Social Security program solvency';
schema.tags = [
  'Social Security Solvency',
  'Trust Fund',
  'Program Future',
  'Retirement Security',
  'Benefits',
];

// FAQ structured data for featured snippets
const faqs: FAQItem[] = [
  {
    question: 'Will Social Security run out of money?',
    answer:
      "The Social Security trust fund is projected to be depleted by 2034, but Social Security will not disappear. Even after the trust fund runs out, payroll taxes will continue to fund about 74% of scheduled benefits. Benefits would only stop entirely if Congress eliminated the payroll tax.",
  },
  {
    question: 'What happens when the Social Security trust fund runs out?',
    answer:
      "Once the trust fund surplus runs out, Social Security will only be able to pay benefits from current payroll tax collections. This would cover approximately 74% of scheduled benefits. Without Congressional action, benefits could be reduced by about 26%.",
  },
  {
    question: 'Will Social Security be there when I retire?',
    answer:
      "Yes, Social Security will almost certainly exist when you retire. The program is extremely popular and has strong political support. While changes may be needed to ensure full solvency, the program has been reformed before (in 1983) and will likely be reformed again rather than eliminated.",
  },
  {
    question: 'How could Congress fix Social Security?',
    answer:
      "Congress has several options: increase the payroll tax rate, raise the retirement age, lift the earnings cap on taxable wages, adjust benefit formulas, change cost-of-living adjustments, or some combination of these approaches. Most experts expect a bipartisan solution before benefits would be cut.",
  },
];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <div class="key-takeaways">
    <h3>The Short Answer</h3>
    <ul>
      <li><strong>Social Security will not disappear</strong> — even if the trust fund is depleted, payroll taxes will continue funding benefits</li>
      <li><strong>Current projection: 2034</strong> — the trust fund surplus is expected to run out</li>
      <li><strong>Worst case: 26% reduction</strong> — if nothing changes, benefits could be reduced by about 26%</li>
      <li><strong>Congress has options</strong> — multiple legislative solutions exist to prevent or minimize cuts</li>
    </ul>
  </div>

  <h2>Is Social Security Running Out of Money?</h2>
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

  <h2>What Happens When the Trust Fund Is Depleted?</h2>
  <p>
    Once the surplus runs out, the program will still be collecting money, and
    those collections will cover all but 26% of the current payments. So, if
    nothing changes by 2034, the calculated benefit may be reduced by 26%,
    but the payments will still continue. This is probably the "worst case"
    scenario.
  </p>
  <p>
    More information: <a
      href="https://www.ssa.gov/policy/docs/ssb/v70n3/v70n3p111.html"
      >The Future Financial Status of the Social Security Program</a
    >
  </p>

  <InlineCTA type="projectionlab" />

  <h2>How Could Congress Fix Social Security?</h2>
  <p>
    There are multiple mechanisms by which Congress could conceivably fix the
    Social Security deficit, which would have less of an impact than the worst
    case scenario. What will ultimately happen is unknown. Some of the ideas
    that have been <a
      href="https://www.ssa.gov/OACT/solvency/provisions/index.html">proposed</a
    > include:
  </p>
  <ul>
    <li>Increase the payroll tax which funds the program</li>
    <li>Raise the ages at which benefits begin</li>
    <li>
      Change the method by which inflation adjustments are made to a more slowly
      rising value
    </li>
    <li>
      Change the <a href="/guides/pia">bend points</a> or ratios for the PIA formula
    </li>
    <li>Reduce the number of years from which benefits are calculated</li>
    <li>Reduce the spousal benefit</li>
    <li>Invest a percentage of the fund in equities</li>
  </ul>

  <h2>Will Social Security Go Away Completely?</h2>
  <p>
    It is unlikely that the program will go away entirely, due to its
    popularity. What approach will be taken is unknown — it is up to Congress
    to decide how to address the issue. It is likely that some combination of
    the above solutions will be used.
  </p>

  <p>
    Regardless of what happens with the trust fund, understanding your current
    benefits is still valuable. Use the <a href="/calculator">SSA.tools calculator</a>
    to see your projected benefits based on your actual earnings record.
  </p>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> — How your benefit
      amount is calculated using the bendpoint formula
    </li>
    <li>
      <a href="/guides/earnings-cap">Earnings Cap</a> — The income limit that funds
      Social Security through payroll taxes
    </li>
    <li>
      <a href="/guides/work-credits">Work Credits</a> — The 40 credits you need
      to qualify for retirement benefits
    </li>
    <li>
      <a href="/guides/maximum">Maximum Benefit</a> — The highest monthly benefit
      you could receive today
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  .key-takeaways {
    background-color: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #856404;
    font-size: 1.2em;
  }

  .key-takeaways ul {
    margin: 0;
    padding-left: 20px;
  }

  .key-takeaways li {
    margin: 10px 0;
    line-height: 1.5;
  }

  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }
</style>
