<script lang="ts">
import { trackOutboundClick } from '$lib/analytics/outbound';
import RecipientName from '$lib/components/RecipientName.svelte';
import {
  retirementFiguresPeople,
  retirementFiguresUrl,
} from '$lib/integrations/retirement-figures';
import type { Recipient } from '$lib/recipient';
import { IntegrationContext } from '../integration-context';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

$: context = new IntegrationContext($recipient, spouse ? $spouse : null);
$: people = retirementFiguresPeople(context);
$: url = retirementFiguresUrl(people);
$: isCouple = people.length > 1;
// With every PIA at $0 there is no benefit to carry over.
$: hasNoBenefit = people.every((p) => p.pia.cents() === 0);
</script>

<div class="pageBreakAvoid">
  <h2>Retirement Figures</h2>
  <div class="text">
    {#if hasNoBenefit}
      <p>
        With a $0 Primary Insurance Amount, there is no Social Security
        retirement benefit to add to Retirement Figures.
      </p>
    {:else}
      <p>
        This link opens the Retirement Figures Social Security calculator with
        the figures below filled in: {isCouple ? 'each person’s' : 'your'} Primary
        Insurance Amount (the monthly benefit at full retirement age) and birth
        date. It works out
        the benefit for each claiming age from 62 to 70{isCouple
          ? ', including spousal benefits,'
          : ''} itself.
      </p>
      <dl class="figures">
        {#each people as p (p.recipient)}
          <div class="figure">
            <dt>
              {#if isCouple}
                <RecipientName r={p.recipient} alwaysShowName />
              {:else}
                Primary Insurance Amount
              {/if}
            </dt>
            <dd>
              <span class="value">{p.pia.wholeDollars()}</span>
              {#if isCouple && p.pia.cents() === 0}
                (spousal benefits only)
              {/if}
              <span class="born">
                born {p.recipient.birthdate.layBirthdateString()}
              </span>
            </dd>
          </div>
        {/each}
      </dl>
      <div class="visit-link">
        <a
          href={url}
          target="_blank"
          rel="noopener"
          on:click={() =>
            trackOutboundClick('retirementfigures', 'integration-report-end')}
        >
          <strong>Open Retirement Figures with my benefits</strong>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  .text p {
    margin: 1em 0;
  }

  .figures {
    margin: 1em 0;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 0.75em 1em;
  }

  .figure {
    display: grid;
    grid-template-columns: 14em 1fr;
    gap: 0.25em 1em;
    padding: 0.4em 0;
  }

  .figure + .figure {
    border-top: 1px solid #e9ecef;
  }

  .figure dt {
    font-weight: 600;
    color: #495057;
  }

  .figure dd {
    margin: 0;
  }

  .value {
    font-weight: 600;
    color: #1d3557;
  }

  .born {
    color: #6c757d;
    margin-left: 0.5em;
  }

  .visit-link a {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    color: #1976d2;
    text-decoration: none;
  }

  .visit-link a:hover {
    text-decoration: underline;
  }

  .visit-link svg {
    width: 1em;
    height: 1em;
  }

  @media (max-width: 600px) {
    .figure {
      grid-template-columns: 1fr;
    }
  }
</style>
