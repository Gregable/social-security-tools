<script lang="ts">
  import type { Recipient } from '$lib/recipient';
  import type { MonthDate } from '$lib/month-time';
  import { recipientFilingDate, spouseFilingDate } from '$lib/context';
  import RecipientName from '$lib/components/RecipientName.svelte';
  import { CURRENT_YEAR } from '$lib/constants';

  export let recipient: Recipient;
  export let spouse: Recipient | null = null;

  // Linopt assumes 2.5% annual inflation rate
  const LINOPT_INFLATION_RATE = 0.025;

  // Toggle for lower earner benefit calculation (personal only vs personal + spousal)
  let includeSpousalBenefit = false;

  // Determine the higher earner and their filing date
  $: higherEarner =
    spouse !== null && recipient.higherEarningsThan(spouse)
      ? recipient
      : spouse;
  $: higherEarnerFilingDate =
    spouse !== null && recipient.higherEarningsThan(spouse)
      ? $recipientFilingDate
      : $spouseFilingDate;

  // Determine the lower earner
  $: lowerEarner =
    spouse !== null && recipient.higherEarningsThan(spouse)
      ? spouse
      : recipient;
  $: lowerEarnerFilingDate =
    spouse !== null && recipient.higherEarningsThan(spouse)
      ? $spouseFilingDate
      : $recipientFilingDate;

  // Helper function to get monthly benefit for display in option preview (today's dollars)
  function getMonthlyBenefit(
    recipient: Recipient,
    filingDate: MonthDate | null,
    includeSpousal: boolean
  ): string {
    if (filingDate === null || lowerEarner === null) return '$0';

    let monthlyBenefit;
    if (
      includeSpousal &&
      higherEarner !== null &&
      higherEarnerFilingDate !== null
    ) {
      monthlyBenefit = recipient.allBenefitsOnDate(
        higherEarner,
        higherEarnerFilingDate,
        filingDate,
        filingDate
      );
    } else {
      monthlyBenefit = recipient.benefitOnDate(filingDate, filingDate);
    }
    // Note that .wholeDollars returns a string with $ sign and commas.
    return monthlyBenefit.roundToDollar().wholeDollars();
  }

  // Helper function to calculate years until benefit starts
  function getYearsUntilBenefitStarts(filingDate: MonthDate | null): number {
    if (filingDate === null) return 0;
    const filingYear = filingDate.year();
    return Math.max(0, filingYear - CURRENT_YEAR);
  }

  // Helper function to inflate amount from today's dollars to future dollars
  function inflateAmount(todaysDollars: number, years: number): number {
    return todaysDollars * Math.pow(1 + LINOPT_INFLATION_RATE, years);
  }

  // Helper function to get filing age for display in option preview
  function getFilingAgeForPreview(
    recipient: Recipient,
    filingDate: MonthDate | null
  ): string {
    if (filingDate === null) return '';
    const ageAtFiling = recipient.birthdate.ageAtSsaDate(filingDate);
    const years = Math.floor(ageAtFiling.asMonths() / 12);
    const months = ageAtFiling.asMonths() % 12;
    if (months === 0) {
      return `${years}`;
    }
    return `${years} and ${months} month${months > 1 ? 's' : ''}`;
  }

  // Format benefit for display (yearly amount in thousands, no $ sign)
  // Uses the filing date to calculate the benefit with early/delayed adjustments
  // Adjusts for inflation to match Linopt's expectation of future dollars
  function formatYearlySS(
    recipient: Recipient,
    filingDate: MonthDate | null,
    isLowerEarner: boolean
  ): string {
    let monthlyBenefit;
    if (filingDate !== null) {
      // For lower earner, optionally include spousal benefit
      if (
        isLowerEarner &&
        includeSpousalBenefit &&
        spouse !== null &&
        higherEarner !== null &&
        higherEarnerFilingDate !== null
      ) {
        // Calculate personal + spousal benefit
        monthlyBenefit = recipient.allBenefitsOnDate(
          higherEarner,
          higherEarnerFilingDate,
          filingDate,
          filingDate
        );
      } else {
        // Calculate personal benefit only
        monthlyBenefit = recipient.benefitOnDate(filingDate, filingDate);
      }
    } else {
      // Use PIA at normal retirement age if no filing date selected
      monthlyBenefit = recipient.pia().primaryInsuranceAmount();
    }

    let yearlyAmount = monthlyBenefit.times(12);
    let dollars = yearlyAmount.roundToDollar().value();

    // Inflate to future dollars for Linopt
    if (filingDate !== null) {
      const yearsUntilStart = getYearsUntilBenefitStarts(filingDate);
      dollars = inflateAmount(dollars, yearsUntilStart);
    }

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
    </p>

    {#if usingSelectedDates}
      <p class="info-note">
        <strong>Note:</strong> The values below are based on the filing
        {spouse ? 'dates' : 'date'} you selected above.
      </p>
    {/if}

    {#if spouse !== null}
      <div class="spousal-toggle-section">
        <h3>
          Benefit Calculation for <RecipientName r={lowerEarner} />
        </h3>
        <p>
          Choose how to calculate <RecipientName r={lowerEarner} apos /> benefit,
          since only Linout only accepts a single filing date per person.
        </p>
        <div class="toggle-options">
          <label class="toggle-option">
            <input
              type="radio"
              name="benefit-type"
              value={false}
              bind:group={includeSpousalBenefit}
            />
            <div class="option-content">
              <strong>Personal Benefit Only</strong>
              <p class="option-description">
                Use <RecipientName r={lowerEarner} apos /> filing date with their
                personal benefit only.
              </p>
              {#if lowerEarnerFilingDate !== null}
                <p class="option-preview">
                  <span class="preview-text">
                    <strong
                      >{getMonthlyBenefit(
                        lowerEarner,
                        lowerEarnerFilingDate,
                        false
                      )} / month</strong
                    >
                    at age
                    <strong
                      >{getFilingAgeForPreview(
                        lowerEarner,
                        lowerEarnerFilingDate
                      )}</strong
                    >
                  </span>
                </p>
              {/if}
            </div>
          </label>
          <label class="toggle-option">
            <input
              type="radio"
              name="benefit-type"
              value={true}
              bind:group={includeSpousalBenefit}
            />
            <div class="option-content">
              <strong>Combined Personal + Spousal Benefit</strong>
              <p class="option-description">
                Use the <RecipientName r={higherEarner} apos /> filing date with
                <RecipientName r={lowerEarner} apos /> combined benefit (personal
                + spousal).
              </p>
              {#if higherEarnerFilingDate !== null}
                <p class="option-preview">
                  <span class="preview-text">
                    <strong
                      >{getMonthlyBenefit(
                        lowerEarner,
                        higherEarnerFilingDate,
                        true
                      )} / month</strong
                    >
                    at age
                    <strong
                      >{getFilingAgeForPreview(
                        lowerEarner,
                        higherEarnerFilingDate
                      )}</strong
                    >
                  </span>
                </p>
              {/if}
            </div>
          </label>
        </div>
      </div>
    {/if}

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
              {formatYearlySS(
                recipient,
                includeSpousalBenefit &&
                  spouse !== null &&
                  !recipient.higherEarningsThan(spouse)
                  ? higherEarnerFilingDate
                  : $recipientFilingDate,
                spouse !== null && !recipient.higherEarningsThan(spouse)
              )}
            </div>
          </div>
          {#if spouse}
            <div class="col-md-6">
              <div class="form-label">Yearly Social Security - Spouse</div>
              <div class="form-control readonly-field">
                {formatYearlySS(
                  spouse,
                  includeSpousalBenefit &&
                    spouse !== null &&
                    recipient.higherEarningsThan(spouse)
                    ? higherEarnerFilingDate
                    : $spouseFilingDate,
                  spouse !== null && recipient.higherEarningsThan(spouse)
                )}
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
              {getFilingAge(
                recipient,
                includeSpousalBenefit &&
                  spouse !== null &&
                  !recipient.higherEarningsThan(spouse)
                  ? higherEarnerFilingDate
                  : $recipientFilingDate
              )}
            </div>
          </div>
          {#if spouse}
            <div class="col-md-6">
              <div class="form-label">
                Age to Start Social Security - Spouse
              </div>
              <div class="form-control readonly-field">
                {getFilingAge(
                  spouse,
                  includeSpousalBenefit &&
                    spouse !== null &&
                    recipient.higherEarningsThan(spouse)
                    ? higherEarnerFilingDate
                    : $spouseFilingDate
                )}
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
          <strong>Inflation Adjustment:</strong> The yearly benefit amounts
          shown below are adjusted for inflation to match Linopt's expectations.
          Linopt assumes you enter benefits in future dollars and then applies
          its own 2.5% annual inflation from the starting age forward. We've
          inflated the amounts by 2.5% annually from {CURRENT_YEAR} to the year benefits
          begin, so Linopt's inflation adjustment will correctly model the benefit
          growth. The amounts shown in the toggle options above are in today's dollars
          ({CURRENT_YEAR}) for easier comparison.
        </li>
        <li>
          The starting age is rounded to the nearest year. Linopt only accepts
          integer ages, while your actual
          {usingSelectedDates ? 'filing age' : 'Normal Retirement Age'} may include
          additional months.
        </li>
        <li>
          {#if usingSelectedDates}
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
          {:else}
            The benefit amounts shown are your Primary Insurance Amount at
            Normal Retirement Age and do not include spousal benefits.
          {/if}
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

  /* Spousal toggle section */
  .spousal-toggle-section {
    background: #f5f5f5;
    border: 1px solid var(--card-border, #dee2e6);
    border-radius: 8px;
    padding: 1.5em;
    margin: 1.5em 0;
  }

  .spousal-toggle-section h3 {
    margin: 0 0 0.5em 0;
    font-size: 1.1em;
    color: #1976d2;
  }

  .spousal-toggle-section > p {
    margin: 0.5em 0 1em 0;
    font-size: 0.95em;
  }

  .toggle-options {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  .toggle-option {
    display: flex;
    align-items: flex-start;
    gap: 0.75em;
    padding: 1em;
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-option:hover {
    border-color: #1976d2;
    background: #f8fbff;
  }

  .toggle-option input[type='radio'] {
    margin-top: 0.25em;
    cursor: pointer;
    flex-shrink: 0;
  }

  .toggle-option input[type='radio']:checked {
    accent-color: #1976d2;
  }

  .option-content {
    flex: 1;
  }

  .option-content strong {
    margin-bottom: 0.25em;
    color: #212529;
  }

  .option-description {
    margin: 0;
    font-size: 0.9em;
    color: #666;
    line-height: 1.4;
  }

  .option-preview {
    margin: 0.75em 0 0 0;
    padding: 0.5em 0.75em;
    background: #e8f4f8;
    border-left: 3px solid #1976d2;
    border-radius: 4px;
    font-size: 0.9em;
    color: #1976d2;
    overflow-x: auto;
  }

  .preview-text {
    white-space: nowrap;
  }

  .option-preview strong {
    color: #0d47a1;
    font-weight: 600;
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

    .spousal-toggle-section {
      background: #2b2b2b;
      border-color: #444;
    }

    .spousal-toggle-section h3 {
      color: #64b5f6;
    }

    .toggle-option {
      background: #1e1e1e;
      border-color: #444;
    }

    .toggle-option:hover {
      border-color: #64b5f6;
      background: #2a3f5f;
    }

    .option-content strong {
      color: #e0e0e0;
    }

    .option-description {
      color: #b0b0b0;
    }

    .option-preview {
      background: #1e3a5f;
      border-left-color: #64b5f6;
      color: #90caf9;
    }

    .option-preview strong {
      color: #bbdefb;
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
