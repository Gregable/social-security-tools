<script lang="ts">
import type { ComponentType, SvelteComponent } from 'svelte';
import { onMount } from 'svelte';
import Header from '$lib/components/Header.svelte';
import { loadIntroBanner } from '$lib/integrations/config';
import { activeIntegration } from '$lib/integrations/context';
import CombinedDemoMp4 from '$lib/videos/combined-demo.mp4';
import CombinedDemoPoster from '$lib/videos/combined-demo-poster.jpg';
import CopyPasteDemoMp4 from '$lib/videos/copy-paste-demo.mp4';
import CopyPasteDemoPoster from '$lib/videos/copy-paste-demo-poster.jpg';
import {
  WebSiteSchema,
  OrganizationSchema,
  renderWebsiteSocialMeta,
} from '$lib/schema-org';

const title = 'SSA.tools: A Social Security Calculator';
const description =
  'Free Social Security calculator for 2026. Estimate your retirement benefits, find your optimal filing age (62-70), and see how your AIME and PIA affect your monthly payment.';
const url = 'https://ssa.tools';
const imageAlt = 'Social Security retirement benefits calculator showing estimated monthly payments';

const websiteSchema = new WebSiteSchema();
websiteSchema.url = url;
websiteSchema.name = 'SSA.tools';
websiteSchema.description = description;

const organizationSchema = new OrganizationSchema();

let IntroBannerComponent: ComponentType<SvelteComponent> | null = null;

onMount(() => {
  // Load integration banner if an integration is active
  // (integration is already initialized by root layout)
  const unsubscribe = activeIntegration.subscribe(async (integration) => {
    if (integration) {
      IntroBannerComponent = await loadIntroBanner(integration.id);
    } else {
      IntroBannerComponent = null;
    }
  });

  return () => {
    unsubscribe();
  };
});
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />

  <!-- Open Graph / Social Meta Tags -->
  {@html renderWebsiteSocialMeta({ url, title, description, imageAlt })}

  <!-- Structured Data -->
  {@html websiteSchema.render()}
  {@html organizationSchema.render()}

  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet" />

  <!-- Google tag (gtag.js) -->
  <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=AW-16669721864"
  >
  </script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag('js', new Date());

    gtag('config', 'AW-16669721864');
  </script>
</svelte:head>

<Header />

{#if IntroBannerComponent && $activeIntegration}
  <svelte:component this={IntroBannerComponent} />
{/if}

<main>
  <div class="jumbotron-grid">
    <div>
      <h1><span id="understand">Understand</span> Social Security</h1>
      <div class="bigbtn">
        <a class="bigbtn" href="calculator" role="button"
          ><span>Get Started</span>
          <div class="freebadge">Free</div></a
        >
      </div>
    </div>
    <div>
      <div>
        <img
          src="/laptop-piggybank.jpg"
          width="1134"
          height="712"
          alt="Social Security retirement benefits calculator showing estimated monthly payments"
          title="Social Security benefits calculator"
        />
      </div>
    </div>
  </div>

  <hr />

  <article class="grid-container">
    <section>
      <h2 class="section-label">Quick Data Entry</h2>
      <h3 class="section-title">Import Your Earnings History from SSA.gov</h3>
      <p>
        Painless entry of your earnings records directly from your my Social Security
        account at ssa.gov. Copy and paste your entire earnings history directly into
        the calculator in a single quick step. Runs entirely in your browser,
        making the process secure and private.
      </p>
    </section>
    <div>
      <div class="shadow">
        <video
          id="pia_vid"
          autoplay
          playsinline
          loop
          muted
          disableRemotePlayback
          width="576"
          height="294"
          poster={CopyPasteDemoPoster}
          title="Animation showing a user copying a social security earnings record from ssa.gov."
        >
          <source src={CopyPasteDemoMp4} type="video/mp4" />
        </video>
      </div>
    </div>

    <section>
      <h2 class="section-label">Highly Interactive</h2>
      <h3 class="section-title">Plan Your Retirement Age</h3>
      <p>
        Working more years can impact your benefit. Use the retirement age
        calculator to estimate how working until your full retirement age (or
        beyond) affects your AIME, PIA, and monthly benefit payments.
      </p>
    </section>
    <div>
      <div class="shadow">
        <video
          id="earnings_vid"
          autoplay
          playsinline
          loop
          muted
          disableRemotePlayback
          width="608"
          height="208"
          poster="/future-earnings-demo-poster.jpg"
          title="Animation
        with two sliders to adjust future earnings years and amount along with
        corresponding changes to the PIA estimations."
        >
          <source src="/future-earnings-demo.mp4" type="video/mp4" />
        </video>
      </div>
    </div>

    <section>
      <h2 class="section-label">Visual Charts</h2>
      <h3 class="section-title">Estimate Your Benefits</h3>
      <p>
        Visualize how your Average Indexed Monthly Earnings (AIME) affects your
        Primary Insurance Amount (PIA). The calculator shows how your earnings
        fit into the Social Security bendpoints that determine your benefit.
      </p>
    </section>
    <div>
      <div class="shadow">
        <video
          id="pia_vid"
          autoplay
          playsinline
          loop
          muted
          disableRemotePlayback
          width="608"
          height="448"
          poster="/pia-demo-poster.jpg"
          title="Animation showing an interaction with the Primary Insurance
        Amount Bend Points displayed in a chart."
        >
          <source src="/pia-demo.mp4" type="video/mp4" />
        </video>
      </div>
    </div>

    <section>
      <h2 class="section-label">When to Claim</h2>
      <h3 class="section-title">Find Your Optimal Filing Age</h3>
      <p>
        Should you claim at 62, wait until 70, or somewhere in between?
        Interactive charts show how early retirement reduces benefits and how
        delayed retirement credits can help maximize your Social Security. See
        the impact on both your benefits and your spouse's spousal and survivor
        benefits.
      </p>
    </section>
    <div>
      <div class="shadow">
        <video
          id="combined_vid"
          autoplay
          playsinline
          loop
          muted
          disableRemotePlayback
          width="640"
          height="784"
          poster={CombinedDemoPoster}
          title="Animation showing user interacting with a widget that visualizes the effect of different benefit filing start dates."
        >
          <source src={CombinedDemoMp4} type="video/mp4" />
        </video>
      </div>
    </div>
  </article>

  <footer id="footer">
    <div id="footer-container">
      <h2 class="section-label">What next</h2>
      <h3 class="section-title">Ready to estimate your Social Security benefits?</h3>
      <p>
        Great, <a href="/calculator">get started here</a>. Updated for 2026
        with the latest bend points and COLA (cost-of-living adjustment).
      </p>
      <h3 class="section-title">Save for later?</h3>
      <p>Here are some easy ways to remember:</p>
      <ol>
        <li>Leave this tab open. Get back to it later.</li>
        <li>Bookmark this in your browser.</li>
        <li>
          <a
            href="mailto:?subject=Read%20later%3A%20Social%20Security%20Calculator%20(ssa.tools)&body=Here's%20that%20link%3A%20https%3A%2F%2Fssa.tools%2F%0ANote%20to%20self%3A%20The%20social%20security%20calculator"
            >Send yourself an email</a
          >.
        </li>
      </ol>
    </div>
  </footer>
</main>

<style>
  main {
    font-family: 'Lato';
    font-size: 14px;
    line-height: 1.42857143;
    color: #333;
    margin: 0;
  }

  a {
    color: #337ab7;
  }

  .bigbtn {
    position: relative;
  }

  .bigbtn a {
    background-color: #5cb85c;
    border-color: #4cae4c;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    padding: 14px 24px;
    font-weight: 400;
    text-decoration: none;
    display: flex;
    box-shadow:
      0 0 0 1px #5cb85c,
      0 1px 2px 0 rgba(31, 42, 55, 0.4);
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-out;
    width: min-content;
    margin: auto;
  }

  .bigbtn a:hover {
    background-color: #449d44;
    border-color: #398439;
  }

  .bigbtn .freebadge {
    background: #fd6054;
    border-radius: 4px;
    margin-left: 10px;
    padding: 3px 5px;
  }

  @media (min-width: 921px) {
    .bigbtn a {
      font-size: 21px;
      line-height: 1.3;
    }
  }

  @media (max-width: 920px) and (min-width: 701px) {
    .bigbtn a {
      font-size: 20px;
      line-height: 1.3;
    }
  }

  @media (max-width: 700px) and (min-width: 520px) {
    .bigbtn a {
      font-size: 16px;
      line-height: 1.2;
    }
  }

  @media (max-width: 520px) {
    .bigbtn a {
      font-size: 16px;
      line-height: 1;
      padding: 7px 12px;
    }
  }

  .grid-container {
    display: grid;
    width: 85%;
    align-items: center;
  }

  .jumbotron-grid {
    display: grid;
    width: 85%;
    margin: 0 auto;
    align-items: center;
  }

  h1,
  h2,
  h3 {
    font-family: inherit;
    line-height: 1.1;
  }

  h1 {
    color: #060606;
    margin-bottom: 2.8rem;
    font-weight: 700;
  }

  .section-label {
    color: #a8a8a8;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
    padding: 0px;
    font-size: inherit;
    margin-bottom: 0.5rem;
  }

  .section-title {
    color: #060606;
    margin-bottom: 2.8rem;
    font-weight: 700;
  }

  p {
    color: #4b4b4b;
    margin: 0 0 10px;
    padding: 0px;
  }

  video {
    width: 100%;
    height: auto;
  }

  div.shadow {
    display: inline-block;
    padding: 1px;
    filter: drop-shadow(4px 4px 8px #000);
  }

  hr {
    background: linear-gradient(90deg, #fff, #687d88, #fff);
    clear: both;
    border: 0;
    height: 1px;
    margin: 0 10vw;
  }

  img {
    width: 100%;
    height: auto;
  }

  span#understand {
    color: #081d88;
  }

  #footer {
    background-color: #060606;
    padding: 10px;
    padding-bottom: 60px;
  }

  #footer a {
    text-decoration: underline;
  }

  #footer-container {
    margin: 0px auto;
  }

  #footer .section-title {
    color: #ddd;
  }

  #footer .section-label {
    color: #888;
  }

  #footer p,
  #footer li {
    color: #ccc;
  }

  @media screen and (min-width: 421px) {
    .grid-container {
      grid-column-gap: 6vw;
      grid-row-gap: 10vw;
      grid-template-columns: auto auto;
      margin: 5vw auto;
      grid-auto-flow: dense;
    }

    /* every other row, move text to the right col */
    .grid-container > section:nth-child(4n + 1) {
      grid-column: 2;
    }

    .jumbotron-grid {
      grid-template-columns: 40% 60%;
    }

    .jumbotron-grid h1 {
      font-size: 5.5vw;
      line-height: 6.5vw;
    }

    .section-title,
    p {
      font-size: 1.8vw;
    }

    #footer-container {
      width: 50%;
    }

    #footer li {
      font-size: 1.8vw;
    }

    #footer p {
      margin-bottom: 2rem;
    }

    .section-label {
      font-size: 1.2vw;
    }
  }

  @media (max-width: 420px) {
    .grid-container {
      grid-column-gap: 6vw;
      grid-row-gap: 10vw;
      grid-template-columns: auto;
      margin: 5vw auto;
    }

    .jumbotron-grid {
      grid-template-columns: 100% 0%;
      text-align: center;
    }

    .jumbotron-grid h1 {
      font-size: 11vw;
      line-height: 13vw;
      margin: 0.2rem 0 1rem;
    }

    hr {
      display: none;
    }

    span#understand {
      font-size: 12vw;
      letter-spacing: 0.4rem;
    }

    .section-title,
    p {
      font-size: 3.6vw;
    }

    #footer-container {
      width: 90%; /* Increased width to prevent unnecessary wrapping */
    }

    #footer p {
      margin-bottom: 1.5rem; /* Reduced margin for better spacing */
    }

    #footer li {
      font-size: 3.6vw;
    }

    .section-label {
      font-size: 2.4vw;
    }
  }
</style>
