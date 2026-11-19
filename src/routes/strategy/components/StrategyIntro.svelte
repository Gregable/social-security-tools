<!--
  @component
  @name StrategyIntro
  @description
    Explains what the optimizer does, shown below the mode picker until a
    mode is chosen. It is the page's main crawlable text: the rest of the
    page only appears after a click, so search engines and first-time
    visitors would otherwise see three buttons. Screenshots are of
    fictional examples.
-->
<script lang="ts">
  import StrategyDemoMp4 from "$lib/videos/strategy-demo.mp4";
  import StrategyDemoPoster from "$lib/videos/strategy-demo-poster.jpg";
  import coupleRecommendation from "../images/couple-recommendation.png";
  import singleDeathAgeChart from "../images/single-death-age-chart.png";
  import singleRecommendation from "../images/single-recommendation.png";
  import widowedRecommendation from "../images/widowed-recommendation.png";
</script>

<section class="intro" aria-labelledby="strategy-intro-heading">
  <h2 id="strategy-intro-heading" class="section-label intro-heading">
    How the optimizer works
  </h2>

  <div class="grid-container">
    <div class="copy">
      <p class="section-label">Your answer</p>
      <h3 class="section-title">A filing month, not just an age</h3>
      <p>
        Enter your date of birth and your Primary Insurance Amount (PIA), the
        monthly benefit Social Security pays if you file at full retirement
        age. The optimizer checks every month you could file, up to age 70,
        and recommends the one with the largest expected lifetime benefit.
      </p>
    </div>
    <div class="media">
      <img
        src={singleRecommendation}
        width="577"
        height="295"
        loading="lazy"
        decoding="async"
        alt="Example recommendation for one person: file in December 2032, at age 68 years 3 months, with the expected lifetime benefit in dollars."
      />
    </div>

    <div class="copy">
      <p class="section-label">Life expectancy</p>
      <h3 class="section-title">Planned for every possible life span</h3>
      <p>
        Filing early pays off if you die young, and waiting pays off if you
        live long. Nobody knows which, so the optimizer finds the best filing
        age for each possible age of death, then weights each one by the
        chance you live that long, using Social Security's life tables for
        your birth year.
      </p>
    </div>
    <div class="media">
      <img
        src={singleDeathAgeChart}
        width="801"
        height="412"
        loading="lazy"
        decoding="async"
        alt="Chart of the best filing age for each possible age of death: 62 for someone who dies around 80, rising to 70 for someone who lives past 88, next to the chance of having died by each age."
      />
    </div>

    <div class="copy">
      <p class="section-label">Married couples</p>
      <h3 class="section-title">Both filing ages, chosen together</h3>
      <p>
        For a couple, it tries every combination of filing months for both of
        you, counting spousal benefits and the survivor benefit the
        longer-lived spouse keeps. The higher earner often does best by
        waiting, because their check becomes the survivor benefit.
      </p>
    </div>
    <div class="media">
      <img
        src={coupleRecommendation}
        width="577"
        height="323"
        loading="lazy"
        decoding="async"
        alt="Example recommendation for a couple: Alex, the higher earner, files in April 2035 at age 70, and Casey files in September 2028 at age 62 and 1 month."
      />
    </div>

    <div class="copy">
      <p class="section-label">Your health</p>
      <h3 class="section-title">Adjust for your health</h3>
      <p>
        Expect to live longer or shorter than average? Move the health slider
        and watch the recommendation change. You can also set the discount
        rate, which counts a dollar now as worth more than a dollar later. It
        starts at the current 20-year Treasury real (after-inflation) yield.
      </p>
    </div>
    <div class="media">
      <video
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

    <div class="copy">
      <p class="section-label">Surviving spouses</p>
      <h3 class="section-title">When to take each benefit</h3>
      <p>
        If your spouse has died, you can take a survivor benefit and your own
        retirement benefit at different times and switch from one to the
        other. The optimizer tells you which to start first and when to
        switch.
      </p>
    </div>
    <div class="media">
      <img
        src={widowedRecommendation}
        width="577"
        height="394"
        loading="lazy"
        decoding="async"
        alt="Example recommendation for a widow: start the survivor benefit in November 2026 at age 60 and 6 months, then her own retirement benefit in May 2036 at age 70."
      />
    </div>
  </div>

  <div class="next-steps">
    <h3 class="section-title">Before you start</h3>
    <p>
      Don't know your PIA? The <a href="/calculator">calculator</a> works it
      out from the earnings record in your my Social Security account. Your
      numbers stay in your browser; nothing you enter is sent to us.
    </p>
    <p>Related guides:</p>
    <ul>
      <li><a href="/guides/break-even-age">Social Security break-even age</a></li>
      <li>
        <a href="/guides/spousal-benefit-filing-date"
          >When to file for spousal benefits</a
        >
      </li>
      <li><a href="/guides/survivor-benefits">Survivor benefits</a></li>
      <li>
        <a href="/guides/strategy-vs-opensocialsecurity"
          >How this optimizer compares with Open Social Security</a
        >
      </li>
    </ul>
  </div>
</section>

<style>
  .intro {
    margin: 2.5rem auto 4rem;
    color: #4b4b4b;
  }

  .intro-heading {
    text-align: center;
  }

  h3 {
    font-family: inherit;
    line-height: 1.1;
  }

  .section-label {
    color: #a8a8a8;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
    font-size: 0.85rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .section-title {
    color: #060606;
    font-weight: 700;
    font-size: 1.5rem;
    margin: 0 0 1rem;
  }

  p {
    margin: 0 0 0.75rem;
    font-size: 1.05rem;
    line-height: 1.5;
  }

  a {
    color: #337ab7;
  }

  .grid-container {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr;
    row-gap: 2.5rem;
    margin: 2rem auto;
  }

  .media {
    filter: drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.35));
  }

  .media img,
  .media video {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }

  .next-steps {
    max-width: 640px;
    margin: 3rem auto 0;
  }

  .next-steps ul {
    margin: 0;
    padding-left: 1.25rem;
    line-height: 1.8;
    font-size: 1.05rem;
  }

  /* Two columns on wider screens, with the text switching sides on every
     other row, as on the home page. */
  @media (min-width: 701px) {
    .grid-container {
      grid-template-columns: 1fr 1fr;
      column-gap: 4rem;
      row-gap: 4rem;
      grid-auto-flow: dense;
    }

    .grid-container > .copy:nth-child(4n + 3) {
      grid-column: 2;
    }

    .section-title {
      font-size: 1.75rem;
    }
  }
</style>
