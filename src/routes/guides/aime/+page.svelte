<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';

  const title = 'Averaged Indexed Monthly Earnings (AIME)';
  const description =
    'Learn how AIME (Average Indexed Monthly Earnings) is calculated and why it matters for your Social Security benefits. Comprehensive guide with examples.';
  const publishDate = new Date('2025-09-19T00:00:00+00:00');
  const updateDate = new Date('2025-09-19T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/aime';
  schema.title = title;
  schema.image = '/laptop-piggybank.jpg';
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt =
    'Laptop with piggybank representing Social Security AIME calculations';
  schema.tags = [
    'AIME',
    'Average Indexed Monthly Earnings',
    'Social Security',
    'Benefits Calculation',
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
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    Your Social Security benefits are fundamentally based on a single key
    calculation: your <strong>Averaged Indexed Monthly Earnings</strong> (AIME).
    Understanding how this number is calculated is crucial to understanding your
    Social Security benefits and how different earning patterns throughout your career
    affect your retirement income.
  </p>

  <h2>What is AIME?</h2>

  <p>
    The Averaged Indexed Monthly Earnings (AIME) is the monthly average of your
    highest 35 years of earnings, adjusted over time by wage growth. This single
    number forms the foundation for calculating your Primary Insurance Amount
    (PIA), which determines your actual Social Security benefit amount.
  </p>

  <div class="highlight-box">
    <strong>Key Point:</strong> AIME is calculated using your top 35 years of
    <em>indexed</em> earnings, not your raw earnings. This indexing process adjusts
    your historical earnings to account for wage growth over time.
  </div>

  <h2>The Three-Step AIME Calculation Process</h2>

  <h3>Step 1: Index Your Earnings</h3>

  <p>
    Social Security doesn't use your raw earnings from each year. Instead, it
    applies <strong>wage indexing multipliers</strong> to adjust your historical
    earnings to reflect wage growth. These multipliers scale your earnings from each
    year to be equivalent to wages in the year you turn 60.
  </p>

  <p>
    For example, if you earned $30,000 in 1995 and the indexing factor for 1995
    is 2.1, your indexed earnings for that year would be $63,000 ($30,000 x 2.1
    = $63,000). This adjustment ensures that your earlier career earnings aren't
    diminished by years of wage inflation.
  </p>

  <p>
    The indexing multipliers increase every year until you reach age 60, after
    which point they are fixed. Years after age 60 use a 1.0 multiplier (no
    indexing). For more detailed information about how these indexing factors
    work and why SSA.tools uses current year factors for younger recipients, see
    our
    <a href="/guides/indexing-factors">Indexing Factors guide</a>.
  </p>

  <p>
    It's important to note that your earnings in any given year are also subject
    to the <strong>annual earnings cap</strong>. Only earnings up to this cap
    count toward your Social Security benefits. For detailed information about
    how these caps work and their historical values, see our
    <a href="/guides/earnings-cap">Earnings Cap guide</a>.
  </p>

  <h3>Step 2: Select Your Top 35 Years</h3>

  <p>
    Once all your earnings are indexed, Social Security takes your highest 35
    years of indexed earnings. If you have fewer than 35 years of earnings,
    zeros are used for the missing years.
  </p>

  <p>
    This means that if you have more than 35 years of earnings, only your
    highest 35 count toward your benefit calculation. Lower earning years are
    effectively ignored. Conversely, if you have fewer than 35 years, every
    additional year you work will likely increase your AIME.
  </p>

  <div class="example-box">
    <h4>Example: Impact of the 35-Year Rule</h4>
    <p>
      Consider someone with 40 years of earnings. Their top 35 years have
      indexed earnings ranging from $45,000 to $75,000, while their bottom 5
      years have indexed earnings of $20,000 to $35,000. Only the top 35 years
      count toward their AIME calculation—the lower 5 years are completely
      ignored.
    </p>
  </div>

  <h3>Step 3: Calculate the Monthly Average</h3>

  <p>
    Your AIME is calculated by summing your top 35 years of indexed earnings and
    dividing by 420 months (35 years × 12 months). The formula is
    straightforward:
  </p>

  <div class="formula-box">
    <strong
      >AIME = Total of Top 35 Indexed Earnings ÷ 35 years ÷ 12 months</strong
    >
  </div>

  <p>
    The result is always rounded down to the nearest dollar. For example, if
    your calculation yields $3,847.83, your AIME would be $3,847.
  </p>

  <h2>Why AIME Matters</h2>

  <p>
    Your AIME directly determines your <a href="/guides/pia"
      >Primary Insurance Amount (PIA)</a
    > through a progressive benefit formula. The Social Security Administration applies
    different percentage rates to different portions of your AIME:
  </p>

  <ul>
    <li>
      90% of the first portion of your AIME (up to the first "bend point")
    </li>
    <li>
      32% of the middle portion (between the first and second bend points)
    </li>
    <li>15% of any remaining amount above the second bend point</li>
  </ul>

  <p>
    For a detailed explanation of how these bend points work and their
    implications for your benefits, see our comprehensive
    <a href="/guides/pia">Primary Insurance Amount (PIA) guide</a>.
  </p>

  <p>
    This progressive structure means that Social Security provides higher
    replacement rates for lower earners while still providing meaningful
    benefits for higher earners.
  </p>

  <h2>Strategies to Maximize Your AIME</h2>

  <h3>Work at Least 35 Years</h3>

  <p>
    Since AIME is based on 35 years of earnings, working fewer than 35 years
    means zeros are averaged into your calculation. Each additional year of work
    (up to 35) will replace a zero and increase your AIME.
  </p>

  <h3>Continue Working After 35 Years</h3>

  <p>
    If you already have 35 years of earnings, additional years can still help if
    your current earnings exceed your lowest indexed earning years. Each
    high-earning year can replace a lower earning year in your top 35.
  </p>

  <h3>Maximize Earnings Within the Cap</h3>

  <p>
    Since only earnings up to the annual cap count toward Social Security,
    there's no benefit calculation advantage to earning above the cap in any
    given year. However, consistently earning at or near the cap will maximize
    your AIME.
  </p>

  <h2>Common AIME Misconceptions</h2>

  <h3>"My Recent High Earnings Will Dramatically Boost My Benefits"</h3>

  <p>
    While recent high earnings can help, remember that AIME is an average over
    35 years. A few high-earning years late in your career may improve your
    AIME, but the impact is diluted across the entire 35-year period.
  </p>

  <h3>"Working Past Age 60 Doesn't Affect Indexing"</h3>

  <p>
    While it's true that earnings after age 60 aren't indexed (they use a 1.0
    multiplier), they can still improve your AIME if they're higher than your
    lowest earning years in your top 35.
  </p>

  <h3>"I Need to Work Until 65 to Maximize My Benefits"</h3>

  <p>
    Your AIME calculation is independent of when you choose to claim benefits.
    You could stop working at 55 and your AIME would be fixed based on your
    earnings history through that point. However, continuing to work and earn
    can improve your AIME by replacing lower earning years.
  </p>

  <h2>Using SSA.tools to Understand Your AIME</h2>

  <p>
    The <a href="/">SSA.tools calculator</a> provides detailed information about
    your AIME calculation. When you input your earnings record, you can see:
  </p>

  <ul>
    <li>Your indexed earnings for each year</li>
    <li>Which years are included in your top 35</li>
    <li>Your total indexed earnings and resulting AIME</li>
    <li>How future earnings scenarios might affect your AIME</li>
  </ul>

  <p>
    The calculator also shows you the "cutoff" indexed earnings amount—the
    lowest indexed earning year in your top 35. Any future year where your
    indexed earnings exceed this amount will improve your AIME.
  </p>

  <h2>Conclusion</h2>

  <p>
    Understanding your AIME is fundamental to understanding your Social Security
    benefits. This single number, representing your average monthly earnings
    over your highest 35 years (adjusted for wage growth), determines your
    Primary Insurance Amount and ultimately your benefit payments.
  </p>

  <p>
    By understanding how AIME is calculated, you can make more informed
    decisions about your career, retirement timing, and overall financial
    planning. Whether you're early in your career or approaching retirement,
    knowing how your earning patterns affect this crucial calculation can help
    you optimize your Social Security benefits.
  </p>

  <GuideFooter />
</div>

<style>
  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #0066cc;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .example-box {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .example-box h4 {
    margin-top: 0;
    color: #333;
  }

  .formula-box {
    background-color: #fff5ee;
    border: 2px solid #ff8c00;
    border-radius: 4px;
    padding: 1rem;
    margin: 1.5rem 0;
    text-align: center;
    font-size: 1.1em;
  }

  .guide-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    line-height: 1.6;
  }

  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 2rem;
  }

  h1 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
  }

  h2 {
    color: #34495e;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  h3 {
    color: #555;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  a {
    color: #3498db;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
  }

  @media (max-width: 768px) {
    .guide-page {
      padding: 1rem;
    }
  }
</style>
