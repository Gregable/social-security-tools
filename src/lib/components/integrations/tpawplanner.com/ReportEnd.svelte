<script lang="ts">
import { trackOutboundClick } from '$lib/analytics/outbound';
import RecipientName from '$lib/components/RecipientName.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import {
  buildTpawIncomeEntries,
  type TpawIncomeEntry,
  type TpawYouChoice,
  tpawBirthMonth,
  tpawEndText,
  tpawLabel,
  tpawPeople,
  tpawStartText,
} from '$lib/integrations/tpaw';
import { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import CopyButton from '../CopyButton.svelte';
import { IntegrationContext } from '../integration-context';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

const TPAW_INCOME_URL =
  'https://tpawplanner.com/plan?section=income-during-retirement';
const now = MonthDate.initFromNow();

/** Which household member is "you" in TPAW; the other is the partner. */
let youChoice: TpawYouChoice = 'recipient';

$: context = new IntegrationContext($recipient, spouse ? $spouse : null);
$: ({ you, partner } = tpawPeople(context, youChoice));
$: entries = buildTpawIncomeEntries({
  context,
  recipientFilingDate: $recipientFilingDate,
  spouseFilingDate: context.spouse === null ? null : $spouseFilingDate,
  you: youChoice,
  now,
});
$: higherEarner = context.higherEarner();
$: lowerEarner = context.lowerEarner();
// With every PIA at $0 there is nothing to enter, at any filing date.
$: hasNoBenefit =
  hasZeroPia(context.recipient) &&
  (context.spouse === null || hasZeroPia(context.spouse));

function hasZeroPia(r: Recipient): boolean {
  return r.pia().primaryInsuranceAmount().cents() <= 0;
}

/** Stable across "you" changes, so each entry keeps its own copy buttons. */
function entryKey(entry: TpawIncomeEntry): string {
  const role = entry.recipient === context.recipient ? 'recipient' : 'spouse';
  return `${entry.kind}-${role}`;
}

function startHint(entry: TpawIncomeEntry): string {
  const month = entry.start.month.toFullString();
  return entry.start.alreadyStarted ? `${month}; already started` : month;
}
</script>

<div class="pageBreakAvoid">
  <h2>TPAW Planner</h2>
  <div class="text">
    <div class="visit-link">
      <a
        href={TPAW_INCOME_URL}
        target="_blank"
        rel="noopener"
        on:click={() =>
          trackOutboundClick('tpawplanner', 'integration-report-end')}
      >
        <strong>Open TPAW Planner</strong>
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

    {#if hasNoBenefit}
      <p class="no-benefit">
        With a $0 Primary Insurance Amount, there is no Social Security
        retirement benefit to add to TPAW.
      </p>
    {:else}
      <p>
        In TPAW, open <strong>Income During Retirement</strong>, select
        <strong>Add</strong>, and create one entry for each benefit below. The
        amounts are monthly, in today's dollars, for the filing
        {context.spouse === null ? 'date' : 'dates'} you selected above.
      </p>

      {#if context.spouse !== null}
        <fieldset class="you-choice">
          <legend
            >In TPAW, who is "you"? The other person is your partner.</legend
          >
          <label>
            <input type="radio" bind:group={youChoice} value="recipient" />
            <RecipientName r={context.recipient} alwaysShowName />
          </label>
          <label>
            <input type="radio" bind:group={youChoice} value="spouse" />
            <RecipientName r={context.spouse} alwaysShowName />
          </label>
        </fieldset>
      {/if}

      <p class="age-check">
        TPAW counts ages from the <strong>Month of Birth</strong> in its
        <strong>Age</strong> section. The start ages below assume
        {#if partner === null}
          a month of birth of
          <strong>{tpawBirthMonth(you).toFullString()}</strong>.
        {:else}
          <strong>{tpawBirthMonth(you).toFullString()}</strong> for you
          (<RecipientName r={you} alwaysShowName />) and
          <strong>{tpawBirthMonth(partner).toFullString()}</strong> for your
          partner (<RecipientName r={partner} alwaysShowName />).
        {/if}
      </p>

      {#if entries.length === 0}
        <p>Choose a filing date in the charts above to see the entries.</p>
      {:else}
        <ol class="entry-list">
          {#each entries as entry (entryKey(entry))}
            {@const label = tpawLabel(entry, partner !== null)}
            <li class="entry-item">
              <h3>
                <RecipientName r={entry.recipient} apos>Your</RecipientName>
                {entry.kind === 'personal' ? 'Social Security' : 'spousal benefit'}
              </h3>
              <dl class="steps">
                <div class="step">
                  <dt>Label</dt>
                  <dd>
                    <span class="value">{label}</span>
                    <CopyButton value={label} label="Copy label for {label}" />
                  </dd>
                </div>
                <div class="step">
                  <dt>Amount per Month</dt>
                  <dd>
                    <span class="value"
                      >{entry.monthlyAmount.wholeDollars()}</span
                    >
                    <CopyButton
                      value={entry.monthlyAmount.value().toFixed(0)}
                      label="Copy amount for {label}"
                    />
                    <span class="hint">adjusted for inflation (real dollars)</span>
                  </dd>
                </div>
                <div class="step">
                  <dt>For These Months</dt>
                  <dd>
                    <span class="range-line">
                      Start: <span class="value">{tpawStartText(entry)}</span>
                      <span class="hint">({startHint(entry)})</span>
                    </span>
                    <span class="range-line">
                      End: <span class="value">{tpawEndText(entry)}</span>
                    </span>
                  </dd>
                </div>
              </dl>
            </li>
          {/each}
        </ol>

        {#if lowerEarner !== null}
          <p class="note">
            TPAW ends each entry at that person's max age. If
            <RecipientName r={higherEarner} alwaysShowName /> dies first,
            <RecipientName r={lowerEarner} alwaysShowName /> would switch to a
            <a href="/guides/survivor-benefits">survivor benefit</a> based on
            <RecipientName r={higherEarner} alwaysShowName apos />
            record. These entries don't include it, so the plan shows
            <RecipientName r={lowerEarner} alwaysShowName apos /> income after that
            point as lower than it would be.
          </p>
        {/if}
      {/if}
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

  .you-choice {
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 0.75em 1em;
    margin: 1em 0;
  }

  .you-choice legend {
    padding: 0 0.25em;
  }

  .you-choice label {
    margin-right: 1.5em;
    cursor: pointer;
  }

  .entry-list {
    margin: 1.5em 0;
    padding-left: 1.5em;
  }

  .entry-item {
    margin: 1.5em 0;
  }

  .entry-item h3 {
    margin: 0 0 0.5em 0;
    font-size: 1.1em;
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
    grid-template-columns: 10em 1fr;
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

  .range-line {
    display: block;
    width: 100%;
  }

  .value {
    font-weight: 600;
    color: #1d3557;
  }

  .hint {
    color: #6c757d;
    font-size: 0.9em;
  }

  .note {
    color: #495057;
    font-size: 0.95em;
  }

  @media (max-width: 500px) {
    .step {
      grid-template-columns: 1fr;
    }
  }
</style>
