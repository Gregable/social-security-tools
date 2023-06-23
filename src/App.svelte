<script lang="ts">
  import "./global.css";

  import Header from "./components/Header.svelte";
  import PastePrompt from "./components/PastePrompt.svelte";


  // The app has 5 modes which the user can be in, based on the information
  // entered so far.
  enum Mode {
    // Starting in initial mode, we render paste-prompt.html and request
    // either a ssa.gov paste or to load demo data.
    INITIAL,
    // When ssa.gov data is entered, we initially display the earings record
    // in the same css style as ssa.gov, and have a "yes/no" confirmation box.
    // This is paste-confirm.html
    PASTE_CONFIRMATION,
    // If the user selects "no" to the paste, we display a "Sorry" view with a
    // button to call reset(). This is also paste-confirm.html
    PASTE_APOLOGY,
    // If the user selects "yes", we then prompt them to enter their age. This
    // is age-request.html.
    AGE_REQUEST,
    // Finally, once age is selected, we move into render earnings mode.
    RENDER_EARNINGS,
  }
  let mode: Mode = Mode.INITIAL;
</script>

<main>
  <Header />
  {#if mode === Mode.INITIAL}
    <PastePrompt />
  {:else if mode === Mode.PASTE_CONFIRMATION}
    <div />
  {:else if mode === Mode.PASTE_APOLOGY}
    <div />
  {:else if mode === Mode.AGE_REQUEST}
    <div />
  {:else if mode === Mode.RENDER_EARNINGS}
    <div />
  {/if}
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
