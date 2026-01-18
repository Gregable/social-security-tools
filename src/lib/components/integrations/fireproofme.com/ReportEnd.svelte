<script lang="ts">
import RecipientName from '$lib/components/RecipientName.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { IntegrationContext } from '../integration-context';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

interface FireproofEntry {
  person: Recipient;
  type: 'personal' | 'spousal';
  annualAmount: Money;
  startDate: MonthDate;
  suggestedName: string;
}

let recipientEntry: FireproofEntry | null = null;
let spouseEntry: FireproofEntry | null = null;
let spousalEntry: FireproofEntry | null = null;

$: context = new IntegrationContext($recipient, $spouse);

$: {
  const primaryDate = $recipientFilingDate;
  if (!primaryDate) {
    recipientEntry = null;
  } else {
    const monthlyBenefit =
      context.higherEarner() === recipient
        ? context.getHigherEarnerPersonalBenefit(primaryDate)
        : context.getLowerEarnerPersonalBenefit(primaryDate);

    recipientEntry = {
      person: recipient,
      type: 'personal',
      annualAmount: monthlyBenefit.times(12),
      startDate: primaryDate,
      suggestedName: `${recipient.name || 'Your'} SS Benefit`,
    };
  }
}

$: {
  const spouseDate = $spouseFilingDate;
  spouseEntry =
    spouse && spouseDate
      ? {
          person: spouse,
          type: 'personal',
          annualAmount: (context.higherEarner() === spouse
            ? context.getHigherEarnerPersonalBenefit(spouseDate)
            : context.getLowerEarnerPersonalBenefit(spouseDate)
          ).times(12),
          startDate: spouseDate,
          suggestedName: `${spouse.name || 'Spouse'} SS Benefit`,
        }
      : null;
}

$: {
  const lowerEarner = context.lowerEarner();
  const spousalInfo = context.getLowerEarnerSpousalBenefit();
  spousalEntry =
    lowerEarner && spousalInfo
      ? {
          person: lowerEarner,
          type: 'spousal',
          annualAmount: spousalInfo.monthlyBenefit.times(12),
          startDate: spousalInfo.startDate,
          suggestedName: `${lowerEarner.name || 'Spouse'} Spousal SS`,
        }
      : null;
}

$: entryCount =
  (recipientEntry ? 1 : 0) + (spouseEntry ? 1 : 0) + (spousalEntry ? 1 : 0);
$: hasEntries = entryCount > 0;

function formatAnnual(amount: Money): string {
  return amount.roundToDollar().wholeDollars();
}

function formatAnnualRaw(amount: Money): string {
  return amount.roundToDollar().value().toFixed(0);
}

function startLabel(date: MonthDate): string {
  return `${date.monthFullName()} ${date.year()}`;
}
</script>

<div class="pageBreakAvoid">
  <h2>FIREProof</h2>
  <div class="text">
    <p>
      Now that you have calculated your Social Security benefits, you can use
      this information with FIREProof to model your retirement income.
    </p>

    <p class="info-note">
      <strong>Note:</strong> The values below are based on the filing
      {spouse ? 'dates' : 'date'} you selected above.
    </p>

    {#if hasEntries}
      <div class="settings-card">
        <h3>For every FIREProof income entry</h3>
        <ul>
          <li>Set <strong>Recurrence</strong> to "Recurring"</li>
          <li>Leave <strong>End Year</strong> at the default for lifetime benefits</li>
          <li>
            Leave <strong>Treat as post-tax</strong> off — Social Security is
            partially taxable, so treating it as pre-tax is the conservative
            approach. See our
            <a href="/guides/federal-taxes" target="_blank" rel="noopener"
              >guide on Social Security and federal taxes</a
            > for more details.
          </li>
        </ul>
      </div>

      <ol class="entry-list">
        {#if recipientEntry}
          <li class="entry-item">
            <h3>
              <RecipientName r={recipientEntry.person} /> personal Social Security
            </h3>
            <div class="fireproof-card">
              <div class="field-row">
                <div class="field-group">
                  <span class="field-label">Name</span>
                  <div class="field-value-row">
                    <span class="field-value">{recipientEntry.suggestedName}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy name to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          recipientEntry?.suggestedName ?? ''
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="field-row">
                <div class="field-group">
                  <span class="field-label">Amount (annual)</span>
                  <div class="field-value-row">
                    <span class="field-value"
                      >{formatAnnual(recipientEntry.annualAmount)}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy amount to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          formatAnnualRaw(recipientEntry?.annualAmount ?? Money.zero())
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="field-group">
                  <span class="field-label">Start Year</span>
                  <div class="field-value-row">
                    <span class="field-value"
                      >{recipientEntry.startDate.year()}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy start year to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          recipientEntry?.startDate.year().toString() ?? ''
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <small class="field-hint"
                    >({startLabel(recipientEntry.startDate)})</small
                  >
                </div>
              </div>
            </div>
          </li>
        {/if}

        {#if spouseEntry}
          <li class="entry-item">
            <h3>
              <RecipientName r={spouseEntry.person} /> personal Social Security
            </h3>
            <div class="fireproof-card">
              <div class="field-row">
                <div class="field-group">
                  <span class="field-label">Name</span>
                  <div class="field-value-row">
                    <span class="field-value">{spouseEntry.suggestedName}</span>
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy name to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          spouseEntry?.suggestedName ?? ''
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="field-row">
                <div class="field-group">
                  <span class="field-label">Amount (annual)</span>
                  <div class="field-value-row">
                    <span class="field-value"
                      >{formatAnnual(spouseEntry.annualAmount)}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy amount to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          formatAnnualRaw(spouseEntry?.annualAmount ?? Money.zero())
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="field-group">
                  <span class="field-label">Start Year</span>
                  <div class="field-value-row">
                    <span class="field-value">{spouseEntry.startDate.year()}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy start year to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          spouseEntry?.startDate.year().toString() ?? ''
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <small class="field-hint"
                    >({startLabel(spouseEntry.startDate)})</small
                  >
                </div>
              </div>
            </div>
          </li>
        {/if}

        {#if spousalEntry}
          <li class="entry-item">
            <h3>
              <RecipientName r={spousalEntry.person} /> spousal Social Security
            </h3>
            <div class="fireproof-card">
              <div class="field-row">
                <div class="field-group">
                  <span class="field-label">Name</span>
                  <div class="field-value-row">
                    <span class="field-value">{spousalEntry.suggestedName}</span>
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy name to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          spousalEntry?.suggestedName ?? ''
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="field-row">
                <div class="field-group">
                  <span class="field-label">Amount (annual)</span>
                  <div class="field-value-row">
                    <span class="field-value"
                      >{formatAnnual(spousalEntry.annualAmount)}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy amount to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          formatAnnualRaw(spousalEntry?.annualAmount ?? Money.zero())
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="field-group">
                  <span class="field-label">Start Year</span>
                  <div class="field-value-row">
                    <span class="field-value"
                      >{spousalEntry.startDate.year()}</span
                    >
                    <button
                      class="copy-btn"
                      title="Copy to clipboard"
                      aria-label="Copy start year to clipboard"
                      on:click={() =>
                        IntegrationContext.copyToClipboard(
                          spousalEntry?.startDate.year().toString() ?? ''
                        )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                          d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <small class="field-hint"
                    >({startLabel(spousalEntry.startDate)})</small
                  >
                </div>
              </div>
            </div>
          </li>
        {/if}
      </ol>
    {:else}
      <p>
        Choose filing ages in the charts above and then return here for the
        exact entries to add in FIREProof.
      </p>
    {/if}

    <p>
      <a href="https://fireproofme.com/" target="_blank" rel="noopener">
        Visit FIREProof
        <svg
          class="external-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </p>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  .text p {
    margin: 1em 0;
  }

  .text a {
    color: #1976d2;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
  }

  .text a:hover {
    text-decoration: underline;
  }

  .external-icon {
    width: 1em;
    height: 1em;
    vertical-align: middle;
  }

  .info-note {
    background: #e3f2fd;
    border-left: 4px solid #1976d2;
    padding: 0.75em 1em;
    margin: 1em 0;
    border-radius: 4px;
    font-size: 0.95em;
  }

  .settings-card {
    background: #f5faff;
    border: 1px solid #91c2ff;
    border-radius: 8px;
    padding: 1.25em 1.5em;
    margin: 1.5em 0;
  }

  .settings-card h3 {
    margin: 0 0 0.75em 0;
    font-size: 1.05em;
    color: #1d4f91;
  }

  .settings-card ul {
    margin: 0;
    padding-left: 1.3em;
  }

  .settings-card li {
    margin: 0.35em 0;
  }

  .entry-list {
    margin: 1.5em 0;
    padding-left: 1.5em;
  }

  .entry-item {
    margin: 1.75em 0;
  }

  .entry-item h3 {
    margin: 0 0 0.75em 0;
    font-size: 1.1em;
    color: #1976d2;
  }

  .fireproof-card {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1em;
  }

  .field-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    margin-bottom: 0.75em;
  }

  .field-row:last-child {
    margin-bottom: 0;
  }

  .field-group {
    flex: 1;
    min-width: 150px;
  }

  .field-label {
    display: block;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6c757d;
    margin-bottom: 0.25em;
  }

  .field-value-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .field-value {
    font-weight: 600;
    color: #1d3557;
    font-family: 'Courier New', monospace;
  }

  .field-hint {
    font-size: 0.85em;
    color: #6c757d;
    font-weight: normal;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25em;
    background: #1976d2;
    color: white;
    border: 1px solid #1565c0;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .copy-btn:hover {
    background: #1565c0;
    transform: translateY(-1px);
  }

  .copy-btn:active {
    transform: translateY(0);
  }

  .copy-btn svg {
    width: 0.9rem;
    height: 0.9rem;
    display: block;
  }

  @media (max-width: 600px) {
    .field-row {
      flex-direction: column;
    }

    .field-group {
      min-width: 100%;
    }
  }

  @media print {
    .copy-btn {
      display: none;
    }
  }
</style>
