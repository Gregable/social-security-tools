<!--
  @component
  @name StrategyIntro
  @description
    Explains what the optimizer does, shown below the mode picker until a
    mode is chosen. It is the page's main crawlable text: the rest of the
    page only appears after a click, so search engines and first-time
    visitors would otherwise see three buttons. Screenshots are of
    fictional examples.

    The layout follows the picker above it: one column per choice with the
    kind of answer that choice gets, then how the answer is worked out,
    then the same choices again so a reader at the bottom can start from
    there.
-->
<script lang="ts">
  import {
    STRATEGY_MODE_LABELS,
    STRATEGY_MODES,
    type StrategyMode,
  } from "$lib/strategy/ui";
  import assumptionsPanel from "../images/assumptions-panel.png";
  import coupleRecommendation from "../images/couple-recommendation.png";
  import singleDeathAgeChart from "../images/single-death-age-chart.png";
  import singleRecommendation from "../images/single-recommendation.png";
  import widowedRecommendation from "../images/widowed-recommendation.png";
  import ModeIcon from "./ModeIcon.svelte";

  export let onselect: (mode: StrategyMode) => void;
</script>

<section class="intro" aria-labelledby="strategy-intro-heading">
  <div class="inner">
    <h2 id="strategy-intro-heading">How the optimizer works</h2>
    <p class="lede">
      The result depends on the choice you make above. An example of each is
      below, followed by how it is calculated.
    </p>

    <h3 class="group-label">Results</h3>
    <div class="topics topics--three">
      <article class="topic">
        <p class="topic-label">
          <ModeIcon mode="single" size={26} />
          <span class="topic-name">{STRATEGY_MODE_LABELS.single.title}</span>
          <span class="example-tag">Example</span>
        </p>
        <figure class="figure figure--answer">
          <img
            src={singleRecommendation}
            width="553"
            height="169"
            loading="lazy"
            decoding="async"
            alt="Example recommendation for one person: file in December 2032, at age 68 years 3 months."
          />
        </figure>
        <h4>A recommended filing month</h4>
        <p>
          Enter your date of birth and your Primary Insurance Amount (PIA),
          the monthly benefit Social Security pays if you file at full
          retirement age. The optimizer checks every month you could file, up
          to age 70, and recommends the one with the largest expected lifetime
          benefit in today's dollars.
        </p>
      </article>

      <article class="topic">
        <p class="topic-label">
          <ModeIcon mode="couple" size={26} />
          <span class="topic-name">{STRATEGY_MODE_LABELS.couple.title}</span>
          <span class="example-tag">Example</span>
        </p>
        <figure class="figure figure--answer">
          <img
            src={coupleRecommendation}
            width="553"
            height="179"
            loading="lazy"
            decoding="async"
            alt="Example recommendation for a couple: Alex, the higher earner, files in April 2035 at age 70, and Chris files in September 2028 at age 62 and 1 month."
          />
        </figure>
        <h4>A filing month for each spouse</h4>
        <p>
          For a couple, the optimizer tries every combination of filing
          months for both of you, counting spousal benefits and the survivor
          benefit the longer-lived spouse keeps. The higher earner often does
          best by waiting, because their benefit becomes the survivor
          benefit.
        </p>
      </article>

      <article class="topic">
        <p class="topic-label">
          <ModeIcon mode="widowed" size={26} />
          <span class="topic-name">{STRATEGY_MODE_LABELS.widowed.title}</span>
          <span class="example-tag">Example</span>
        </p>
        <figure class="figure figure--answer">
          <img
            src={widowedRecommendation}
            width="553"
            height="214"
            loading="lazy"
            decoding="async"
            alt="Example recommendation for a widow: start the survivor benefit in November 2026 at age 60 and 6 months, then her own retirement benefit in May 2036 at age 70."
          />
        </figure>
        <h4>A start month for each benefit</h4>
        <p>
          If your spouse has died, you can take a survivor benefit and your
          own retirement benefit at different times and switch from one to
          the other. The optimizer tells you when to start each one, or
          whether you only need one of them.
        </p>
      </article>
    </div>

    <h3 class="group-label">Method</h3>
    <div class="topics topics--two">
      <article class="topic">
        <p class="topic-label">
          <span class="topic-name">Life expectancy</span>
          <span class="example-tag">Example</span>
        </p>
        <figure class="figure figure--wide">
          <img
            src={singleDeathAgeChart}
            width="801"
            height="412"
            loading="lazy"
            decoding="async"
            alt="Chart of the best filing age for each possible age of death: about 62 for deaths before 81, rising in steps to 70 for deaths after about 88, next to the chance of having died by each age."
          />
        </figure>
        <h4>Averaged over possible ages of death</h4>
        <p>
          The best filing age depends on how long you live: filing early pays
          more if you die young, and waiting pays more if you live long.
          Because that can't be known in advance, the optimizer averages your
          lifetime benefits for each filing month over every possible age of
          death, weighted by how likely each one is under Social Security's
          life tables for your birth year. A chart shows the best filing age
          for each age of death.
        </p>
      </article>

      <article class="topic">
        <p class="topic-label">
          <span class="topic-name">Assumptions</span>
          <span class="example-tag">Example</span>
        </p>
        <figure class="figure figure--wide figure--panel">
          <img
            src={assumptionsPanel}
            width="497"
            height="304"
            loading="lazy"
            decoding="async"
            alt="The optimizer's assumption controls: a health slider set to average, and a discount rate field with buttons for the 20-year Treasury rate and two stock market rates."
          />
        </figure>
        <h4>Health and discount rate</h4>
        <p>
          If you expect to live longer or shorter than average, a health
          slider scales the death rates used in the calculation, and the
          recommendation updates. You can also set the discount rate, which
          counts a dollar now as worth more than a dollar later. It starts at
          the current 20-year Treasury real (after-inflation) yield.
        </p>
      </article>
    </div>

    <div class="closing">
      <div>
        <h3>Before you start</h3>
        <p>
          If you don't know your PIA, the
          <a href="/calculator">calculator</a> works it out from the earnings
          record in your my Social Security account. The calculations run in
          your browser, and no account is needed.
        </p>
      </div>
      <div>
        <h3>Related guides</h3>
        <ul>
          <li>
            <a href="/guides/break-even-age">Social Security break-even age</a>
          </li>
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
    </div>

    <div class="start" role="group" aria-labelledby="strategy-intro-start">
      <p id="strategy-intro-start" class="start-label">
        Who are we calculating for?
      </p>
      <div class="start-choices">
        {#each STRATEGY_MODES as mode}
          <button
            type="button"
            class="start-choice"
            on:click={() => onselect(mode)}
          >
            <ModeIcon {mode} size={22} />
            {STRATEGY_MODE_LABELS[mode].title}
          </button>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .intro {
    --rule: #d6dce6;
    --quiet: #596273;
    margin-top: 3.5rem;
    padding: 3.25rem 0 4rem;
    background: #f4f6fa;
    color: #4b4b4b;
  }

  /* The same side padding as the site header, so the band's content lines
     up with the logo and the last nav link, up to the width limit the rest
     of this page uses. */
  .inner {
    box-sizing: content-box;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 7.5vw;
  }

  h2,
  h3,
  h4 {
    font-family: inherit;
    font-weight: 700;
    color: #0b0c0c;
  }

  /* Sized like the picker's "Who are we calculating for?", its sibling. */
  h2 {
    font-size: 1.4rem;
    line-height: 1.2;
    text-align: center;
    margin: 0 0 0.5rem;
  }

  .lede {
    max-width: 52ch;
    margin: 0 auto 2.75rem;
    text-align: center;
    font-size: 1rem;
    line-height: 1.5;
  }

  .group-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0 0 1.75rem;
    color: var(--quiet);
    font-size: 0.78rem;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
  }

  .group-label::before,
  .group-label::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--rule);
  }

  .topics {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
    margin: 0 0 3.5rem;
  }

  .topic {
    width: 100%;
    max-width: 36rem;
    margin: 0 auto;
  }

  .topic-label {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin: 0 0 0.85rem;
    /* The icon takes this color; the name beside it is set darker. */
    color: #081d88;
  }

  .topic-name {
    color: #0b0c0c;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .example-tag {
    margin-left: auto;
    padding: 0.12rem 0.5rem;
    border: 1px solid #cfd6e1;
    border-radius: 999px;
    color: var(--quiet);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .figure {
    margin: 0 0 1.25rem;
    overflow: hidden;
    background: #fff;
    border: 1px solid #dde2ea;
    border-radius: 8px;
    box-shadow:
      0 1px 2px rgba(16, 24, 40, 0.05),
      0 12px 24px -14px rgba(16, 24, 40, 0.22);
  }

  .figure img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* The three answer cards are cropped to different heights. One frame
     shape, in the cards' own background color, keeps the text under them
     level. */
  .figure--answer {
    aspect-ratio: 553 / 226;
    background: #f7f8fd;
  }

  .figure--wide {
    aspect-ratio: 801 / 412;
  }

  .figure--wide img {
    height: 100%;
    object-fit: contain;
  }

  .figure--panel img {
    box-sizing: border-box;
    padding: 0.75rem 1.25rem;
  }

  h4 {
    font-size: 1.2rem;
    line-height: 1.25;
    margin: 0 0 0.5rem;
  }

  .topic > p:last-child,
  .closing p,
  .closing ul {
    margin: 0;
    font-size: 1rem;
    line-height: 1.55;
  }

  .closing {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.25rem;
    padding-top: 2.5rem;
    border-top: 1px solid var(--rule);
  }

  .closing h3 {
    font-size: 1.2rem;
    line-height: 1.25;
    margin: 0 0 0.5rem;
  }

  .closing ul {
    padding: 0;
    list-style: none;
    line-height: 1.75;
  }

  /* Darker than the site's usual link blue, which is too faint on the
     band's tint. */
  a {
    color: #005ea5;
  }

  .start {
    margin-top: 3rem;
    text-align: center;
  }

  .start-label {
    margin: 0 0 0.9rem;
    color: #0b0c0c;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .start-choices {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .start-choice {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.1rem;
    background: #fff;
    border: 2px solid #d5dae3;
    border-radius: 8px;
    color: #0b0c0c;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }

  .start-choice :global(svg) {
    color: #081d88;
  }

  .start-choice:hover,
  .start-choice:focus {
    border-color: #005ea5;
    background: #f0f7fc;
    outline: none;
  }

  @media (min-width: 900px) {
    .topics--three {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .topics--two {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 3rem;
    }

    .topic {
      max-width: none;
    }

    .closing {
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 3rem;
    }
  }

  /* The page pads its content by 1rem at this width. Negative margins take
     that back, so the band still reaches the edges of the window and the
     end of the page, and the content gets the padding instead. */
  @media (max-width: 768px) {
    .intro {
      margin: 2rem -1rem -1rem;
      padding: 2.25rem 0 3rem;
    }

    .inner {
      padding: 0 1rem;
    }

    .topics {
      margin-bottom: 2.75rem;
    }
  }
</style>
