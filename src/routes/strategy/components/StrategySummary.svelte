<script lang="ts">
  import type { Recipient } from "$lib/recipient";
  import RecipientName from "$lib/components/RecipientName.svelte";

  // Props
  export let recipients: [Recipient, Recipient];
  export let piaValues: [number, number];
  export let formattedBirthdates: [string, string];
</script>

<section class="summary-section">
  <p>
    This page shows the optimal Social Security claiming strategy for a couple
    with the following characteristics:
  </p>
  <ul>
    <li>
      <RecipientName r={recipients[0]} /> PIA = ${piaValues[0]}, born
      {formattedBirthdates[0]}
    </li>
    <li>
      <RecipientName r={recipients[1]} /> PIA = ${piaValues[1]}, born
      {formattedBirthdates[1]}
    </li>
  </ul>
</section>

<style>
  .summary-section {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
  }
</style>
