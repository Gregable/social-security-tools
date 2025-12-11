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

// User-configurable inflation rate (Linopt's default is 2.5%)
let inflationRatePercent = 2.5;
$: inflationRate = inflationRatePercent / 100;

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

// Format annual benefit for Linopt (with inflation adjustment, in thousands)
function formatForLinopt(
  annualBenefit: Money,
  calculationDate: MonthDate
): string {
  let dollars = annualBenefit.roundToDollar().value();

  // Inflate to future dollars for Linopt
  const yearsUntilStart = Math.max(0, calculationDate.year() - CURRENT_YEAR);
  dollars = dollars * (1 + inflationRate) ** yearsUntilStart;

  // Convert to thousands with 3 decimal places
  return (dollars / 1000).toFixed(3);
}

// Reactive formatted values (recalculate when inflation rate or benefits change)
$: recipientYearlySS =
  recipientAnnualBenefit && recipientBenefitCalculationDate
    ? formatForLinopt(recipientAnnualBenefit, recipientBenefitCalculationDate)
    : '0.000';

$: spouseYearlySS =
  spouse !== null && spouseAnnualBenefit && spouseBenefitCalculationDate
    ? formatForLinopt(spouseAnnualBenefit, spouseBenefitCalculationDate)
    : '0.000';
</script>

<div class="pageBreakAvoid">
  <h2>Linopt</h2>

  <div class="text">
    <p>
      Now that you have calculated your Social Security benefits, you can use
      this information with Linopt to optimize your retirement income strategy.
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
        toolName="Linopt"
      />
    {/if}

    <div class="inflation-input-section">
      <div class="inflation-input-row">
        <label for="inflation-rate"
          >Annual Inflation Rate (for converting to future dollars):</label
        >
        <div class="input-with-suffix">
          <input
            id="inflation-rate"
            type="number"
            bind:value={inflationRatePercent}
            min="0"
            max="10"
            step="0.1"
          />
          <span class="suffix">%</span>
        </div>
      </div>
    </div>

    <p>
      Below are your calculated values to enter into Linopt's "Social Security
      Income" section:
    </p>

    <div class="linopt-card">
      <div class="card-header">Social Security Income</div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <div class="form-label">Yearly Social Security</div>
            <div class="form-control readonly-field">
              {recipientYearlySS}
            </div>
          </div>
          {#if spouse}
            <div class="col-md-6">
              <div class="form-label">Yearly Social Security - Spouse</div>
              <div class="form-control readonly-field">
                {spouseYearlySS}
              </div>
            </div>
          {:else}
            <div class="col-md-6 spouse-field disabled">
              <div class="form-label">Yearly Social Security - Spouse</div>
              <div class="form-control readonly-field disabled-field">
                0.000
              </div>
            </div>
          {/if}
          <div class="col-md-6">
            <div class="form-label">Age to Start Social Security</div>
            <div class="form-control readonly-field">
              {recipient.birthdate
                .ageAtSsaDate(recipientBenefitCalculationDate)
                .roundedYears()}
            </div>
          </div>
          {#if spouse}
            <div class="col-md-6">
              <div class="form-label">
                Age to Start Social Security - Spouse
              </div>
              <div class="form-control readonly-field">
                {spouse.birthdate
                  .ageAtSsaDate(spouseBenefitCalculationDate)
                  .roundedYears()}
              </div>
            </div>
          {:else}
            <div class="col-md-6 spouse-field disabled">
              <div class="form-label">
                Age to Start Social Security - Spouse
              </div>
              <div class="form-control readonly-field disabled-field">67</div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <p>
      These values are based on your selected filing
      {spouse ? 'dates' : 'date'} from the chart above. You can adjust the filing
      age in Linopt to explore different claiming strategies and see how they affect
      your lifetime benefits.
    </p>

    <p>
      <a href="https://linopt.com/" target="_blank" rel="noopener">
        Visit Linopt
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
          <strong>Inflation Adjustment:</strong> The yearly benefit amounts are
          inflated by {inflationRatePercent}% annually from {CURRENT_YEAR} to the
          year benefits begin, converting them to future dollars as Linopt expects.
          The amounts shown in the toggle options above are in today's dollars ({CURRENT_YEAR})
          for easier comparison.
        </li>
        <li>
          The starting age is rounded to the nearest year. Linopt only accepts
          integer ages, while your actual filing age may include additional
          months.
        </li>
        <li>
          The benefit amounts include early filing reductions or delayed
          retirement credits based on your selected filing
          {spouse ? 'dates' : 'date'}.
          {#if spouse && includeSpousalBenefit}
            The lower earner's amount includes both personal and spousal
            benefits.
          {:else if spouse}
            Spousal benefits are not included unless you select the "Combined
            Personal + Spousal Benefit" option above.
          {/if}
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

  /* Inflation input section */
  .inflation-input-section {
    background: #f5f5f5;
    border: 1px solid var(--card-border, #dee2e6);
    border-radius: 6px;
    padding: 0.75em 1em;
    margin: 1em 0;
  }

  .inflation-input-row {
    display: flex;
    align-items: center;
    gap: 0.75em;
    flex-wrap: wrap;
  }

  .inflation-input-row label {
    font-size: 0.9em;
    color: #555;
    flex: 1;
    min-width: 200px;
  }

  .input-with-suffix {
    display: flex;
    align-items: center;
    position: relative;
  }

  .input-with-suffix input[type='number'] {
    width: 5em;
    padding: 0.4em 1.75em 0.4em 0.6em;
    font-size: 0.95rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: white;
  }

  .input-with-suffix input[type='number']:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 0.15rem rgba(25, 118, 210, 0.25);
  }

  .input-with-suffix .suffix {
    position: absolute;
    right: 0.6em;
    color: #666;
    font-size: 0.9em;
    pointer-events: none;
  }

  /* Linopt card styling */
  .linopt-card {
    background: var(--card-bg, #fff);
    border: 1px solid var(--card-border, #dee2e6);
    border-radius: 8px;
    margin: 1.5em 0;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  }

  .card-header {
    background: linear-gradient(
      to right,
      var(--card-header-gradient-start, #d3e3f3),
      transparent
    );
    border-bottom: 1px solid var(--card-border, #dee2e6);
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: var(--card-header-color, #212529);
    border-radius: 8px 8px 0 0;
  }

  .card-body {
    padding: 1rem;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -0.75rem;
    gap: 1rem 0;
  }

  .col-md-6 {
    flex: 0 0 auto;
    padding: 0 0.75rem;
  }

  /* Two columns on wider screens */
  @media (min-width: 771px) {
    .col-md-6 {
      width: 50%;
    }
  }

  /* Single column on narrow screens */
  @media (max-width: 770px) {
    .col-md-6 {
      width: 100%;
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

  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--label-color, #212529);
    font-size: 0.95rem;
  }

  .form-control {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--input-color, #212529);
    background-color: var(--input-bg, #fff);
    background-clip: padding-box;
    border: 1px solid var(--input-border, #dee2e6);
    border-radius: 0.375rem;
    transition:
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
  }

  .readonly-field {
    background-color: var(--readonly-bg, #e9ecef);
    cursor: default;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: var(--readonly-color, #495057);
  }

  .disabled-field {
    opacity: 0.5;
    color: var(--disabled-color, #6c757d);
  }

  .spouse-field.disabled {
    opacity: 0.6;
  }

  @media (prefers-color-scheme: dark) {
    .linopt-card {
      --card-bg: #2b2b2b;
      --card-border: #444;
      --card-header-gradient-start: #2d4a5e;
      --card-header-color: #e0e0e0;
      --label-color: #e0e0e0;
      --input-color: #e0e0e0;
      --input-bg: #1e1e1e;
      --input-border: #444;
      --readonly-bg: #3a3a3a;
      --readonly-color: #b0b0b0;
      --disabled-color: #888;
    }

    .inflation-input-section {
      background: #2b2b2b;
      border-color: #444;
    }

    .inflation-input-row label {
      color: #b0b0b0;
    }

    .input-with-suffix input[type='number'] {
      background: #1e1e1e;
      border-color: #444;
      color: #e0e0e0;
    }

    .input-with-suffix input[type='number']:focus {
      border-color: #64b5f6;
      box-shadow: 0 0 0 0.15rem rgba(100, 181, 246, 0.25);
    }

    .input-with-suffix .suffix {
      color: #b0b0b0;
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
    .linopt-card {
      box-shadow: none;
      border: 1px solid #000;
    }
  }
</style>
