<script context="module" lang="ts">
  // Generate a number unique to each instance to use.
  let uniqid: number = 0;
</script>

<script lang="ts">
  /**
   * The label to show in the sidebar for this section.
   */
  export let label: string = "";

  /**
   * Whether this section is a heading. Headings are styled differently.
   */
  export let heading: boolean = false;

  // TODO: This should ideally generate a unique id for each sidebar as well,
  // by having the sidebar pass it's own unique id down to the section.

  // Increment the uniqid to ensure unique ids / labels:
  let id = "sidebarsection-" + uniqid;
  uniqid += 1;
</script>

<div {id} data-label={label} data-heading={heading ? "true" : "false"}>
  <slot />
</div>

<style>
</style>
