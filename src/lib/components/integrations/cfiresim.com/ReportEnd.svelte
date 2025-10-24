<script lang="ts">
import RecipientName from '$lib/components/RecipientName.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { IntegrationContext } from '../integration-context';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

const today = MonthDate.initFromNow();
const currentYear = today.year();
const indefiniteEndYear = 2100;

type ColumnId = 'primary' | 'secondary';

interface PersonalEntry {
  person: Recipient;
  annualAmount: Money;
  startDate: MonthDate;
  column: ColumnId;
}

interface AdjustmentEntry {
  person: Recipient;
  annualAmount: Money;
  startDate: MonthDate;
}

let context: IntegrationContext;
let recipientEntry: PersonalEntry | null = null;
let spouseEntry: PersonalEntry | null = null;
let spousalAdjustment: AdjustmentEntry | null = null;

$: context = new IntegrationContext(recipient, spouse);

$: recipientEntry = buildPersonalEntry(
  recipient,
  $recipientFilingDate,
  'primary'
);
$: spouseEntry = spouse
  ? buildPersonalEntry(spouse, $spouseFilingDate, 'secondary')
  : null;
$: spousalAdjustment = buildSpousalAdjustment();

$: hasAnyPersonal = Boolean(recipientEntry || spouseEntry);
$: hasInstructions = hasAnyPersonal || Boolean(spousalAdjustment);

function buildPersonalEntry(
  person: Recipient,
  filingDate: MonthDate | null,
  column: ColumnId
): PersonalEntry | null {
  if (!filingDate) return null;

  const monthlyBenefit =
    person === context.higherEarner()
      ? context.getHigherEarnerPersonalBenefit(filingDate)
      : context.getLowerEarnerPersonalBenefit(filingDate);

  if (monthlyBenefit.cents() <= 0) return null;

  return {
    person,
    annualAmount: monthlyBenefit.times(12),
    startDate: filingDate,
    column,
  };
}

function buildSpousalAdjustment(): AdjustmentEntry | null {
  const info = context.getLowerEarnerSpousalBenefit();
  if (!info) return null;
  const lower = context.lowerEarner();
  if (!lower) return null;
  if (info.monthlyBenefit.cents() <= 0) return null;

  return {
    person: lower,
    annualAmount: info.monthlyBenefit.times(12),
    startDate: info.startDate,
  };
}

function recommendedStartYear(date: MonthDate): number {
  const year = date.year();
  return year < currentYear ? currentYear : year;
}

function hasStarted(date: MonthDate): boolean {
  return date.monthsSinceEpoch() <= today.monthsSinceEpoch();
}

function monthLabel(date: MonthDate): string {
  return `${date.monthFullName()} ${date.year()}`;
}

function startYearNote(date: MonthDate): string {
  if (hasStarted(date)) {
    return `Already receiving since ${monthLabel(date)}; keeping the start year at ${currentYear} keeps it active immediately.`;
  }
  return `Begins ${monthLabel(date)}.`;
}

function fieldName(column: ColumnId, base: string): string {
  return column === 'primary' ? base : `${base} #2`;
}

function columnDescription(column: ColumnId): string {
  return column === 'primary'
    ? 'SS column on the left'
    : 'SS #2 column on the right';
}

function labelForSpousal(person: Recipient): string {
  return `${person.shortName(24)} spousal Social Security`;
}

function formatCurrency(amount: Money): string {
  return amount.roundToDollar().value().toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatInputValue(amount: Money): string {
  return Math.round(amount.roundToDollar().value()).toString();
}
</script>

<div class="pageBreakAvoid">
  <h2>cFIREsim</h2>
  <div class="text">
    <p>
      cFIREsim models Social Security with two dedicated fields plus optional
      adjustments. The values below are based on the filing dates selected in
      the charts above.
    </p>

    {#if !hasInstructions}
      <p class="empty-state">
        Choose filing ages in the charts above and return here for the exact
        numbers to copy into cFIREsim.
      </p>
    {:else}
      <div class="settings-card">
        <h3>Before you enter anything</h3>
        <ul>
          <li>
            Leave both <strong>SS Payment Frequency</strong> dropdowns set to
            <strong>Annual</strong>.
          </li>
          <li>
            Keep all <strong>SS End Year</strong> fields at
            <strong>{indefiniteEndYear}</strong> so the income lasts through the
            projection.
          </li>
          <li>
            Amounts below are in today's dollars; keep cFIREsim's inflation
            settings at their defaults.
          </li>
        </ul>
      </div>

      <div class="ss-grid">
        {#if recipientEntry}
          <section class="ss-card">
            <h3>
              <RecipientName r={recipientEntry.person} /> Social Security
              <div class="column-note">
                ({columnDescription(recipientEntry.column)})
              </div>
            </h3>
            <div class="field-grid">
              <div>
                <span class="field-label"
                  >{fieldName(
                    recipientEntry.column,
                    "SS Payment Frequency"
                  )}</span
                >
                <span class="field-value">Annual</span>
              </div>
              <div>
                <span class="field-label"
                  >{fieldName(
                    recipientEntry.column,
                    "SS Annual Value ($)"
                  )}</span
                >
                <span class="field-value">
                  <code>{formatInputValue(recipientEntry.annualAmount)}</code>
                </span>
              </div>
              <div>
                <span class="field-label"
                  >{fieldName(recipientEntry.column, "SS Start Year")}</span
                >
                <span class="field-value">
                  {recommendedStartYear(recipientEntry.startDate)}
                  <small>{startYearNote(recipientEntry.startDate)}</small>
                </span>
              </div>
              <div>
                <span class="field-label"
                  >{fieldName(recipientEntry.column, "SS End Year")}</span
                >
                <span class="field-value">
                  {indefiniteEndYear}
                  <small
                    >Leave at {indefiniteEndYear} so payments continue.</small
                  >
                </span>
              </div>
            </div>
          </section>
        {/if}

        {#if spouseEntry}
          <section class="ss-card">
            <h3>
              <RecipientName r={spouseEntry.person} /> Social Security
              <div class="column-note">
                ({columnDescription(spouseEntry.column)})
              </div>
            </h3>
            <div class="field-grid">
              <div>
                <span class="field-label"
                  >{fieldName(spouseEntry.column, "SS Payment Frequency")}</span
                >
                <span class="field-value">Annual</span>
              </div>
              <div>
                <span class="field-label"
                  >{fieldName(spouseEntry.column, "SS Annual Value ($)")}</span
                >
                <span class="field-value">
                  <code>{formatInputValue(spouseEntry.annualAmount)}</code>
                </span>
              </div>
              <div>
                <span class="field-label"
                  >{fieldName(spouseEntry.column, "SS Start Year")}</span
                >
                <span class="field-value">
                  {recommendedStartYear(spouseEntry.startDate)}
                  <small>{startYearNote(spouseEntry.startDate)}</small>
                </span>
              </div>
              <div>
                <span class="field-label"
                  >{fieldName(spouseEntry.column, "SS End Year")}</span
                >
                <span class="field-value">
                  {indefiniteEndYear}
                  <small
                    >Leave at {indefiniteEndYear} so payments continue.</small
                  >
                </span>
              </div>
            </div>
          </section>
        {/if}
      </div>

      {#if spousalAdjustment}
        <section class="adjustment-card">
          <h3>
            Spousal adjustment for
            <RecipientName r={spousalAdjustment.person} />
          </h3>
          <p>
            Click <strong>Add Adjustment</strong> once, then fill the first adjustment
            row with:
          </p>
          <div class="field-grid">
            <div>
              <span class="field-label">Label</span>
              <span class="field-value"
                >{labelForSpousal(spousalAdjustment.person)}</span
              >
            </div>
            <div>
              <span class="field-label">Amount Per Year $</span>
              <span class="field-value">
                <code>{formatInputValue(spousalAdjustment.annualAmount)}</code>
              </span>
            </div>
            <div>
              <span class="field-label">Start Year</span>
              <span class="field-value">
                {recommendedStartYear(spousalAdjustment.startDate)}
                <small>{startYearNote(spousalAdjustment.startDate)}</small>
              </span>
            </div>
            <div>
              <span class="field-label">End Year</span>
              <span class="field-value">
                {indefiniteEndYear}
                <small>Leave at {indefiniteEndYear} for ongoing payments.</small
                >
              </span>
            </div>
          </div>
          <ul class="adjustment-notes">
            <li>
              Keep <strong>Adjustment Type</strong> set to
              <strong>Income/Savings</strong>.
            </li>
            <li>
              Leave <strong>Recurring</strong> and
              <strong>Inflation Adjusted</strong> checked.
            </li>
            <li>
              Leave <strong>Freeze Value Until Withdrawal</strong> unchecked.
            </li>
            <li>
              Keep <strong>Inflation Type</strong> at <strong>CPI</strong>.
            </li>
          </ul>
        </section>
      {/if}
    {/if}

    <p class="visit-link">
      <a href="https://www.cfiresim.com/" target="_blank" rel="noopener">
        Visit cFIREsim
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

  .empty-state {
    background: #f8f9fa;
    border-left: 4px solid #1d4f91;
    padding: 1em;
    border-radius: 4px;
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

  .ss-grid {
    display: grid;
    gap: 1.5em;
    margin: 1.5em 0;
  }

  @media (min-width: 860px) {
    .ss-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .ss-card,
  .adjustment-card {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1.25em;
  }

  .ss-card h3,
  .adjustment-card h3 {
    margin: 0 0 0.75em 0;
    font-size: 1.1em;
    color: #1d4f91;
  }

  .column-note {
    font-size: 0.85em;
    color: #6c757d;
    font-weight: 400;
    margin-left: 0.35em;
  }

  .field-grid {
    display: grid;
    gap: 0.75em;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    background: #ffffff;
    border: 1px solid #e1e4e8;
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
    display: inline-flex;
    flex-direction: column;
    gap: 0.25em;
  }

  .field-value code {
    font-family: "Courier New", monospace;
    font-weight: 600;
    background: #edf2fb;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    color: #1d3557;
  }

  .field-value small {
    font-weight: normal;
    color: #495057;
    line-height: 1.3;
  }

  .adjustment-notes {
    margin: 1em 0 0 0;
    padding-left: 1.3em;
  }

  .adjustment-notes li {
    margin: 0.35em 0;
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
    .empty-state {
      background: #1f2d3d;
      border-color: #335b94;
      color: #dde7ff;
    }

    .settings-card {
      background: #1f2d3d;
      border-color: #335b94;
    }

    .settings-card h3 {
      color: #9ac9ff;
    }

    .ss-card,
    .adjustment-card {
      background: #23272f;
      border-color: #3a4250;
    }

    .field-grid {
      background: #1f2330;
      border-color: #343c4a;
    }

    .field-label {
      color: #9aa0a6;
    }

    .field-value {
      color: #d6e2ff;
    }

    .field-value code {
      background: #2d3650;
      color: #d6e2ff;
    }

    .field-value small {
      color: #b0b6be;
    }

    .adjustment-notes {
      color: #d6e2ff;
    }

    .visit-link a {
      color: #9ac9ff;
    }
  }
</style>
