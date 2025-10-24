<script lang="ts">
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { recipientFilingDate, spouseFilingDate } from "$lib/context";
  import { Money } from "$lib/money";
  import { MonthDate } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import { IntegrationContext } from "../integration-context";

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  const currentMonth = MonthDate.initFromNow();

  interface Entry {
    person: Recipient;
    type: "personal" | "spousal";
    annualAmount: Money;
    startDate: MonthDate;
  }

  let recipientEntry: Entry | null = null;
  let spouseEntry: Entry | null = null;
  let spousalEntry: Entry | null = null;
  let entryCount = 0;

  $: context = new IntegrationContext(recipient, spouse);
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
        type: "personal",
        annualAmount: monthlyBenefit.times(12),
        startDate: primaryDate,
      };
    }
  }

  $: {
    const spouseDate = $spouseFilingDate;
    spouseEntry =
      spouse && spouseDate
        ? {
            person: spouse,
            type: "personal",
            annualAmount: (context.higherEarner() === spouse
              ? context.getHigherEarnerPersonalBenefit(spouseDate)
              : context.getLowerEarnerPersonalBenefit(spouseDate)
            ).times(12),
            startDate: spouseDate,
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
            type: "spousal",
            annualAmount: spousalInfo.monthlyBenefit.times(12),
            startDate: spousalInfo.startDate,
          }
        : null;
  }

  $: entryCount =
    (recipientEntry ? 1 : 0) + (spouseEntry ? 1 : 0) + (spousalEntry ? 1 : 0);
  $: hasEntries = entryCount > 0;

  function yearsIntoRetirement(startDate: MonthDate): number {
    const diffMonths =
      startDate.monthsSinceEpoch() - currentMonth.monthsSinceEpoch();
    if (diffMonths <= 0) return 0;
    return Math.round(diffMonths / 12);
  }

  function formatAnnual(amount: Money): string {
    return amount.roundToDollar().wholeDollars();
  }

  function startLabel(date: MonthDate): string {
    return `${date.monthFullName()} ${date.year()}`;
  }
</script>

<div class="pageBreakAvoid">
  <h2>FI Calc</h2>
  <div class="text">
    <p>
      FI Calc lets you list multiple retirement income streams.
      {#if hasEntries}
        Click <strong>Add Income</strong> in FI Calc and create {entryCount}
        entr{entryCount === 1 ? "y" : "ies"} using the values below.
      {:else}
        Choose filing ages in the charts above and then return here for the
        exact entries to add via FI Calc's <strong>Add Income</strong> modal.
      {/if}
    </p>

    {#if hasEntries}
      <div class="settings-card">
        <h3>For every FI Calc income entry</h3>
        <ul>
          <li>Check <strong>Adjust annually for inflation</strong>.</li>
          <li>
            Keep <strong>Begin adjusting for inflation</strong> set to
            <strong>immediately, at the first year</strong>.
          </li>
          <li>Check <strong>Income repeats indefinitely</strong>.</li>
        </ul>
      </div>

      <ol class="entry-list">
        {#if recipientEntry}
          <li class="entry-item">
            <h3>
              <RecipientName r={recipientEntry.person} /> personal Social Security
            </h3>
            <div class="field-grid">
              <div>
                <span class="field-label">Suggested FI Calc name</span>
                <span class="field-value">
                  <RecipientName noColor r={recipientEntry.person} /> – Personal
                  benefit
                </span>
              </div>
              <div>
                <span class="field-label">Annual amount</span>
                <span class="field-value"
                  >{formatAnnual(recipientEntry.annualAmount)}</span
                >
              </div>
              <div>
                <span class="field-label">Income starts</span>
                <span class="field-value">
                  {yearsIntoRetirement(recipientEntry.startDate) === 0
                    ? "0 (already started or starts immediately)"
                    : `${yearsIntoRetirement(recipientEntry.startDate)} years into retirement`}<br
                  />
                  <small
                    >Start month: {startLabel(recipientEntry.startDate)}</small
                  >
                </span>
              </div>
            </div>
          </li>
        {/if}

        {#if spouseEntry}
          <li class="entry-item">
            <h3>
              <RecipientName r={spouseEntry.person} /> personal Social Security
            </h3>
            <div class="field-grid">
              <div>
                <span class="field-label">Suggested FI Calc name</span>
                <span class="field-value">
                  <RecipientName noColor r={spouseEntry.person} /> – Personal benefit
                </span>
              </div>
              <div>
                <span class="field-label">Annual amount</span>
                <span class="field-value"
                  >{formatAnnual(spouseEntry.annualAmount)}</span
                >
              </div>
              <div>
                <span class="field-label">Income starts</span>
                <span class="field-value">
                  {yearsIntoRetirement(spouseEntry.startDate) === 0
                    ? "0 (already started or starts immediately)"
                    : `${yearsIntoRetirement(spouseEntry.startDate)} years into retirement`}<br
                  />
                  <small>Start month: {startLabel(spouseEntry.startDate)}</small
                  >
                </span>
              </div>
            </div>
          </li>
        {/if}

        {#if spousalEntry}
          <li class="entry-item">
            <h3>
              <RecipientName r={spousalEntry.person} /> spousal Social Security
            </h3>
            <div class="field-grid">
              <div>
                <span class="field-label">Suggested FI Calc name</span>
                <span class="field-value">
                  <RecipientName noColor r={spousalEntry.person} /> – Spousal benefit
                </span>
              </div>
              <div>
                <span class="field-label">Annual amount</span>
                <span class="field-value"
                  >{formatAnnual(spousalEntry.annualAmount)}</span
                >
              </div>
              <div>
                <span class="field-label">Income starts</span>
                <span class="field-value">
                  {yearsIntoRetirement(spousalEntry.startDate) === 0
                    ? "0 (already started or starts immediately)"
                    : `${yearsIntoRetirement(spousalEntry.startDate)} years into retirement`}<br
                  />
                  <small
                    >Start month: {startLabel(spousalEntry.startDate)}</small
                  >
                </span>
              </div>
            </div>
          </li>
        {/if}
      </ol>
    {/if}

    <p class="visit-link">
      <a href="https://ficalc.app/" target="_blank" rel="noopener">
        Visit FI Calc
        <svg
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

  .field-grid {
    display: grid;
    gap: 0.75em;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1em;
  }

  .field-label {
    display: block;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6c757d;
  }

  .field-value {
    font-weight: 600;
    color: #1d3557;
  }

  .field-value small {
    font-weight: normal;
    color: #495057;
  }

  .note {
    margin: 0.75em 0 0 0;
    font-size: 0.9em;
    color: #495057;
  }

  .visit-link a {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    color: #1976d2;
    text-decoration: none;
    font-weight: 500;
  }

  .visit-link a:hover {
    text-decoration: underline;
  }

  .visit-link svg {
    width: 1em;
    height: 1em;
  }

  @media (prefers-color-scheme: dark) {
    .settings-card {
      background: #1f2d3d;
      border-color: #335b94;
    }

    .settings-card h3 {
      color: #9ac9ff;
    }

    .field-grid {
      background: #23272f;
      border-color: #3a4250;
    }

    .field-label {
      color: #9aa0a6;
    }

    .field-value {
      color: #d6e2ff;
    }

    .field-value small {
      color: #b0b6be;
    }

    .note {
      color: #b0b6be;
    }

    .visit-link a {
      color: #9ac9ff;
    }
  }
</style>
