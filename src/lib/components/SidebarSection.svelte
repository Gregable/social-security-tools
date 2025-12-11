<script context="module" lang="ts">
// Generate a number unique to each instance to use.
let uniqid: number = 0;
</script>

<script lang="ts">
  import { activeIntegration } from "$lib/integrations/context";

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

  /**
   * If true, color this as an integration section.
   */
  export let integration: boolean = false;

  /**
   * Path to favicon icon for integration sections.
   */
  export let integrationFaviconPath: string = "";

  /**
   * If true, this section considered to be below a sticky element, namely the
   * slider elements. This is used to add a scroll-margin-top to the section
   * so that it's not hidden behind the sticky elements when it's selected in
   * the sidebar.
   */
  export let underSticky: boolean = false;

  // TODO: This should ideally generate a unique id for each sidebar as well,
  // by having the sidebar pass it's own unique id down to the section.

  // Increment the uniqid to ensure unique ids / labels:
  let id = "sidebarsection-" + uniqid;
  uniqid += 1;
</script>

<div
  {id}
  data-sidebarsection
  data-label={label}
  data-heading={heading ? "true" : "false"}
  data-sponsor={sponsor ? "true" : "false"}
  data-integration={integration ? "true" : "false"}
  data-integration-favicon={integrationFaviconPath}
  class:underSticky
  class:with-integration={$activeIntegration}
>
  <slot></slot>
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
  .underSticky {
    scroll-margin-top: 110px;
  }
  .underSticky.with-integration {
    scroll-margin-top: 160px;
  }
  .with-integration:not(.underSticky) {
    scroll-margin-top: 60px;
  }
</style>
