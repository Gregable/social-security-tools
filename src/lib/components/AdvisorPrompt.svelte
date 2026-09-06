<script lang="ts">
  import { trackOutboundClick, outboundImpression } from "$lib/analytics/outbound";
  import { SPONSOR } from "$lib/sponsor";

  const PLACEMENT = "strategy-prompt";

  function handleClick() {
    trackOutboundClick(SPONSOR.destination, PLACEMENT);
  }
</script>

<aside
  class="advisor-prompt"
  use:outboundImpression={{ destination: SPONSOR.destination, placement: PLACEMENT }}
>
  <header class="header">
    <p class="kicker">Sponsor</p>
  </header>
  <p class="copy">
    This optimizer gives you a data-driven starting point. An experienced
    advisor can review the parts it can't model, like your taxes, pensions,
    and health, and help you file. <strong>{SPONSOR.name}</strong> offers a
    free initial consultation.
  </p>
  <p class="cta">
    <a
      href={SPONSOR.url}
      target="_blank"
      rel="noopener"
      on:click={handleClick}
    >
      Book a Free Consultation &rarr;
    </a>
  </p>
</aside>

<style>
  .advisor-prompt {
    margin: 1.5rem 0;
  }

  .header {
    padding-bottom: 0.5rem;
    margin-bottom: 0.6rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .copy {
    margin: 0 0 1.4rem;
    color: #1f2937;
    line-height: 1.65;
    font-size: 1.12rem;
  }

  .cta {
    margin: 0;
    text-align: center;
  }

  .cta a {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 8px;
    background: linear-gradient(135deg, #337ab7 0%, #23527c 100%);
    color: #fff;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .cta a:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(11, 17, 48, 0.12);
  }

  .cta a:focus-visible {
    outline: 2px solid #081d88;
    outline-offset: 4px;
  }
</style>
