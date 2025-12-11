<script lang="ts">
import { CURRENT_YEAR } from '$lib/constants';
import { recipientFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { IntegrationContext } from '../integration-context';
import SpousalBenefitToggle from '../SpousalBenefitToggle.svelte';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

// Toggle for lower earner benefit calculation (personal only vs personal + spousal)
let includeSpousalBenefit = false;

// Context for determining higher/lower earners and their filing dates
$: context = new IntegrationContext($recipient, $spouse);

// Calculated values from SpousalBenefitToggle (annual benefits in today's dollars)
// These are bound from the toggle component when spouse is present
let recipientBenefitCalculationDate: MonthDate;
let spouseBenefitCalculationDate: MonthDate;
let recipientAnnualBenefit: Money;
let spouseAnnualBenefit: Money;

// For single-person case, calculate values directly
$: if (spouse === null) {
  const recipientValue = $recipient;
  recipientBenefitCalculationDate = $recipientFilingDate!;
  recipientAnnualBenefit = recipientValue
    .benefitOnDate(
      recipientBenefitCalculationDate,
      recipientBenefitCalculationDate
    )
    .times(12);
}

// Format annual benefit for FIRECalc (today's dollars, whole dollars)
function formatForFIRECalc(annualBenefit: Money): string {
  return annualBenefit.roundToDollar().value().toFixed(0);
}

// Reactive formatted values and starting years
$: recipientStartingYear = recipientBenefitCalculationDate
  ? recipientBenefitCalculationDate.year()
  : CURRENT_YEAR;
$: recipientAnnualSS = recipientAnnualBenefit
  ? formatForFIRECalc(recipientAnnualBenefit)
  : '0';

$: spouseStartingYear = spouse
  ? (spouseBenefitCalculationDate?.year() ?? CURRENT_YEAR)
  : CURRENT_YEAR;
$: spouseAnnualSS =
  spouse && spouseAnnualBenefit ? formatForFIRECalc(spouseAnnualBenefit) : '0';
</script>

<div class="pageBreakAvoid">
  <h2>FIRECalc</h2>

  <div class="text">
    <p>
      Now that you have calculated your Social Security benefits, you can use
      this information with FIRECalc to model your retirement income strategy.
    </p>

    <p class="info-note">
      <strong>Note:</strong> The values below are based on the filing
      {spouse ? 'dates' : 'date'} you selected above.
    </p>

    {#if spouse !== null}
      <SpousalBenefitToggle
        {context}
        bind:includeSpousalBenefit
        bind:recipientBenefitCalculationDate
        bind:spouseBenefitCalculationDate
        bind:recipientAnnualBenefit
        bind:spouseAnnualBenefit
        toolName="FIRECalc"
      />
    {/if}

    <p>
      Enter these values into FIRECalc's "Other Income/Spending" tab into the
      "Social Security" form boxes:
    </p>

    <div class="firecalc-mirror">
      <div class="mirror-header">
        <div class="mirror-title">
          <svg
            class="window-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          FIRECalc Interface Preview
        </div>
        <div class="mirror-subtitle">
          Copy these values into FIRECalc's form
        </div>
      </div>

      <div class="firecalc-section">
        <table class="ss-table">
          <tbody>
            <tr>
              <td>
                <p>
                  <strong>Your Social Security:</strong>
                  <span class="description"
                    >Enter the <strong>annual</strong> payments you expect to receive,
                    in today's dollars.</span
                  >
                </p>
              </td>
              <td class="input-cell">
                <input type="text" readonly value={recipientAnnualSS} />
                <button
                  class="copy-btn"
                  title="Copy to clipboard"
                  aria-label="Copy your Social Security amount to clipboard"
                  on:click={() =>
                    IntegrationContext.copyToClipboard(recipientAnnualSS)}
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
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    />
                  </svg>
                </button>
              </td>
              <td class="starting-cell">
                starting in
                <input
                  type="text"
                  readonly
                  class="year-input"
                  value={recipientStartingYear}
                />
                <button
                  class="copy-btn"
                  title="Copy to clipboard"
                  aria-label="Copy starting year to clipboard"
                  on:click={() =>
                    IntegrationContext.copyToClipboard(
                      recipientStartingYear.toString()
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
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    />
                  </svg>
                </button>
              </td>
            </tr>
            <tr class={spouse ? '' : 'disabled'}>
              <td>
                <p>
                  <strong>Spouse's Social Security:</strong>
                  {#if !spouse}
                    <span class="description">(No spouse entered)</span>
                  {/if}
                </p>
              </td>
              <td class="input-cell">
                <input type="text" readonly value={spouseAnnualSS} />
                {#if spouse}
                  <button
                    class="copy-btn"
                    title="Copy to clipboard"
                    aria-label="Copy spouse's Social Security amount to clipboard"
                    on:click={() =>
                      IntegrationContext.copyToClipboard(spouseAnnualSS)}
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
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      />
                    </svg>
                  </button>
                {/if}
              </td>
              <td class="starting-cell">
                starting in
                <input
                  type="text"
                  readonly
                  class="year-input"
                  value={spouseStartingYear}
                />
                {#if spouse}
                  <button
                    class="copy-btn"
                    title="Copy to clipboard"
                    aria-label="Copy spouse's starting year to clipboard"
                    on:click={() =>
                      IntegrationContext.copyToClipboard(
                        spouseStartingYear.toString()
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
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      />
                    </svg>
                  </button>
                {/if}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p>
      These values are based on your selected filing
      {spouse ? 'dates' : 'date'} from the chart above.
    </p>

    <p>
      <a href="https://firecalc.com/" target="_blank" rel="noopener">
        Visit FIRECalc
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

    <div class="caveats">
      <h3>Caveats</h3>
      <ul>
        <li>
          The starting years shown are the actual years when benefits begin
          based on your filing dates. Your benefits may not begin exactly at the
          start of the year.
        </li>
        <li>
          Only a single starting year is entered for each person. With spousal
          benefits, there may be multiple periods when benefits start (e.g., one
          for personal benefit and another for spousal benefit).
        </li>
      </ul>
    </div>
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

  /* FIRECalc mirror container - lightbox style */
  .firecalc-mirror {
    background: var(--mirror-outer-bg, #f0f4f8);
    border: 2px solid var(--mirror-border, #1976d2);
    border-radius: 8px;
    padding: 0;
    margin: 1.5em 0;
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.1),
      0 1px 3px rgba(0, 0, 0, 0.08),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    overflow: hidden;
  }

  .mirror-header {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    padding: 1rem 1.5rem;
    border-bottom: 3px solid var(--mirror-border, #0d47a1);
  }

  .mirror-title {
    font-size: 1.1em;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .window-icon {
    width: 1.2em;
    height: 1.2em;
    opacity: 0.9;
  }

  .mirror-subtitle {
    font-size: 0.9em;
    opacity: 0.9;
    font-weight: normal;
  }

  /* FIRECalc section styling - mimics FIRECalc's form layout */
  .firecalc-section {
    background: var(--section-bg, #fff);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .ss-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ss-table tbody tr {
    border-bottom: 1px solid var(--row-border, #e9ecef);
  }

  .ss-table tbody tr:last-child {
    border-bottom: none;
  }

  .ss-table tbody tr.disabled {
    opacity: 0.5;
  }

  .ss-table td {
    padding: 1rem 0.5rem;
    vertical-align: middle;
  }

  .ss-table td:first-child {
    padding-left: 0;
  }

  .ss-table td p {
    margin: 0;
  }

  .ss-table > tbody > tr > td > p > strong {
    display: block;
    margin-bottom: 0.25rem;
    color: var(--label-color, #212529);
  }

  .ss-table .description {
    display: block;
    font-size: 0.9em;
    color: var(--description-color, #6c757d);
    line-height: 1.4;
  }

  .ss-table .description strong {
    display: inline;
    margin-bottom: 0;
  }

  .input-cell {
    white-space: nowrap;
    text-align: right;
    width: 1%;
  }

  .ss-table input {
    padding: 0.375rem 0.5rem;
    text-align: right;
    font-size: 1rem;
    border: 1px solid var(--input-border, #ced4da);
    border-radius: 0.25rem;
    background-color: var(--input-bg, #f8f9fa);
    color: var(--input-color, #495057);
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem;
    margin-left: 0.5rem;
    background: var(--copy-btn-bg, #1976d2);
    color: var(--copy-btn-color, white);
    border: 1px solid var(--copy-btn-border, #1565c0);
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    vertical-align: middle;
  }

  .copy-btn:hover {
    background: var(--copy-btn-hover-bg, #1565c0);
    transform: translateY(-1px);
  }

  .copy-btn:active {
    transform: translateY(0);
  }

  .copy-btn svg {
    width: 1rem;
    height: 1rem;
    display: block;
  }

  .input-cell input {
    width: 7em;
  }

  .starting-cell {
    white-space: nowrap;
    color: var(--text-color, #212529);
    text-align: right;
    width: 1%;
    padding-right: 0 !important;
  }

  .year-input {
    width: 5em !important;
    margin-left: 0.5rem;
  }

  /* Responsive layout */
  @media (max-width: 770px) {
    .ss-table,
    .ss-table tbody,
    .ss-table tr,
    .ss-table td {
      display: block;
      width: 100%;
    }

    .ss-table td {
      padding: 0.5rem 0;
    }

    .ss-table tbody tr {
      padding: 1rem 0;
    }

    .input-cell,
    .starting-cell {
      text-align: left;
      margin-top: 0.5rem;
    }

    .starting-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mirror-header {
      padding: 0.75rem 1rem;
    }

    .firecalc-section {
      padding: 1rem;
    }
  }

  .caveats {
    background: #f8f9fa;
    border-left: 4px solid #1976d2;
    padding: 1em;
    margin: 1.5em 0;
    border-radius: 4px;
  }

  .caveats h3 {
    margin: 0 0 0.5em 0;
    font-size: 1em;
    color: #1976d2;
  }

  .caveats ul {
    margin: 0;
    padding-left: 1.5em;
  }

  .caveats li {
    margin: 0.5em 0;
  }

  @media (prefers-color-scheme: dark) {
    .firecalc-mirror {
      --mirror-outer-bg: #1a1a1a;
      --mirror-border: #64b5f6;
    }

    .mirror-header {
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      border-bottom-color: #1976d2;
    }

    .firecalc-section {
      --section-bg: #2b2b2b;
      --heading-color: #e0e0e0;
      --row-border: #444;
      --label-color: #e0e0e0;
      --description-color: #b0b0b0;
      --input-border: #555;
      --input-bg: #3a3a3a;
      --input-color: #e0e0e0;
      --text-color: #e0e0e0;
      --copy-btn-bg: #1976d2;
      --copy-btn-color: white;
      --copy-btn-border: #1565c0;
      --copy-btn-hover-bg: #1565c0;
    }

    .caveats {
      background: #2b2b2b;
      color: #e0e0e0;
    }

    .caveats h3 {
      color: #64b5f6;
    }

    .info-note {
      background: #1e3a5f;
      color: #e0e0e0;
    }
  }

  @media print {
    .firecalc-mirror {
      box-shadow: none;
      border: 2px solid #000;
    }

    .mirror-header {
      background: #f0f0f0;
      color: #000;
      border-bottom: 2px solid #000;
    }
  }
</style>
