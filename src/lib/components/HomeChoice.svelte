<script lang="ts">
import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { outboundImpression, trackOutboundClick } from '$lib/analytics/outbound';
import { activeIntegration } from '$lib/integrations/context';
import { SPONSOR } from '$lib/sponsor';

const PLACEMENT = 'homepage-choice';
// Phones get a short text link instead of the card (see the 700px
// media query); its own placement keeps the two comparable in PostHog.
const MOBILE_PLACEMENT = 'homepage-mobile-link';

// Partner-integration visitors never see the sponsor, matching the
// calculator and strategy pages.
$: showSponsor = !$activeIntegration;

function trackDiyClick(path: 'calculator' | 'strategy'): void {
  if (!browser) return;
  posthog.capture('Homepage Choice: Clicked', { path });
}

function handleProClick(): void {
  trackOutboundClick(SPONSOR.destination, PLACEMENT);
}

function handleProLinkClick(): void {
  trackOutboundClick(SPONSOR.destination, MOBILE_PLACEMENT);
}
</script>

<section class="choice" aria-label="Ways to plan">
  {#if showSponsor}
    <h2 class="choice-label">Two ways to plan</h2>
  {/if}
  <div class="cards" class:solo={!showSponsor}>
    <!-- Not an <a> like the sponsor card: it holds a second link, and links
         cannot nest. The button link stretches over the card instead. -->
    <div class="card diy">
      <p class="kicker">Do it yourself</p>
      <h3 class="card-title">Use the free calculator</h3>
      <p class="card-body">
        Paste in your earnings record from SSA.gov and see your benefit at every
        filing age. Free, and your data never leaves your browser.
      </p>
      <a
        href="/calculator"
        class="card-button stretched-link"
        on:click={() => trackDiyClick('calculator')}
        >Calculate My Benefits &rarr;</a
      >
      <p class="card-footnote">
        Already know your Primary Insurance Amount?
        <a
          href="/strategy"
          class="secondary-link"
          on:click={() => trackDiyClick('strategy')}
          >Go straight to the strategy optimizer&nbsp;&rarr;</a
        >
      </p>
    </div>

    {#if showSponsor}
      <a
        href={SPONSOR.url}
        class="card pro"
        target="_blank"
        rel="noopener"
        on:click={handleProClick}
        use:outboundImpression={{ destination: SPONSOR.destination, placement: PLACEMENT }}
      >
        <p class="kicker">Get expert help <span class="badge">Sponsor</span></p>
        <h3 class="card-title">Talk to a professional</h3>
        <p class="card-body">
          Prefer to talk it through? {SPONSOR.name} offers a free call with a
          Social Security specialist.
        </p>
        <span class="card-button">Schedule a Free Call &rarr;</span>
        <p class="card-footnote">Opens the scheduling calendar in a new tab.</p>
      </a>
    {/if}
  </div>

  {#if showSponsor}
    <!-- Only one of the card and this line is displayed at a time, and a
         display:none element never intersects, so impressions are not
         double counted. -->
    <p class="pro-line">
      <span class="pro-lead"
        >Prefer to talk it through? <span class="badge">Sponsor</span></span
      >
      <a
        href={SPONSOR.url}
        target="_blank"
        rel="noopener"
        on:click={handleProLinkClick}
        use:outboundImpression={{
          destination: SPONSOR.destination,
          placement: MOBILE_PLACEMENT,
        }}
        >Free call with {SPONSOR.name}&nbsp;&rarr;<span class="sr-only"
          >{' '}(sponsor, opens in a new tab)</span
        ></a
      >
    </p>
  {/if}
</section>

<style>
  .choice {
    width: 85%;
    margin: 1rem auto 3rem;
  }

  .choice-label {
    color: #a8a8a8;
    letter-spacing: 0.2rem;
    text-transform: uppercase;
    font-size: max(0.75rem, 1.2vw);
    text-align: center;
    margin: 0 0 1.25rem;
  }

  /* The calculator is the main path; the sponsor is a smaller option. */
  .cards {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  .cards.solo {
    grid-template-columns: 1fr;
  }

  /* Each card spans five rows shared through subgrid (kicker, title, body,
     button, footnote), so titles, bodies and buttons line up across both
     cards whatever their text length. Keep the span in sync with the
     number of children. */
  .card {
    position: relative;
    display: grid;
    grid-row: span 5;
    grid-template-rows: subgrid;
    row-gap: 0;
    align-content: start;
    padding: clamp(1.25rem, 2vw, 2.25rem);
    border: 2px solid;
    border-radius: 8px;
    color: inherit;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  }

  .card:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 4px;
  }

  /* Makes the whole card a click target for the calculator link. The
     overlay is positioned against .card, so the link itself must not be
     positioned. */
  .stretched-link::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
  }

  /* Draw the focus ring around the whole card (the overlay) rather than
     around the button. */
  .stretched-link:focus-visible {
    outline: none;
  }

  .stretched-link:focus-visible::after {
    outline: 2px solid #081d88;
    outline-offset: 4px;
  }

  .diy {
    border-color: #5cb85c;
    background: linear-gradient(135deg, #f0faf0 0%, #e2f5e2 100%);
    --accent: #449d44;
    --accent-dark: #3a8a3a;
  }

  .pro {
    border-color: #337ab7;
    background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
    --accent: #337ab7;
    --accent-dark: #23527c;
  }

  .kicker {
    margin: 0 0 0.4rem;
    font-size: clamp(0.85rem, 0.95vw, 1.15rem);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .badge {
    margin-left: 0.5rem;
    padding: 2px 6px;
    border-radius: 3px;
    background: var(--accent);
    color: #fff;
    font-size: 0.8em;
    letter-spacing: 0.04em;
  }

  .card-title {
    margin: 0 0 0.75rem;
    color: #060606;
    font-size: clamp(1.4rem, 2vw, 2.4rem);
    font-weight: 700;
    line-height: 1.2;
  }

  .card-body {
    margin: 0 0 1.25rem;
    color: #4b4b4b;
    font-size: clamp(1.1rem, 1.35vw, 1.6rem);
    line-height: 1.5;
  }

  .card-button {
    justify-self: start;
    align-self: end;
    padding: 0.65em 1.3em;
    border-radius: 6px;
    background: var(--accent);
    color: #fff;
    font-weight: 700;
    font-size: clamp(1.05rem, 1.2vw, 1.4rem);
    transition: background 0.2s ease;
  }

  .card:hover .card-button {
    background: var(--accent-dark);
  }

  .pro .card-title {
    font-size: clamp(1.2rem, 1.5vw, 1.8rem);
  }

  .pro .card-body {
    font-size: clamp(1rem, 1.1vw, 1.3rem);
  }

  /* Outlined rather than filled, so the calculator button stays the
     strongest call to action on the page. */
  .pro .card-button {
    background: transparent;
    border: 2px solid var(--accent);
    color: var(--accent);
    font-size: clamp(0.95rem, 1vw, 1.2rem);
  }

  .pro:hover .card-button {
    background: var(--accent);
    color: #fff;
  }

  .card-footnote {
    margin: 0.9rem 0 0;
    color: #555;
    font-size: clamp(0.9rem, 1vw, 1.15rem);
    line-height: 1.4;
  }

  /* Sits above the stretched calculator link so it stays clickable. */
  .secondary-link {
    position: relative;
    z-index: 1;
    color: var(--accent-dark);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .secondary-link:hover {
    color: #2d6e2d;
  }

  .secondary-link:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  /* Too narrow for the one-third sponsor card: stack, calculator first. */
  @media (max-width: 1000px) {
    .cards {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .pro-line {
    display: none;
    margin: 1rem 0 0;
    color: #555;
    font-size: 1rem;
    line-height: 1.5;
    /* Card padding plus its 2px border, so the text lines up with the
       calculator card's content above it. */
    padding: 0 calc(clamp(1.25rem, 2vw, 2.25rem) + 2px);
    --accent: #337ab7;
  }

  /* Read by screen readers but not shown: the Sponsor label sits outside
     the link, and the card's new-tab notice has no visible twin here. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Lead-in and sponsor label on the first line, the link on the second. */
  .pro-lead {
    display: block;
    margin-bottom: 0.15rem;
  }

  .pro-line a {
    color: #23527c;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .pro-line .badge {
    font-weight: 700;
    text-transform: uppercase;
  }

  .pro-line a:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 2px;
  }

  @media (max-width: 700px) {
    .choice {
      width: 90%;
      margin: 1.5rem auto 2rem;
    }

    /* On phones the sponsor card filled a whole screen yet drew almost no
       clicks, so it becomes a short text link under the calculator card. */
    .pro {
      display: none;
    }

    .pro-line {
      display: block;
    }
  }
</style>
