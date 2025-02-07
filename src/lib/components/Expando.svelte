<script lang="ts">
  import { onMount } from "svelte";

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

  // Print events can change the height of the expando's contents, while toggled
  // We need to trigger a remeasure of the height so that the expando doesn't
  // chop off the contents.
  let media_query_list: MediaQueryList;

  // Determine if the expando is expanded or collapsed initially from outside
  // state, but once rendered, the expando should manage it's own state.
  let expanded = false;

  onMount(() => {
    expanded = initiallyExpanded;
    media_query_list = window.matchMedia("print");
    media_query_list.addEventListener("change", onPrintMediaChange);

    if (initiallyExpanded) {
      contentsEl.style.maxHeight = contentsEl.scrollHeight + "px";
    }

    return () => {
      removeMediaQueryListener();
    };
  });

  function onPrintMediaChange() {
    if (expanded) {
      contentsEl.style.maxHeight = contentsEl.scrollHeight + "px";
    }
  }

  function removeMediaQueryListener() {
    if (media_query_list) {
      media_query_list.removeEventListener("change", onPrintMediaChange);
    }
  }

  let contentsEl: HTMLDivElement;
  function toggle() {
    expanded = !expanded;
    if (expanded) {
      contentsEl.style.maxHeight = contentsEl.scrollHeight + "px";
    } else {
      contentsEl.style.maxHeight = null;
    }
  }
</script>

<section
  class="expando"
  class:expanded
  style:--collapsed-background-color={collapsed_background_color}
  style:--collapsed-hover-color={collapsed_hover_color}
  style:--collapsed-tab-color={collapsed_tab_color}
  style:--collapsed-border-color={collapsed_border_color}
  style:--expanded-tab-color={expanded_tab_color}
  style:--expanded-border-color={expanded_border_color}
  style:--expanded-background-color={expanded_background_color}
>
  <div
    class="label noprint"
    on:click={toggle}
    on:keydown={toggle}
    role="button"
    tabindex="0"
  >
    {expanded ? expandedText : collapsedText}
  </div>

  <div class="expandContents" bind:this={contentsEl}>
    <slot />
  </div>
</section>

<style>
  section {
    position: relative;
    margin: 10px 0 20px 0;
  }
  .label {
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
    transition: all 0.25s ease-out;
    /* Leave some space for the right arrow */
    padding-right: 35px;
    max-width: max-content;
  }
  .label:hover {
    background: var(--collapsed-hover-color);
  }
  /* Prevent the label from being selected */
  .label::selection {
    background: none;
  }
  /* Create a right pointing triangle by making only the left border
   * visible. Since the border is 6px wide, the triangle is 6px wide
   * and 12px tall.
   */
  .label::before {
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
  .expanded .label {
    border: 1px solid var(--expanded-border-color);
    border-left: 3px solid var(--expanded-tab-color);
    background: var(--expanded-background-color);
  }
  /* Update the right arrow to a down arrow when checked */
  .expanded .label::before {
    border: 6px solid transparent;
    border-top-color: var(--expanded-tab-color);
    margin-top: -3px;
    right: 10px;
  }
  .expandContents {
    overflow: hidden;
    margin-left: 6px;
    border-left: 2px solid #a6a6f5;
    margin-bottom: 4px;
    border-image: linear-gradient(to bottom, #a6a6f5, 90%, #fff) 1 100%;
    padding: 0px;
    transition: all 0.25s ease-in;

    /* This will be modified by javascript upon toggling. */
    max-height: 0;
  }
</style>
