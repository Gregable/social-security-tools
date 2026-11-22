<script lang="ts">
import { trackOutboundClick } from '$lib/analytics/outbound';
import RecipientName from '$lib/components/RecipientName.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import {
  buildRsHousehold,
  type RsHousehold,
  type RsPerson,
  retirementScenarioUrl,
  rsClaimAge,
  rsFields,
} from '$lib/integrations/retirement-scenario';
import { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import CopyButton from '../CopyButton.svelte';
import { IntegrationContext } from '../integration-context';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

const now = MonthDate.initFromNow();

$: context = new IntegrationContext($recipient, spouse ? $spouse : null);
$: household = buildRsHousehold({
  context,
  recipientFilingDate: $recipientFilingDate,
  spouseFilingDate: context.spouse === null ? null : $spouseFilingDate,
  now,
});
$: people = householdPeople(household);
$: url = household === null ? '' : retirementScenarioUrl(household);
// With every PIA at $0 there is nothing to enter, at any filing date.
$: hasNoBenefit =
  hasZeroPia(context.recipient) &&
  (context.spouse === null || hasZeroPia(context.spouse));

function householdPeople(h: RsHousehold | null): RsPerson[] {
  if (h === null) return [];
  if (h.spouse === null) return [h.you];
  return [h.you, h.spouse];
}

function hasZeroPia(r: Recipient): boolean {
  return r.pia().primaryInsuranceAmount().cents() <= 0;
}

/** True when the spousal-only claim age was lowered to 67. */
function isCapped(p: RsPerson): boolean {
  return p.claimAge !== rsClaimAge(p.filingAge);
}

/** True when the filing age had to be rounded or clamped to whole years. */
function isRounded(p: RsPerson): boolean {
  return (
    !isCapped(p) &&
    (p.filingAge.modMonths() !== 0 || p.filingAge.years() !== p.claimAge)
  );
}

/** True when the age-67 amount includes delayed credits (FRA before 67). */
function hasEarlierFra(p: RsPerson): boolean {
  return (
    p.benefit.kind === 'planned' &&
    p.recipient.normalRetirementAge().asMonths() < 67 * 12
  );
}
</script>

<div class="pageBreakAvoid">
  <h2>Retirement Scenario Explorer</h2>
  <div class="text">
    {#if hasNoBenefit}
      <p>
        With a $0 Primary Insurance Amount, there is no Social Security
        retirement benefit to add to Retirement Scenario.
      </p>
    {:else if household === null}
      <p>Choose a filing date in the charts above to see your entries.</p>
    {:else}
      <p>
        This link opens Retirement Scenario with your Social Security filled in
        for the filing {household.spouse === null ? 'date' : 'dates'} you selected
        above. Retirement Scenario calculates the amounts for other claim
        ages{household.spouse === null
          ? ''
          : ', and spousal and survivor benefits,'} itself. Add your savings and
        spending there to complete the plan.
      </p>
      <div class="visit-link">
        <a
          href={url}
          target="_blank"
          rel="noopener"
          on:click={() =>
            trackOutboundClick('retirementscenario', 'integration-report-end')}
        >
          <strong>Open Retirement Scenario with my benefits</strong>
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
        <span class="link-hint">
          It opens as a shared plan. Select <strong>Explore This Plan</strong>
          to see your Social Security inputs.
        </span>
      </div>

      <h3>Entering them in a plan you already have</h3>
      <p>
        If you already have a plan saved in Retirement Scenario, the link opens
        a separate copy and leaves your plan as it is. To update your own plan
        instead, enter these settings in the <strong>Social Security</strong>
        section of its <strong>Inputs</strong> tab.
      </p>
      {#if household.spouse !== null}
        <p>
          Enter <RecipientName r={household.you.recipient} alwaysShowName /> as
          "you" and <RecipientName r={household.spouse.recipient} alwaysShowName />
          as your spouse. The higher earner goes first in Retirement Scenario.
        </p>
      {/if}

      {#each people as p (p.role)}
        <div class="person">
          {#if household.spouse !== null}
            <h4>
              <RecipientName r={p.recipient} alwaysShowName />
              ({p.role === 'you' ? 'you' : 'your spouse'})
            </h4>
          {/if}
          <dl class="steps">
            {#each rsFields(p) as field (field.label)}
              <div class="step">
                <dt>{field.label}</dt>
                <dd>
                  <span class="value">{field.value}</span>
                  {#if field.copyValue !== undefined}
                    <CopyButton
                      value={field.copyValue}
                      label="Copy {field.label}"
                    />
                  {/if}
                </dd>
              </div>
            {/each}
          </dl>
          {#if isRounded(p)}
            <p class="note">
              Retirement Scenario takes claim ages in whole years, so a filing
              age of {p.filingAge.toFullAgeString()} is entered as {p.claimAge}.
            </p>
          {/if}
          {#if isCapped(p)}
            <p class="note">
              Spousal benefits stop growing at full retirement age, so
              Retirement Scenario's spousal estimate takes a claim age of at
              most 67.
            </p>
          {/if}
          {#if hasEarlierFra(p)}
            <p class="note">
              Retirement Scenario uses 67 as everyone's full retirement age.
              <RecipientName r={p.recipient} apos>Your</RecipientName> full retirement
              age is
              {p.recipient.normalRetirementAge().toFullAgeString()}, so the age-67
              amount above includes delayed retirement credits.
            </p>
          {/if}
        </div>
      {/each}
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

  .text h3 {
    margin: 1.5em 0 0.5em 0;
    font-size: 1.1em;
  }

  .visit-link {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25em 1em;
  }

  .link-hint {
    color: #6c757d;
    font-size: 0.9em;
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

  .person {
    margin: 1.25em 0;
  }

  .person h4 {
    margin: 0 0 0.5em 0;
    font-size: 1em;
  }

  .steps {
    margin: 0;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 0.75em 1em;
  }

  .step {
    display: grid;
    grid-template-columns: 18em 1fr;
    gap: 0.25em 1em;
    padding: 0.4em 0;
  }

  .step + .step {
    border-top: 1px solid #e9ecef;
  }

  .step dt {
    font-weight: 600;
    color: #495057;
  }

  .step dd {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25em 0.5em;
  }

  .value {
    font-weight: 600;
    color: #1d3557;
  }

  .text .note {
    color: #495057;
    font-size: 0.95em;
    margin: 0.5em 0;
  }

  @media (max-width: 600px) {
    .step {
      grid-template-columns: 1fr;
    }
  }
</style>
