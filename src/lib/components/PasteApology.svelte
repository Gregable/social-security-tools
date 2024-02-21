<!--
  @component
  @name PasteApology
  @description
    A component that prompts the user to restart the paste flow after they
    decline the paste of their earnings record.

  @example
    <PasteApology on:reset={handleReset} />

  @events
    reset: Fired when the user clicks the reset button.
-->

<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  function reset() {
    dispatch("reset");
  }
</script>

<div class="confirmation">
  <p>Sorry about that, let's try again.</p>
  <button on:click={reset}>
    <ico>&#8635;</ico>
    Click to restart.
  </button>
</div>

<style>
  .confirmation {
    text-align: center;
    font-size: 18px;
  }
  button {
    background: #4ac15a;
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 8px 26px;
    margin: 0 10px;
    min-width: 110px;
    cursor: pointer;
  }
  button:hover {
    background: #2aa13a;
  }
  button ico {
    font-weight: bold;
    font-size: 22px;
    vertical-align: middle;
  }
</style>
