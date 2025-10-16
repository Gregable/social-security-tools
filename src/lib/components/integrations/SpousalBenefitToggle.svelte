<script lang="ts">
import RecipientName from '$lib/components/RecipientName.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import type { IntegrationContext } from './integration-context';

/**
 * Reusable component for choosing between personal benefit only vs
 * combined personal + spousal benefit for the lower earner.
 *
 * Used by integration components (FIRECalc, Linopt) that only accept
 * a single filing date per person, requiring the user to choose
 * which benefit calculation to use for the lower earner.
 *
 * This component calculates and exposes (via binding):
 * - recipientBenefitCalculationDate: The filing date to use for recipient benefits
 * - spouseBenefitCalculationDate: The filing date to use for spouse benefits
 * - recipientAnnualBenefit: The annual benefit amount for recipient (in today's dollars)
 * - spouseAnnualBenefit: The annual benefit amount for spouse (in today's dollars)
 */

export let context: IntegrationContext;
export let includeSpousalBenefit: boolean;
export let toolName: string;

// Export calculated values via binding
export let recipientBenefitCalculationDate: MonthDate;
export let spouseBenefitCalculationDate: MonthDate;
export let recipientAnnualBenefit: Money;
export let spouseAnnualBenefit: Money;

$: recipient = context.recipient;
$: spouse = context.spouse;
$: higherEarner = context.higherEarner();
$: higherEarnerFilingDate = context.higherEarnerFilingDate();
$: lowerEarner = context.lowerEarner();
$: lowerEarnerFilingDate = context.lowerEarnerFilingDate();

// Calculate which filing date to use for each person
$: recipientBenefitCalculationDate =
  includeSpousalBenefit && context.isRecipientLowerEarner()
    ? higherEarnerFilingDate!
    : $recipientFilingDate!;

$: spouseBenefitCalculationDate =
  spouse !== null && includeSpousalBenefit && !context.isRecipientLowerEarner()
    ? higherEarnerFilingDate!
    : $spouseFilingDate!;

// Calculate annual benefits (in today's dollars, before any inflation adjustments)
$: {
  let monthlyBenefit;

  if (context.isRecipientLowerEarner() && includeSpousalBenefit) {
    // Lower earner with spousal benefit included
    monthlyBenefit = recipient.allBenefitsOnDate(
      higherEarner,
      higherEarnerFilingDate!,
      recipientBenefitCalculationDate,
      recipientBenefitCalculationDate
    );
  } else {
    // Personal benefit only
    monthlyBenefit = recipient.benefitOnDate(
      recipientBenefitCalculationDate,
      recipientBenefitCalculationDate
    );
  }

  recipientAnnualBenefit = monthlyBenefit.times(12);
}

$: {
  if (spouse !== null) {
    let monthlyBenefit;

    if (!context.isRecipientLowerEarner() && includeSpousalBenefit) {
      // Lower earner (spouse) with spousal benefit included
      monthlyBenefit = spouse.allBenefitsOnDate(
        higherEarner,
        higherEarnerFilingDate!,
        spouseBenefitCalculationDate,
        spouseBenefitCalculationDate
      );
    } else {
      // Personal benefit only
      monthlyBenefit = spouse.benefitOnDate(
        spouseBenefitCalculationDate,
        spouseBenefitCalculationDate
      );
    }

    spouseAnnualBenefit = monthlyBenefit.times(12);
  } else {
    spouseAnnualBenefit = Money.zero();
  }
}

// Helper function to get filing age for display in option preview
function getFilingAgeForPreview(
  recipient: Recipient,
  filingDate: MonthDate | null
): string {
  if (filingDate === null) return '';
  const ageAtFiling = recipient.birthdate.ageAtSsaDate(filingDate);
  return ageAtFiling.toAgeString();
}
</script>

<div class="spousal-toggle-section">
  <h3>
    Benefit Calculation for <RecipientName r={lowerEarner} />
  </h3>
  <p>
    Choose how to calculate <RecipientName r={lowerEarner} apos /> benefit, since
    {toolName} only accepts a single filing date per person.
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
          Use <RecipientName r={lowerEarner} apos /> filing date with their personal
          benefit only.
        </p>
        {#if lowerEarnerFilingDate !== null}
          <p class="option-preview">
            <span class="preview-text">
              <strong
                >{context.getLowerEarnerPersonalBenefit(lowerEarnerFilingDate)}
                / month</strong
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
          <RecipientName r={lowerEarner} apos /> combined benefit (personal + spousal).
        </p>
        <p class="option-preview">
          <span class="preview-text">
            <strong
              >{context.getLowerEarnerCombinedBenefit(higherEarnerFilingDate!)} /
              month</strong
            >
            at age
            <strong
              >{getFilingAgeForPreview(
                lowerEarner,
                higherEarnerFilingDate!
              )}</strong
            >
          </span>
        </p>
      </div>
    </label>
  </div>
</div>

<style>
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

  @media (prefers-color-scheme: dark) {
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
  }
</style>
