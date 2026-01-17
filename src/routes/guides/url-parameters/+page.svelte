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
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
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

  <p>
    There are two ways to specify recipient data: using PIA (Primary Insurance
    Amount) or using a detailed earnings history. The earnings history approach
    provides more functionality but requires longer URLs.
  </p>

  <h3>Option 1: PIA-Based Parameters (Simple)</h3>

  <p>
    This approach is simpler and results in shorter URLs, but the calculator
    cannot show how future earnings affect your benefits.
  </p>

  <h4>For a Single Person</h4>

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

  <h4>For a Couple</h4>

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

  <h3>Option 2: Earnings History Parameters (Advanced)</h3>

  <p>
    This approach allows the calculator to show the full benefits report
    including AIME calculations, indexed earnings, and how future earnings
    affect your PIA. URLs will be longer but provide complete functionality.
  </p>

  <h4>Format</h4>

  <p>
    Earnings are specified as comma-separated year:amount pairs. For example:
    <code>earnings1=2020:50000,2021:55000,2022:60000</code>
  </p>

  <h4>For a Single Person</h4>

  <ul>
    <li>
      <code>earnings1</code> - Earnings history as year:amount pairs (required)
    </li>
    <li>
      <code>dob1</code> - Date of birth in YYYY-MM-DD format (required)
    </li>
    <li>
      <code>name1</code> - Person's name for display (optional, defaults to "Self")
    </li>
  </ul>

  <h4>For a Couple</h4>

  <ul>
    <li>
      <code>earnings2</code> - Spouse's earnings history as year:amount pairs
    </li>
    <li>
      <code>dob2</code> - Spouse's date of birth in YYYY-MM-DD format
    </li>
    <li><code>name2</code> - Spouse's name for display (optional)</li>
  </ul>

  <h4>Earnings Format Rules</h4>

  <ul>
    <li>Format: <code>year:amount,year:amount,...</code></li>
    <li>Years: 4-digit integers (1951-2100)</li>
    <li>Amounts: Dollar amounts without $ or commas</li>
    <li>Separate pairs with commas</li>
    <li>You can include as many years as needed</li>
    <li>Years do not need to be consecutive (gaps are allowed)</li>
    <li>Use 0 for years with no earnings</li>
  </ul>

  <h2>Example URLs</h2>

  <h3>PIA-Based Examples</h3>

  <h4>Single Person Example</h4>

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

  <h4>Couple Example</h4>

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

  <h3>Earnings History Examples</h3>

  <h4>Single Person with Recent Earnings</h4>

  <p>Jordan, born March 15, 1995, with three years of earnings history:</p>

  <pre><code
      >https://ssa.tools/calculator#earnings1=2020:50000,2021:55000,2022:60000&dob1=1995-03-15&name1=Jordan</code
    ></pre>

  <p>
    <a
      href="/calculator#earnings1=2020:50000,2021:55000,2022:60000&dob1=1995-03-15&name1=Jordan"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this example →</a
    >
  </p>

  <h4>Person with Longer Career History</h4>

  <p>Pat, born June 20, 1980, with 10 years of steady career progression:</p>

  <pre><code
      >https://ssa.tools/calculator#earnings1=2000:35000,2001:38000,2002:42000,2003:45000,2004:48000,2005:52000,2006:55000,2007:58000,2008:60000,2009:62000&dob1=1980-06-20&name1=Pat</code
    ></pre>

  <p>
    <a
      href="/calculator#earnings1=2000:35000,2001:38000,2002:42000,2003:45000,2004:48000,2005:52000,2006:55000,2007:58000,2008:60000,2009:62000&dob1=1980-06-20&name1=Pat"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this example →</a
    >
  </p>

  <h4>Couple with Both Earnings Histories</h4>

  <p>
    Alex and Chris, both with earnings histories showing different career paths:
  </p>

  <pre><code
      >https://ssa.tools/calculator#earnings1=2020:80000,2021:85000&dob1=1960-01-15&name1=Alex&earnings2=2020:40000,2021:42000&dob2=1962-03-10&name2=Chris</code
    ></pre>

  <p>
    <a
      href="/calculator#earnings1=2020:80000,2021:85000&dob1=1960-01-15&name1=Alex&earnings2=2020:40000,2021:42000&dob2=1962-03-10&name2=Chris"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this example →</a
    >
  </p>

  <h4>Career with Gaps (Zero Earnings Years)</h4>

  <p>Sam with a career break showing zero earnings for 2017-2018:</p>

  <pre><code
      >https://ssa.tools/calculator#earnings1=2015:50000,2016:55000,2017:0,2018:0,2019:60000,2020:65000&dob1=1980-03-20&name1=Sam</code
    ></pre>

  <p>
    <a
      href="/calculator#earnings1=2015:50000,2016:55000,2017:0,2018:0,2019:60000,2020:65000&dob1=1980-03-20&name1=Sam"
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
      data-sveltekit-reload>Try this PIA-based example →</a
    >
  </p>

  <p><strong>Using earnings history (more detailed):</strong></p>

  <pre><code
      >https://ssa.tools/calculator#earnings1=2010:60000,2011:62000,2012:65000,2013:68000,2014:70000,2015:73000,2016:75000,2017:78000,2018:80000,2019:82000,2020:85000&dob1=1960-06-15&name1=Pat&pia2=0&dob2=1962-03-10&name2=Sam</code
    ></pre>

  <p>
    <a
      href="/calculator#earnings1=2010:60000,2011:62000,2012:65000,2013:68000,2014:70000,2015:73000,2016:75000,2017:78000,2018:80000,2019:82000,2020:85000&dob1=1960-06-15&name1=Pat&pia2=0&dob2=1962-03-10&name2=Sam"
      target="_blank"
      rel="noopener noreferrer"
      data-sveltekit-reload>Try this earnings-based example →</a
    >
  </p>

  <h2>Privacy Considerations</h2>

  <p>
    URL parameters are processed entirely in the browser—no data is sent to a
    server. However, be mindful that:
  </p>

  <ul>
    <li>URLs are visible in browser history.</li>
    <li>
      Shared links expose the information (PIA/earnings and birthdate) to anyone
      who views them.
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
