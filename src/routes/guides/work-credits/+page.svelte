<script lang="ts">
import { EARNINGS_PER_CREDIT, MAX_CREDITS, MAX_YEAR } from '$lib/constants';
import { GuidesSchema, renderFAQSchema, type FAQItem } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';

const currentYear = MAX_YEAR;
const currentYearCredit = EARNINGS_PER_CREDIT[currentYear];
const requiredCredits = MAX_CREDITS;

const title = 'Social Security Work Credits: How Many Do You Need?';
const description =
  `Learn how Social Security work credits work and how many you need to qualify for benefits. In ${currentYear}, you need ${currentYearCredit.wholeDollars()} in earnings per credit, and ${requiredCredits} total credits (about 10 years of work) for retirement benefits.`;
const publishDate = new Date('2024-02-26T00:00:00+00:00');
const updateDate = new Date('2024-02-26T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/work-credits';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Laptop with piggybank representing Social Security work credits';
schema.tags = [
  'Work Credits',
  'Social Security',
  'Eligibility',
  'Quarters of Coverage',
  String(currentYear),
];

// FAQ structured data for featured snippets
const faqs: FAQItem[] = [
  {
    question: 'How many work credits do I need for Social Security?',
    answer: `You need ${requiredCredits} work credits to qualify for Social Security retirement benefits. Since you can earn a maximum of 4 credits per year, this typically requires at least 10 years of work. The number required for disability or survivor benefits may vary based on your age.`,
  },
  {
    question: `How do I earn Social Security work credits in ${currentYear}?`,
    answer: `In ${currentYear}, you earn 1 work credit for each ${currentYearCredit.wholeDollars()} in earnings, up to a maximum of 4 credits per year. You earn credits by working and paying Social Security taxes. The earnings amount required per credit increases each year to keep pace with wage growth.`,
  },
  {
    question: 'Do I need work credits for spousal benefits?',
    answer: 'No, you do not need to have earned work credits yourself to receive spousal benefits. You qualify for spousal benefits through your spouse\'s work history. This also applies to divorced spouses who were married for at least 10 years.',
  },
  {
    question: 'What are quarters of coverage?',
    answer: 'Quarters of coverage is another term for work credits. Before 1978, one credit was earned for each calendar quarter with at least $50 in wages. Since 1978, credits are based on annual earnings rather than quarterly, but the term "quarters of coverage" is still sometimes used.',
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
    <h3>Quick Facts</h3>
    <ul>
      <li><strong>{requiredCredits} credits needed</strong> for retirement benefits (about 10 years of work)</li>
      <li><strong>Maximum 4 credits per year</strong> — you can't earn more than 4 in any calendar year</li>
      <li><strong>{currentYear}: {currentYearCredit.wholeDollars()} per credit</strong> — the amount needed increases each year</li>
      <li><strong>Spousal benefits don't require credits</strong> — you qualify through your spouse's work history</li>
    </ul>
  </div>

  <p>
    Understanding work credits is crucial for anyone planning their retirement
    or considering Social Security benefits. This guide explains what work
    credits are, how to earn them, and why they matter for your Social Security
    eligibility.
  </p>

  <h2>What Are Work Credits?</h2>

  <p>
    <strong>Work credits</strong> (also called "quarters of coverage") are the
    building blocks of your Social Security eligibility. They are earned by
    working and paying Social Security taxes. This system ensures a minimum
    level of work contribution before qualifying for benefits.
  </p>

  <h2>How Many Work Credits Do I Need?</h2>

  <h3>For Retirement Benefits</h3>
  <p>
    <strong>You need {requiredCredits} work credits to qualify for retirement benefits.</strong>
    Since you can earn a maximum of 4 credits per year, this typically requires
    at least 10 years of work.
  </p>

  <h3>For Survivor's Benefits</h3>
  <p>
    The number of work credits required for your family to qualify for
    survivor's benefits depends on your age at the time of death:
  </p>
  <ul>
    <li>Younger individuals need fewer credits</li>
    <li>The maximum required is {requiredCredits} credits, regardless of age</li>
  </ul>

  <h3>For Disability Benefits</h3>
  <p>
    The required number of work credits for disability benefits varies based on
    your age when you become disabled. Generally, you need credits earned in
    recent years. For more details, visit the <a
      href="https://www.ssa.gov/benefits/retirement/planner/credits.html#h3"
      >official SSA website</a
    >.
  </p>

  <h2>How Do I Earn Work Credits?</h2>

  <h3>Current Rules ({currentYear})</h3>
  <ul>
    <li>Work credits are earned by working and paying Social Security taxes</li>
    <li>You can earn up to <strong>4 work credits per calendar year</strong></li>
    <li>In {currentYear}, you earn 1 credit for each <strong>{currentYearCredit.wholeDollars()}</strong> of earnings</li>
    <li>Partial credits cannot be earned — you need the full amount for each credit</li>
  </ul>

  <h3>Historical Background</h3>
  <p>
    Before 1978, one work credit was earned for each calendar quarter with at
    least $50 in wages. These were called "quarters of coverage" (QCs). The
    system changed to a yearly earnings-based approach starting in 1978.
  </p>

  <h2>Earnings Required Per Credit by Year</h2>

  <p>
    The earnings required to earn a credit increases yearly to keep pace with
    wage growth. Here's the amount needed for each year since 1978:
  </p>

  <div class="earnings-container">
    {#each Object.entries(EARNINGS_PER_CREDIT) as [year, earnings]}
      <div class="earnings-year" class:current-year={Number(year) === currentYear}>
        <span class="year">{year}:</span>
        <span class="earnings">{earnings.wholeDollars()}</span>
      </div>
    {/each}
  </div>

  <div class="example-box">
    <h4>Example: How Credits Work</h4>
    <p>
      In {currentYear}, you need {currentYearCredit.wholeDollars()} in earnings for each credit.
      If you earn {currentYearCredit.times(4).wholeDollars()} or more during the year, you'll
      receive all 4 credits. Earning {currentYearCredit.times(2.5).floorToDollar().wholeDollars()}
      would give you 2 credits — the extra amount above {currentYearCredit.times(2).wholeDollars()}
      doesn't count toward a third credit.
    </p>
  </div>

  <h2>Spousal Benefits and Work Credits</h2>

  <p>
    <strong>Important:</strong> To receive <a href="/guides/spousal-benefit-filing-date">spousal benefits</a>,
    you don't need to have earned work credits yourself. You only need to be
    married to someone who has earned enough work credits. This also applies to
    divorced spouses who were married for at least 10 years.
  </p>

  <h2>Check Your Credits</h2>

  <p>
    You can check how many work credits you've earned by creating an account at
    <a href="https://www.ssa.gov/myaccount/">my Social Security</a>. Your
    Statement will show your total credits earned and whether you're eligible
    for benefits.
  </p>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/aime">AIME Guide</a> — Once you have 40 credits, learn how
      your earnings are averaged to calculate your benefit
    </li>
    <li>
      <a href="/guides/pia">PIA Guide</a> — How your averaged earnings become your
      monthly benefit amount
    </li>
    <li>
      <a href="/guides/earnings-cap">Earnings Cap</a> — The annual limit on earnings
      that count toward both credits and benefits
    </li>
    <li>
      <a href="/guides/spousal-benefit-filing-date">Spousal Benefits</a> — How to
      receive benefits without earning credits yourself
    </li>
  </ul>

  <p>
    Use the <a href="/calculator">SSA.tools calculator</a> to see your complete
    earnings history and projected benefits based on your work record.
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

<style>
  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  .key-takeaways {
    background-color: #e8f4fd;
    border: 2px solid #4a90e2;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2c5282;
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

  .example-box {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px 20px;
    margin: 20px 0;
  }

  .example-box h4 {
    margin-top: 0;
    color: #2c3e50;
  }

  .example-box p {
    margin-bottom: 0;
  }

  .earnings-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    margin: 20px 0;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  .earnings-year {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .earnings-year.current-year {
    background-color: #d4edda;
    font-weight: bold;
  }

  .year {
    color: #666;
  }

  .earnings {
    font-weight: 500;
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
