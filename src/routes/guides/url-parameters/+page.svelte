<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';
  import chainLinkImage from './chain-link.jpg'; // imported so bundler serves asset

  const title = 'Sharing Social Security Scenarios with URL Parameters';
  const description =
    'Learn how to use URL parameters to link directly to the SSA.tools calculator with preloaded scenarios. Perfect for financial advisors, educators, or sharing examples with family and friends.';
  const publishDate = new Date('2025-10-07T00:00:00+00:00');
  const updateDate = new Date('2025-10-07T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/url-parameters';
  schema.title = title;
  schema.image = chainLinkImage; // use bundled image path
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt =
    'Sharing Social Security calculator scenarios using URL parameters';
  schema.tags = [
    'URL Parameters',
    'Calculator',
    'Social Security',
    'Link Sharing',
    'Financial Planning',
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

  <div class="hero-image">
    <img
      src={chainLinkImage}
      alt="Sharing Social Security calculator scenarios using URL parameters"
      width="1024"
      height="682"
      loading="lazy"
    />
  </div>

  <p>
    The SSA.tools calculator supports URL parameters that allow you to create
    shareable links with preloaded scenarios. This feature is invaluable for
    financial advisors explaining concepts to clients, educators demonstrating
    Social Security principles, or simply sharing benefit comparisons with
    family members.
  </p>

  <h2>Why Use URL Parameters?</h2>

  <p>
    Rather than manually entering earnings records and birthdates each time you
    want to show someone a specific scenario, you can encode that information
    directly in the URL. When someone clicks your link, the calculator will
    automatically load with your specified parameters.
  </p>

  <h2>Basic URL Structure</h2>

  <p>
    URL parameters are added to the calculator URL using a hash (#) followed by
    parameter pairs. The basic format is:
  </p>

  <pre><code>https://ssa.tools/calculator#pia1=VALUE&dob1=DATE&name1=NAME</code
    ></pre>

  <h2>Available Parameters</h2>

  <h3>For a Single Person</h3>

  <ul>
    <li>
      <code>pia1</code> - Primary Insurance Amount in dollars (required)
    </li>
    <li>
      <code>dob1</code> - Date of birth in YYYY-MM-DD format (required)
    </li>
    <li>
      <code>name1</code> - Person's name for display (optional, defaults to "Self")
    </li>
  </ul>

  <h3>For a Couple</h3>

  <p>To include a spouse, add the corresponding parameters with "2" suffix:</p>

  <ul>
    <li>
      <code>pia2</code> - Spouse's Primary Insurance Amount in dollars
    </li>
    <li>
      <code>dob2</code> - Spouse's date of birth in YYYY-MM-DD format
    </li>
    <li><code>name2</code> - Spouse's name for display (optional)</li>
  </ul>

  <h2>Example URLs</h2>

  <h3>Single Person Example</h3>

  <p>
    A single person named Alex with a PIA of $3,000, born September 21, 1965:
  </p>

  <pre><code
      >https://ssa.tools/calculator#pia1=3000&dob1=1965-09-21&name1=Alex</code
    ></pre>

  <p>
    <a
      href="/calculator#pia1=3000&dob1=1965-09-21&name1=Alex"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this example →</a
    >
  </p>

  <h3>Couple Example</h3>

  <p>
    Alex (PIA $1,000) and Chris (PIA $0, eligible for spousal benefits only):
  </p>

  <pre><code
      >https://ssa.tools/calculator#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=0&dob2=1965-09-28&name2=Chris</code
    ></pre>

  <p>
    <a
      href="/calculator#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=0&dob2=1965-09-28&name2=Chris"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this example →</a
    >
  </p>

  <h3>Real-World Use Case: Spousal Benefits</h3>

  <p>
    This feature is particularly useful for demonstrating spousal benefit
    scenarios. For example, showing how a spouse with zero PIA (no work history)
    can receive spousal benefits based on their partner's earnings:
  </p>

  <pre><code
      >https://ssa.tools/calculator#pia1=2500&dob1=1960-06-15&name1=Pat&pia2=0&dob2=1962-03-10&name2=Sam</code
    ></pre>

  <p>
    <a
      href="/calculator#pia1=2500&dob1=1960-06-15&name1=Pat&pia2=0&dob2=1962-03-10&name2=Sam"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this spousal benefits example →</a
    >
  </p>

  <h2>How to Find Your PIA</h2>

  <p>
    To use URL parameters effectively, you need to know your Primary Insurance
    Amount (PIA). Here's how to find it:
  </p>

  <ol>
    <li>
      <strong>Use the full calculator first:</strong> Paste your earnings record
      from ssa.gov and enter your birthdate using the standard SSA.tools interface
    </li>
    <li>
      <strong>Note your PIA:</strong> The calculator will display your Primary Insurance
      Amount in the report
    </li>
    <li>
      <strong>Create your URL:</strong> Use that PIA value along with your birthdate
      to construct a shareable URL
    </li>
  </ol>

  <p>
    Learn more about how PIA is calculated in our comprehensive <a
      href="/guides/pia">Primary Insurance Amount (PIA) guide</a
    >.
  </p>

  <h2>Privacy Considerations</h2>

  <p>
    URL parameters are processed entirely in the browser—no data is sent to a
    server. However, be mindful that:
  </p>

  <ul>
    <li>URLs are visible in browser history.</li>
    <li>
      Shared links expose the PIA and birthdate information to anyone who views
      them.
    </li>
    <li>
      Use generic examples (not real personal data) when sharing publicly or in
      educational settings.
    </li>
  </ul>

  <h2>Related Resources</h2>

  <ul>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> - Understanding what
      PIA is and how it's calculated
    </li>
    <li>
      <a href="/guides/aime">Averaged Indexed Monthly Earnings (AIME)</a> - How your
      earnings history determines your PIA
    </li>
    <li>
      <a href="/guides/filing-date-chart">Navigate the Filing Date Chart</a> - Understanding
      the calculator's output
    </li>
    <li>
      <a href="/guides/spousal-benefit-filing-date"
        >Deep look at Spousal Benefits and Filing Dates</a
      > - Complex scenarios involving couples
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
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

  .hero-image {
    text-align: center;
    margin: 2rem 0;
  }

  .hero-image img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  .guide-page h1 {
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
  }

  .guide-page h2 {
    color: #34495e;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  .guide-page h3 {
    color: #555;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .guide-page a {
    color: #3498db;
    text-decoration: none;
  }

  .guide-page a:hover {
    text-decoration: underline;
  }

  .guide-page ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  .guide-page ol {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  .guide-page li {
    margin: 0.5rem 0;
  }

  pre {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1em;
    overflow-x: auto;
    font-size: 0.75em;
    margin: 1.5em 0;
  }

  code {
    background-color: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre code {
    background-color: transparent;
    padding: 0;
  }

  @media (max-width: 768px) {
    .guide-page {
      padding: 1rem;
    }
  }
</style>
