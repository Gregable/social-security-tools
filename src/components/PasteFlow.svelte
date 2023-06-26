<script lang="ts">
  import "../global.css";
  import { createEventDispatcher } from "svelte";
  import { Recipient } from "../lib/recipient";
  import AgeRequest from "./AgeRequest.svelte";
  import PasteConfirm from "./PasteConfirm.svelte";
  import PastePrompt from "./PastePrompt.svelte";
  import PasteApology from "./PasteApology.svelte";

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
  }
  let mode: Mode = Mode.INITIAL;

  let recipient: Recipient;
  let spouse: Recipient;

  /**
   * Handle the user selecting a demo record. There is no confirmation step
   * for demo records, since the user isn't actually entering data.
   */
  function handleDemo(event: CustomEvent) {
    recipient = event.detail.recipient;
    spouse = event.detail.spouse;

    // Let the app know we're done.
    dispatch("done");
  }

  /**
   * Handle the user pasting their earnings record. We display a confirmation
   * step, and then prompt for age.
   */
  function handlePaste(event: CustomEvent) {
    recipient = event.detail.recipient;
    mode = Mode.PASTE_CONFIRMATION;
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
    recipient.birthdate = event.detail.birthdate;
    console.log("Recipient birthdate:", recipient.birthdate);

    // Let the app know we're done.
    dispatch("done");
  }
</script>

<div>
  {#if mode === Mode.INITIAL}
    <PastePrompt on:demo={handleDemo} on:paste={handlePaste} />
  {:else if mode === Mode.PASTE_CONFIRMATION}
    <PasteConfirm
      on:confirm={handleConfirm}
      on:decline={handleDecline}
      earningsRecords={recipient.earningsRecords}
    />
  {:else if mode === Mode.PASTE_APOLOGY}
    <PasteApology on:reset={handleReset} />
  {:else if mode === Mode.AGE_REQUEST}
    <AgeRequest on:submit={handleAgeSubmit} />
  {/if}
</div>

<style>
</style>
