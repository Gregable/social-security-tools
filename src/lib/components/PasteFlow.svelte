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
import AgeRequest from './AgeRequest.svelte';
import DemoData from './DemoData.svelte';
import PasteApology from './PasteApology.svelte';
import PasteConfirm from './PasteConfirm.svelte';
import PastePrompt from './PastePrompt.svelte';
import SpouseQuestion from './SpouseQuestion.svelte';

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
  // If the user selects "yes", we then prompt them to enter their age. This
  // is <AgeRequest>.
  AGE_REQUEST: 3,
  // After entering an age, we prompt the user to enter their spouse's
  // data if they so choose.
  SPOUSE_QUESTION: 4,
} as const;
let mode: number = Mode.INITIAL;

// The flow supports data entry for two people. The first person is always
// "recipient", set to context.recipient. The second person is "spouse", set
// to context.spouse. If the user chooses to enter data for their spouse,
// at that time isRecipient is set to false and the flow is repeated for
// the spouse.
let isRecipient: boolean = true;
let allowSpouseFlow: boolean = true;

$: allowSpouseFlow = ($activeIntegration?.maxHouseholdMembers ?? 2) > 1;

let spouseName: string = 'Spouse';

onMount(() => {
  // Reset everything, especially the context.
  mode = Mode.INITIAL;
  isRecipient = true;
  spouseName = 'Spouse';
  context.recipient = null;
  context.spouse = null;

  // Check for URL parameters using UrlParams class
  const urlParams = new UrlParams();
  if (
    urlParams.hasValidRecipientParams() ||
    urlParams.hasValidRecipientEarnings()
  ) {
    handleHashPaste();
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

function handleHashPaste() {
  const urlParams = new UrlParams();

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
    browser && posthog.capture('Hash Pasted');
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
  browser && posthog.capture('Demo Loaded');
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
 * Handle the user confirming their earnings record. We next prompt for age.
 */
function handleConfirm() {
  mode = Mode.AGE_REQUEST;
}

/**
 * Handle the user declining their earnings record. We display a "Sorry"
 * message and a button to reset.
 */
function handleDecline() {
  mode = Mode.PASTE_APOLOGY;
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
  if (isRecipient) {
    context.recipient.birthdate = detail.birthdate;
    if (!allowSpouseFlow) {
      browser && posthog.capture('Pasted');
      ondone?.();
      return;
    }
  } else {
    context.spouse.birthdate = detail.birthdate;
    browser && posthog.capture('Pasted with spousal');
    // Let the app know we're done.
    ondone?.();
  }
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
    // Mark the recipient as first. Spouse will be marked second later.
    isRecipient = false;
    spouseName = detail.spousename;
    mode = Mode.INITIAL;
  } else {
    browser && posthog.capture('Pasted');
    // Let the app know we're done.
    ondone?.();
  }
}
</script>

<div>
  {#if allowSpouseFlow && !isRecipient}
    <div class="text">
      <h3>
        <span class="highlight">Repeat for <b>{spouseName}</b></span>
      </h3>
    </div>
  {/if}
  {#if mode === Mode.INITIAL}
    {#if isRecipient}
      <DemoData ondemo={handleDemo} />
    {/if}
    <PastePrompt onpaste={handlePaste} />
  {:else if mode === Mode.PASTE_CONFIRMATION}
    {#if isRecipient}
      <PasteConfirm
        onconfirm={handleConfirm}
        ondecline={handleDecline}
        earningsRecords={context.recipient.earningsRecords}
      />
    {:else}
      <PasteConfirm
        onconfirm={handleConfirm}
        ondecline={handleDecline}
        earningsRecords={context.spouse.earningsRecords}
      />
    {/if}
  {:else if mode === Mode.PASTE_APOLOGY}
    <PasteApology onreset={handleReset} />
  {:else if mode === Mode.AGE_REQUEST}
    <AgeRequest onsubmit={handleAgeSubmit} />
  {:else if allowSpouseFlow && mode === Mode.SPOUSE_QUESTION}
    <SpouseQuestion onresponse={handleSpouseQuestion} />
  {/if}
</div>

<style>
  .text {
    margin: auto;
    max-width: min(660px, 80%);
  }

  .highlight {
    border-radius: 1em 0 1em 0;
    background-image: linear-gradient(
      -100deg,
      rgba(255, 224, 0, 0.2),
      rgba(255, 224, 0, 0.7) 95%,
      rgba(255, 224, 0, 0.1)
    );
  }

  @media screen and (min-width: 1025px) {
    .text {
      font-size: 18px;
    }
  }
  /** Ipad **/
  @media screen and (min-width: 411px) and (max-width: 1024px) {
    .text {
      font-size: 16px;
    }
  }
  /** iPhone */
  @media screen and (max-width: 410px) {
    .text {
      font-size: 12px;
    }
  }
</style>
