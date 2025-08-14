<script lang="ts">
  import { Recipient } from '$lib/recipient';
  import SpousalBenefit from './SpousalBenefit.svelte';

  export let recipient: Recipient = new Recipient();
  export let spouse: Recipient = new Recipient();
</script>

<div>
  <h2>Spousal Benefit</h2>
  <div class="text">
    <p>
      In addition to your own <u>primary</u> benefit, married couples may earn
      <u>spousal</u> Social Security benefits based on each other's records.
    </p>
    <SpousalBenefit {recipient} {spouse} />
    <SpousalBenefit recipient={spouse} spouse={recipient} />
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }
</style>
