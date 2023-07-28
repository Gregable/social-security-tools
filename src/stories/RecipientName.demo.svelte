<script lang="ts">
  /**
   * As far as I can tell, there is no good way to implement demo slots
   * in Storybook. This is a hack to get around that, by creating a new
   * component that is only used in the demo.
   */
  import RecipientName from "../components/RecipientName.svelte";
  import { Recipient } from "../lib/recipient";

  export let r: Recipient = new Recipient();
  export let noColor: boolean = false;
</script>

<div>
  <p>
    <RecipientName {r} apos shortenTo={13} {noColor}>your</RecipientName>
  </p>
</div>

<style>
  p {
    padding: 2em;
    font-size: 22px;
  }
</style>
