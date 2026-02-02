<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { Birthdate } from '$lib/birthday';
import { context } from '$lib/context';
import { EarningRecord } from '$lib/earning-record';
import { activeIntegration } from '$lib/integrations/context';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import type { EarningsEntry } from '$lib/url-params';
import { UrlParams } from '$lib/url-params';
import * as constants from '$lib/constants';
import AgeRequest from './AgeRequest.svelte';
import DemoData from './DemoData.svelte';
import MobileDesktopPrompt from './MobileDesktopPrompt.svelte';
import PasteApology from './PasteApology.svelte';
import PasteConfirm from './PasteConfirm.svelte';
import PastePrompt from './PastePrompt.svelte';
import ProgressIndicator from './ProgressIndicator.svelte';
import SpouseQuestion from './SpouseQuestion.svelte';
import ZeroEarningsConfirm from './ZeroEarningsConfirm.svelte';

// Callback prop for done event
export let ondone: (() => void) | undefined = undefined;
// Callback prop for when user moves past initial paste prompt
export let onStarted: (() => void) | undefined = undefined;

// The mode of the paste flow. This is a state machine that controls
// which component is rendered.
const Mode = {
  // Starting in initial mode, we render <PastePrompt> and request
  // either a ssa.gov paste or to load demo data.
  INITIAL: 0,
  // When ssa.gov data is entered, we initially display the earings record
  // in the same css style as ssa.gov, and have a "yes / no" confirmation box.
  // This is <PasteConfirm>.
  PASTE_CONFIRMATION: 1,
  // If the user selects "no" to the paste, we display a "Sorry" view with a
  // button to call reset(). This is <PasteApology>.
  PASTE_APOLOGY: 2,
  // If the prior year has $0 earnings, we ask the user to confirm if it's
  // accurate or not yet recorded. This is <ZeroEarningsConfirm>.
  ZERO_EARNINGS_CONFIRM: 3,
  // If the user selects "yes", we then prompt them to enter their age. This
  // is <AgeRequest>.
  AGE_REQUEST: 4,
  // After entering an age, we prompt the user to enter their spouse's
  // data if they so choose.
  SPOUSE_QUESTION: 5,
} as const;
let mode: number = Mode.INITIAL;

// Compute the current step for the progress indicator (1-4)
// Step 1: Enter Data, Step 2: Verify, Step 3: Birthdate, Step 4: Results
$: currentStep = (() => {
  if (mode === Mode.INITIAL) return 1;
  if (mode === Mode.PASTE_CONFIRMATION || mode === Mode.ZERO_EARNINGS_CONFIRM) return 2;
  if (mode === Mode.AGE_REQUEST) return 3;
  if (mode === Mode.SPOUSE_QUESTION) return 5; // All steps complete (shows all checkmarks)
  return 1; // Default (including PASTE_APOLOGY)
})();

// Show "results ready" message during spouse question
$: showResultsReady = mode === Mode.SPOUSE_QUESTION;

// Whether to show the progress indicator (hide during error states only)
$: showProgress = mode !== Mode.PASTE_APOLOGY;

// Show two-row mode when entering spouse data
$: showSpouseRow = !isRecipient;

// Get the recipient's name for the progress indicator
$: recipientName = context.recipient?.name || 'Self';

// The flow supports data entry for two people. The first person is always
// "recipient", set to context.recipient. The second person is "spouse", set
// to context.spouse. If the user chooses to enter data for their spouse,
// at that time isRecipient is set to false and the flow is repeated for
// the spouse.
let isRecipient: boolean = true;
let allowSpouseFlow: boolean = true;

let recipientBirthdateFromHash: Birthdate | null = null;
let spouseBirthdateFromHash: Birthdate | null = null;
let recipientNameFromHash: string | null = null;
let spouseNameFromHash: string | null = null;

$: allowSpouseFlow = ($activeIntegration?.maxHouseholdMembers ?? 2) > 1;

let spouseName: string = 'Spouse';

// Track the year with ambiguous $0 earnings that needs confirmation
let zeroEarningsYear: number | null = null;

/**
 * Find the first earnings record with $0 for the prior year that isn't already
 * marked as incomplete. Returns the year if found, null otherwise.
 */
function findAmbiguousZeroYear(records: EarningRecord[]): number | null {
  const priorYear = constants.CURRENT_YEAR - 1;
  for (const record of records) {
    if (
      record.year === priorYear &&
      record.taxedEarnings.value() === 0 &&
      !record.incomplete
    ) {
      return record.year;
    }
  }
  return null;
}

onMount(() => {
  // Reset everything, especially the context.
  // Note: Direct context mutation is safe here because PasteFlow renders before
  // any components that read from context. Those components only mount after
  // ondone() is called, at which point context is fully populated.
  mode = Mode.INITIAL;
  isRecipient = true;
  spouseName = 'Spouse';
  context.recipient = null;
  context.spouse = null;

  // Check for URL parameters using UrlParams class
  const urlParams = new UrlParams();
  recipientBirthdateFromHash = parseDob(urlParams.getRecipientDob());
  spouseBirthdateFromHash = parseDob(urlParams.getSpouseDob());
  recipientNameFromHash = urlParams.getRecipientName();
  spouseNameFromHash = urlParams.getSpouseName();
  if (
    urlParams.hasValidRecipientParams() ||
    urlParams.hasValidRecipientEarnings()
  ) {
    handleHashPaste(urlParams);
  } else {
    // Track flow started for non-hash users
    browser && posthog.capture('Paste Flow: Started', { is_spouse_entry: false });
  }
});

/**
 * Parse a date string in YYYY-MM-DD format.
 * Returns null if invalid.
 */
function parseDob(dob: string | null): Birthdate | null {
  if (!dob) return null;

  const dobRegex = /(\d{4})-(\d{2})-(\d{2})/;
  let m = dob.match(dobRegex);
  if (!m) return null;

  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1; // Month is 0-indexed
  const day = parseInt(m[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
    return null;

  return Birthdate.FromYMD(year, month, day);
}

/**
 * Convert earnings entries to EarningRecord array.
 * Sorts by year in ascending order.
 */
function earningsEntriesToRecords(entries: EarningsEntry[]): EarningRecord[] {
  const records = entries.map(
    (entry) =>
      new EarningRecord({
        year: entry.year,
        taxedEarnings: Money.from(entry.amount),
        taxedMedicareEarnings: Money.from(entry.amount),
      })
  );

  // Sort by year (ascending) as done in parsePaste
  records.sort((a, b) => a.year - b.year);

  return records;
}

/**
 * Parse a recipient from PIA-based URL parameters.
 */
function parseRecipient(
  pia: number | null,
  dob: string | null,
  name: string | null
): Recipient | null {
  if (pia === null || !dob) return null;

  const birthdate = parseDob(dob);
  if (!birthdate) return null;

  const recipient = new Recipient();
  recipient.setPia(Money.from(pia));
  recipient.birthdate = birthdate;
  recipient.name = name || 'Self';

  return recipient;
}

/**
 * Parse a recipient from earnings-based URL parameters.
 */
function parseRecipientFromEarnings(
  earnings: EarningsEntry[] | null,
  dob: string | null,
  name: string | null
): Recipient | null {
  if (!earnings || earnings.length === 0 || !dob) return null;

  const birthdate = parseDob(dob);
  if (!birthdate) return null;

  const recipient = new Recipient();
  recipient.earningsRecords = earningsEntriesToRecords(earnings);
  recipient.birthdate = birthdate;
  recipient.name = name || 'Self';

  return recipient;
}

function handleHashPaste(urlParams: UrlParams = new UrlParams()) {
  // Check for earnings-based parameters first (more detailed than PIA)
  let recipient1: Recipient | null = null;
  if (urlParams.hasValidRecipientEarnings()) {
    const earnings = urlParams.getRecipientEarnings();
    const dob = urlParams.getRecipientDob();
    const name = urlParams.getRecipientName();
    recipient1 = parseRecipientFromEarnings(earnings, dob, name);
  } else if (urlParams.hasValidRecipientParams()) {
    // Fall back to PIA-based parameters
    const recipientParams = urlParams.getRecipientParams();
    recipient1 = parseRecipient(
      recipientParams.pia,
      recipientParams.dob,
      recipientParams.name
    );
  }

  // Check for spouse parameters
  let recipient2: Recipient | null = null;
  if (urlParams.hasValidSpouseEarnings()) {
    const earnings = urlParams.getSpouseEarnings();
    const dob = urlParams.getSpouseDob();
    const name = urlParams.getSpouseName();
    recipient2 = parseRecipientFromEarnings(earnings, dob, name);
  } else if (urlParams.hasValidSpouseParams()) {
    const spouseParams = urlParams.getSpouseParams();
    recipient2 = parseRecipient(
      spouseParams.pia,
      spouseParams.dob,
      spouseParams.name
    );
  }

  if (recipient1) {
    context.recipient = recipient1;
    if (recipient2) {
      context.recipient.markFirst();
      context.spouse = recipient2;
      context.spouse.markSecond();
    }
    // Let the app know we're done.
    browser && posthog.capture('Hash Pasted', {
      has_spouse: recipient2 !== null,
      has_earnings: urlParams.hasValidRecipientEarnings() || urlParams.hasValidSpouseEarnings(),
    });
    ondone?.();
  }
}

/**
 * Handle the user selecting a demo record. There is no confirmation step
 * for demo records, since the user isn't actually entering data.
 */
function handleDemo(detail: {
  recipient: Recipient;
  spouse: Recipient | null;
  demoType?: string;
}) {
  context.recipient = detail.recipient;
  if (detail.spouse !== null) {
    context.recipient.markFirst();
    context.spouse = detail.spouse;
    context.spouse.markSecond();
  }

  // Notify that user has started (demo skips paste flow entirely)
  onStarted?.();

  // Let the app know we're done.
  browser && posthog.capture('Demo Loaded', {
    demo_type: detail.demoType || 'average_earner_couple',
    has_spouse: detail.spouse !== null,
  });
  ondone?.();
}

/**
 * Handle the user pasting their earnings record. We display a confirmation
 * step, and then prompt for age.
 */
function handlePaste(detail: { recipient: Recipient }) {
  if (isRecipient) {
    context.recipient = detail.recipient;
  } else {
    context.recipient.markFirst();
    context.spouse = detail.recipient;
    context.spouse.markSecond();
    context.spouse.name = spouseName;
  }

  // Track successful parse
  browser && posthog.capture('Paste Flow: Parse Success', {
    is_spouse_entry: !isRecipient,
    record_count: detail.recipient.earningsRecords.length,
    is_pia_only: detail.recipient.isPiaOnly,
  });

  // Notify that user has started entering data (no longer showing initial prompt)
  onStarted?.();

  if (detail.recipient.isPiaOnly) {
    // If the user only pasted their PIA, we skip the confirmation step.
    mode = Mode.AGE_REQUEST;
  } else {
    mode = Mode.PASTE_CONFIRMATION;
  }
}

/**
 * Handle the user confirming their earnings record. Check for ambiguous $0
 * earnings, otherwise prompt for age.
 */
function handleConfirm() {
  browser && posthog.capture('Paste Flow: Data Confirmed', {
    is_spouse_entry: !isRecipient,
  });

  const records = isRecipient
    ? context.recipient.earningsRecords
    : context.spouse.earningsRecords;

  zeroEarningsYear = findAmbiguousZeroYear(records);
  if (zeroEarningsYear !== null) {
    browser && posthog.capture('Paste Flow: Zero Earnings Check', {
      is_spouse_entry: !isRecipient,
      year: zeroEarningsYear,
    });
    mode = Mode.ZERO_EARNINGS_CONFIRM;
  } else {
    mode = Mode.AGE_REQUEST;
  }
}

/**
 * Handle the user declining their earnings record. We display a "Sorry"
 * message and a button to reset.
 */
function handleDecline() {
  browser && posthog.capture('Paste Flow: Data Rejected', {
    is_spouse_entry: !isRecipient,
  });
  mode = Mode.PASTE_APOLOGY;
}

/**
 * Handle the user confirming whether their $0 earnings are accurate or not
 * yet recorded. If incomplete, mark the record as such.
 */
function handleZeroEarningsConfirm(incomplete: boolean) {
  if (incomplete && zeroEarningsYear !== null) {
    const records = isRecipient
      ? context.recipient.earningsRecords
      : context.spouse.earningsRecords;

    // Find and mark the record as incomplete
    for (const record of records) {
      if (record.year === zeroEarningsYear) {
        record.incomplete = true;
        break;
      }
    }
  }

  // Reset and proceed to age request
  zeroEarningsYear = null;
  mode = Mode.AGE_REQUEST;
}

/**
 * Handle the user clicking the reset button. We go back to the initial
 * state.
 */
function handleReset() {
  mode = Mode.INITIAL;
}

/**
 * Handle the user submitting their age. We're done!
 */
function handleAgeSubmit(detail: { birthdate: Birthdate }) {
  browser && posthog.capture('Paste Flow: Birthdate Entered', {
    is_spouse_entry: !isRecipient,
  });

  if (isRecipient) {
    context.recipient.birthdate = detail.birthdate;
    if (!allowSpouseFlow) {
      if (recipientNameFromHash) {
        context.recipient.name = recipientNameFromHash;
      }
      browser && posthog.capture('Pasted', {
        record_count: context.recipient.earningsRecords.length,
        is_pia_only: context.recipient.isPiaOnly,
      });
      ondone?.();
      return;
    }
  } else {
    context.spouse.birthdate = detail.birthdate;
    browser && posthog.capture('Pasted with spousal', {
      record_count_recipient: context.recipient.earningsRecords.length,
      record_count_spouse: context.spouse.earningsRecords.length,
      recipient_is_pia_only: context.recipient.isPiaOnly,
      spouse_is_pia_only: context.spouse.isPiaOnly,
    });
    // Let the app know we're done.
    ondone?.();
  }

  browser && posthog.capture('Paste Flow: Spouse Question Shown');
  mode = Mode.SPOUSE_QUESTION;
}

/**
 * Handle the user responding to the spouse question. If they have a spouse,
 * we repeat the flow for the spouse. If not, we're done!
 */
function handleSpouseQuestion(detail: {
  spouse: boolean;
  name: string;
  spousename?: string;
}) {
  context.recipient.name = detail.name;
  if (detail.spouse) {
    browser && posthog.capture('Paste Flow: Couple Selected');
    // Mark the recipient as first. Spouse will be marked second later.
    isRecipient = false;
    spouseName = detail.spousename;
    // Track flow started for spouse entry
    browser && posthog.capture('Paste Flow: Started', { is_spouse_entry: true });
    mode = Mode.INITIAL;
  } else {
    browser && posthog.capture('Paste Flow: Single Selected');
    browser && posthog.capture('Pasted', {
      record_count: context.recipient.earningsRecords.length,
      is_pia_only: context.recipient.isPiaOnly,
    });
    // Let the app know we're done.
    ondone?.();
  }
}
</script>

<div>
  {#if showProgress}
    <ProgressIndicator
      {currentStep}
      {recipientName}
      {spouseName}
      {showSpouseRow}
    />
    {#if showResultsReady}
      <p class="results-ready">Your results are ready! Optionally add spouse data below.</p>
    {/if}
  {/if}
  {#if mode === Mode.INITIAL}
    {#if isRecipient}
      <DemoData ondemo={handleDemo} />
      <MobileDesktopPrompt />
    {/if}
    <PastePrompt onpaste={handlePaste} isSpouse={!isRecipient} name={isRecipient ? '' : spouseName} />
  {:else if mode === Mode.PASTE_CONFIRMATION}
    <PasteConfirm
      onconfirm={handleConfirm}
      ondecline={handleDecline}
      earningsRecords={isRecipient ? context.recipient.earningsRecords : context.spouse.earningsRecords}
      name={isRecipient ? '' : spouseName}
    />
  {:else if mode === Mode.PASTE_APOLOGY}
    <PasteApology onreset={handleReset} />
  {:else if mode === Mode.ZERO_EARNINGS_CONFIRM && zeroEarningsYear !== null}
    <ZeroEarningsConfirm
      year={zeroEarningsYear}
      onconfirm={handleZeroEarningsConfirm}
      name={isRecipient ? '' : spouseName}
    />
  {:else if mode === Mode.AGE_REQUEST}
    <AgeRequest
      birthdate={isRecipient
        ? recipientBirthdateFromHash
        : spouseBirthdateFromHash}
      name={isRecipient ? '' : spouseName}
      onsubmit={handleAgeSubmit}
    />
  {:else if allowSpouseFlow && mode === Mode.SPOUSE_QUESTION}
    <SpouseQuestion
      selfname={recipientNameFromHash || "Self"}
      spousename={spouseNameFromHash || "Spouse"}
      onresponse={handleSpouseQuestion}
    />
  {/if}
</div>

<style>
  .results-ready {
    text-align: center;
    color: #2d6a2d;
    font-size: 14px;
    margin: -0.5em 0 1em 0;
    padding: 8px 16px;
    background: #e8f4e8;
    border-radius: 6px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
</style>
