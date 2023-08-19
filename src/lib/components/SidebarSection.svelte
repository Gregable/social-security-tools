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

  /**
   * If true, color this as a sponsor section.
   */
  export let sponsor: boolean = false;

  // TODO: This should ideally generate a unique id for each sidebar as well,
  // by having the sidebar pass it's own unique id down to the section.

  // Increment the uniqid to ensure unique ids / labels:
  let id = "sidebarsection-" + uniqid;
  uniqid += 1;
</script>

<div
  {id}
  data-label={label}
  data-heading={heading ? "true" : "false"}
  data-sidebarsection
  data-sponsor={sponsor ? "true" : "false"}
>
  <slot />
</div>

<style>
  /**
   * This ensures that the <div> does not become a scrollable container which
   * prevents the earnings sliders from being sticky at a higher level element.
   * I'm a bit confused about why this is necessary, but it works.
   */
  div {
    display: unset;
  }
</style>
