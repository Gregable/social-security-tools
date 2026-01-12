<!--
  @component
  Demo wrapper for SpousalBenefit that sets up required recipient stores.
  Used only in Storybook stories.
-->
<script lang="ts">
import SpousalBenefit from '$lib/components/SpousalBenefit.svelte';
import { Recipient } from '$lib/recipient';

export let recipientData: Recipient;
export let spouseData: Recipient;

// Create writable stores from the recipient data
const recipient = new Recipient();
const spouse = new Recipient();

// Copy data to the store-backed recipients
$: {
  if (recipientData) {
    recipient.name = recipientData.name;
    recipient.earningsRecords = recipientData.earningsRecords;
    recipient.birthdate = recipientData.birthdate;
    if (recipientData.first) {
      recipient.markFirst();
    } else {
      recipient.markSecond();
    }
  }
}

$: {
  if (spouseData) {
    spouse.name = spouseData.name;
    spouse.earningsRecords = spouseData.earningsRecords;
    spouse.birthdate = spouseData.birthdate;
    if (spouseData.first) {
      spouse.markFirst();
    } else {
      spouse.markSecond();
    }
  }
}
</script>

<div class="demo-container">
  <SpousalBenefit {recipient} {spouse} />
</div>

<style>
  .demo-container {
    max-width: 800px;
    padding: 1em;
  }
</style>
