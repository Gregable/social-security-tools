<script lang="ts">
import { onMount } from 'svelte';

/**
 * Visual style variant for the expando.
 * - 'default': Box style with gray background (backwards compatible)
 * - 'inline': Link-like style, lightweight for helper content
 * - 'section': Full-width section divider style
 */
export let variant: 'default' | 'inline' | 'section' = 'default';

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
export let collapsedText = 'Expand';

/**
 * The text to display on the expando's tab when it is expanded.
 */
export let expandedText = 'Collapse';

export let collapsed_background_color: string = '#eee';
export let collapsed_hover_color: string = '#f5f5f5';
export let collapsed_tab_color: string = '#ddd';
export let collapsed_border_color: string = '#888';
export let expanded_tab_color: string = '#a6a6f5';
export let expanded_border_color: string = '#c6c6f5';
export let expanded_background_color: string = '#e9e9ff';

// Print events can change the height of the expando's contents, while toggled
// We need to trigger a remeasure of the height so that the expando doesn't
// chop off the contents.
let media_query_list: MediaQueryList;

// Determine if the expando is expanded or collapsed initially from outside
// state, but once rendered, the expando should manage it's own state.
let expanded = false;

onMount(() => {
  expanded = initiallyExpanded;
  media_query_list = window.matchMedia('print');
  media_query_list.addEventListener('change', onPrintMediaChange);

  if (initiallyExpanded) {
    contentsEl.style.maxHeight = `${contentsEl.scrollHeight}px`;
  }

  return () => {
    removeMediaQueryListener();
  };
});

function onPrintMediaChange() {
  if (expanded) {
    contentsEl.style.maxHeight = `${contentsEl.scrollHeight}px`;
  }
}

function removeMediaQueryListener() {
  if (media_query_list) {
    media_query_list.removeEventListener('change', onPrintMediaChange);
  }
}

let contentsEl: HTMLDivElement;
function toggle() {
  expanded = !expanded;
  if (expanded) {
    contentsEl.style.maxHeight = `${contentsEl.scrollHeight}px`;
  } else {
    contentsEl.style.maxHeight = null;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  }
}
</script>

<section
  class="expando variant-{variant}"
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
    on:keydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-expanded={expanded}
  >
    {expanded ? expandedText : collapsedText}
  </div>

  <div class="expandContents" bind:this={contentsEl}>
    <slot></slot>
  </div>
</section>

<style>
  section {
    position: relative;
    margin: 10px 0 20px 0;
  }

  /* ========================================
   * DEFAULT VARIANT (modernized)
   * ======================================== */
  .variant-default .label {
    font-size: 15px;
    display: block;
    position: relative;
    height: auto;
    padding: 10px 14px;
    padding-right: 36px;
    font-weight: 600;
    background: linear-gradient(to bottom, #f8f9fa, #f1f3f4);
    border: 1px solid #d0d4d8;
    border-radius: 6px;
    color: #495057;
    cursor: pointer;
    transition: all 0.2s ease;
    max-width: max-content;
  }
  .variant-default .label:hover {
    background: linear-gradient(to bottom, #fff, #f8f9fa);
    border-color: #b8bdc2;
  }
  .variant-default .label::selection {
    background: none;
  }
  .variant-default .label::before {
    content: '';
    position: absolute;
    right: 12px;
    top: 50%;
    margin-top: -5px;
    border: 5px solid transparent;
    border-left-color: #6c757d;
    border-left-width: 6px;
  }
  .variant-default.expanded .label {
    background: linear-gradient(to bottom, #e8f0fe, #dbe6f6);
    border-color: #a8c7f5;
    border-bottom-color: transparent;
    color: #1a4d8c;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .variant-default.expanded .label::before {
    border: 5px solid transparent;
    border-top-color: #1a4d8c;
    border-top-width: 6px;
    margin-top: -3px;
    right: 14px;
  }
  .variant-default .expandContents {
    overflow: hidden;
    margin: 0;
    padding: 0;
    background: #f8fafc;
    border-radius: 0 0 6px 6px;
    box-shadow: inset 0 0 0 1px transparent;
    transition: max-height 0.25s ease-in-out, box-shadow 0.15s ease;
    max-height: 0;
  }
  .variant-default.expanded .expandContents {
    box-shadow:
      inset 1px 0 0 #a8c7f5,
      inset -1px 0 0 #a8c7f5,
      inset 0 -1px 0 #a8c7f5,
      inset 0 1px 0 #a8c7f5;
  }

  /* ========================================
   * INLINE VARIANT (link-like, lightweight)
   * ======================================== */
  .variant-inline {
    margin: 4px 0;
    display: inline-block;
  }
  .variant-inline .label {
    display: inline;
    background: transparent;
    border: none;
    padding: 0;
    padding-left: 1em;
    font-weight: normal;
    font-size: inherit;
    color: #4a90a4;
    text-decoration: underline;
    cursor: pointer;
    position: relative;
  }
  .variant-inline .label:hover {
    background: transparent;
    color: #2c5f72;
  }
  .variant-inline .label::selection {
    background: none;
  }
  .variant-inline .label::before {
    content: '\25B6';
    font-size: 0.6em;
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    color: #4a90a4;
    transition: transform 0.2s ease;
  }
  .variant-inline.expanded .label {
    background: transparent;
    border: none;
    color: #2c5f72;
  }
  .variant-inline.expanded .label::before {
    transform: translateY(-50%) rotate(90deg);
    border: none;
    color: #2c5f72;
  }
  .variant-inline .expandContents {
    overflow: hidden;
    margin-left: 1em;
    margin-top: 0.5em;
    border-left: none;
    border-image: none;
    padding: 0;
    transition: all 0.2s ease-in;
    max-height: 0;
  }

  /* ========================================
   * SECTION VARIANT (full-width divider)
   * ======================================== */
  .variant-section {
    margin: 1.5em 0;
  }
  .variant-section .label {
    display: block;
    position: relative;
    width: 100%;
    padding: 12px 40px 12px 16px;
    font-size: 15px;
    font-weight: 600;
    background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
    border: 1px solid #ced4da;
    border-radius: 4px;
    color: #495057;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  .variant-section .label:hover {
    background: linear-gradient(to bottom, #ffffff, #f8f9fa);
    border-color: #adb5bd;
  }
  .variant-section .label::selection {
    background: none;
  }
  .variant-section .label::before {
    content: '';
    position: absolute;
    right: 16px;
    top: 50%;
    margin-top: -5px;
    border: 5px solid transparent;
    border-left-color: #6c757d;
    border-left-width: 6px;
  }
  .variant-section.expanded .label {
    background: linear-gradient(to bottom, #e7f1ff, #d6e6ff);
    border-color: #a6c8ff;
    border-bottom-color: transparent;
    color: #2c5282;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .variant-section.expanded .label::before {
    border: 5px solid transparent;
    border-top-color: #2c5282;
    border-top-width: 6px;
    margin-top: -3px;
    right: 18px;
  }
  .variant-section .expandContents {
    overflow: hidden;
    border-radius: 0 0 4px 4px;
    background: #fafbfc;
    margin: 0;
    box-shadow: inset 0 0 0 1px transparent;
    transition: max-height 0.25s ease-in-out, box-shadow 0.15s ease;
    max-height: 0;
  }
  .variant-section.expanded .expandContents {
    box-shadow:
      inset 1px 0 0 #a6c8ff,
      inset -1px 0 0 #a6c8ff,
      inset 0 -1px 0 #a6c8ff,
      inset 0 1px 0 #a6c8ff;
  }
</style>
