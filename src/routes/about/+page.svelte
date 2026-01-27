<script lang="ts">
  import Header from "$lib/components/Header.svelte";
  import KoFiImg from "$lib/images/kofi.png";
  import { renderWebsiteSocialMeta } from "$lib/schema-org";

  const pageTitle = "About - Social Security Calculator | SSA.tools";
  const pageDescription =
    "Learn about SSA.tools, the free social security calculator. Built to help you understand your retirement benefits.";
  const pageUrl = "https://ssa.tools/about";
  const pageImageAlt = "About the Social Security Calculator";
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph / Social Meta Tags -->
  {@html renderWebsiteSocialMeta({
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    imageAlt: pageImageAlt,
  })}
</svelte:head>

<Header active="About" />
<main>
  <div>
    <h1>About the Social Security Calculator</h1>
    <p>
      This site provides individuals with an estimate of their future Social
      Security retirement benefits. The benefits are based on the earnings
      record provided by the Social Security Administration. A detailed report
      is created from this data.
    </p>
    <h3>What If?</h3>
    <p>
      This site provides clear interactive visuals that let the user investigate
      how different choices might affect their overall benefit. Scenarios
      include:
    </p>
    <ul>
      <li>
        What happens to my benefit if I earn additional wages for several more
        years?
      </li>
      <li>
        How does my benefit change as my total earnings grow during my lifetime?
      </li>
      <li>
        What happens if I choose to take my benefits early? What if I delay and
        take them late?
      </li>
      <li>
        How are my benefits affected by my spouse's earnings records, and vice
        versa.
      </li>
    </ul>

    <h3>Security</h3>
    <p>
      This site does not store any data entered by users. All calculations are
      made client-side in the browser's JavaScript and are never transmitted
      over the internet.
    </p>
    <p>
      While unnecessary for security, this can be confirmed by loading the site
      in your browser, and then disconnecting your computer before entering any
      additional data. For more details, see the
      <a href="/guides/privacy">Privacy & Security guide</a>.
    </p>
    <h3>Accuracy</h3>
    <p>
      This site should be correct, and I will update it as Social Security rules
      change. However, there are no <i>guarantees</i> of the accuracy of this information.
      It should be treated as a useful exploratory tool, but any decisions should
      be made after researching the subject yourself.
    </p>
    <p>The site was most recently updated on Jan 17, 2026.</p>
    <h3>Why?</h3>
    <p>
      This site is completely free and contains no advertising. I don't collect
      your email address, subscribe you to SMS services, make a credit report
      inquiry, kill a dolphin, etc. Feel free to use the site without wondering
      if there is a catch.
    </p>
    <p>
      Costs for running the site are minimal, just a few dollars a year, plus my
      time.
    </p>
    <p>
      I noticed that most people don't understand their Social Security benefits
      very well. The online tools at SSA.gov are excellent, but I felt lacking
      in a few places. In particular, I felt that by simply spitting out a final
      number, the results failed to educate the user as to how the program
      works. I thought it would be useful to contribute a tool that helped folks
      to understand their own Social Security benefit and how it will help them
      in the future.
    </p>
    <p>
      The <a href="/contact">author of this site</a> could never have done all of
      this without help from the internet. This page lists some of the contributors
      that have made this all possible.
    </p>
    <h1>Major Contributors</h1>
    <p>
      <a href="/contact">Greg Grothaus</a>: Greg is the primary developer of
      this site. He is a software engineer who has worked on this project on the
      side for several years. You can find Greg's personal blog at
      <a href="http://www.gregable.com/"> gregable.com</a>.
    </p>
    <p>
      <a href="http://www.sotirioskeros.com/"> Sotirios Keros</a>: a physician,
      financial planner, and co-founder of the not-for-profit
      <a href="http://www.doctoredmoney.org/">Doctored Money</a>. Sotirios
      contributed heavily to the design and correctness of the calculations this
      tool makes.
    </p>
    <p>
      Steve Nicolai: a semi-retired telecom software engineer. Steve contributed
      the implementation of social security credits.
    </p>

    <h3>Contributions Welcome</h3>
    <p>
      If you would like to contribute, the project is on github at:
      <a href="https://github.com/Gregable/social-security-tools">
        Gregable/social-security-tools
      </a>. Please file issues in the
      <a href="https://github.com/Gregable/social-security-tools/issues">
        Issue Tracker
      </a>.
    </p>

    <div class="kofi-section">
      <h3>Thank you</h3>
      <p>Many have asked me if they can support this site.</p>
      <p class="noprint">
        While absolutely not necessary, if you would like to say thanks you can
        contribute by clicking the button below:
      </p>
      <p class="onlyprint">
        While absolutely not necessary, if you would like to say thanks you can
        contribute at:
      </p>
      <p class="onlyprint kofi-url">https://ko-fi.com/ssatools</p>
      <p class="kofi-button">
        <a href="https://ko-fi.com/ssatools" target="_blank"
          ><img
            height="55"
            width="214"
            style:border="0px"
            src={KoFiImg}
            alt="Buy me a coffee if you found this useful"
          /></a
        >
      </p>
    </div>
  </div>
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 1em;
  }

  main > div {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2.5em;
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  h3 {
    color: #34495e;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  p,
  ul {
    font-size: 1.4em;
    color: #333;
    line-height: 1.6;
  }

  li {
    margin: 0.5rem 0;
  }

  a {
    color: #3498db;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .kofi-section {
    margin-top: 2em;
  }

  .kofi-section .kofi-url {
    font-size: 1.8em;
  }

  .kofi-section .kofi-button img {
    display: block;
    margin: auto;
  }

  @media (max-width: 768px) {
    main {
      padding: 0 1.5em;
    }

    h1 {
      font-size: 2em;
    }

    p,
    ul {
      font-size: 1.1em;
    }
  }
</style>
