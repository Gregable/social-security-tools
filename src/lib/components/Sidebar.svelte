<script lang="ts">
import { onDestroy, onMount, tick } from 'svelte';
import { get } from 'svelte/store';
import { isFirstStuck, isSecondStuck, isStuck } from '$lib/context';
import { activeIntegration } from '$lib/integrations/context';

// Optional prop to trigger rescan when integration components are loaded
export let integrationComponentsLoaded: boolean = false;

function scrollTo(section: SidebarSection) {
  return () => {
    const element = document.getElementById(section.id);
    if (element) {
      history.pushState(
        { id: section.id },
        '',
        `#${section.label.replaceAll(' ', '')}`
      );
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
}

function popState(event: PopStateEvent) {
  if (event.state?.id) {
    if (event.state.id === 'top') {
      mainColumn.scrollIntoView({ behavior: 'smooth' });
    } else {
      const element = document.getElementById(event.state.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}

let mainColumn: HTMLDivElement;

let visibleSections: Array<number> = [];

let lastIsStuck: boolean = false;

function observeCallback(entries: Array<IntersectionObserverEntry>, _) {
  // Check if stuck state has changed and recreate observer if needed
  const currentIsStuck = $isStuck;
  if (currentIsStuck !== lastIsStuck) {
    lastIsStuck = currentIsStuck;
    createObserver();
    return;
  }

  entries.forEach((entry) => {
    let id: number = parseInt(
      entry.target.getAttribute('id').split('-')[1],
      10
    );

    let isIntersecting = entry.isIntersecting;

    if (isIntersecting) {
      // Push to front or back, as appropriate, if not already present.
      if (visibleSections.length === 0) {
        visibleSections.push(id);
      } else if (visibleSections[0] > id) {
        visibleSections.unshift(id);
      } else if (visibleSections[visibleSections.length - 1] < id) {
        visibleSections.push(id);
      }
    } else {
      visibleSections = visibleSections.filter((x) => x !== id);
    }
  });

  if (lastActiveSection) {
    lastActiveSection.active = false;
  }
  if (visibleSections.length > 0) {
    lastActiveSection = sidebarSections[visibleSections[0]];
    lastActiveSection.active = true;
  }
  // eslint-disable-next-line no-self-assign
  sidebarSections = sidebarSections;
}

let observer: IntersectionObserver | null = null;
let unsubscribeStuck: (() => void) | null = null;

function createObserver() {
  if (!mainColumn) return;
  if (observer) observer.disconnect();

  const stuckNow = get(isStuck);
  const integrationNow = get(activeIntegration);

  // Calculate root margin to account for sticky elements
  const topMargin = integrationNow
    ? stuckNow
      ? -160 // CTA (50px) + sliders (110px)
      : -60 // CTA only
    : stuckNow
      ? -110 // sliders only
      : 0; // nothing sticky

  observer = new IntersectionObserver(observeCallback, {
    root: document,
    rootMargin: `${topMargin}px 0px 0px 0px`,
    // Every 5%:
    threshold: [...Array(20).keys()].map((i) => i / 20),
  });
  let children = mainColumn.querySelectorAll('[data-sidebarsection]');
  for (let i = 0; i < children.length; i++) {
    observer.observe(children[i]);
  }
}

class SidebarSection {
  label: string | null = '';
  id: string = '';
  heading: boolean = false;
  active: boolean = false;
  sponsor: boolean = false;
  integration: boolean = false;
  integrationFaviconPath: string = '';
}
let lastActiveSection: SidebarSection;

let hasHeading: boolean = false;
let sidebarSections: Array<SidebarSection> = [];

function scanSections() {
  // Read the SidebarSection components from the slot and use them to
  // populate the sidebar.
  sidebarSections = [];
  hasHeading = false;

  let children = mainColumn.querySelectorAll('[data-sidebarsection]');
  for (let i = 0; i < children.length; i++) {
    let child = children[i];
    let isHeading = child.getAttribute('data-heading') === 'true';
    let isIntegration = child.getAttribute('data-integration') === 'true';
    let label = child.getAttribute('data-label');

    // Reassign ID to ensure sequential ordering
    // This is critical because observeCallback relies on ID order matching array index
    const newId = `sidebarsection-${i}`;
    child.id = newId;

    // If we have no headings, then nothing should be indented. If we have
    // at least one heading, non-heading items should be indented.
    if (isHeading) hasHeading = true;
    sidebarSections.push({
      label: label,
      id: newId,
      heading: isHeading,
      // active highlights a section if it's visible at the top of
      // the viewport. Initially all false.
      active: false,
      sponsor: child.getAttribute('data-sponsor') === 'true',
      integration: isIntegration,
      integrationFaviconPath:
        child.getAttribute('data-integration-favicon') || '',
    });
  }
  // eslint-disable-next-line no-self-assign
  sidebarSections = sidebarSections;
  createObserver();
}

onMount(() => {
  scanSections();

  // React to stuck state changes immediately
  unsubscribeStuck = isStuck.subscribe((value) => {
    if (observer && mainColumn) {
      lastIsStuck = value;
      createObserver();
    } else {
      lastIsStuck = value;
    }
  });
});

onDestroy(() => {
  if (unsubscribeStuck) unsubscribeStuck();
});

// Rescan sections when activeIntegration changes OR when integration components are loaded
// This ensures integration sections appear in the sidebar after they're dynamically added
$: if (($activeIntegration || integrationComponentsLoaded) && mainColumn) {
  // Use tick() to wait for DOM updates before rescanning
  tick().then(() => {
    scanSections();
  });
}

// Recreate observer when activeIntegration changes to update rootMargin
$: if (mainColumn && observer) {
  $activeIntegration; // Track this dependency
  createObserver();
}
</script>

<svelte:window on:popstate={popState} />

<div class="twoColumns">
  <div class="sideBar">
    <ul>
      {#each sidebarSections as section}
        <li
          on:click={scrollTo(section)}
          on:keydown={scrollTo(section)}
          class:active={section.active}
          class:sponsor={section.sponsor}
          class:integration={section.integration}
          role="presentation"
        >
          <div class="navlabel" class:indent={hasHeading && !section.heading}>
            {#if section.integration && section.integrationFaviconPath}
              <img
                src={section.integrationFaviconPath}
                alt=""
                class="integration-icon"
              />
            {/if}
            {section.label}
          </div>

          <span class="chevron">&rsaquo;</span>
        </li>
      {/each}
    </ul>
  </div>
  <div class="mainColumn" bind:this={mainColumn}>
    <slot></slot>
  </div>
</div>

<style>
  @media print {
    .twoColumns {
      display: block;
    }
    .sideBar {
      display: none;
    }
    .mainColumn {
      margin: 0 auto;
      padding: 0 5px;
    }
  }
  /** Wide Tablet or Desktop **/
  @media screen and (min-width: 1025px) {
    .twoColumns {
      display: grid;
      grid-template-columns: 230px 1fr;
      grid-column-gap: 10px;
    }
    .mainColumn {
      max-width: 750px;
    }
  }
  /** Tall Tablet **/
  @media screen and (max-width: 1024px) {
    /** Hide the sidebar, display only main column*/
    .sideBar {
      display: none;
    }
    .twoColumns {
      display: block;
    }
    .mainColumn {
      margin: 0 auto;
      padding: 0 5px;
    }
  }
  /**
   * This prevents the sidebar from being selected as the "scroll anchoring"
   * element. This is a feature that prevents the page from jumping around
   * when new content is loaded. However, the sidebar doesn't scroll, so it
   * shouldn't be used as the anchor.
   */
  .sideBar {
    overflow-anchor: none;
  }

  ul {
    top: 10px;
    position: sticky;
    margin: 20px 15px 0 0;
    border-radius: 6px;
    max-width: 220px;
    list-style: none;
    padding: 0;
  }
  li {
    line-height: 20px;
    margin-top: 0;
    position: relative;
    display: block;
    color: #0088cc;
    text-decoration: none;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
    border: 1px solid #e5e5e5;
    padding: 8px 14px;
    margin: 0 0 -1px;
    display: block;
    font-size: 14px;
    cursor: pointer;
  }
  li.active,
  li.active.sponsor {
    background-color: #0088cc;
    color: #fff;
    border-color: #0088cc;
  }
  li.sponsor {
    background-color: aliceblue;
  }
  .integration-icon {
    width: 14px;
    height: 14px;
    vertical-align: middle;
    margin-right: 0.35em;
    display: inline-block;
  }
  li:first-child {
    border-radius: 6px 6px 0 0;
  }
  li:last-child {
    border-radius: 0 0 6px 6px;
  }
  .navlabel {
    display: inline-block;
    max-width: 175px;
    padding-right: 20px;
    white-space: nowrap;
  }
  .navlabel.indent {
    padding-left: 10px;
  }
  .chevron {
    position: absolute;
    top: 10px;
    right: 4px;
    font-size: 24px;
  }

</style>
