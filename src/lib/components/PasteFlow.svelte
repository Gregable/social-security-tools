<script lang="ts">
  import "$lib/global.css";
  import { createEventDispatcher, onMount } from "svelte";
  import { context } from "$lib/context";
  import { Birthdate } from "$lib/birthday";
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import AgeRequest from "./AgeRequest.svelte";
  import DemoData from "./DemoData.svelte";
  import PasteConfirm from "./PasteConfirm.svelte";
  import PastePrompt from "./PastePrompt.svelte";
  import PasteApology from "./PasteApology.svelte";
  import SpouseQuestion from "./SpouseQuestion.svelte";
  import { browser } from "$app/environment";
  import posthog from "posthog-js";

  const dispatch = createEventDispatcher();

  // The mode of the paste flow. This is a state machine that controls
  // which component is rendered.
  enum Mode {
    // Starting in initial mode, we render <PastePrompt> and request
    // either a ssa.gov paste or to load demo data.
    INITIAL,
    // When ssa.gov data is entered, we initially display the earings record
    // in the same css style as ssa.gov, and have a "yes / no" confirmation box.
    // This is <PasteConfirm>.
    PASTE_CONFIRMATION,
    // If the user selects "no" to the paste, we display a "Sorry" view with a
    // button to call reset(). This is <PasteApology>.
    PASTE_APOLOGY,
    // If the user selects "yes", we then prompt them to enter their age. This
    // is <AgeRequest>.
    AGE_REQUEST,
    // After entering an age, we prompt the user to enter their spouse's
    // data if they so choose.
    SPOUSE_QUESTION,
  }
  let mode: Mode = Mode.INITIAL;

  // The flow supports data entry for two people. The first person is always
  // "recipient", set to context.recipient. The second person is "spouse", set
  // to context.spouse. If the user chooses to enter data for their spouse,
  // at that time isRecipient is set to false and the flow is repeated for
  // the spouse.
  let isRecipient: boolean = true;

  let spouseName: string = "Spouse";

  onMount(() => {
    // Reset everything, especially the context.
    mode = Mode.INITIAL;
    isRecipient = true;
    spouseName = "Spouse";
    context.recipient = null;
    context.spouse = null;
    if (window.location.hash.startsWith("#pia1")) {
      handleHashPaste();
    }
  });

  function parseRecipient(piaStr, dobStr, nameStr): Recipient | null {
    const dobRegex = /(\d{4})-(\d{2})-(\d{2})/;
    let recipient1: Recipient | null = null;
    if (piaStr && dobStr) {
      const pia1 = parseInt(piaStr, 10);
      console.log(pia1);
      if (isNaN(pia1)) return;

      let m = dobStr.match(dobRegex);
      console.log(m);
      if (!m) return;
      const year = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const day = parseInt(m[3], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return;

      recipient1 = new Recipient();
      recipient1.setPia(Money.from(pia1));
      recipient1.birthdate = Birthdate.FromYMD(year, month, day);
      recipient1.name = nameStr || "Self";
    }
    return recipient1;
  }

  function handleHashPaste() {
    const fullHash = window.location.hash;
    console.log(fullHash);
    // Parse the hash string into parameters:
    // #pia1=3000&dob1=1965-09-21&name1=Alex&
    //  pia2=500&dob2=1962-09-28&name2=Chris
    const hash = fullHash.substring(1);
    const params = new URLSearchParams(hash);

    const pia1str: string | null = params.get("pia1");
    const pia2str: string | null = params.get("pia2");
    const dob1str: string | null = params.get("dob1");
    const dob2str: string | null = params.get("dob2");
    const name1str: string | null = params.get("name1");
    const name2str: string | null = params.get("name2");
    console.log(pia1str, pia2str, dob1str, dob2str, name1str, name2str);

    const dobRegex = /(\d{4})-(\d{2})-(\d{2})/;
    let recipient1 = parseRecipient(pia1str, dob1str, name1str);
    let recipient2 = parseRecipient(pia2str, dob2str, name2str);

    if (recipient1) {
      context.recipient = recipient1;
      if (recipient2) {
        context.recipient.markFirst();
        context.spouse = recipient2;
        context.spouse.markSecond();
      }
      // Let the app know we're done.
      browser && posthog.capture("Hash Pasted");
      dispatch("done");
    }
  }

  /**
   * Handle the user selecting a demo record. There is no confirmation step
   * for demo records, since the user isn't actually entering data.
   */
  function handleDemo(event: CustomEvent) {
    context.recipient = event.detail.recipient;
    if (event.detail.spouse !== null) {
      context.recipient.markFirst();
      context.spouse = event.detail.spouse;
      context.spouse.markSecond();
    }

    // Let the app know we're done.
    browser && posthog.capture("Demo Loaded");
    dispatch("done");
  }

  /**
   * Handle the user pasting their earnings record. We display a confirmation
   * step, and then prompt for age.
   */
  function handlePaste(event: CustomEvent) {
    if (isRecipient) {
      context.recipient = event.detail.recipient;
    } else {
      context.recipient.markFirst();
      context.spouse = event.detail.recipient;
      context.spouse.markSecond();
      context.spouse.name = spouseName;
    }

    if (event.detail.recipient.isPiaOnly) {
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
  function handleAgeSubmit(event: CustomEvent) {
    if (isRecipient) {
      context.recipient.birthdate = event.detail.birthdate;
    } else {
      context.spouse.birthdate = event.detail.birthdate;
      browser && posthog.capture("Pasted with spousal");
      // Let the app know we're done.
      dispatch("done");
    }
    mode = Mode.SPOUSE_QUESTION;
  }

  /**
   * Handle the user responding to the spouse question. If they have a spouse,
   * we repeat the flow for the spouse. If not, we're done!
   */
  function handleSpouseQuestion(event: CustomEvent) {
    context.recipient.name = event.detail.name;
    if (event.detail.spouse) {
      // Mark the recipient as first. Spouse will be marked second later.
      isRecipient = false;
      spouseName = event.detail.spousename;
      mode = Mode.INITIAL;
    } else {
      browser && posthog.capture("Pasted");
      // Let the app know we're done.
      dispatch("done");
    }
  }
</script>

<div>
  {#if !isRecipient}
    <div class="text">
      <h3>
        <span class="highlight">Repeat for <b>{spouseName}</b></span>
      </h3>
    </div>
  {/if}
  {#if mode === Mode.INITIAL}
    {#if isRecipient}
      <DemoData on:demo={handleDemo} />
    {/if}
    <PastePrompt on:demo={handleDemo} on:paste={handlePaste} />
  {:else if mode === Mode.PASTE_CONFIRMATION}
    {#if isRecipient}
      <PasteConfirm
        on:confirm={handleConfirm}
        on:decline={handleDecline}
        earningsRecords={context.recipient.earningsRecords}
      />
    {:else}
      <PasteConfirm
        on:confirm={handleConfirm}
        on:decline={handleDecline}
        earningsRecords={context.spouse.earningsRecords}
      />
    {/if}
  {:else if mode === Mode.PASTE_APOLOGY}
    <PasteApology on:reset={handleReset} />
  {:else if mode === Mode.AGE_REQUEST}
    <AgeRequest on:submit={handleAgeSubmit} />
  {:else if mode === Mode.SPOUSE_QUESTION}
    <SpouseQuestion on:response={handleSpouseQuestion} />
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
