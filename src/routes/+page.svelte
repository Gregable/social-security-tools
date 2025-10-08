<script lang="ts">
  import { onMount } from 'svelte';
  import { activeIntegration } from '$lib/integrations/context';
  import { loadIntroBanner } from '$lib/integrations/config';
  import type { ComponentType, SvelteComponent } from 'svelte';

  import Header from '$lib/components/Header.svelte';
  import CopyPasteDemoMp4 from '$lib/videos/copy-paste-demo.mp4';
  import CopyPasteDemoPoster from '$lib/videos/copy-paste-demo-poster.jpg';
  import CombinedDemoMp4 from '$lib/videos/combined-demo.mp4';
  import CombinedDemoPoster from '$lib/videos/combined-demo-poster.jpg';

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
  <title>SSA.tools: A Social Security Calculator</title>
  <meta
    name="description"
    content="An online social security calculator that makes understanding social security retirement benefits quick and simple."
  />
  <link rel="canonical" href="https://ssa.tools" />
  <meta property="og:url" content="https://ssa.tools" />
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
          alt="Laptop displaying two piggybanks."
          title="Laptop displaying two piggybanks."
        />
      </div>
    </div>
  </div>

  <hr />

  <div class="grid-container">
    <div>
      <h2>Quick Data Entry</h2>
      <h1>Directly Copy & Paste Records</h1>
      <p>
        Painless entry of your earnings records directly from the "<i>my</i> SocialSecurity"
        section at ssa.gov. Copy and paste your entire record directly into the social
        security calculator in a single quick step. Run entirely from your browser
        making the process secure and private.
      </p>
    </div>
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

    <div>
      <h2>Highly Interactive</h2>
      <h1>Future Benefits Formula</h1>
      <p>
        Working more years in the future can have an impact on your benefit. Use
        the working years quick calculator to estimate the impact of working
        more or fewer years on your AIME, PIA, and benefit payments.
      </p>
    </div>
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

    <div>
      <h2>Visual Charts</h2>
      <h1>PIA Calculation</h1>
      <p>
        Visually calculate how your Average Indexed Monthly Earnings (AIME)
        affects your Primary Insurance Amount (PIA). Use the calculator to see
        how you compare to the two Social Security breakpoints.
      </p>
    </div>
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

    <div>
      <h2>Graphical Excellence</h2>
      <h1>Filing Start Date Analysis</h1>
      <p>
        Intuitive interactive visual charts let you see the impact of the choice
        of filing dates on your benefits. See your detailed payment schedule,
        each month, specifically tailored to your own inputs. Unique unified
        view of filing dates and the effect on both you and your spouse's
        benefits.
      </p>
    </div>
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
  </div>

  <div id="footer">
    <div id="footer-container">
      <h2>What next</h2>
      <h1>Want to try the social security calculator now?</h1>
      <p>
        Great, <a href="/calculator">get started here</a>.
      </p>
      <h1>Later?</h1>
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
  </div>
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
  h2 {
    font-family: inherit;
    line-height: 1.1;
  }

  h1 {
    color: #060606;
    margin-bottom: 2.8rem;
    font-weight: 700;
  }

  h2 {
    color: #a8a8a8;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
    padding: 0px;
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

  #footer h1 {
    color: #ddd;
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
    .grid-container > div:nth-child(4n + 1) {
      grid-column: 2;
    }

    .jumbotron-grid {
      grid-template-columns: 40% 60%;
    }

    .jumbotron-grid h1 {
      font-size: 5.5vw;
      line-height: 8vw;
    }

    h1,
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

    h2 {
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
      line-height: 16vw;
      margin: 0.2rem 0 1rem;
    }

    hr {
      display: none;
    }

    span#understand {
      font-size: 12vw;
      letter-spacing: 0.4rem;
    }

    h1,
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

    h2 {
      font-size: 2.4vw;
    }
  }
</style>
