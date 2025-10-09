<script lang="ts">
  import type { Recipient } from '$lib/recipient';
  import type { MonthDate } from '$lib/month-time';
  import { recipientFilingDate, spouseFilingDate } from '$lib/context';

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  // Format PIA for display (yearly amount in thousands, no $ sign)
  function formatYearlySS(recipient: Recipient): string {
    const monthlyPia = recipient.pia().primaryInsuranceAmount();
    const yearlyAmount = monthlyPia.times(12);
    const dollars = yearlyAmount.roundToDollar().value();
    // Convert to thousands with 3 decimal places
    return (dollars / 1000).toFixed(3);
  }

  // Get filing age as integer (rounded to nearest year)
  function getFilingAge(
    recipient: Recipient,
    filingDate: MonthDate | null
  ): number {
    if (filingDate !== null) {
      // Calculate age at filing date
      const ageAtFiling = recipient.birthdate.ageAtSsaDate(filingDate);
      const years = Math.floor(ageAtFiling.asMonths() / 12);
      const months = ageAtFiling.asMonths() % 12;
      // Round to nearest year
      return months >= 6 ? years + 1 : years;
    } else {
      // Use normal retirement age
      const nra = recipient.normalRetirementAge();
      const years = Math.floor(nra.asMonths() / 12);
      const months = nra.asMonths() % 12;
      // Round to nearest year
      return months >= 6 ? years + 1 : years;
    }
  }

  // Determine if we're using selected filing dates or NRA
  $: usingSelectedDates =
    $recipientFilingDate !== null ||
    (spouse !== null && $spouseFilingDate !== null);
</script>

<div class="pageBreakAvoid">
  <h2>Linopt</h2>

  <div class="text">
    <p>
      Now that you have calculated your Social Security benefits, you can use
      this information with Linopt to optimize your retirement income strategy.
      Below are your calculated values to enter into Linopt's "Social Security
      Income" section:
    </p>

    {#if usingSelectedDates}
      <p class="info-note">
        <strong>Note:</strong> The values below are based on the filing
        {spouse ? 'dates' : 'date'} you selected in the
        {spouse ? 'Combined Spousal Benefits' : 'Filing Date'} chart.
      </p>
    {/if}

    <div class="linopt-card">
      <div class="card-header">Social Security Income</div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <div class="form-label">Yearly Social Security</div>
            <div class="form-control readonly-field">
              {formatYearlySS(recipient)}
            </div>
          </div>
          {#if spouse}
            <div class="col-md-6">
              <div class="form-label">Yearly Social Security - Spouse</div>
              <div class="form-control readonly-field">
                {formatYearlySS(spouse)}
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
              {getFilingAge(recipient, $recipientFilingDate)}
            </div>
          </div>
          {#if spouse}
            <div class="col-md-6">
              <div class="form-label">
                Age to Start Social Security - Spouse
              </div>
              <div class="form-control readonly-field">
                {getFilingAge(spouse, $spouseFilingDate)}
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
      {#if usingSelectedDates}
        These values are based on your selected filing
        {spouse ? 'dates' : 'date'} from the chart above. You can adjust the filing
        age in Linopt to explore different claiming strategies and see how they affect
        your lifetime benefits.
      {:else}
        These values represent your Primary Insurance Amount at Normal
        Retirement Age. You can adjust the filing age in Linopt to see how
        different claiming strategies affect your lifetime benefits.
      {/if}
    </p>

    <div class="caveats">
      <h3>Caveats</h3>
      <ul>
        <li>
          The starting age is rounded to the nearest year. Linopt only accepts
          integer ages, while your actual
          {usingSelectedDates ? 'filing age' : 'Normal Retirement Age'} may include
          additional months.
        </li>
        {#if !usingSelectedDates}
          <li>
            The age shown is your Normal Retirement Age, not a filing strategy
            recommendation. Use the Filing Date chart above to explore different
            filing ages.
          </li>
        {/if}
      </ul>
    </div>

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
