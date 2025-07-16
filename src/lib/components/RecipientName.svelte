<!--
  @component
  @name RecipientName
  @description
    A component that displays the recipients name as an inline span of text.

    If the recipient is the only user, the name is instead replaced with the
    provided slot value, and is not styled.

    If the recpient is not the only user, the name is displayed
    with styling to help visually identify the user.

  @example
    <RecipientName r={recipient}/ suffix="'s">your</RecipientName>
    This will display as "your" if the recipient is the only user, or as
    "Alex's" for example if the recipient is not the only user.
-->

<script lang="ts">
  import { Recipient } from "$lib/recipient";

  /**
   * Shortened "recipient", to make the tag less verbose.
   */
  export let r: Recipient = new Recipient();

  /**
   * If set, the string will be appended to the recipeint's name.
   * String will not be appended if the slot is used instead.
   */
  export let suffix: string = "";

  /**
   * If set, no styling will be applied to the name.
   */
  export let noColor: boolean = false;

  /**
   * If set, the name will be shortened to the given number of characters.
   */
  export let shortenTo: number | null = null;

  /**
   * Apostrophe: shorthand for suffix="'s".
   */
  export let apos: boolean = false;

  function finalSuffix(): string {
    if (suffix) {
      return suffix;
    } else if (apos) {
      return "'s";
    } else {
      return "";
    }
  }
</script>

<span
  >{#if r.only}<slot></slot>{:else}<span
      class="name"
      class:noColor
      class:first={r.first}
      >{#if shortenTo}{r.shortName(shortenTo)}{:else}{r.name}{/if}</span
    >{finalSuffix()}{/if}
</span>

<style>
  .name.noColor {
    color: inherit;
  }
  .name.first:not(.noColor) {
    color: #dd6600;
  }
  .name:not(.noColor) {
    font-weight: 900;
    color: #558855;
  }
</style>
