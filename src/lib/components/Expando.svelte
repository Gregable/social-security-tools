<script context="module" lang="ts">
  // Generate a number unique to each Expando instance to use
  // with label for / input id pairs.
  let uniqid: number = 0;
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import "$lib/global.css";
  /**
   * If true, the expando will be expanded when the page loads.
   *
   * Modifications to this variable will not be reflected in the
   * expando's state after it has been rendered.
   */
  export let initiallyExpanded: boolean = false;

  /**
   * The text to display on the expando's tab when it is collapsed.
   */
  export let collapsedText = "Expand";

  /**
   * The text to display on the expando's tab when it is expanded.
   */
  export let expandedText = "Collapse";

  export let collapsed_background_color: string = "#eee";
  export let collapsed_hover_color: string = "#f5f5f5";
  export let collapsed_tab_color: string = "#ddd";
  export let collapsed_border_color: string = "#888";
  export let expanded_tab_color: string = "#a6a6f5";
  export let expanded_border_color: string = "#c6c6f5";
  export let expanded_background_color: string = "#e9e9ff";

  let id = "expando-" + uniqid;
  // Increment the uniqid to ensure unique ids / labels:
  uniqid += 1;

  // The height of the contents div. This is used to set the negative margin
  // on the contents div to hide it when the expando is collapsed.
  let clientHeight: number;

  // The goal is to set the contents div to have a negative margin equal to
  // it's height. With the parent div having overflow: hidden, this will cause
  // the contents div to be hidden when the expando is collapsed.
  function updateMargin(clientHeight: number): string {
    if (clientHeight) {
      return `-${clientHeight}px`;
    } else {
      // Initially set to -100vh so that when the page loads, the contents
      // are hidden. Otherwise, there is a brief transition animation to hide
      // the contents after they are loaded.
      return "-10000vh";
    }
  }
  let negative_margin: string;
  $: negative_margin = updateMargin(clientHeight);

  // Determine if the expando is expanded or collapsed initially from outside
  // state, but once rendered, the expando should manage it's own state.
  let expanded = false;
  onMount(() => {
    expanded = initiallyExpanded;
  });
</script>

<section
  class="expando"
  style:--collapsed-background-color={collapsed_background_color}
  style:--collapsed-hover-color={collapsed_hover_color}
  style:--collapsed-tab-color={collapsed_tab_color}
  style:--collapsed-border-color={collapsed_border_color}
  style:--expanded-tab-color={expanded_tab_color}
  style:--expanded-border-color={expanded_border_color}
  style:--expanded-background-color={expanded_background_color}
>
  <input type="checkbox" {id} bind:checked={expanded} />
  <label for={id} class="label">{expanded ? expandedText : collapsedText}</label
  >
  <div class="expandContainer">
    <div
      class="expandContents"
      bind:clientHeight
      style:--negative-margin={negative_margin}
    >
      <div>
        <slot />
      </div>
    </div>
  </div>
</section>

<style>
  section {
    position: relative;
  }
  /* Hide the checkbox, this is only used as a toggle state. */
  input {
    display: none;
  }
  label {
    font-size: 16px;
    display: block;
    position: relative;
    /* 20px + 7x2 padding + 1x2 border = 36px */
    height: auto;
    padding: 7px 10px;
    font-weight: bold;
    background-color: var(--collapsed-background-color);
    border: 1px solid var(--collapsed-tab-color);
    border-left: 3px solid var(--collapsed-border-color);
    cursor: pointer;
    transition: all 0.15s ease-out;
    /* Leave some space for the right arrow */
    padding-right: 35px;
    max-width: max-content;
  }
  label:hover {
    background: var(--collapsed-hover-color);
  }
  /* Prevent the label from being selected */
  label::selection {
    background: none;
  }
  /* Create a right pointing triangle by making only the left border
   * visible. Since the border is 6px wide, the triangle is 6px wide
   * and 12px tall.
   */
  label::before {
    content: "";
    position: absolute;
    right: 4px;
    top: 50%;
    margin-top: -6px;
    border: 6px solid transparent;
    border-left-color: var(--collapsed-border-color);
  }
  /**
   * When the input is checked upon the label being clicked, change the border
   * colors to make it look like it's selected.
   */
  input[type="checkbox"]:checked ~ label {
    border: 1px solid var(--expanded-border-color);
    border-left: 3px solid var(--expanded-tab-color);
    background: var(--expanded-background-color);
  }
  /* Update the right arrow to a down arrow when checked */
  input[type="checkbox"]:checked ~ label::before {
    border: 6px solid transparent;
    border-top-color: var(--expanded-tab-color);
    margin-top: -3px;
    right: 10px;
  }
  /*
   * The expandContainer is the container that will be expanded. It's height
   * will be set to 0px and then transitioned to the height of the contents.
   * We need to hide the overflow so that the contents don't show when the
   * height is 0px.
   *
   * This is similar to using display: none, but we can't use that because
   * it doesn't support transitions.
   */
  .expandContainer {
    overflow: hidden;
  }
  .expandContents {
    /*
     * This is necessary to ensure that the contents height includes any
     * margins or padding. Otherwise, the height will be too small.
     */
    display: flex;
    /*
     * It would be nice to just use -100%, but margin-top is calcaulated
     * from the width of the element, not the height. So we need to use
     * a negative margin that is the height of the element calculated in
     * javascript (~typescript).
     */
    margin-top: var(--negative-margin);
    transition: all 0.25s ease-in;
    margin-left: 6px;
    border-left: 2px solid #a6a6f5;
    border-image: linear-gradient(to bottom, #a6a6f5, 90%, #fff) 1 100%;
  }
  input[type="checkbox"]:checked ~ label ~ .expandContainer .expandContents {
    margin-top: 0;
    padding-top: 0;
  }
</style>
