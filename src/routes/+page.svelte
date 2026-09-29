<script lang="ts">
import type { ComponentType, SvelteComponent } from 'svelte';
import { onMount } from 'svelte';
import Header from '$lib/components/Header.svelte';
import HomeChoice from '$lib/components/HomeChoice.svelte';
import { loadIntroBanner } from '$lib/integrations/config';
import { activeIntegration } from '$lib/integrations/context';
import CombinedDemoMp4 from '$lib/videos/combined-demo.mp4';
import CombinedDemoPoster from '$lib/videos/combined-demo-poster.jpg';
import CopyPasteDemoMp4 from '$lib/videos/copy-paste-demo.mp4';
import CopyPasteDemoPoster from '$lib/videos/copy-paste-demo-poster.jpg';
import StrategyDemoMp4 from '$lib/videos/strategy-demo.mp4';
import StrategyDemoPoster from '$lib/videos/strategy-demo-poster.jpg';
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
      <p class="hero-sub">Estimate your benefit and decide when to file.</p>
      <p class="hero-tagline">Free, private, no sign-up.</p>
    </div>
    <div>
      <div>
        <img
          class="hero-image"
          src="/laptop-piggybank.jpg"
          width="1134"
          height="882"
          alt="Social Security retirement benefits calculator showing estimated monthly payments"
          title="Social Security benefits calculator"
        />
      </div>
    </div>
  </div>

  <HomeChoice />

  <h2 class="section-label features-intro">Inside the DIY calculator</h2>

  <article class="grid-container">
    <section>
      <h2 class="section-label">Your earnings</h2>
      <h3 class="section-title">Copy and paste your earnings record</h3>
      <p>
        Sign in to your my Social Security account at ssa.gov, copy your
        earnings history, and paste it in. That's the whole setup. Everything
        runs in your browser, so your earnings never leave your device.
      </p>
    </section>
    <div>
      <div class="shadow">
        <video
          id="copypaste_vid"
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
      <h2 class="section-label">Future work</h2>
      <h3 class="section-title">See what more years of work are worth</h3>
      <p>
        Your benefit is based on your highest 35 years of earnings. Tell the
        calculator how much longer you plan to work and roughly what you'll
        earn, and watch your monthly benefit update.
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
      <h2 class="section-label">The formula</h2>
      <h3 class="section-title">See how your benefit is calculated</h3>
      <p>
        Social Security averages your top 35 years of earnings, adjusted for
        wage growth. It pays back 90% of the first part of that average, 32% of
        the next, and 15% of the rest. The chart shows where your earnings fall
        and what that means for your monthly check.
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
      <h2 class="section-label">When to claim</h2>
      <h3 class="section-title">Try different filing ages</h3>
      <p>
        Claim at 62 and your check is smaller for life. Wait until 70 and it's
        larger for life. Drag the start date to see how your monthly benefit
        changes, along with your spouse's spousal and survivor benefits.
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

    <section>
      <h2 class="section-label">Filing strategy</h2>
      <h3 class="section-title">Let the optimizer pick your filing ages</h3>
      <p>
        Not sure which age is best? The <a href="/strategy">strategy optimizer</a>
        tries every combination of filing dates for you (and your spouse, if
        you're married), weighs each by how long you're likely to live, and
        recommends the best one. Adjust for your health and watch the answer
        change.
      </p>
    </section>
    <div>
      <div class="shadow">
        <video
          id="strategy_vid"
          autoplay
          playsinline
          loop
          muted
          disableRemotePlayback
          width="840"
          height="800"
          poster={StrategyDemoPoster}
          title="Animation showing the optimal filing age for each combination of death ages changing as a health slider moves."
        >
          <source src={StrategyDemoMp4} type="video/mp4" />
        </video>
      </div>
    </div>
  </article>

  <footer id="footer">
    <div id="footer-container">
      <h2 class="section-label">What next</h2>
      <h3 class="section-title">Ready to see your numbers?</h3>
      <p>
        Start the <a href="/calculator">free calculator</a>. It's up to date for
        2026, including this year's cost-of-living adjustment.
      </p>
      <h3 class="section-title">Not ready yet?</h3>
      <p>
        Leave this tab open, bookmark the page, or
        <a
          href="mailto:?subject=Read%20later%3A%20Social%20Security%20Calculator%20(ssa.tools)&body=Here's%20that%20link%3A%20https%3A%2F%2Fssa.tools%2F%0ANote%20to%20self%3A%20The%20social%20security%20calculator"
          >send yourself an email</a
        > so you can come back later.
      </p>
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

  .hero-sub {
    color: #4b4b4b;
    line-height: 1.4;
    margin: 0;
    white-space: nowrap;
  }

  .hero-tagline {
    margin: 0.4em 0 0;
    color: #449d44;
    font-weight: 700;
  }

  .features-intro {
    width: 85%;
    margin: 3vw auto 0;
  }

  /* The photo has a wide white band above the laptop; crop it so the
     choice cards below sit higher on the first screen. */
  img.hero-image {
    aspect-ratio: 1134 / 721;
    object-fit: cover;
    object-position: 50% 87%;
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
    margin-bottom: 1.2rem;
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

  #footer p {
    color: #ccc;
  }

  @media screen and (min-width: 421px) {
    .grid-container {
      grid-column-gap: 6vw;
      grid-row-gap: 5vw;
      grid-template-columns: auto auto;
      margin: 3vw auto 5vw;
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

    .jumbotron-grid .hero-sub {
      font-size: 1.6vw;
    }

    .jumbotron-grid .hero-tagline {
      font-size: max(0.85rem, 1.3vw);
    }

    .section-title {
      font-size: max(1.25rem, 2.2vw);
    }

    p {
      font-size: max(1rem, 1.35vw);
    }

    #footer-container {
      width: 50%;
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
      grid-row-gap: 8vw;
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

    .jumbotron-grid .hero-sub {
      font-size: 4.2vw;
    }

    .jumbotron-grid .hero-tagline {
      font-size: 3.8vw;
    }

    span#understand {
      font-size: 12vw;
      letter-spacing: 0.4rem;
    }

    .section-title {
      font-size: 4.8vw;
    }

    p {
      font-size: 3.8vw;
    }

    #footer-container {
      width: 90%; /* Increased width to prevent unnecessary wrapping */
    }

    #footer p {
      margin-bottom: 1.5rem; /* Reduced margin for better spacing */
    }

    .section-label {
      font-size: 2.4vw;
    }
  }
</style>
